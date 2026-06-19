-- CreateTable
CREATE TABLE "staff_password_reset_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_password_reset_tokens_token_hash_key" ON "staff_password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "staff_password_reset_tokens_user_id_idx" ON "staff_password_reset_tokens"("user_id");

-- CreateIndex
CREATE INDEX "staff_password_reset_tokens_expires_at_idx" ON "staff_password_reset_tokens"("expires_at");

-- AddForeignKey
ALTER TABLE "staff_password_reset_tokens" ADD CONSTRAINT "staff_password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
