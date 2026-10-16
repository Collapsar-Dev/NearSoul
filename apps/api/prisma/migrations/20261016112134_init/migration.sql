-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('onboarding', 'active', 'suspended', 'blocked_underage', 'deletion_requested', 'deleted');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'tester');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('woman', 'man', 'non_binary');

-- CreateEnum
CREATE TYPE "Intent" AS ENUM ('long_term', 'open_to_long', 'casual', 'not_sure');

-- CreateEnum
CREATE TYPE "ShareLevel" AS ENUM ('minimal', 'standard', 'deep');

-- CreateEnum
CREATE TYPE "CardVisibility" AS ENUM ('everyone', 'matches_only', 'hidden');

-- CreateEnum
CREATE TYPE "PhotoStatus" AS ENUM ('quarantine', 'ready', 'rejected');

-- CreateEnum
CREATE TYPE "LikeAction" AS ENUM ('like', 'pass');

-- CreateEnum
CREATE TYPE "LikeSource" AS ENUM ('daily', 'nearby', 'profile');

-- CreateEnum
CREATE TYPE "CodePurpose" AS ENUM ('login', 'sensitive_action', 'email_change');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'onboarding',
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "onboarding_step" TEXT NOT NULL DEFAULT 'dob',
    "dob" DATE,
    "age_gate_passed_at" TIMESTAMP(3),
    "discovery_enabled" BOOLEAN NOT NULL DEFAULT false,
    "hide_distance" BOOLEAN NOT NULL DEFAULT false,
    "read_receipts" BOOLEAN NOT NULL DEFAULT true,
    "card_visibility" "CardVisibility" NOT NULL DEFAULT 'matches_only',
    "share_level" "ShareLevel",
    "flexible_fallback" BOOLEAN NOT NULL DEFAULT true,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Amsterdam',
    "analytics_id" TEXT NOT NULL,
    "is_demo" BOOLEAN NOT NULL DEFAULT false,
    "invites_left" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_active_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletion_requested_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_codes" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "purpose" "CodePurpose" NOT NULL,
    "code_hash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "device_id" TEXT,
    "platform" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "replaced_by" UUID,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_tokens" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,

    CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consents" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "value" JSONB,
    "granted" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cities" (
    "id" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "country_code" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interests" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "labels" JSONB NOT NULL,

    CONSTRAINT "interests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "user_id" UUID NOT NULL,
    "first_name" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "interested_in" "Gender"[],
    "intent" "Intent" NOT NULL,
    "bio" TEXT NOT NULL DEFAULT '',
    "age_min" INTEGER NOT NULL,
    "age_max" INTEGER NOT NULL,
    "city_id" TEXT,
    "height_cm" INTEGER,
    "job_title" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "profile_interests" (
    "user_id" UUID NOT NULL,
    "interest_id" TEXT NOT NULL,

    CONSTRAINT "profile_interests_pkey" PRIMARY KEY ("user_id","interest_id")
);

-- CreateTable
CREATE TABLE "photos" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "storage_key" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "status" "PhotoStatus" NOT NULL DEFAULT 'quarantine',
    "sha256" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engine_answers" (
    "user_id" UUID NOT NULL,
    "item_key" TEXT NOT NULL,
    "item_version" INTEGER NOT NULL,
    "value" JSONB NOT NULL,
    "answered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "engine_answers_pkey" PRIMARY KEY ("user_id","item_key")
);

-- CreateTable
CREATE TABLE "soul_profiles" (
    "user_id" UUID NOT NULL,
    "profile" JSONB NOT NULL,
    "archetype" TEXT NOT NULL,
    "depth" INTEGER NOT NULL,
    "engine_version" TEXT NOT NULL,
    "norms_version" TEXT NOT NULL,
    "profile_version" INTEGER NOT NULL DEFAULT 1,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "soul_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "layer_overrides" (
    "user_id" UUID NOT NULL,
    "trait_key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "source" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "layer_overrides_pkey" PRIMARY KEY ("user_id","trait_key")
);

