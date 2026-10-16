import { Injectable, Logger } from '@nestjs/common';
import JSZip from 'jszip';
import { AppError, notFound } from '../../common/errors';
import { PrismaService } from '../../common/prisma.service';
import { EmailService } from '../auth/email.service';
import { SoulCryptoService } from '../soul/soul-crypto.service';
import { StorageService } from '../storage/storage.service';

const LINK_TTL_SEC = 24 * 3600;
const COOLDOWN_MS = 7 * 86_400_000;

/**
 * ACC-002: everything NearSoul stores about the user, in a ZIP (JSON + photos), via a 24-hour private link.
 * Other people's personal data is not included: matches and likes appear only as the user's own actions.
 */
@Injectable()
export class ExportService {
  private readonly logger = new Logger('Export');

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly email: EmailService,
    private readonly soulCrypto: SoulCryptoService,
  ) {}

  async request(userId: string): Promise<{ id: string; status: string }> {
    const recent = await this.prisma.dataExportJob.findFirst({ where: { userId, status: { in: ['pending', 'ready'] }, createdAt: { gte: new Date(Date.now() - COOLDOWN_MS) } } });
    if (recent) throw new AppError(429, 'EXPORT_LIMIT', 'You can request one export every 7 days.', { retry_after: Math.ceil((recent.createdAt.getTime() + COOLDOWN_MS - Date.now()) / 1000) });
    const job = await this.prisma.dataExportJob.create({ data: { userId } });
    void this.process(job.id).catch((e: Error) => this.logger.error({ msg: 'export failed', err: e.message }));
    return { id: job.id, status: job.status };
  }

  async latest(userId: string) {
    const job = await this.prisma.dataExportJob.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } });
    if (!job) throw notFound();
    const usable = job.status === 'ready' && job.expiresAt && job.expiresAt > new Date() && job.storageKey;
    return { id: job.id, status: usable ? 'ready' : job.status === 'ready' ? 'expired' : job.status, createdAt: job.createdAt, expiresAt: job.expiresAt, url: usable ? await this.storage.signedUrl(job.storageKey!, Date.now(), Math.max(60, Math.floor((job.expiresAt!.getTime() - Date.now()) / 1000))) : null };
  }

  async process(jobId: string): Promise<void> {
    const job = await this.prisma.dataExportJob.findUniqueOrThrow({ where: { id: jobId } });
    try {
      const { json, photos } = await this.collect(job.userId);
      const zip = new JSZip();
      zip.file('README.txt', 'Your NearSoul data export.\nexport.json contains your account, profile, answers, Soul Profile, reports you filed, your messages and your Soul Talk.\nphotos/ contains your profile photos.\n');
      zip.file('export.json', JSON.stringify(json, null, 2));
      photos.forEach((p, i) => zip.file(`photos/${i + 1}.webp`, p));
      const body = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
      const key = `exports/${job.userId}/${job.id}.zip`;
      await this.storage.put(key, body, 'application/zip');
      const expiresAt = new Date(Date.now() + LINK_TTL_SEC * 1000);
      await this.prisma.dataExportJob.update({ where: { id: job.id }, data: { status: 'ready', storageKey: key, completedAt: new Date(), expiresAt } });
      const user = await this.prisma.user.findUniqueOrThrow({ where: { id: job.userId }, select: { email: true } });
      const url = await this.storage.signedUrl(key, Date.now(), LINK_TTL_SEC);
      await this.email.send({ to: user.email, subject: 'Your NearSoul data export is ready', text: `Download your data (link valid for 24 hours):\n${url}\n\nIf you didn't request this, sign out of all devices in Settings.` });
    } catch (e) {
      await this.prisma.dataExportJob.update({ where: { id: job.id }, data: { status: 'failed', error: (e as Error).message.slice(0, 200) } });
      throw e;
    }
  }

  private async collect(userId: string) {
    const u = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        profile: { include: { interests: true } }, photos: { orderBy: { position: 'asc' } }, consents: true, answers: true, soulProfile: true,
        overrides: true, card: true, location: true, feedback: true, ratings: true, likesGiven: true,
      },
    });
    const matches = await this.prisma.match.findMany({ where: { OR: [{ userLow: userId }, { userHigh: userId }] } });
    const sentMessages = await this.prisma.message.findMany({ where: { senderId: userId }, orderBy: { createdAt: 'asc' } });
    const reports = await this.prisma.moderationReport.findMany({ where: { reporterId: userId } });
    const blocks = await this.prisma.block.findMany({ where: { blockerId: userId } });
    const sessions = await this.prisma.soulSession.findMany({ where: { userId }, include: { messages: { orderBy: { createdAt: 'asc' } }, insights: true }, orderBy: { startedAt: 'asc' } });
    const dec = (s: string | null) => (s ? this.soulCrypto.decrypt(userId, s) : Promise.resolve(null));
    const soulTalk = await Promise.all(sessions.map(async (s) => ({
      topic: s.topicKey, status: s.status, startedAt: s.startedAt, finishedAt: s.finishedAt,
      summary: await dec(s.summaryEnc), questionToSitWith: await dec(s.questionEnc),
      messages: await Promise.all(s.messages.map(async (m) => ({ role: m.role, text: await dec(m.bodyEnc), at: m.createdAt }))),
      insights: await Promise.all(s.insights.map(async (i) => ({ category: i.category, text: await dec(i.textEnc), evidence: await dec(i.evidenceEnc), status: i.status, visibility: i.visibility }))),
    })));
    const photos: Buffer[] = [];
    for (const p of u.photos) {
      const b = await this.storage.get(p.storageKey);
      if (b) photos.push(b);
    }
    const json = {
      exportedAt: new Date().toISOString(),
      account: { id: u.id, email: u.email, status: u.status, createdAt: u.createdAt, dateOfBirth: u.dob, locale: u.locale, timezone: u.timezone },
      settings: { discoveryEnabled: u.discoveryEnabled, hideDistance: u.hideDistance, readReceipts: u.readReceipts, cardVisibility: u.cardVisibility, shareLevel: u.shareLevel, soulKeepConversations: u.soulKeepConversations },
      consents: u.consents.map((c) => ({ type: c.type, version: c.version, granted: c.granted, value: c.value, at: c.createdAt })),
      profile: u.profile && { firstName: u.profile.firstName, gender: u.profile.gender, interestedIn: u.profile.interestedIn, intent: u.profile.intent, bio: u.profile.bio, ageMin: u.profile.ageMin, ageMax: u.profile.ageMax, cityId: u.profile.cityId, heightCm: u.profile.heightCm, jobTitle: u.profile.jobTitle, interests: u.profile.interests.map((i) => i.interestId) },
      photos: u.photos.map((p, i) => ({ file: `photos/${i + 1}.webp`, position: p.position, uploadedAt: p.createdAt })),
      questionnaireAnswers: u.answers.map((a) => ({ item: a.itemKey, value: a.value, answeredAt: a.answeredAt })),
      soulProfile: u.soulProfile?.profile ?? null,
      traitCorrections: u.overrides.map((o) => ({ trait: o.traitKey, value: o.value, source: o.source, at: o.updatedAt })),
      personalityCard: u.card && { headline: u.card.headline, summary: u.card.summary, communicationStyle: u.card.communicationStyle, idealFirstDate: u.card.idealFirstDate, strengths: u.card.strengths, source: u.card.source },
      approximateLocation: u.location && { h3Cell: u.location.h3Cell, updatedAt: u.location.updatedAt, note: 'Only the latest approximate area is kept, for at most 24 hours.' },
      likesAndPasses: u.likesGiven.map((l) => ({ action: l.action, source: l.source, at: l.createdAt, profileId: l.targetId })),
      matches: matches.map((m) => ({ id: m.id, createdAt: m.createdAt, endedAt: m.endedAt, endReason: m.endReason })),
      messagesYouSent: sentMessages.map((m) => ({ matchId: m.matchId, text: m.body, at: m.createdAt })),
      blocks: blocks.map((b) => ({ profileId: b.blockedId, at: b.createdAt })),
      reportsYouFiled: reports.map((r) => ({ category: r.category, comment: r.comment, status: r.status, at: r.createdAt })),
      feedback: u.feedback.map((f) => ({ category: f.category, text: f.text, at: f.createdAt })),
      ratings: u.ratings.map((r) => ({ kind: r.kind, stars: r.stars, comment: r.comment, at: r.createdAt })),
      soulTalk,
    };
    return { json, photos };
  }

  /** Retention: remove expired export files. */
  async cleanup(now = new Date()): Promise<void> {
    const expired = await this.prisma.dataExportJob.findMany({ where: { expiresAt: { lt: now }, storageKey: { not: null } } });
    for (const j of expired) {
      await this.storage.delete(j.storageKey!);
      await this.prisma.dataExportJob.update({ where: { id: j.id }, data: { storageKey: null } });
    }
  }
}
