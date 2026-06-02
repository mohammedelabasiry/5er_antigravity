import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Role, DeliveryStatus } from '@prisma/client';

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, deliveryStatus, notes } = await request.json();
    if (!id || !deliveryStatus) {
      return NextResponse.json({ error: 'ID and Status are required' }, { status: 400 });
    }

    // 1. Fetch resource distribution
    const dist = await prisma.resourceDistribution.findUnique({
      where: { id },
    });

    if (!dist) {
      return NextResponse.json({ error: 'Distribution record not found' }, { status: 404 });
    }

    // 2. Check authorization: Admins or Charity representatives that own this record
    const isAdmin = session.role === Role.ADMIN || session.role === Role.SUPER_ADMIN;
    let isOwnerCharity = false;

    if (session.role === Role.CHARITY_ADMIN) {
      const charity = await prisma.charityProfile.findUnique({
        where: { userId: session.userId },
      });
      if (charity && dist.charityProfileId === charity.id) {
        isOwnerCharity = true;
      }
    }

    if (!isAdmin && !isOwnerCharity) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Perform update
    const updated = await prisma.resourceDistribution.update({
      where: { id },
      data: {
        deliveryStatus: deliveryStatus as DeliveryStatus,
        notes: notes !== undefined ? notes : dist.notes,
      },
    });

    // 4. Log governance action
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'RESOURCE_DISTRIBUTION_UPDATED',
        details: JSON.stringify({
          distributionId: id,
          newStatus: deliveryStatus,
          prevStatus: dist.deliveryStatus,
        }),
      },
    });

    return NextResponse.json({ success: true, updated });
  } catch (error: any) {
    console.error('Update resource distribution error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
