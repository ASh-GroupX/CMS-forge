ALTER TABLE "notifications" ADD COLUMN "read_at" TIMESTAMP(3);

UPDATE "notifications"
SET "read_at" = COALESCE("sent_at", "queued_at")
WHERE "channel" = 'IN_APP' AND "status" = 'SENT';

CREATE INDEX "notifications_recipient_user_id_channel_read_at_queued_at_idx"
ON "notifications"("recipient_user_id", "channel", "read_at", "queued_at");
