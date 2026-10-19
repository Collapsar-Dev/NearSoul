-- CR-30: selfie photo verification (verified badge).
ALTER TABLE "users" ADD COLUMN "verified_at" TIMESTAMP(3);

CREATE TABLE "photo_verifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "pose" TEXT NOT NULL,
    "storage_key" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_at" TIMESTAMP(3),
    "decided_by" TEXT,
    CONSTRAINT "photo_verifications_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "photo_verifications_status_created_at_idx" ON "photo_verifications"("status", "created_at");
CREATE INDEX "photo_verifications_user_id_created_at_idx" ON "photo_verifications"("user_id", "created_at");
ALTER TABLE "photo_verifications" ADD CONSTRAINT "photo_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
