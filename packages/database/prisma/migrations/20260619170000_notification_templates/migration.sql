-- CreateTable
CREATE TABLE "notification_templates" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "version_note" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_code_channel_locale_version_key" ON "notification_templates"("code", "channel", "locale", "version");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_active_unique" ON "notification_templates"("code", "channel", "locale") WHERE "is_active" = true;

-- CreateIndex
CREATE INDEX "notification_templates_code_channel_locale_is_active_idx" ON "notification_templates"("code", "channel", "locale", "is_active");
