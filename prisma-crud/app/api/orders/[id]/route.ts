import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = verifyToken(req);
  if (!payload) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  // ข้อ 5.2: อนุญาตเฉพาะ ADMIN และ STAFF
  if (payload.role !== 'ADMIN' && payload.role !== 'STAFF') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const orderId = parseInt(params.id);
    const { status } = await req.json();

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    return NextResponse.json(updatedOrder);
  } catch (err) {
    return NextResponse.json({ message: 'Update status failed' }, { status: 400 });
  }
}