CREATE TABLE "integration_api_keys" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key_prefix" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "scopes" TEXT[] NOT NULL,
    "branch_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "all_branches" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "integration_api_keys_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "integration_api_keys_token_hash_key" ON "integration_api_keys"("token_hash");
CREATE INDEX "integration_api_keys_created_by_id_idx" ON "integration_api_keys"("created_by_id");
CREATE INDEX "integration_api_keys_revoked_at_idx" ON "integration_api_keys"("revoked_at");

ALTER TABLE "integration_api_keys" ADD CONSTRAINT "integration_api_keys_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;