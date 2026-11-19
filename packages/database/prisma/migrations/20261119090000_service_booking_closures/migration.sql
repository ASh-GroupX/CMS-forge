CREATE TABLE "service_booking_closures" (
  "id" TEXT NOT NULL,
  "service_center_id" TEXT NOT NULL,
  "start_date" DATE NOT NULL,
  "end_date" DATE NOT NULL,
  "reason" TEXT NOT NULL,
  "created_by_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "service_booking_closures_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "service_booking_closures_valid_range" CHECK ("end_date" >= "start_date"),
  CONSTRAINT "service_booking_closures_service_center_id_fkey" FOREIGN KEY ("service_center_id") REFERENCES "service_centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "service_booking_closures_service_center_id_start_date_end_date_idx"
  ON "service_booking_closures"("service_center_id", "start_date", "end_date");
