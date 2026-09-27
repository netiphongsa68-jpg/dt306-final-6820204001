import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-dt306';

export async function POST(req: Request) {
  try {
    // 1. ตรวจสอบ Bearer Token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; role: string };

    const { items } = await req.json(); // รับข้อมูล { items: [{ productId: 1, quantity: 2 }] }

    if (!items || items.length === 0) {
      return NextResponse.json({ message: 'รายการสินค้าห้ามว่าง' }, { status: 400 });
    }

    // ข้อ 4.6: ใช้ prisma.$transaction ครอบกระบวนการทั้งหมด
    const newOrder = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const orderItemsData = [];

      for (const item of items) {
        // ข้อ 4.1: ตรวจสอบว่ามีสินค้าจริงหรือไม่
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error(`NOT_FOUND_${item.productId}`);
        }

        // ข้อ 4.2: ตรวจสอบจำนวน Stock
        if (item.quantity > product.stock) {
          throw new Error(`OUT_OF_STOCK_${product.name}`);
        }

        // ข้อ 4.3: คำนวณยอดรวมบน Server (price x quantity)
        totalAmount += product.price * item.quantity;

        orderItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          price: product.price,
        });

        // ข้อ 4.5: ตัด Stock สินค้า
        await tx.product.update({
          where: { id: product.id },
          data: { stock: product.stock - item.quantity },
        });
      }

      // ข้อ 4.4: บันทึก Order และ OrderItem
      const order = await tx.order.create({
        data: {
          orderNo: `ORD-${Date.now()}`,
          userId: decoded.id,
          totalAmount,
          orderItems: {
            create: orderItemsData,
          },
        },
        include: {
          orderItems: true,
        },
      });

      return order;
    });

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error: any) {
    if (error.message?.startsWith('NOT_FOUND')) {
      return NextResponse.json({ message: 'ไม่พบสินค้านี้ในระบบ' }, { status: 404 });
    }
    if (error.message?.startsWith('OUT_OF_STOCK')) {
      return NextResponse.json({ message: 'สินค้าในสต็อกไม่เพียงพอ' }, { status: 400 });
    }
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการสั่งซื้อ' }, { status: 500 });
  }
}