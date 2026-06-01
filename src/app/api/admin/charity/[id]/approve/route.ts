import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const session = await getSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const charityId = params.id;
    const { isApproved } = await request.json();

    const charity = await prisma.charityProfile.findUnique({
      where: { id: charityId },
    });

    if (!charity) {
      return NextResponse.json({ error: 'Charity organization not found' }, { status: 404 });
    }

    const updated = await prisma.charityProfile.update({
      where: { id: charityId },
      data: { isApproved },
    });

    // Notify charity representative user
    await prisma.notification.create({
      data: {
        userId: charity.userId,
        title: isApproved ? 'Charity License Approved!' : 'Charity Account Suspended',
        message: isApproved
          ? 'Your charity license is approved. You can now browse beneficiaries and manage resource distributions.'
          : 'Your charity organization access has been suspended. Please contact admins.',
        type: 'CHARITY_APPROVED',
      },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: isApproved ? 'CHARITY_APPROVED' : 'CHARITY_SUSPENDED',
        details: `Admin ${session.name} updated charity ${charity.charityName} (License: ${charity.licenseNumber}) status to Approved=${isApproved}`,
      },
    });

    return NextResponse.json({ success: true, charity: updated });
  } catch (error: any) {
    console.error('Charity approval API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