-- CreateTable
CREATE TABLE "match_config" (
    "version" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_config_pkey" PRIMARY KEY ("version")
);

-- CreateTable
CREATE TABLE "personality_cards" (
    "user_id" UUID NOT NULL,
    "headline" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "communication_style" TEXT NOT NULL,
    "ideal_first_date" TEXT NOT NULL,
    "strengths" TEXT[],
    "source" TEXT NOT NULL,
    "model" TEXT,
    "prompt_version" TEXT NOT NULL,
    "user_edited" BOOLEAN NOT NULL DEFAULT false,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personality_cards_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "daily_sets" (
    "user_id" UUID NOT NULL,
    "date" TEXT NOT NULL,
    "candidate_ids" TEXT[],
    "config_version" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_sets_pkey" PRIMARY KEY ("user_id","date")
);

-- CreateTable
CREATE TABLE "likes" (
    "id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "target_id" UUID NOT NULL,
    "action" "LikeAction" NOT NULL,
    "source" "LikeSource" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" UUID NOT NULL,
    "user_low" UUID NOT NULL,
    "user_high" UUID NOT NULL,
    "source" "LikeSource" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "ended_by" UUID,
    "end_reason" TEXT,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "match_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "client_message_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),
    "hidden_at" TIMESTAMP(3),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "owner_id" UUID NOT NULL,
    "other_id" UUID,
    "match_id" UUID,
    "effective_share_level" "ShareLevel",
    "data" JSONB NOT NULL,
    "sections" JSONB NOT NULL,
    "source_versions" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocks" (
    "blocker_id" UUID NOT NULL,
    "blocked_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocks_pkey" PRIMARY KEY ("blocker_id","blocked_id")
);

