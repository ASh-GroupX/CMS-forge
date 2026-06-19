-- CreateTable
CREATE TABLE "customer_notification_preferences" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "preferred_channel" "NotificationChannel",
    "sms_quiet_start" TEXT,
    "sms_quiet_end" TEXT,
    "timezone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_notification_preferences_customer_id_key" ON "customer_notification_preferences"("customer_id");

-- AddForeignKey
ALTER TABLE "customer_notification_preferences" ADD CONSTRAINT "customer_notification_preferences_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
