CREATE TYPE "DataSource" AS ENUM ('LOCAL', 'MANUAL', 'DMS');

ALTER TABLE "customers"
  ADD COLUMN "data_source" "DataSource" NOT NULL DEFAULT 'LOCAL';

ALTER TABLE "vehicles"
  ADD COLUMN "data_source" "DataSource" NOT NULL DEFAULT 'LOCAL';

ALTER TABLE "complaints"
  ADD COLUMN "customer_data_source" "DataSource" NOT NULL DEFAULT 'LOCAL',
  ADD COLUMN "vehicle_data_source" "DataSource",
  ADD COLUMN "manual_customer_flag" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "manual_vehicle_flag" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "vehicle_related" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "vehicle_data_unavailable_reason" TEXT;
