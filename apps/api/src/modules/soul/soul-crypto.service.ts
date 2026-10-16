import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { env } from '../../config/env';
import { PrismaService } from '../../common/prisma.service';

const ALG = 'aes-256-gcm';

function seal(key: Buffer, plaintext: Buffer): string {
  const iv = randomBytes(12);
  const c = createCipheriv(ALG, key, iv);
  const ct = Buffer.concat([c.update(plaintext), c.final()]);
  return `v1.${iv.toString('base64')}.${c.getAuthTag().toString('base64')}.${ct.toString('base64')}`;
}

function open(key: Buffer, sealed: string): Buffer {
  const [v, iv, tag, ct] = sealed.split('.');
  if (v !== 'v1' || !iv || !tag || !ct) throw new Error('Unsupported ciphertext');
  const d = createDecipheriv(ALG, key, Buffer.from(iv, 'base64'));
  d.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([d.update(Buffer.from(ct, 'base64')), d.final()]);
}

/**
 * SOUL-007 envelope encryption: a random per-user data key (AES-256-GCM) wrapped by the master key.
 * Deleting the user's row in user_data_keys makes all their Soul Talk ciphertext unreadable (crypto-shredding).
 */
@Injectable()
export class SoulCryptoService {
  private readonly cache = new Map<string, Buffer>();

  constructor(private readonly prisma: PrismaService) {}

  private master(): Buffer {
    const k = env().SOUL_MASTER_KEY;
    if (k) return Buffer.from(k, 'base64');
    // Development/test only (env.ts refuses this elsewhere): derive a local key.
    return createHash('sha256').update(`soul-dev-master:${env().JWT_SECRET}`).digest();
  }

  private async userKey(userId: string): Promise<Buffer> {
    const cached = this.cache.get(userId);
    if (cached) return cached;
    let row = await this.prisma.userDataKey.findUnique({ where: { userId } });
    if (!row) {
      const fresh = randomBytes(32);
      row = await this.prisma.userDataKey.upsert({ where: { userId }, create: { userId, wrappedKey: seal(this.master(), fresh) }, update: {} });
    }
    const key = open(this.master(), row.wrappedKey);
    this.cache.set(userId, key);
    return key;
  }

  async encrypt(userId: string, text: string): Promise<string> {
    return seal(await this.userKey(userId), Buffer.from(text, 'utf8'));
  }

  async decrypt(userId: string, sealed: string): Promise<string> {
    return open(await this.userKey(userId), sealed).toString('utf8');
  }

  /** Crypto-shred: forget the key everywhere. */
  async destroy(userId: string): Promise<void> {
    this.cache.delete(userId);
    await this.prisma.userDataKey.deleteMany({ where: { userId } });
  }
}
