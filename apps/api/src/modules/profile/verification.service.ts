import { Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { AppError, badRequest, notFound } from '../../common/errors';
import { PrismaService } from '../../common/prisma.service';
import { env } from '../../config/env';
import { NotificationsService } from '../notifications/notifications.service';
import { StorageService } from '../storage/storage.service';

/** Only the friends test approves on its own; development/test use the moderator flow like production. */
const autoApprove = () => env().APP_ENV === 'alpha';

/** Poses a person copies in the selfie, so an old photo or someone else's picture can't pass. */
export const POSES = ['peace', 'thumb_up', 'three_fingers', 'wave', 'touch_ear', 'chin'] as const;
export type Pose = (typeof POSES)[number];
export const VERIFICATIONS_PER_DAY = 3;
const MAX_BYTES = 10 * 1024 * 1024;

/** Today's pose for this person: stable for the day, so the screen and the server agree. */
export function poseFor(userId: string, now = new Date()): Pose {
  const h = createHash('sha256').update(`${userId}:${now.toISOString().slice(0, 10)}`).digest();
  return POSES[h[0]! % POSES.length]!;
}

/**
 * CR-30 photo verification (SAFE-006 without a paid vendor): a selfie with a random pose is compared with the
 * profile photos by a moderator. No face templates or biometrics are computed. The selfie is private, never shown
 * to other users, and deleted as soon as a decision is made. In the alpha the check is approved automatically.
 */
@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService,
  ) {}

  async status(userId: string) {
    const [user, last] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { verifiedAt: true } }),
      this.prisma.photoVerification.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    ]);
    return {
      verified: !!user.verifiedAt,
      verifiedAt: user.verifiedAt,
      pending: last?.status === 'pending',
      lastResult: last && last.status !== 'pending' ? { status: last.status, reason: last.reason } : null,
      pose: poseFor(userId),
      autoApprove: autoApprove(),
    };
  }

  async submit(userId: string, pose: string, file: { buffer: Buffer; size: number } | undefined) {
    if (pose !== poseFor(userId)) throw badRequest('WRONG_POSE', 'Please take a new selfie with today’s pose.');
    if (!file?.buffer?.length) throw badRequest('NO_FILE', 'Please take a selfie.');
    if (file.size > MAX_BYTES) throw badRequest('FILE_TOO_LARGE', 'Photos must be 10 MB or smaller.');
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { verifiedAt: true } });
    if (user.verifiedAt) throw new AppError(409, 'ALREADY_VERIFIED', 'Your photos are already verified.');
    if (!(await this.prisma.photo.count({ where: { userId, status: 'ready' } }))) throw badRequest('NO_PHOTOS', 'Add a profile photo first.');
    if (await this.prisma.photoVerification.findFirst({ where: { userId, status: 'pending' } })) throw new AppError(409, 'VERIFICATION_PENDING', 'Your selfie is being checked.');
    const today = await this.prisma.photoVerification.count({ where: { userId, createdAt: { gte: new Date(Date.now() - 86_400_000) } } });
    if (today >= VERIFICATIONS_PER_DAY) throw new AppError(429, 'VERIFICATION_LIMIT', `You can try ${VERIFICATIONS_PER_DAY} times a day.`, { limit: VERIFICATIONS_PER_DAY });

    let out: Buffer;
    try {
      const meta = await sharp(file.buffer).metadata();
      if (!meta.format || !['jpeg', 'png', 'webp', 'heif'].includes(meta.format)) throw new Error('format');
      if ((meta.width ?? 0) < 300 || (meta.height ?? 0) < 300) throw badRequest('IMAGE_TOO_SMALL', 'The selfie must be at least 300×300 pixels.');
      out = await sharp(file.buffer).rotate().resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    } catch (e) {
      if (e instanceof AppError) throw e;
      throw badRequest('INVALID_IMAGE', 'That file is not a supported image.');
    }
    const key = `verifications/${userId}/${randomUUID()}.webp`;
    await this.storage.put(key, out, 'image/webp');
    const v = await this.prisma.photoVerification.create({ data: { userId, pose, storageKey: key } });
    // Alpha: no moderators yet, so the check passes right away (clearly a test-version shortcut).
    if (autoApprove()) await this.decide(v.id, true, 'alpha-auto');
    return this.status(userId);
  }

  /** Moderator queue: pending selfies with the profile photos to compare against. */
  async queue() {
    const rows = await this.prisma.photoVerification.findMany({ where: { status: 'pending' }, orderBy: { createdAt: 'asc' }, take: 50 });
    return Promise.all(rows.map(async (v) => {
      const photos = await this.prisma.photo.findMany({ where: { userId: v.userId, status: 'ready' }, orderBy: { position: 'asc' }, take: 6 });
      return {
        id: v.id,
        userId: v.userId,
        pose: v.pose,
        createdAt: v.createdAt,
        selfie: v.storageKey ? await this.storage.signedUrl(v.storageKey) : null,
        photos: await Promise.all(photos.map((p) => this.storage.signedUrl(p.storageKey))),
      };
    }));
  }

  async decide(id: string, approve: boolean, decidedBy: string, reason?: string) {
    const v = await this.prisma.photoVerification.findUnique({ where: { id } });
    if (!v || v.status !== 'pending') throw notFound();
    if (v.storageKey) await this.storage.delete(v.storageKey).catch(() => undefined);
    await this.prisma.photoVerification.update({
      where: { id },
      data: { status: approve ? 'approved' : 'rejected', reason: approve ? null : (reason ?? 'not_matching'), decidedAt: new Date(), decidedBy, storageKey: null },
    });
    if (approve) await this.prisma.user.update({ where: { id: v.userId }, data: { verifiedAt: new Date() } });
    await this.notifications.notify(v.userId, 'verification_result', { status: approve ? 'approved' : 'rejected' });
    return { id, status: approve ? 'approved' : 'rejected' };
  }
}
