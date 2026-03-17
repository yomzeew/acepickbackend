-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('superadmin', 'admin', 'professional', 'client', 'corperate', 'delivery');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('EMAIL', 'SMS', 'BOTH');

-- CreateEnum
CREATE TYPE "JobMode" AS ENUM ('VIRTUAL', 'PHYSICAL');

-- CreateEnum
CREATE TYPE "PayStatus" AS ENUM ('unpaid', 'paid', 'refunded', 'released');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('COMPLETED', 'APPROVED', 'DISPUTED', 'PENDING', 'DECLINED', 'ONGOING', 'CANCELLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('success', 'failed', 'pending');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('debit', 'credit');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('success', 'failed', 'pending');

-- CreateEnum
CREATE TYPE "ProductTransactionStatus" AS ENUM ('pending', 'ordered', 'delivered', 'disputed');

-- CreateEnum
CREATE TYPE "OrderMethod" AS ENUM ('self_pickup', 'delivery');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'paid', 'accepted', 'picked_up', 'confirm_pickup', 'in_transit', 'delivered', 'confirm_delivery', 'cancelled', 'disputed');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('car', 'bike', 'bus', 'truck', 'keke');

-- CreateEnum
CREATE TYPE "RiderStatus" AS ENUM ('busy', 'available', 'suspended', 'inactive');

-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('percentage', 'fixed');

-- CreateEnum
CREATE TYPE "CommissionScope" AS ENUM ('job', 'product', 'delivery', 'all');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('user_wallet', 'platform_escrow', 'platform_revenue', 'payment_gateway', 'professional_wallet');

-- CreateEnum
CREATE TYPE "EntryCategory" AS ENUM ('job', 'product', 'delivery');

-- CreateEnum
CREATE TYPE "WorkType" AS ENUM ('BUSY', 'IDLE');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('RESOLVED', 'PENDING');

