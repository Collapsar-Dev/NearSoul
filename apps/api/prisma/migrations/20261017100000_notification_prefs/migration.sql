-- AlterTable
ALTER TABLE "users" ADD COLUMN     "daily_announced_key" TEXT,
ADD COLUMN     "last_reminder_push_day" TEXT,
ADD COLUMN     "notify_prefs" JSONB NOT NULL DEFAULT '{}';

