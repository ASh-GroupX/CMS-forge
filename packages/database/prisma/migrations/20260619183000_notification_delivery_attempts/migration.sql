-- CreateTable
CREATE TABLE "notification_delivery_attempts" (
    "id" TEXT NOT NULL,
    "notification_id" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL,
    "provider" TEXT,
    "provider_result" TEXT,
    "failure_reason" TEXT,
    "attempted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_delivery_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_delivery_attempts_notification_id_attempted_at_idx" ON "notification_delivery_attempts"("notification_id", "attempted_at");

-- CreateIndex
CREATE INDEX "notification_delivery_attempts_status_idx" ON "notification_delivery_attempts"("status");

-- AddForeignKey
ALTER TABLE "notification_delivery_attempts" ADD CONSTRAINT "notification_delivery_attempts_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
