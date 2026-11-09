CREATE SEQUENCE "ledger_account_number_seq"
  AS BIGINT
  START WITH 1000000000
  INCREMENT BY 1
  MINVALUE 1000000000
  MAXVALUE 9999999999
  NO CYCLE;

ALTER TABLE "ledger_accounts"
ADD COLUMN "account_number" TEXT;

UPDATE "ledger_accounts"
SET "account_number" = nextval('ledger_account_number_seq')::text
WHERE "type" = 'CUSTOMER_WALLET';

CREATE UNIQUE INDEX "ledger_accounts_account_number_key"
ON "ledger_accounts"("account_number");