-- CreateEnum
CREATE TYPE "WalletStatus" AS ENUM ('active', 'inactive', 'disabled');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('success', 'failed', 'pending');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fcmToken" TEXT,
    "phone" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "role" "UserRole" NOT NULL DEFAULT 'client',
    "agreed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" SERIAL NOT NULL,
    "firstName" VARCHAR(50) NOT NULL,
    "lastName" VARCHAR(50) NOT NULL,
    "fcmToken" TEXT,
    "avatar" TEXT,
    "birthDate" DATE,
    "verified" BOOLEAN NOT NULL DEFAULT true,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "totalJobs" INTEGER NOT NULL DEFAULT 0,
    "totalExpense" INTEGER NOT NULL DEFAULT 0,
    "rate" DECIMAL(65,30) DEFAULT 0,
    "totalJobsDeclined" INTEGER NOT NULL DEFAULT 0,
    "totalJobsPending" INTEGER NOT NULL DEFAULT 0,
    "count" INTEGER NOT NULL DEFAULT 0,
    "totalJobsOngoing" INTEGER NOT NULL DEFAULT 0,
    "totalJobsCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalReview" INTEGER NOT NULL DEFAULT 0,
    "totalJobsApproved" INTEGER NOT NULL DEFAULT 0,
    "totalJobsCanceled" INTEGER NOT NULL DEFAULT 0,
    "totalDisputes" INTEGER NOT NULL DEFAULT 0,
    "bvn" TEXT,
    "bvnVerified" BOOLEAN,
    "switch" BOOLEAN DEFAULT false,
    "store" BOOLEAN DEFAULT false,
    "position" VARCHAR(50),
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professionals" (
    "id" SERIAL NOT NULL,
    "file" VARCHAR(500),
    "intro" TEXT,
    "chargeFrom" DECIMAL(65,30),
    "language" VARCHAR(100) DEFAULT 'English',
    "available" BOOLEAN DEFAULT true,
    "workType" "WorkType" NOT NULL DEFAULT 'IDLE',
    "totalEarning" INTEGER NOT NULL DEFAULT 0,
    "completedAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "pendingAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "rejectedAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "availableWithdrawalAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "regNum" TEXT,
    "yearsOfExp" INTEGER,
    "online" BOOLEAN NOT NULL DEFAULT false,
    "profileId" INTEGER NOT NULL,
    "professionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professionals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professions" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "image" TEXT NOT NULL DEFAULT '',
    "sectorId" INTEGER NOT NULL,

    CONSTRAINT "professions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sectors" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "image" TEXT NOT NULL,

    CONSTRAINT "sectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" SERIAL NOT NULL,
    "description" TEXT,
    "title" TEXT,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "mode" "JobMode" DEFAULT 'VIRTUAL',
    "state" TEXT,
    "lga" TEXT,
    "fullAddress" TEXT,
    "long" DOUBLE PRECISION,
    "total" INTEGER,
    "departureDaysCount" INTEGER DEFAULT 0,
    "arrivalDaysCount" INTEGER DEFAULT 0,
    "clientLocation" JSONB,
    "clientLocationArrival" JSONB,
    "clientLocationDeparture" JSONB,
    "isLocationMatch" BOOLEAN DEFAULT false,
    "payStatus" "PayStatus" DEFAULT 'unpaid',
    "paymentRef" VARCHAR(200),
    "workmanship" DECIMAL(10,2),
    "materialsCost" DECIMAL(10,2),
    "numOfJobs" INTEGER DEFAULT 0,
    "isMaterial" BOOLEAN,
    "lan" DOUBLE PRECISION,
    "durationUnit" TEXT,
    "reason" TEXT,
    "durationValue" INTEGER,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "sectorId" INTEGER,
    "clientId" UUID NOT NULL,
    "professionalId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" BIGSERIAL NOT NULL,
    "previousBalance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currentBalance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currency" VARCHAR(50) NOT NULL DEFAULT 'NGN',
    "pin" TEXT,
    "status" "WalletStatus" NOT NULL DEFAULT 'active',
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" BIGSERIAL NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "type" "TransactionType" NOT NULL DEFAULT 'credit',
    "status" "TransactionStatus" NOT NULL,
    "channel" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "timestamp" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "reference" VARCHAR(200),
    "jobId" INTEGER,
    "productTransactionId" INTEGER,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "number" VARCHAR(20) NOT NULL,
    "bank" TEXT NOT NULL,
    "recipientCode" TEXT NOT NULL,
    "currency" VARCHAR(10) NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" BIGSERIAL NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "action" TEXT NOT NULL,
    "status" "ActivityStatus" NOT NULL DEFAULT 'success',
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certifications" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "companyIssue" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "profileId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_rooms" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "members" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commissions" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DECIMAL(5,4),
    "type" "CommissionType" NOT NULL DEFAULT 'percentage',
    "fixedAmount" DECIMAL(10,2),
    "minAmount" DECIMAL(10,2) DEFAULT 0,
    "appliesTo" "CommissionScope" NOT NULL,
    "active" BOOLEAN NOT NULL,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cooperations" (
    "id" SERIAL NOT NULL,
    "nameOfOrg" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "regNum" TEXT,
    "noOfEmployees" TEXT,
    "professionId" INTEGER,
    "profileId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cooperations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "directors" (
    "id" SERIAL NOT NULL,
    "firstName" VARCHAR(50) NOT NULL,
    "lastName" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(50) NOT NULL,
    "address" TEXT,
    "state" TEXT,
    "lga" TEXT,
    "bvn" VARCHAR(20),
    "cooperateId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "directors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" SERIAL NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'PENDING',
    "url" TEXT,
    "jobId" INTEGER,
    "productTransactionId" INTEGER,
    "reporterId" UUID,
    "partnerId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education" (
    "id" SERIAL NOT NULL,
    "school" TEXT NOT NULL,
    "degreeType" TEXT NOT NULL,
    "course" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "gradDate" TIMESTAMP(3),
    "isCurrent" BOOLEAN DEFAULT false,
    "profileId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiences" (
    "id" SERIAL NOT NULL,
    "postHeld" TEXT NOT NULL,
    "workPlace" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isCurrent" BOOLEAN DEFAULT false,
    "description" TEXT,
    "profileId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" SERIAL NOT NULL,
    "address" TEXT,
    "lga" TEXT,
    "state" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "zipcode" INTEGER,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" VARCHAR(20),
    "subTotal" INTEGER,
    "price" INTEGER NOT NULL,
    "jobId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" BIGSERIAL NOT NULL,
    "from" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "chatroomId" BIGINT NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "online_users" (
    "userId" UUID NOT NULL,
    "socketId" TEXT NOT NULL,
    "lastActive" TIMESTAMP(3) NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "online_users_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "distance" DECIMAL(10,2) NOT NULL,
    "weight" DECIMAL(10,2),
    "deliveryFee" DECIMAL(10,2),
    "pickupAddress" TEXT,
    "deliveryAddress" TEXT,
    "productTransactionId" INTEGER NOT NULL,
    "locationId" INTEGER NOT NULL,
    "riderId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolios" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "duration" VARCHAR(50) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "file" VARCHAR(500),
    "profileId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "images" TEXT,
    "weightPerUnit" DECIMAL(10,2),
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DECIMAL(10,2) NOT NULL,
    "approved" BOOLEAN,
    "discount" DOUBLE PRECISION,
    "categoryId" INTEGER NOT NULL,
    "userId" UUID NOT NULL,
    "locationId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_transactions" (
    "id" SERIAL NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DECIMAL(10,2) NOT NULL,
    "status" "ProductTransactionStatus" NOT NULL DEFAULT 'pending',
    "orderMethod" "OrderMethod" NOT NULL DEFAULT 'self_pickup',
    "date" TIMESTAMP(3) NOT NULL,
    "productId" INTEGER NOT NULL,
    "buyerId" UUID NOT NULL,
    "sellerId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "riders" (
    "id" SERIAL NOT NULL,
    "vehicleType" "VehicleType" NOT NULL DEFAULT 'bike',
    "licenseNumber" TEXT NOT NULL,
    "status" "RiderStatus" NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "riders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" BIGSERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "professionalUserId" UUID,
    "clientUserId" UUID,
    "jobId" INTEGER,
    "orderId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ratings" (
    "id" BIGSERIAL NOT NULL,
    "value" INTEGER NOT NULL,
    "professionalUserId" UUID,
    "clientUserId" UUID,
    "jobId" INTEGER,
    "orderId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfers" (
    "id" BIGSERIAL NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'pending',
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "timestamp" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "reference" VARCHAR(200) NOT NULL,
    "recipientCode" VARCHAR(200) NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verify" (
    "id" SERIAL NOT NULL,
    "contact" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "verified" BOOLEAN DEFAULT false,
    "type" "VerificationType" NOT NULL DEFAULT 'EMAIL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verify_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voicerecords" (
    "id" SERIAL NOT NULL,
    "url" TEXT,
    "duration" INTEGER,
    "profileId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voicerecords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_pricing" (
    "id" SERIAL NOT NULL,
    "vehicleType" "VehicleType" NOT NULL,
    "baseCost" DECIMAL(10,2) NOT NULL,
    "costPerKm" DECIMAL(10,2) NOT NULL,
    "costPerKg" DECIMAL(10,2) DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" BIGSERIAL NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "type" "TransactionType" NOT NULL DEFAULT 'credit',
    "account" "AccountType" NOT NULL,
    "category" "EntryCategory",
    "transactionId" BIGINT NOT NULL,
    "userId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_skills" (
    "id" SERIAL NOT NULL,
    "professionalId" INTEGER NOT NULL,
    "skillId" INTEGER NOT NULL,
    "proficiency" TEXT,
    "yearsOfExp" INTEGER,

    CONSTRAINT "professional_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_skills" (
    "id" SERIAL NOT NULL,
    "jobId" INTEGER NOT NULL,
    "skillId" INTEGER NOT NULL,

    CONSTRAINT "job_skills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_userId_key" ON "profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "professionals_profileId_key" ON "professionals"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_userId_key" ON "wallets"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_reference_key" ON "transactions"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_number_key" ON "accounts"("number");

-- CreateIndex
CREATE UNIQUE INDEX "cooperations_profileId_key" ON "cooperations"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "directors_cooperateId_key" ON "directors"("cooperateId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_productTransactionId_key" ON "orders"("productTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "riders_userId_key" ON "riders"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "transfers_reference_key" ON "transfers"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");

-- CreateIndex
CREATE UNIQUE INDEX "professional_skills_professionalId_skillId_key" ON "professional_skills"("professionalId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "job_skills_jobId_skillId_key" ON "job_skills"("jobId", "skillId");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professionals" ADD CONSTRAINT "professionals_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professionals" ADD CONSTRAINT "professionals_professionId_fkey" FOREIGN KEY ("professionId") REFERENCES "professions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professions" ADD CONSTRAINT "professions_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "sectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_productTransactionId_fkey" FOREIGN KEY ("productTransactionId") REFERENCES "product_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cooperations" ADD CONSTRAINT "cooperations_professionId_fkey" FOREIGN KEY ("professionId") REFERENCES "professions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cooperations" ADD CONSTRAINT "cooperations_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "directors" ADD CONSTRAINT "directors_cooperateId_fkey" FOREIGN KEY ("cooperateId") REFERENCES "cooperations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_productTransactionId_fkey" FOREIGN KEY ("productTransactionId") REFERENCES "product_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "education" ADD CONSTRAINT "education_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_chatroomId_fkey" FOREIGN KEY ("chatroomId") REFERENCES "chat_rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "online_users" ADD CONSTRAINT "online_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_productTransactionId_fkey" FOREIGN KEY ("productTransactionId") REFERENCES "product_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_transactions" ADD CONSTRAINT "product_transactions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_transactions" ADD CONSTRAINT "product_transactions_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_transactions" ADD CONSTRAINT "product_transactions_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "riders" ADD CONSTRAINT "riders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_professionalUserId_fkey" FOREIGN KEY ("professionalUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_professionalUserId_fkey" FOREIGN KEY ("professionalUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voicerecords" ADD CONSTRAINT "voicerecords_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_skills" ADD CONSTRAINT "professional_skills_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_skills" ADD CONSTRAINT "professional_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_skills" ADD CONSTRAINT "job_skills_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_skills" ADD CONSTRAINT "job_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
