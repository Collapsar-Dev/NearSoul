-- AlterTable
ALTER TABLE "users" ADD COLUMN     "onboarding_skipped" TEXT[] DEFAULT ARRAY[]::TEXT[];

