import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Criando empresa e usuário de teste...\n');

  // Criar empresa
  const company = await prisma.company.upsert({
    where: { id: 'demo-company-1' },
    update: {},
    create: {
      id: 'demo-company-1',
      legalName: 'Elevadores Demo Ltda',
      tradeName: 'Elevadores Demo',
      taxId: '12345678000199',
      email: 'contato@elevadoresdemo.com.br',
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

  // Criar usuário admin
  const hashedPassword = await bcrypt.hash('123456', 10);

  const user = await prisma.user.upsert({
    where: {
      companyId_email: {
        companyId: company.id,
        email: 'admin@elevadoresdemo.com.br'
      }
    },
    update: { passwordHash: hashedPassword },
    create: {
      email: 'admin@elevadoresdemo.com.br',
      passwordHash: hashedPassword,
      name: 'Administrador Demo',
      role: 'ADMIN',
      companyId: company.id,
    },
  });
  console.log('✅ Usuário criado:', user.email);
  console.log('   Senha: 123456\n');

  // Criar cliente de exemplo
  const customer = await prisma.customer.upsert({
    where: { id: 'demo-customer-1' },
    update: {},
    create: {
      id: 'demo-customer-1',
      name: 'Condomínio Edifício Central',
      taxId: '98765432000111',
      email: 'sindico@edcentral.com.br',
      phone: '(11) 98888-7777',
      address: 'Rua das Flores',
      number: '500',
      city: 'São Paulo',
      state: 'SP',
      contactName: 'João Silva (Síndico)',
      companyId: company.id,
    },
  });
  console.log('✅ Cliente criado:', customer.name);

  // Criar elevadores de exemplo
  const elevator1 = await prisma.elevator.upsert({
    where: { id: 'demo-elevator-1' },
    update: {},
    create: {
      id: 'demo-elevator-1',
      identification: 'Elevador Social 01',
      number: '001',
      manufacturer: 'Otis',
      model: 'Gen2',
      capacity: '450kg / 6 pessoas',
      stops: '10 andares',
      location: 'Hall principal',
      type: 'Passageiros',
      customerId: customer.id,
      companyId: company.id,
    },
  });
  console.log('✅ Elevador criado:', elevator1.identification);

  const elevator2 = await prisma.elevator.upsert({
    where: { id: 'demo-elevator-2' },
    update: {},
    create: {
      id: 'demo-elevator-2',
      identification: 'Elevador de Serviço',
      number: '002',
      manufacturer: 'ThyssenKrupp',
      model: 'Evolution',
      capacity: '1000kg / 13 pessoas',
      stops: '10 andares',
      location: 'Área de serviço',
      type: 'Carga/Serviço',
      customerId: customer.id,
      companyId: company.id,
    },
  });
  console.log('✅ Elevador criado:', elevator2.identification);

  console.log('\n========================================');
  console.log('SEED CONCLUÍDO COM SUCESSO!');
  console.log('========================================');
  console.log('\nAcesse: http://localhost:3000/os/login');
  console.log('Email: admin@elevadoresdemo.com.br');
  console.log('Senha: 123456');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