-- CreateTable
CREATE TABLE "reports_moderation" (
    "id" UUID NOT NULL,
    "reporter_id" UUID NOT NULL,
    "reported_id" UUID NOT NULL,
    "match_id" UUID,
    "category" TEXT NOT NULL,
    "comment" TEXT,
    "urgent" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'open',
    "assigned_to" UUID,
    "resolution" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "reports_moderation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_actions" (
    "id" UUID NOT NULL,
    "admin_id" UUID NOT NULL,
    "target_user_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "report_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "mfa_secret" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "actor_type" TEXT NOT NULL,
    "actor_id" UUID,
    "action" TEXT NOT NULL,
    "target_type" TEXT,
    "target_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invites" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "created_by" UUID,
    "created_by_admin" BOOLEAN NOT NULL DEFAULT false,
    "max_uses" INTEGER NOT NULL DEFAULT 1,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invite_redemptions" (
    "invite_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "redeemed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invite_redemptions_pkey" PRIMARY KEY ("invite_id","user_id")
);

-- CreateTable
CREATE TABLE "feedback" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "app_version" TEXT,
    "platform" TEXT,
    "screen" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ratings" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "stars" INTEGER NOT NULL,
    "comment" TEXT,
    "engine_version" TEXT NOT NULL,
    "match_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_locations" (
    "user_id" UUID NOT NULL,
    "h3_cell" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "simulated" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_locations_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "nearby_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "radius_m" INTEGER NOT NULL,
    "activity" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "open_until" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "nearby_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nearby_alerts" (
    "id" UUID NOT NULL,
    "user_a" UUID NOT NULL,
    "user_b" UUID NOT NULL,
    "band" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nearby_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nearby_later" (
    "user_id" UUID NOT NULL,
    "target_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nearby_later_pkey" PRIMARY KEY ("user_id","target_id","session_id")
);

-- CreateTable
CREATE TABLE "pair_outcomes" (
    "id" UUID NOT NULL,
    "user_low" UUID NOT NULL,
    "user_high" UUID NOT NULL,
    "tier" TEXT NOT NULL,
    "config_version" TEXT NOT NULL,
    "shown_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "matched_at" TIMESTAMP(3),
    "first_msg_at" TIMESTAMP(3),
    "ten_msgs_at" TIMESTAMP(3),

    CONSTRAINT "pair_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_status_discovery_enabled_idx" ON "users"("status", "discovery_enabled");

-- CreateIndex
CREATE INDEX "auth_codes_email_purpose_created_at_idx" ON "auth_codes"("email", "purpose", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refresh_token_hash_key" ON "sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_family_id_idx" ON "sessions"("family_id");

-- CreateIndex
CREATE UNIQUE INDEX "device_tokens_session_id_token_key" ON "device_tokens"("session_id", "token");

-- CreateIndex
CREATE INDEX "consents_user_id_type_created_at_idx" ON "consents"("user_id", "type", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "photos_storage_key_key" ON "photos"("storage_key");

-- CreateIndex
CREATE INDEX "photos_user_id_position_idx" ON "photos"("user_id", "position");

-- CreateIndex
CREATE INDEX "likes_target_id_action_idx" ON "likes"("target_id", "action");

-- CreateIndex
CREATE UNIQUE INDEX "likes_actor_id_target_id_key" ON "likes"("actor_id", "target_id");

-- CreateIndex
CREATE INDEX "matches_user_low_idx" ON "matches"("user_low");

-- CreateIndex
CREATE INDEX "matches_user_high_idx" ON "matches"("user_high");

-- CreateIndex
CREATE UNIQUE INDEX "matches_user_low_user_high_key" ON "matches"("user_low", "user_high");

-- CreateIndex
CREATE INDEX "messages_match_id_created_at_idx" ON "messages"("match_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "messages_sender_id_client_message_id_key" ON "messages"("sender_id", "client_message_id");

-- CreateIndex
CREATE UNIQUE INDEX "reports_type_owner_id_match_id_key" ON "reports"("type", "owner_id", "match_id");

-- CreateIndex
CREATE INDEX "reports_moderation_status_urgent_created_at_idx" ON "reports_moderation"("status", "urgent", "created_at");

-- CreateIndex
CREATE INDEX "reports_moderation_reported_id_created_at_idx" ON "reports_moderation"("reported_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE INDEX "audit_events_target_type_target_id_idx" ON "audit_events"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "invites_code_key" ON "invites"("code");

-- CreateIndex
CREATE UNIQUE INDEX "invite_redemptions_user_id_key" ON "invite_redemptions"("user_id");

-- CreateIndex
CREATE INDEX "user_locations_updated_at_idx" ON "user_locations"("updated_at");

-- CreateIndex
CREATE INDEX "nearby_sessions_user_id_started_at_idx" ON "nearby_sessions"("user_id", "started_at");

-- CreateIndex
CREATE INDEX "nearby_sessions_open_until_idx" ON "nearby_sessions"("open_until");

-- CreateIndex
CREATE INDEX "nearby_alerts_user_a_user_b_sent_at_idx" ON "nearby_alerts"("user_a", "user_b", "sent_at");

-- CreateIndex
CREATE UNIQUE INDEX "pair_outcomes_user_low_user_high_key" ON "pair_outcomes"("user_low", "user_high");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consents" ADD CONSTRAINT "consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_interests" ADD CONSTRAINT "profile_interests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_interests" ADD CONSTRAINT "profile_interests_interest_id_fkey" FOREIGN KEY ("interest_id") REFERENCES "interests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engine_answers" ADD CONSTRAINT "engine_answers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soul_profiles" ADD CONSTRAINT "soul_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "layer_overrides" ADD CONSTRAINT "layer_overrides_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personality_cards" ADD CONSTRAINT "personality_cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_redemptions" ADD CONSTRAINT "invite_redemptions_invite_id_fkey" FOREIGN KEY ("invite_id") REFERENCES "invites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_locations" ADD CONSTRAINT "user_locations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
