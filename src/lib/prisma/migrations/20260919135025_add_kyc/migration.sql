/*
  Warnings:

  - You are about to drop the column `documentType` on the `kycs` table. All the data in the column will be lost.
  - You are about to drop the column `submitted_data` on the `kycs` table. All the data in the column will be lost.
  - Added the required column `document_type` to the `kycs` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "KycProvider" AS ENUM ('DOJAH', 'PREMBLY', 'MANUAL');

-- AlterTable
ALTER TABLE "kycs" DROP COLUMN "documentType",
DROP COLUMN "submitted_data",
ADD COLUMN     "date_of_birth" DATE,
ADD COLUMN     "document_expiry_date" DATE,
ADD COLUMN     "document_issue_date" DATE,
ADD COLUMN     "document_number" TEXT,
ADD COLUMN     "document_type" "KycDocumentType" NOT NULL,
ADD COLUMN     "first_name" TEXT,
ADD COLUMN     "last_name" TEXT,
ADD COLUMN     "middle_name" TEXT,
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "provider" "KycProvider",
ADD COLUMN     "provider_reference" TEXT,
ADD COLUMN     "provider_response" JSONB;
