import { GetObjectCommand, PutObjectCommand, DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Optional } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { env } from '../../config/env';
import { hmac, safeEqualHex } from '../../common/crypto';

const URL_TTL_SEC = 600; // PRD D9: signed URLs live 10 minutes

/** Private object storage (D9). `local` is for development/test only (enforced in env.ts). */
@Injectable()
export class StorageService {
  private s3: S3Client | null = null;

  constructor(@Optional() private readonly prisma?: PrismaClient) {}

  private db(): PrismaClient {
    if (!this.prisma) throw new Error('STORAGE_DRIVER=db needs a Prisma client');
    return this.prisma;
  }

  private client(): S3Client {
    const e = env();
    this.s3 ??= new S3Client({
      region: e.S3_REGION,
      endpoint: e.S3_ENDPOINT,
      credentials: { accessKeyId: e.S3_ACCESS_KEY_ID ?? '', secretAccessKey: e.S3_SECRET_ACCESS_KEY ?? '' },
      forcePathStyle: true,
    });
    return this.s3;
  }

  private localPath(key: string): string {
    const base = resolve(env().LOCAL_STORAGE_DIR);
    const p = resolve(join(base, key));
    if (!p.startsWith(base)) throw new Error('Invalid key');
    return p;
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    if (env().STORAGE_DRIVER === 'db') {
      const data = new Uint8Array(body);
      await this.db().media.upsert({ where: { key }, create: { key, data, contentType }, update: { data, contentType } });
      return;
    }
    if (env().STORAGE_DRIVER === 'local') {
      const p = this.localPath(key);
      await mkdir(dirname(p), { recursive: true });
      await writeFile(p, body);
      return;
    }
    await this.client().send(new PutObjectCommand({ Bucket: env().S3_BUCKET, Key: key, Body: body, ContentType: contentType }));
  }

  async delete(key: string): Promise<void> {
    if (env().STORAGE_DRIVER === 'db') {
      await this.db().media.deleteMany({ where: { key } });
      return;
    }
    if (env().STORAGE_DRIVER === 'local') {
      await rm(this.localPath(key), { force: true });
      return;
    }
    await this.client().send(new DeleteObjectCommand({ Bucket: env().S3_BUCKET, Key: key }));
  }

  async signedUrl(key: string, now = Date.now(), ttlSec = URL_TTL_SEC): Promise<string> {
    if (env().STORAGE_DRIVER === 'local' || env().STORAGE_DRIVER === 'db') {
      const exp = Math.floor(now / 1000) + ttlSec;
      const sig = hmac(env().JWT_SECRET, `media:${key}:${exp}`);
      return `${env().PUBLIC_API_URL}/v1/media/${encodeURIComponent(key)}?exp=${exp}&sig=${sig}`;
    }
    return getSignedUrl(this.client(), new GetObjectCommand({ Bucket: env().S3_BUCKET, Key: key }), { expiresIn: ttlSec });
  }

  /** Reads an object's bytes (server-side use: data export). */
  async get(key: string): Promise<Buffer | null> {
    if (env().STORAGE_DRIVER === 'db') {
      const row = await this.db().media.findUnique({ where: { key } });
      return row ? Buffer.from(row.data) : null;
    }
    if (env().STORAGE_DRIVER === 'local') {
      try {
        return await readFile(this.localPath(key));
      } catch {
        return null;
      }
    }
    const res = await this.client().send(new GetObjectCommand({ Bucket: env().S3_BUCKET, Key: key }));
    return res.Body ? Buffer.from(await res.Body.transformToByteArray()) : null;
  }

  /** Local/db drivers: verify a signed media URL and read the bytes. */
  async readLocalSigned(key: string, exp: number, sig: string): Promise<Buffer | null> {
    if (env().STORAGE_DRIVER === 's3') return null;
    if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return null;
    if (!/^[0-9a-f]{64}$/.test(sig) || !safeEqualHex(sig, hmac(env().JWT_SECRET, `media:${key}:${exp}`))) return null;
    if (env().STORAGE_DRIVER === 'db') {
      const row = await this.db().media.findUnique({ where: { key } });
      return row ? Buffer.from(row.data) : null;
    }
    try {
      return await readFile(this.localPath(key));
    } catch {
      return null;
    }
  }
}
