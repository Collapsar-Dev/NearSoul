import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { badRequest, notFound } from '../../common/errors';
import { sha256 } from '../../common/crypto';
import { PrismaService } from '../../common/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ageOn } from '../me/me.service';
import { containsContactInfo, looksLikeScam } from './text-safety';

export const MAX_PHOTOS = 6;
export const MIN_PHOTOS = 1;
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_FORMATS = new Set(['jpeg', 'png', 'webp', 'heif']);

export interface ProfileInput {
  firstName: string;
  gender: 'woman' | 'man' | 'non_binary';
  interestedIn: ('woman' | 'man' | 'non_binary')[];
  intent: 'long_term' | 'open_to_long' | 'casual' | 'not_sure';
  bio?: string;
  ageMin?: number;
  ageMax?: number;
  cityId?: string;
  heightCm?: number | null;
  jobTitle?: string | null;
  interests?: string[];
}

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService, private readonly storage: StorageService) {}

  async upsert(userId: string, input: Partial<ProfileInput>) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, include: { profile: true } });
    const age = user.dob ? ageOn(user.dob, new Date()) : 25;
    if (input.bio !== undefined && containsContactInfo(input.bio)) {
      throw badRequest('BIO_CONTACT_INFO', 'Please keep links, phone numbers and handles out of your bio.');
    }
    if (input.jobTitle && containsContactInfo(input.jobTitle)) throw badRequest('CONTACT_INFO', 'Please remove contact details.');
    const ageMin = input.ageMin ?? user.profile?.ageMin ?? Math.max(18, age - 5);
    const ageMax = input.ageMax ?? user.profile?.ageMax ?? age + 5;
    if (ageMin < 18 || ageMax > 99 || ageMin > ageMax) throw badRequest('INVALID_AGE_RANGE', 'Please choose a valid age range.');
    if (input.cityId && !(await this.prisma.city.findFirst({ where: { id: input.cityId, active: true } }))) {
      throw badRequest('INVALID_CITY', 'Unknown city.');
    }
    if (input.interests) {
      const unique = [...new Set(input.interests)];
      if ((unique.length > 0 && unique.length < 3) || unique.length > 10) throw badRequest('INTERESTS_COUNT', 'Pick between 3 and 10 interests, or skip this step.');
      const known = await this.prisma.interest.count({ where: { id: { in: unique } } });
      if (known !== unique.length) throw badRequest('INVALID_INTEREST', 'Unknown interest.');
      input.interests = unique;
    }
    if (!user.profile) {
      if (!input.firstName || !input.gender || !input.interestedIn || !input.intent) {
        throw badRequest('PROFILE_REQUIRED_FIELDS', 'Name, gender, who you’re interested in and what you’re looking for are required.');
      }
    }
    const data = {
      firstName: input.firstName,
      gender: input.gender,
      interestedIn: input.interestedIn,
      intent: input.intent,
      bio: input.bio,
      ageMin,
      ageMax,
      cityId: input.cityId,
      heightCm: input.heightCm,
      jobTitle: input.jobTitle,
    };
    await this.prisma.$transaction(async (tx) => {
      if (user.profile) {
        await tx.profile.update({ where: { userId }, data });
      } else {
        await tx.profile.create({
          data: { ...data, userId, firstName: input.firstName!, gender: input.gender!, interestedIn: input.interestedIn!, intent: input.intent!, cityId: input.cityId ?? 'amsterdam' },
        });
      }
      if (input.interests) {
        await tx.profileInterest.deleteMany({ where: { userId } });
        await tx.profileInterest.createMany({ data: input.interests.map((interestId) => ({ userId, interestId })) });
      }
      if (input.bio && looksLikeScam(input.bio)) {
        await tx.auditEvent.create({ data: { actorType: 'system', action: 'scam_keyword_flag', targetType: 'user', targetId: userId } });
      }
    });
    return this.getOwn(userId);
  }

  async getOwn(userId: string) {
    const p = await this.prisma.profile.findUnique({ where: { userId }, include: { interests: true } });
    const photos = await this.photos(userId);
    if (!p) return { profile: null, photos };
    return {
      profile: {
        firstName: p.firstName, gender: p.gender, interestedIn: p.interestedIn, intent: p.intent, bio: p.bio,
        ageMin: p.ageMin, ageMax: p.ageMax, cityId: p.cityId, heightCm: p.heightCm, jobTitle: p.jobTitle,
        interests: p.interests.map((i) => i.interestId).sort(),
      },
      photos,
    };
  }

  async photos(userId: string) {
    const rows = await this.prisma.photo.findMany({ where: { userId, status: 'ready' }, orderBy: { position: 'asc' } });
    return Promise.all(rows.map(async (r) => ({ id: r.id, position: r.position, url: await this.storage.signedUrl(r.storageKey) })));
  }

  /** PROF-002: validate real type, re-encode to WebP (strips EXIF/GPS), store under a random key. */
  async addPhoto(userId: string, file: { buffer: Buffer; size: number } | undefined) {
    if (!file?.buffer?.length) throw badRequest('NO_FILE', 'Please choose a photo.');
    if (file.size > MAX_BYTES) throw badRequest('FILE_TOO_LARGE', 'Photos must be 10 MB or smaller.');
    const count = await this.prisma.photo.count({ where: { userId, status: 'ready' } });
    if (count >= MAX_PHOTOS) throw badRequest('TOO_MANY_PHOTOS', `You can have up to ${MAX_PHOTOS} photos.`);
    let meta: sharp.Metadata;
    try {
      meta = await sharp(file.buffer).metadata();
    } catch {
      throw badRequest('INVALID_IMAGE', 'That file is not a supported image.');
    }
    if (!meta.format || !ALLOWED_FORMATS.has(meta.format)) throw badRequest('INVALID_IMAGE', 'Use a JPEG, PNG or WebP photo.');
    if ((meta.width ?? 0) < 400 || (meta.height ?? 0) < 400) throw badRequest('IMAGE_TOO_SMALL', 'Photos must be at least 400×400 pixels.');
    // .rotate() applies EXIF orientation; sharp drops all metadata unless withMetadata() is called.
    const out = await sharp(file.buffer).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
    const key = `photos/${userId}/${randomUUID()}.webp`;
    const hash = sha256(out.data.toString('base64'));
    const banned = await this.prisma.auditEvent.findFirst({ where: { action: 'photo_hash_banned', targetId: hash } });
    if (banned) throw badRequest('PHOTO_REJECTED', 'This photo can’t be used.');
    await this.storage.put(key, out.data, 'image/webp');
    const photo = await this.prisma.photo.create({
      data: { userId, storageKey: key, position: count, status: 'ready', sha256: hash, width: out.info.width, height: out.info.height },
    });
    return { id: photo.id, position: photo.position, url: await this.storage.signedUrl(key) };
  }

  async deletePhoto(userId: string, photoId: string) {
    const photo = await this.prisma.photo.findFirst({ where: { id: photoId, userId } });
    if (!photo) throw notFound();
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const count = await this.prisma.photo.count({ where: { userId, status: 'ready' } });
    if (count <= MIN_PHOTOS && user.discoveryEnabled) throw badRequest('MIN_PHOTOS', 'Keep at least one photo while you are discoverable.');
    await this.prisma.photo.delete({ where: { id: photo.id } });
    await this.storage.delete(photo.storageKey);
    await this.reindex(userId);
  }

  async reorder(userId: string, ids: string[]) {
    const own = await this.prisma.photo.findMany({ where: { userId, status: 'ready' }, select: { id: true } });
    const ownIds = new Set(own.map((p) => p.id));
    if (ids.length !== own.length || !ids.every((id) => ownIds.has(id)) || new Set(ids).size !== ids.length) {
      throw badRequest('INVALID_ORDER', 'The photo order must include each of your photos once.');
    }
    await this.prisma.$transaction(ids.map((id, position) => this.prisma.photo.update({ where: { id }, data: { position } })));
    return this.photos(userId);
  }

  private async reindex(userId: string) {
    const rows = await this.prisma.photo.findMany({ where: { userId, status: 'ready' }, orderBy: { position: 'asc' } });
    await this.prisma.$transaction(rows.map((r, position) => this.prisma.photo.update({ where: { id: r.id }, data: { position } })));
  }
}
