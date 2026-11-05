ALTER TABLE "department_ticket_custom_fields" ADD COLUMN "phone_duplicate_check" BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE "ticket_customer_phones" (
  "id" TEXT NOT NULL,
  "ticket_id" TEXT NOT NULL,
  "field_id" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  CONSTRAINT "ticket_customer_phones_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ticket_customer_phones_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "internal_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ticket_customer_phones_ticket_id_field_id_key" ON "ticket_customer_phones"("ticket_id", "field_id");
CREATE INDEX "ticket_customer_phones_phone_idx" ON "ticket_customer_phones"("phone");
