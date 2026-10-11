import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Lazy Prisma client - não instancia se DATABASE_URL não existir (build time)
function createPrismaClient() {
  if (!process.env.DATABASE_URL) {
    return null as any;
  }

  // Garante que o arquivo SQLite exista (Hostinger precisa do arquivo físico)
  const dbPath = process.env.DATABASE_URL.replace(/^file:/, "");
  const fullPath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);

  if (!fs.existsSync(fullPath)) {
    try {
      fs.writeFileSync(fullPath, "", { encoding: "utf8" });
      console.log("[DB] Arquivo SQLite criado:", fullPath);
    } catch (e) {
      console.error("[DB] Falha ao criar arquivo SQLite:", e);
    }
  }

  return new PrismaClient();
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// Helper para verificar se DB está disponível
export function isDbAvailable(): boolean {
  return !!process.env.DATABASE_URL && db !== null;
}

// Cria schema via SQL raw
export async function createSchema() {
  if (!isDbAvailable()) {
    throw new Error("DATABASE_URL não configurada");
  }

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Company" (
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
    );`);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "User" (
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
    );`);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Customer" (
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
    );`);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Elevator" (
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
    );`);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ServiceOrder" (
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
    );`);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ServiceRecord" (
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
    );`);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Photo" (
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
    );`);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Signature" (
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
    );`);

  // Criar índices
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Company_taxId_idx" ON "Company"("taxId");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "User_companyId_active_idx" ON "User"("companyId", "active");`);
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "User_companyId_email_key" ON "User"("companyId", "email");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Customer_companyId_name_idx" ON "Customer"("companyId", "name");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Elevator_companyId_customerId_idx" ON "Elevator"("companyId", "customerId");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ServiceOrder_companyId_status_openedAt_idx" ON "ServiceOrder"("companyId", "status", "openedAt");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ServiceOrder_companyId_customerId_idx" ON "ServiceOrder"("companyId", "customerId");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ServiceOrder_companyId_elevatorId_idx" ON "ServiceOrder"("companyId", "elevatorId");`);
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "ServiceOrder_companyId_number_key" ON "ServiceOrder"("companyId", "number");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ServiceRecord_companyId_serviceOrderId_idx" ON "ServiceRecord"("companyId", "serviceOrderId");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Photo_companyId_serviceOrderId_idx" ON "Photo"("companyId", "serviceOrderId");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Photo_serviceRecordId_idx" ON "Photo"("serviceRecordId");`);
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Signature_serviceOrderId_key" ON "Signature"("serviceOrderId");`);

  await prisma.$disconnect();
}

// Função para criar empresa e usuário de bootstrap
export async function bootstrapCompany() {
  if (!isDbAvailable()) {
    throw new Error("DATABASE_URL não configurada");
  }
  const existingCompany = await db.company.findFirst({
    where: { id: "company-andrejan" },
  });

  if (existingCompany) {
    return { company: existingCompany, user: null };
  }

  const company = await db.company.upsert({
    where: { id: "company-andrejan" },
    update: {},
    create: {
      id: "company-andrejan",
      legalName: "Smart Intech Serviços Ltda",
      tradeName: "Smart Intech",
      taxId: "58.108.960/0001-50",
      address: "Rua do Rocio",
      number: "220",
      complement: "Sala 101",
      neighborhood: "Vila Olímpia",
      city: "São Paulo",
      state: "SP",
      postalCode: "04552-000",
      phone: "(11) 99999-9999",
      email: "andrejan@smartintech.com",
    },
  });

  const passwordHash = await bcrypt.hash("73710000", 10);

  const user = await db.user.upsert({
    where: {
      companyId_email: { companyId: company.id, email: "andrejan@smartintech.com" }
    },
    update: {},
    create: {
      companyId: company.id,
      name: "Andre Jan",
      email: "andrejan@smartintech.com",
      passwordHash,
      role: "ADMIN",
    },
  });

  return { company, user };
}
