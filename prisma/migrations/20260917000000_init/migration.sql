-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('text', 'number', 'date', 'boolean', 'select');

-- CreateTable
CREATE TABLE "clinics" (
    "id" UUID NOT NULL,
    "clinic_name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "default_extraction_schema_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extraction_schemas" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT,
    "schema_definition" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "extraction_schemas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" UUID NOT NULL,
    "patient_name" TEXT,
    "file_name" TEXT NOT NULL,
    "clinic_id" UUID NOT NULL,
    "extraction_schema_id" UUID,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "s3_bucket" TEXT NOT NULL,
    "s3_key" TEXT NOT NULL,
    "extracted_payload" JSONB,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clinics_username_key" ON "clinics"("username");

-- CreateIndex
CREATE UNIQUE INDEX "extraction_schemas_clinic_id_version_key" ON "extraction_schemas"("clinic_id", "version");

-- CreateIndex
CREATE INDEX "referrals_clinic_id_status_idx" ON "referrals"("clinic_id", "status");

-- AddForeignKey
ALTER TABLE "extraction_schemas" ADD CONSTRAINT "extraction_schemas_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_extraction_schema_id_fkey" FOREIGN KEY ("extraction_schema_id") REFERENCES "extraction_schemas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
