import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Role } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== Role.DONOR) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const { charityProfileId, amount, notes } = await request.json();
    const parsedAmount = Number(amount) || 0;

    if (parsedAmount <= 0) {
      return NextResponse.json({ error: 'Donation amount must be greater than zero EGP.' }, { status: 400 });
    }

    if (!charityProfileId) {
      return NextResponse.json({ error: 'Charity organization ID is required.' }, { status: 400 });
    }

    // 1. Resolve Donor Profile
    const donor = await prisma.donorProfile.findUnique({
      where: { userId: session.userId },
    });
    if (!donor) {
      return NextResponse.json({ error: 'Donor profile not found' }, { status: 404 });
    }

    // 2. Resolve Charity Profile and verify approval status
    const charity = await prisma.charityProfile.findUnique({
      where: { id: charityProfileId },
      include: { user: true }
    });

    if (!charity) {
      return NextResponse.json({ error: 'Charity organization not found.' }, { status: 404 });
    }

    if (!charity.isApproved) {
      return NextResponse.json({ error: 'This charity organization is not approved by the system administration.' }, { status: 403 });
    }

    // 3. Database transaction
    const charityDonation = await prisma.$transaction(async (tx) => {
      const donation = await tx.charityDonation.create({
        data: {
          donorProfileId: donor.id,
          charityProfileId: charity.id,
          amount: parsedAmount,
          notes: notes || 'Direct general support donation to charity organization.',
        },
      });

      // Notify charity
      await tx.notification.create({
        data: {
          userId: charity.userId,
          title: 'New Donation Received!',
          message: `Alhamdulillah! A generous donor (${donor.displayName}) has donated ${parsedAmount} EGP directly to your organization.`,
          type: 'CHARITY_DONATION_RECEIVED',
        },
      });

      // Audit Trail
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: 'CHARITY_DONATION_CREATED',
          details: `Donated ${parsedAmount} EGP to charity ${charity.charityName}. Donation ID: ${donation.id}`,
        },
      });

      return donation;
    });

    return NextResponse.json({ success: true, donationId: charityDonation.id });
  } catch (error: any) {
    console.error('Charity donation transaction error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
