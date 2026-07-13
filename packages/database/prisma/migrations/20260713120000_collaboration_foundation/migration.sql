CREATE TYPE "CommunicationGroupVisibility" AS ENUM ('PERSONAL', 'SHARED');
CREATE TYPE "CollaborationMentionSource" AS ENUM ('USER', 'SYSTEM_ROLE', 'SYSTEM_DEPARTMENT', 'CUSTOM_GROUP');
CREATE TYPE "CollaborationRecordType" AS ENUM ('COMPLAINT', 'TASK');

CREATE TABLE "communication_groups" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "visibility" "CommunicationGroupVisibility" NOT NULL DEFAULT 'PERSONAL',
  "owner_id" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "communication_groups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "communication_group_members" (
  "id" TEXT NOT NULL,
  "group_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "communication_group_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "complaint_watchers" (
  "id" TEXT NOT NULL,
  "complaint_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "added_by_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "complaint_watchers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "complaint_comment_mentions" (
  "id" TEXT NOT NULL,
  "comment_id" TEXT NOT NULL,
  "recipient_user_id" TEXT NOT NULL,
  "source" "CollaborationMentionSource" NOT NULL,
  "source_id" TEXT,
  "source_label" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "complaint_comment_mentions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "task_comment_mentions" (
  "id" TEXT NOT NULL,
  "task_comment_id" TEXT NOT NULL,
  "recipient_user_id" TEXT NOT NULL,
  "source" "CollaborationMentionSource" NOT NULL,
  "source_id" TEXT,
  "source_label" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "task_comment_mentions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notification_digest_items" (
  "id" TEXT NOT NULL,
  "recipient_user_id" TEXT NOT NULL,
  "record_type" "CollaborationRecordType" NOT NULL,
  "record_id" TEXT NOT NULL,
  "event_key" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "delivered_at" TIMESTAMP(3),
  CONSTRAINT "notification_digest_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "communication_groups_owner_id_name_key" ON "communication_groups"("owner_id", "name");
CREATE INDEX "communication_groups_visibility_is_active_idx" ON "communication_groups"("visibility", "is_active");
CREATE UNIQUE INDEX "communication_group_members_group_id_user_id_key" ON "communication_group_members"("group_id", "user_id");
CREATE INDEX "communication_group_members_user_id_idx" ON "communication_group_members"("user_id");
CREATE UNIQUE INDEX "complaint_watchers_complaint_id_user_id_key" ON "complaint_watchers"("complaint_id", "user_id");
CREATE INDEX "complaint_watchers_user_id_idx" ON "complaint_watchers"("user_id");
CREATE UNIQUE INDEX "complaint_comment_mentions_comment_id_recipient_user_id_key" ON "complaint_comment_mentions"("comment_id", "recipient_user_id");
CREATE INDEX "complaint_comment_mentions_recipient_user_id_idx" ON "complaint_comment_mentions"("recipient_user_id");
CREATE UNIQUE INDEX "task_comment_mentions_task_comment_id_recipient_user_id_key" ON "task_comment_mentions"("task_comment_id", "recipient_user_id");
CREATE INDEX "task_comment_mentions_recipient_user_id_idx" ON "task_comment_mentions"("recipient_user_id");
CREATE UNIQUE INDEX "notification_digest_items_event_key_key" ON "notification_digest_items"("event_key");
CREATE INDEX "notification_digest_items_recipient_user_id_record_type_record_id_delivered_at_idx" ON "notification_digest_items"("recipient_user_id", "record_type", "record_id", "delivered_at");

ALTER TABLE "communication_groups" ADD CONSTRAINT "communication_groups_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "communication_group_members" ADD CONSTRAINT "communication_group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "communication_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "communication_group_members" ADD CONSTRAINT "communication_group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "complaint_watchers" ADD CONSTRAINT "complaint_watchers_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "complaint_watchers" ADD CONSTRAINT "complaint_watchers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "complaint_watchers" ADD CONSTRAINT "complaint_watchers_added_by_id_fkey" FOREIGN KEY ("added_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "complaint_comment_mentions" ADD CONSTRAINT "complaint_comment_mentions_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "complaint_comment_mentions" ADD CONSTRAINT "complaint_comment_mentions_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "task_comment_mentions" ADD CONSTRAINT "task_comment_mentions_task_comment_id_fkey" FOREIGN KEY ("task_comment_id") REFERENCES "task_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_comment_mentions" ADD CONSTRAINT "task_comment_mentions_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "notification_digest_items" ADD CONSTRAINT "notification_digest_items_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
