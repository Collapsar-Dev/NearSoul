import { GetObjectCommand, PutObjectCommand, DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { env } from '../../config/env';
import { hmac, safeEqualHex } from '../../common/crypto';

const URL_TTL_SEC = 600; // PRD D9: signed URLs live 10 minutes

/** Private object storage (D9). `local` is for development/test only (enforced in env.ts). */
@Injectable()
export class StorageService {
  private s3: S3Client | null = null;

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
    if (env().STORAGE_DRIVER === 'local') {
      const p = this.localPath(key);
      await mkdir(dirname(p), { recursive: true });
      await writeFile(p, body);
      return;
    }
    await this.client().send(new PutObjectCommand({ Bucket: env().S3_BUCKET, Key: key, Body: body, ContentType: contentType }));
  }

  async delete(key: string): Promise<void> {
    if (env().STORAGE_DRIVER === 'local') {
      await rm(this.localPath(key), { force: true });
      return;
    }
    await this.client().send(new DeleteObjectCommand({ Bucket: env().S3_BUCKET, Key: key }));
  }

  async signedUrl(key: string, now = Date.now()): Promise<string> {
    if (env().STORAGE_DRIVER === 'local') {
      const exp = Math.floor(now / 1000) + URL_TTL_SEC;
      const sig = hmac(env().JWT_SECRET, `media:${key}:${exp}`);
      return `${env().PUBLIC_API_URL}/v1/media/${encodeURIComponent(key)}?exp=${exp}&sig=${sig}`;
    }
    return getSignedUrl(this.client(), new GetObjectCommand({ Bucket: env().S3_BUCKET, Key: key }), { expiresIn: URL_TTL_SEC });
  }

  /** Local driver only: verify a signed media URL and read the file. */
  async readLocalSigned(key: string, exp: number, sig: string): Promise<Buffer | null> {
    if (env().STORAGE_DRIVER !== 'local') return null;
    if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return null;
    if (!/^[0-9a-f]{64}$/.test(sig) || !safeEqualHex(sig, hmac(env().JWT_SECRET, `media:${key}:${exp}`))) return null;
    try {
      return await readFile(this.localPath(key));
    } catch {
      return null;
    }
  }
}
