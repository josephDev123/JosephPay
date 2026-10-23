ALTER TABLE "ledger_accounts" ADD COLUMN "code" TEXT;

UPDATE "ledger_accounts"
SET "code" = 'LEGACY_' || "id"::text
WHERE "code" IS NULL;

ALTER TABLE "ledger_accounts" ALTER COLUMN "code" SET NOT NULL;

CREATE UNIQUE INDEX "ledger_accounts_code_key" ON "ledger_accounts"("code");
