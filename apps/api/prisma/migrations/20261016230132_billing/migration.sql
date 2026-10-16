-- AlterTable
ALTER TABLE "users" ADD COLUMN     "billing_id" TEXT NOT NULL DEFAULT gen_random_uuid()::text;
ALTER TABLE "users" ALTER COLUMN "billing_id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "entitlements" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "entitlement" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "store" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL,
    "expires_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "user_id" UUID,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "entitlements_user_id_entitlement_key" ON "entitlements"("user_id", "entitlement");

-- CreateIndex
CREATE UNIQUE INDEX "users_billing_id_key" ON "users"("billing_id");

-- AddForeignKey
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

