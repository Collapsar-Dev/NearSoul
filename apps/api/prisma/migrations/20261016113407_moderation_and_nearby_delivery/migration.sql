/*
  Warnings:

  - Added the required column `deliver_at` to the `nearby_alerts` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "nearby_alerts_user_a_user_b_sent_at_idx";

-- AlterTable
ALTER TABLE "nearby_alerts" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deliver_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "sent_at" DROP NOT NULL,
ALTER COLUMN "sent_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "hidden_by_moderation" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "nearby_alerts_user_a_user_b_created_at_idx" ON "nearby_alerts"("user_a", "user_b", "created_at");

-- CreateIndex
CREATE INDEX "nearby_alerts_sent_at_deliver_at_idx" ON "nearby_alerts"("sent_at", "deliver_at");
