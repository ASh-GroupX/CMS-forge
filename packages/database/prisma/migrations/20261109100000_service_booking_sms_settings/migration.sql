CREATE TABLE "service_booking_sms_settings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "lead_hours" INTEGER NOT NULL DEFAULT 24,
    "sender_number" TEXT NOT NULL DEFAULT '',
    "message_template" TEXT NOT NULL DEFAULT '',
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_booking_sms_settings_pkey" PRIMARY KEY ("id")
);
