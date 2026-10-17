import type { PrismaService } from './prisma.service';

/** Personas (CR-17): one owner account (has the email) plus up to two extra profiles with parentId set. */
export const MAX_PERSONAS = 3;

/** The owner account id for a user or persona. */
export async function accountRootId(prisma: PrismaService, userId: string): Promise<string> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { parentId: true } });
  return u?.parentId ?? userId;
}

/** Every profile of the same person (owner + personas), including `userId` itself. */
export async function familyIds(prisma: PrismaService, userId: string): Promise<string[]> {
  const root = await accountRootId(prisma, userId);
  const rows = await prisma.user.findMany({ where: { OR: [{ id: root }, { parentId: root }] }, select: { id: true } });
  return rows.map((r) => r.id);
}

/** The sign-in email of the account a user or persona belongs to. */
export async function accountEmail(prisma: PrismaService, userId: string): Promise<string> {
  const u = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true, parent: { select: { email: true } } } });
  const email = u.email ?? u.parent?.email;
  if (!email) throw new Error('account without email');
  return email;
}
