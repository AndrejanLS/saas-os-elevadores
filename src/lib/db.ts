import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// Função para criar empresa e usuário de bootstrap
export async function bootstrapCompany() {
  const existingCompany = await db.company.findFirst({
    where: { taxId: "00.000.000/0001-00" },
  });

  if (existingCompany) {
    return { company: existingCompany, user: null };
  }

  const company = await db.company.create({
    data: {
      legalName: "Empresa Demo de Elevadores LTDA",
      tradeName: "Elevadores Demo",
      taxId: "00.000.000/0001-00",
      address: "Rua das Flores",
      number: "123",
      neighborhood: "Centro",
      city: "São Paulo",
      state: "SP",
      postalCode: "01000-000",
      phone: "(11) 3000-0000",
      email: "contato@elevadoresdemo.com.br",
    },
  });

  const passwordHash = await bcrypt.hash("123456", 10);

  const user = await db.user.create({
    data: {
      companyId: company.id,
      name: "Administrador",
      email: "admin@elevadoresdemo.com.br",
      passwordHash,
      role: "ADMIN",
    },
  });

  return { company, user };
}