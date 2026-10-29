-- CreateTable
CREATE TABLE IF NOT EXISTS "user_booking_rules" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "can_view_bookings" BOOLEAN NOT NULL DEFAULT true,
    "can_create_bookings" BOOLEAN NOT NULL DEFAULT true,
    "can_reschedule_bookings" BOOLEAN NOT NULL DEFAULT true,
    "can_change_status" BOOLEAN NOT NULL DEFAULT true,
    "can_cancel_bookings" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_settings" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_booking_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "user_booking_rules_user_id_key" ON "user_booking_rules"("user_id");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "user_booking_rules" ADD CONSTRAINT "user_booking_rules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
