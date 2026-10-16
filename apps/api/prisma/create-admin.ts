/**
 * Creates (or resets) an admin account with a random password and a TOTP secret.
 * Usage: npm run admin:create -- someone@example.com admin|moderator|support
 * Prints the password and the otpauth:// URL once — store them in a password manager.
 */
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import { randomBytes } from 'node:crypto';
import { authenticator } from 'otplib';

async function main() {
  const [email, role = 'admin'] = process.argv.slice(2);
  if (!email || !['admin', 'moderator', 'support'].includes(role)) {
    console.error('Usage: npm run admin:create -- <email> <admin|moderator|support>');
    process.exit(1);
  }
  const prisma = new PrismaClient();
  const password = randomBytes(18).toString('base64url');
  const secret = authenticator.generateSecret();
  const normalized = email.trim().toLowerCase();
  await prisma.adminUser.upsert({
    where: { email: normalized },
    create: { email: normalized, role, passwordHash: await argon2.hash(password), mfaSecret: secret },
    update: { role, passwordHash: await argon2.hash(password), mfaSecret: secret, active: true },
  });
  await prisma.$disconnect();
  console.log(`Admin ${normalized} (${role}) ready.`);
  console.log(`Password: ${password}`);
  console.log(`TOTP: ${authenticator.keyuri(normalized, 'NearSoul Admin', secret)}`);
  console.log('Add the TOTP URL to an authenticator app (paste it or turn it into a QR code). Shown only once.');
}

void main();
