-- AlterTable
ALTER TABLE "layer_overrides" ADD COLUMN     "insight_id" UUID;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "soul_keep_conversations" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "user_data_keys" (
    "user_id" UUID NOT NULL,
    "wrapped_key" TEXT NOT NULL,
    "key_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_data_keys_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "soul_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "topic_key" TEXT NOT NULL,
    "topic_version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'active',
    "turn_count" INTEGER NOT NULL DEFAULT 0,
    "summary_enc" TEXT,
    "question_enc" TEXT,
    "model" TEXT,
    "prompt_version" TEXT NOT NULL,
    "tokens_in" INTEGER NOT NULL DEFAULT 0,
    "tokens_out" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "resume_until" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "soul_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soul_messages" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "body_enc" TEXT NOT NULL,
    "idempotency_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purge_at" TIMESTAMP(3),

    CONSTRAINT "soul_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soul_insights" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "text_enc" TEXT NOT NULL,
    "evidence_enc" TEXT NOT NULL,
    "trait_key" TEXT,
    "trait_value" JSONB,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "user_edited" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "soul_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_events" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "safety_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "soul_sessions_user_id_started_at_idx" ON "soul_sessions"("user_id", "started_at");

-- CreateIndex
CREATE INDEX "soul_messages_session_id_created_at_idx" ON "soul_messages"("session_id", "created_at");

-- CreateIndex
CREATE INDEX "soul_messages_purge_at_idx" ON "soul_messages"("purge_at");

-- CreateIndex
CREATE UNIQUE INDEX "soul_messages_session_id_idempotency_key_key" ON "soul_messages"("session_id", "idempotency_key");

-- CreateIndex
CREATE INDEX "soul_insights_user_id_status_idx" ON "soul_insights"("user_id", "status");

-- CreateIndex
CREATE INDEX "safety_events_category_created_at_idx" ON "safety_events"("category", "created_at");

-- AddForeignKey
ALTER TABLE "user_data_keys" ADD CONSTRAINT "user_data_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soul_sessions" ADD CONSTRAINT "soul_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soul_messages" ADD CONSTRAINT "soul_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "soul_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soul_insights" ADD CONSTRAINT "soul_insights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soul_insights" ADD CONSTRAINT "soul_insights_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "soul_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
