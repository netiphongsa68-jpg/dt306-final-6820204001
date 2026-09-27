import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('12345678', 10);

  // สร้าง Admin
  await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@gmail.com',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  // สร้าง Staff
  await prisma.user.upsert({
    where: { email: 'staff@gmail.com' },
    update: {},
    create: {
      name: 'Store Staff',
      email: 'staff@gmail.com',
      password: hashedPassword,
      role: Role.STAFF,
    },
  });

  // สร้าง Customer
  await prisma.user.upsert({
    where: { email: 'customer@gmail.com' },
    update: {},
    create: {
      name: 'John Customer',
      email: 'customer@gmail.com',
      password: hashedPassword,
      role: Role.CUSTOMER,
    },
  });

  console.log('Seed data created successfully!');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());