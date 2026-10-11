-- CreateEnum
CREATE TYPE "CollectionStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'EXPIRED', 'REVERSED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('PAYSTACK', 'STRIPE', 'FLUTTERWAVE');

-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'COLLECTION';

-- CreateTable
CREATE TABLE "collections" (
    "id" UUID NOT NULL,
    "reference" TEXT NOT NULL,
    "merchant_user_id" UUID NOT NULL,
    "transaction_id" UUID NOT NULL,
    "amount" BIGINT NOT NULL,
    "currency" "Currency" NOT NULL,
    "status" "CollectionStatus" NOT NULL DEFAULT 'PENDING',
    "provider" "PaymentProvider" NOT NULL,
    "provider_reference" TEXT,
    "payment_url" TEXT,
    "customer_email" TEXT NOT NULL,
    "customer_name" TEXT,
    "idempotency_scope" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "provider_response" JSONB,
    "metadata" JSONB,
    "paid_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "failure_code" TEXT,
    "failure_message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" UUID NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "event_reference" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "signature_valid" BOOLEAN NOT NULL,
    "processing_status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "processed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "collections_reference_key" ON "collections"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "collections_transaction_id_key" ON "collections"("transaction_id");

-- CreateIndex
CREATE INDEX "collections_merchant_user_id_created_at_idx" ON "collections"("merchant_user_id", "created_at");

-- CreateIndex
CREATE INDEX "collections_status_created_at_idx" ON "collections"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "collections_idempotency_scope_idempotency_key_key" ON "collections"("idempotency_scope", "idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "collections_provider_provider_reference_key" ON "collections"("provider", "provider_reference");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_provider_event_reference_key" ON "webhook_events"("provider", "event_reference");

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_merchant_user_id_fkey" FOREIGN KEY ("merchant_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
