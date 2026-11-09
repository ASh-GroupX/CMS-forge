ALTER TABLE "notifications" ADD COLUMN "service_appointment_id" TEXT;
ALTER TABLE "notifications" ADD COLUMN "scheduled_at" TIMESTAMP(3);
CREATE INDEX "notifications_service_appointment_id_channel_status_idx" ON "notifications"("service_appointment_id", "channel", "status");
CREATE INDEX "notifications_channel_status_scheduled_at_idx" ON "notifications"("channel", "status", "scheduled_at");
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_service_appointment_id_fkey" FOREIGN KEY ("service_appointment_id") REFERENCES "service_appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
