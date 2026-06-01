import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Role } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { beneficiaryProfileId } = await request.json();
    if (!beneficiaryProfileId) {
      return NextResponse.json({ error: 'Beneficiary Profile ID is required' }, { status: 400 });
    }

    // 1. Resolve donor or charity profile ID from user ID
    let donorProfileId = null;
    let charityProfileId = null;

    if (session.role === Role.DONOR) {
      const donor = await prisma.donorProfile.findUnique({
        where: { userId: session.userId },
      });
      if (!donor) return NextResponse.json({ error: 'Donor profile not found' }, { status: 404 });
      donorProfileId = donor.id;
    } else if (session.role === Role.CHARITY_ADMIN) {
      const charity = await prisma.charityProfile.findUnique({
        where: { userId: session.userId },
      });
      if (!charity) return NextResponse.json({ error: 'Charity profile not found' }, { status: 404 });
      charityProfileId = charity.id;
    } else {
      return NextResponse.json({ error: 'Only donors or charities can initiate conversations' }, { status: 403 });
    }

    // 2. Check if a conversation already exists
    let conversation = null;

    if (donorProfileId) {
      conversation = await prisma.chatConversation.findUnique({
        where: {
          beneficiaryProfileId_donorProfileId: {
            beneficiaryProfileId,
            donorProfileId,
          },
        },
      });
    } else if (charityProfileId) {
      conversation = await prisma.chatConversation.findUnique({
        where: {
          beneficiaryProfileId_charityProfileId: {
            beneficiaryProfileId,
            charityProfileId,
          },
        },
      });
    }

    // 3. If not, create a new privacy-shielded conversation
    if (!conversation) {
      conversation = await prisma.chatConversation.create({
        data: {
          beneficiaryProfileId,
          donorProfileId,
          charityProfileId,
        },
      });

      // Seeding a default automated safety warning message
      await prisma.chatMessage.create({
        data: {
          conversationId: conversation.id,
          senderId: 'SYSTEM',
          senderName: 'KhairLink Safety Bot',
          content: 'Keep communications respectful and secure. Sharing exact home addresses, phone numbers, or national IDs is strictly prohibited to preserve beneficiary dignity and privacy.',
        },
      });
    }

    return NextResponse.json({ success: true, conversationId: conversation.id });
  } catch (error: any) {
    console.error('Create conversation API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
