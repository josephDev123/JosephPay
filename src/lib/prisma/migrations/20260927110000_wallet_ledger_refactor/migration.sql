DO $$ BEGIN CREATE TYPE "WalletStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'CLOSED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "LedgerAccountType" AS ENUM ('CUSTOMER_WALLET', 'BANK', 'CASH', 'REVENUE', 'EXPENSE', 'PAYABLE', 'RECEIVABLE', 'OPENING_BALANCE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "LedgerAccountOwnerType" AS ENUM ('CUSTOMER', 'SYSTEM', 'MERCHANT', 'BANK'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "LedgerAccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'CLOSED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'PAYMENT', 'REFUND', 'FEE', 'REVERSAL', 'OPENING_BALANCE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REVERSED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "LedgerEntryType" AS ENUM ('DEBIT', 'CREDIT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  IF to_regclass('public.wallets') IS NOT NULL THEN
    ALTER TABLE "wallets" RENAME TO "wallets_legacy";
  END IF;
  IF to_regclass('public.wallets_legacy') IS NOT NULL
     AND EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wallets_pkey') THEN
    ALTER TABLE "wallets_legacy" RENAME CONSTRAINT "wallets_pkey" TO "wallets_legacy_pkey";
  END IF;
  IF to_regclass('public.wallet_user_id_currency_key') IS NOT NULL THEN
    ALTER INDEX "wallet_user_id_currency_key" RENAME TO "wallets_legacy_user_id_currency_key";
  END IF;
  IF to_regclass('public.wallet_user_id_idx') IS NOT NULL THEN
    ALTER INDEX "wallet_user_id_idx" RENAME TO "wallets_legacy_user_id_idx";
  END IF;
END $$;

CREATE TABLE "wallets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "WalletStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ledger_accounts" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "LedgerAccountType" NOT NULL,
    "owner_type" "LedgerAccountOwnerType" NOT NULL,
    "owner_id" UUID,
    "currency" "Currency" NOT NULL,
    "status" "LedgerAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "ledger_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "wallet_balances" (
    "id" UUID NOT NULL,
    "wallet_id" UUID NOT NULL,
    "ledger_account_id" UUID NOT NULL,
    "currency" "Currency" NOT NULL,
    "balance" BIGINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "wallet_balances_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "reference" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL,
    "amount" BIGINT NOT NULL,
    "currency" "Currency" NOT NULL,
    "initiated_by_user_id" UUID,
    "source_account_id" UUID,
    "destination_account_id" UUID,
    "idempotency_scope" TEXT,
    "idempotency_key" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ledger_entries" (
    "id" UUID NOT NULL,
    "transaction_id" UUID NOT NULL,
    "ledger_account_id" UUID NOT NULL,
    "entry_type" "LedgerEntryType" NOT NULL,
    "amount" BIGINT NOT NULL,
    "currency" "Currency" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

INSERT INTO "wallets" ("id", "user_id", "status", "created_at", "updated_at")
SELECT DISTINCT ON ("user_id") "id", "user_id", 'ACTIVE', "created_at", "updated_at"
FROM "wallets_legacy"
ORDER BY "user_id", "created_at", "id";

INSERT INTO "ledger_accounts" ("id", "name", "type", "owner_type", "owner_id", "currency", "created_at", "updated_at")
SELECT "id", 'Customer wallet ' || "user_id" || ' ' || "currency", 'CUSTOMER_WALLET', 'CUSTOMER', "user_id", "currency", "created_at", "updated_at"
FROM "wallets_legacy";

INSERT INTO "wallet_balances" ("id", "wallet_id", "ledger_account_id", "currency", "balance", "created_at", "updated_at")
SELECT legacy."id", wallet."id", legacy."id", legacy."currency", legacy."balance", legacy."created_at", legacy."updated_at"
FROM "wallets_legacy" legacy
JOIN "wallets" wallet ON wallet."user_id" = legacy."user_id";

CREATE UNIQUE INDEX "wallets_user_id_key" ON "wallets"("user_id");
CREATE UNIQUE INDEX "wallet_balances_ledger_account_id_key" ON "wallet_balances"("ledger_account_id");
CREATE UNIQUE INDEX "wallet_balances_wallet_id_currency_key" ON "wallet_balances"("wallet_id", "currency");
CREATE UNIQUE INDEX "transactions_reference_key" ON "transactions"("reference");
CREATE UNIQUE INDEX "transactions_idempotency_scope_idempotency_key_key" ON "transactions"("idempotency_scope", "idempotency_key");
CREATE INDEX "ledger_accounts_owner_type_owner_id_idx" ON "ledger_accounts"("owner_type", "owner_id");
CREATE INDEX "ledger_accounts_currency_type_idx" ON "ledger_accounts"("currency", "type");
CREATE INDEX "transactions_initiated_by_user_id_created_at_idx" ON "transactions"("initiated_by_user_id", "created_at");
CREATE INDEX "ledger_entries_ledger_account_id_created_at_idx" ON "ledger_entries"("ledger_account_id", "created_at");
CREATE INDEX "ledger_entries_transaction_id_idx" ON "ledger_entries"("transaction_id");

ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "wallet_balances" ADD CONSTRAINT "wallet_balances_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "wallet_balances" ADD CONSTRAINT "wallet_balances_ledger_account_id_fkey" FOREIGN KEY ("ledger_account_id") REFERENCES "ledger_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_initiated_by_user_id_fkey" FOREIGN KEY ("initiated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_source_account_id_fkey" FOREIGN KEY ("source_account_id") REFERENCES "ledger_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_destination_account_id_fkey" FOREIGN KEY ("destination_account_id") REFERENCES "ledger_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_ledger_account_id_fkey" FOREIGN KEY ("ledger_account_id") REFERENCES "ledger_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DROP TABLE "wallets_legacy";
