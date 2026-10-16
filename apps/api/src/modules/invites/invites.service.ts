import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { inviteCode } from '../../common/crypto';
import { badRequest, forbidden } from '../../common/errors';
import { PrismaService } from '../../common/prisma.service';

/** ALPHA-001: invite-only access. */
@Injectable()
export class InvitesService {
  constructor(private readonly prisma: PrismaService) {}

  async validate(code: string): Promise<boolean> {
    const invite = await this.prisma.invite.findUnique({ where: { code: code.toUpperCase() } });
    return !!invite && invite.uses < invite.maxUses && (!invite.expiresAt || invite.expiresAt > new Date());
  }

  /** Called inside the account-creation transaction. */
  async redeem(tx: Prisma.TransactionClient, code: string, userId: string): Promise<void> {
    const invite = await tx.invite.findUnique({ where: { code: code.toUpperCase() } });
    if (!invite || (invite.expiresAt && invite.expiresAt < new Date())) throw badRequest('INVALID_INVITE', 'That invite code is not valid.');
    // Conditional increment guards against concurrent redemptions of the last use.
    const updated = await tx.invite.updateMany({ where: { id: invite.id, uses: { lt: invite.maxUses } }, data: { uses: { increment: 1 } } });
    if (updated.count === 0) throw badRequest('INVALID_INVITE', 'That invite code has already been used.');
    await tx.inviteRedemption.create({ data: { inviteId: invite.id, userId } });
  }

  async createForUser(userId: string): Promise<string> {
    return this.prisma.$transaction(async (tx) => {
      const dec = await tx.user.updateMany({ where: { id: userId, invitesLeft: { gt: 0 } }, data: { invitesLeft: { decrement: 1 } } });
      if (dec.count === 0) throw forbidden('NO_INVITES_LEFT', 'You have no invites left.');
      const invite = await tx.invite.create({ data: { code: inviteCode(), createdBy: userId, maxUses: 1 } });
      return invite.code;
    });
  }

  async createByAdmin(maxUses: number, expiresAt?: Date): Promise<string> {
    const invite = await this.prisma.invite.create({ data: { code: inviteCode(), createdByAdmin: true, maxUses, expiresAt } });
    return invite.code;
  }

  async mine(userId: string) {
    const [user, invites] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { invitesLeft: true } }),
      this.prisma.invite.findMany({ where: { createdBy: userId }, orderBy: { createdAt: 'desc' }, select: { code: true, uses: true, maxUses: true } }),
    ]);
    return { invitesLeft: user.invitesLeft, invites };
  }
}
