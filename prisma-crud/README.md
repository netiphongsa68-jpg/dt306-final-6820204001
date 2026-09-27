# STU Smart Shop Co., Ltd. - Back-end API

ระบบ Back-end API พัฒนาด้วย Next.js (App Router), TypeScript, Prisma ORM และ MySQL

## การรันระบบ
1. สั่ง Migrate และ Seed ข้อมูล:
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed