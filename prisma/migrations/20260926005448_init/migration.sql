-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "legalName" TEXT NOT NULL,
    "tradeName" TEXT,
    "taxId" TEXT,
    "address" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logoObjectKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'TECHNICIAN',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taxId" TEXT,
    "address" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "contactName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Customer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Elevator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "identification" TEXT NOT NULL,
    "number" TEXT,
    "manufacturer" TEXT,
    "model" TEXT,
    "capacity" TEXT,
    "stops" TEXT,
    "location" TEXT,
    "type" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Elevator_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Elevator_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ServiceOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "customerId" TEXT NOT NULL,
    "elevatorId" TEXT NOT NULL,
    "technicianId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "situation" TEXT,
    "startTime" DATETIME,
    "endTime" DATETIME,
    "responsibleName" TEXT,
    "responsibleRole" TEXT,
    "generalNotes" TEXT,
    "servicesNotes" TEXT,
    "findingsNotes" TEXT,
    "openedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ServiceOrder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ServiceOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ServiceOrder_elevatorId_fkey" FOREIGN KEY ("elevatorId") REFERENCES "Elevator" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ServiceOrder_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ServiceRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "part" TEXT NOT NULL,
    "customPart" TEXT,
    "notes" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ServiceRecord_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ServiceOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ServiceRecord_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    "serviceRecordId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "originalName" TEXT,
    "caption" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Photo_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Photo_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ServiceOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Photo_serviceRecordId_fkey" FOREIGN KEY ("serviceRecordId") REFERENCES "ServiceRecord" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Photo_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Signature" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "signerName" TEXT NOT NULL,
    "signerRole" TEXT,
    "consentText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Signature_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Signature_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ServiceOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Company_taxId_idx" ON "Company"("taxId");

-- CreateIndex
CREATE INDEX "User_companyId_active_idx" ON "User"("companyId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "User_companyId_email_key" ON "User"("companyId", "email");

-- CreateIndex
CREATE INDEX "Customer_companyId_name_idx" ON "Customer"("companyId", "name");

-- CreateIndex
CREATE INDEX "Elevator_companyId_customerId_idx" ON "Elevator"("companyId", "customerId");

-- CreateIndex
CREATE INDEX "ServiceOrder_companyId_status_openedAt_idx" ON "ServiceOrder"("companyId", "status", "openedAt");

-- CreateIndex
CREATE INDEX "ServiceOrder_companyId_customerId_idx" ON "ServiceOrder"("companyId", "customerId");

-- CreateIndex
CREATE INDEX "ServiceOrder_companyId_elevatorId_idx" ON "ServiceOrder"("companyId", "elevatorId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceOrder_companyId_number_key" ON "ServiceOrder"("companyId", "number");

-- CreateIndex
CREATE INDEX "ServiceRecord_companyId_serviceOrderId_idx" ON "ServiceRecord"("companyId", "serviceOrderId");

-- CreateIndex
CREATE INDEX "Photo_companyId_serviceOrderId_idx" ON "Photo"("companyId", "serviceOrderId");

-- CreateIndex
CREATE INDEX "Photo_serviceRecordId_idx" ON "Photo"("serviceRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "Signature_serviceOrderId_key" ON "Signature"("serviceOrderId");
