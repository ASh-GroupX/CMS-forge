-- Move old demo funnel stages onto the fixed dealership workflow.
ALTER TYPE "DealStage" RENAME TO "DealStage_old";
CREATE TYPE "DealStage" AS ENUM ('LEAD', 'BOOKING', 'PAYMENT', 'FINANCE', 'INSURANCE', 'REGISTRATION', 'PDI', 'DELIVERY', 'POST_DELIVERY');

ALTER TABLE "deals"
  ALTER COLUMN "stage" DROP DEFAULT,
  ALTER COLUMN "stage" TYPE "DealStage" USING (
    CASE "stage"::text
      WHEN 'QUALIFIED' THEN 'BOOKING'
      WHEN 'TEST_DRIVE' THEN 'BOOKING'
      WHEN 'QUOTE' THEN 'PAYMENT'
      ELSE "stage"::text
    END
  )::"DealStage",
  ALTER COLUMN "stage" SET DEFAULT 'LEAD';

DROP TYPE "DealStage_old";
