-- CR-29: matches can see each other's approximate area on a map when they opt in.
CREATE TABLE "map_shares" (
    "user_id" UUID NOT NULL,
    "until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "map_shares_pkey" PRIMARY KEY ("user_id")
);
ALTER TABLE "map_shares" ADD CONSTRAINT "map_shares_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
