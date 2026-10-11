import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Lazy Prisma client - não instancia se DATABASE_URL não existir (build time)
function createPrismaClient() {
  if (!process.env.DATABASE_URL) {
    return null as any;
  }
  return new PrismaClient();
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// Helper para verificar se DB está disponível
export function isDbAvailable(): boolean {
  return !!process.env.DATABASE_URL && db !== null;
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

  const user = await db.user.create({
    data: {
      companyId: company.id,
      name: "Andre Jan",
      email: "andrejan@smartintech.com",
      passwordHash,
      role: "ADMIN",
    },
  });

  return { company, user };
}
