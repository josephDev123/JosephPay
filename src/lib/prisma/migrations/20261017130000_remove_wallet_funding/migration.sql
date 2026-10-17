ALTER TABLE "transactions" ADD COLUMN "provider" "PaymentProvider";
ALTER TABLE "transactions" ADD COLUMN "provider_reference" TEXT;
ALTER TABLE "transactions" ADD COLUMN "payment_url" TEXT;
ALTER TABLE "transactions" ADD COLUMN "customer_email" TEXT;
ALTER TABLE "transactions" ADD COLUMN "customer_name" TEXT;
ALTER TABLE "transactions" ADD COLUMN "provider_response" JSONB;
ALTER TABLE "transactions" ADD COLUMN "paid_at" TIMESTAMPTZ(6);
ALTER TABLE "transactions" ADD COLUMN "expires_at" TIMESTAMPTZ(6);
ALTER TABLE "transactions" ADD COLUMN "failure_code" TEXT;
ALTER TABLE "transactions" ADD COLUMN "failure_message" TEXT;

UPDATE "transactions" AS t
SET
  "provider" = f."provider",
  "provider_reference" = f."provider_reference",
  "payment_url" = f."payment_url",
  "customer_email" = f."customer_email",
  "customer_name" = f."customer_name",
  "provider_response" = f."provider_response",
  "paid_at" = f."paid_at",
  "expires_at" = f."expires_at",
  "failure_code" = f."failure_code",
  "failure_message" = f."failure_message"
FROM "wallet_fundings" AS f
WHERE t."id" = f."transaction_id";

CREATE UNIQUE INDEX "transactions_provider_provider_reference_key"
ON "transactions"("provider", "provider_reference");

ALTER TABLE "wallet_fundings" DROP CONSTRAINT "wallet_fundings_transaction_id_fkey";
DROP TABLE "wallet_fundings";
DROP TYPE "WalletFundingStatus";
