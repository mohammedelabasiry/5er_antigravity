import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = session.role === Role.ADMIN || session.role === Role.SUPER_ADMIN;
    const isCharity = session.role === Role.CHARITY_ADMIN;

    if (!isAdmin && !isCharity) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const stock = await prisma.resourceStock.findMany({
      orderBy: { resourceType: 'asc' },
    });

    return NextResponse.json(stock);
  } catch (error: any) {
    console.error('Fetch stock error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = session.role === Role.ADMIN || session.role === Role.SUPER_ADMIN;
    const isCharity = session.role === Role.CHARITY_ADMIN;

    if (!isAdmin && !isCharity) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { resourceType, quantity, unit, isAdjustment = false } = body;

    if (!resourceType || quantity === undefined || !unit) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const parsedQty = Number(quantity);

    // Upsert logic
    const stockItem = await prisma.resourceStock.findUnique({
      where: { resourceType },
    });

    let updatedStock;
    if (stockItem) {
      const nextQty = isAdjustment ? stockItem.quantity + parsedQty : parsedQty;
      updatedStock = await prisma.resourceStock.update({
        where: { resourceType },
        data: {
          quantity: Math.max(0, nextQty),
          unit,
        },
      });
    } else {
      updatedStock = await prisma.resourceStock.create({
        data: {
          resourceType,
          quantity: Math.max(0, parsedQty),
          unit,
        },
      });
    }

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'INVENTORY_STOCK_UPDATED',
        details: `Updated stock for "${resourceType}". New Quantity: ${updatedStock.quantity} ${unit}. Adjustment: ${isAdjustment} (${quantity})`,
      },
    });

    return NextResponse.json({ success: true, stock: updatedStock });
  } catch (error: any) {
    console.error('Update stock error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
