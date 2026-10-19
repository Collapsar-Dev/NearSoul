-- CR-31: compatibility check by personal link.
CREATE TABLE "soul_links" (
    "code" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "soul_links_pkey" PRIMARY KEY ("code")
);
CREATE UNIQUE INDEX "soul_links_user_id_key" ON "soul_links"("user_id");
ALTER TABLE "soul_links" ADD CONSTRAINT "soul_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "soul_checks" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "viewer_id" UUID NOT NULL,
    "percent" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "soul_checks_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "soul_checks_owner_id_viewer_id_key" ON "soul_checks"("owner_id", "viewer_id");
CREATE INDEX "soul_checks_owner_id_created_at_idx" ON "soul_checks"("owner_id", "created_at");
CREATE INDEX "soul_checks_viewer_id_created_at_idx" ON "soul_checks"("viewer_id", "created_at");
ALTER TABLE "soul_checks" ADD CONSTRAINT "soul_checks_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "soul_checks" ADD CONSTRAINT "soul_checks_viewer_id_fkey" FOREIGN KEY ("viewer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
