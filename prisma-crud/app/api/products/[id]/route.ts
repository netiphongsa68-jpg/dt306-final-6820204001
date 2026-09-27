import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Zod Schema ตรวจสอบข้อมูลสินค้า ตามข้อ 3.2
const productSchema = z.object({
  code: z.string().min(3, 'code ต้องมีอย่างน้อย 3 ตัวอักษร'),
  name: z.string().min(3, 'name ต้องมีอย่างน้อย 3 ตัวอักษร'),
  price: z.number().gt(0, 'price ต้องมากกว่า 0'),
  stock: z.number().int().min(0, 'stock ต้องไม่น้อยกว่า 0'),
});

// ข้อ 3.1 & 6.1: GET สินค้า รองรับ search, page, limit
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  const skip = (page - 1) * limit;

  const where = search
    ? { name: { contains: search } }
    : {};

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({
    data: products,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}

// ข้อ 3.2: POST เพิ่มสินค้าใหม่
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate ข้อมูลด้วย Zod
    const validation = productSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const newProduct = await prisma.product.create({
      data: validation.data,
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Bad Request' }, { status: 400 });
  }
}