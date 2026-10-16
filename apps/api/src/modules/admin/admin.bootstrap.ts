import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import argon2 from 'argon2';
import { randomBytes } from 'node:crypto';
import { authenticator } from 'otplib';
import { env } from '../../config/env';
import { PrismaService } from '../../common/prisma.service';

/**
 * Creates the first admin on hosts without a shell. Runs only when ADMIN_BOOTSTRAP_EMAIL is set and no admin
 * exists yet; the one-time password and TOTP URL are written once to the service log (visible only to the owner).
 * Remove ADMIN_BOOTSTRAP_EMAIL after the first sign-in.
 */
@Injectable()
export class AdminBootstrap implements OnApplicationBootstrap {
  private readonly logger = new Logger('AdminBootstrap');

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap(): Promise<void> {
    const email = env().ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
    if (!email || env().APP_ENV === 'test') return;
    if ((await this.prisma.adminUser.count()) > 0) return;
    const password = randomBytes(18).toString('base64url');
    const secret = authenticator.generateSecret();
    await this.prisma.adminUser.create({ data: { email, role: 'admin', passwordHash: await argon2.hash(password), mfaSecret: secret } });
    await this.prisma.auditEvent.create({ data: { actorType: 'system', action: 'admin_bootstrapped', targetType: 'admin', targetId: email } });
    // Deliberately printed once so the owner can sign in; never logged again.
    console.log(`\n=== NearSoul admin created (shown once) ===\nEmail: ${email}\nPassword: ${password}\nTOTP: ${authenticator.keyuri(email, 'NearSoul Admin', secret)}\nOpen /admin and remove ADMIN_BOOTSTRAP_EMAIL afterwards.\n`);
    this.logger.log('admin bootstrapped');
  }
}
