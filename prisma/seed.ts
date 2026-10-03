import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Limpando banco de dados (reset total)...\n');

  // Deletar tudo na ordem correta (FK constraints)
  await prisma.signature.deleteMany({});
  await prisma.photo.deleteMany({});
  await prisma.serviceRecord.deleteMany({});
  await prisma.serviceOrder.deleteMany({});
  await prisma.elevator.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.company.deleteMany({});
  console.log('✅ Banco zerado\n');

  console.log('🏢 Criando empresa e usuário novo...\n');

  // Criar empresa
  const company = await prisma.company.create({
    data: {
      id: 'company-andrejan',
      legalName: 'Smart Intech Serviços Ltda',
      tradeName: 'Smart Intech',
      taxId: '00000000000100',
      email: 'andrejan@smartintech.com',
      phone: '(11) 99999-9999',
      whatsapp: '(11) 99999-9999',
      address: 'Av. Paulista',
      number: '1000',
      city: 'São Paulo',
      state: 'SP',
      postalCode: '01310-100',
    },
  });
  console.log('✅ Empresa criada:', company.legalName);

  // Criar usuário andrejan (ADMIN)
  const hashedPassword = await bcrypt.hash('73710000', 10);

  const user = await prisma.user.create({
    data: {
      email: 'andrejan@smartintech.com',
      passwordHash: hashedPassword,
      name: 'Andrejan',
      role: 'ADMIN',
      companyId: company.id,
    },
  });
  console.log('✅ Usuário criado:', user.email);
  console.log('   Senha: 73710000\n');

  console.log('========================================');
  console.log('SEED CONCLUÍDO — SISTEMA ZERADO PARA NOVO USUÁRIO');
  console.log('========================================');
  console.log('\nAcesse: http://localhost:3000/os/login');
  console.log('Usuário: andrejan@smartintech.com');
  console.log('Senha: 73710000');
  console.log('\nChave mestra (acesso inicial): 73710000');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });