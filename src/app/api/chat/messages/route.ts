import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Role } from '@prisma/client';

// Safety/Privacy Filter function
function checkSensitiveContent(text: string): boolean {
  // Regex for 14-digit Egyptian National ID
  const nationalIdRegex = /\b\d{14}\b/;
  // Regex for common Egyptian phone number formats (e.g. 010..., 011..., 012..., 015... followed by 8 digits)
  // or generic international phone numbers
  const phoneRegex = /(\b01[0125]\d{8}\b)|(\+?\d{10,14})/;
  
  return nationalIdRegex.test(text) || phoneRegex.test(text);
}

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    // 1. Fetch conversation and check access rights
    const conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
      include: {
        beneficiaryProfile: true,
        donorProfile: true,
        charityProfile: true,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const isAdmin = session.role === Role.ADMIN || session.role === Role.SUPER_ADMIN;
    const isBeneficiary = conversation.beneficiaryProfile.userId === session.userId;
    const isDonor = conversation.donorProfile?.userId === session.userId;
    const isCharity = conversation.charityProfile?.userId === session.userId;

    if (!isAdmin && !isBeneficiary && !isDonor && !isCharity) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Fetch and return messages
    const messages = await prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(messages);
  } catch (error: any) {
    console.error('Get chat messages API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId, content } = await request.json();
    if (!conversationId || !content || !content.trim()) {
      return NextResponse.json({ error: 'Conversation ID and message content are required' }, { status: 400 });
    }

    // 1. Fetch conversation and check access rights
    const conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
      include: {
        beneficiaryProfile: true,
        donorProfile: true,
        charityProfile: true,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const isAdmin = session.role === Role.ADMIN || session.role === Role.SUPER_ADMIN;
    const isBeneficiary = conversation.beneficiaryProfile.userId === session.userId;
    const isDonor = conversation.donorProfile?.userId === session.userId;
    const isCharity = conversation.charityProfile?.userId === session.userId;

    if (!isAdmin && !isBeneficiary && !isDonor && !isCharity) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Privacy & Moderation check
    const hasSensitiveData = checkSensitiveContent(content);
    if (hasSensitiveData) {
      return NextResponse.json(
        { 
          error: 'Message blocked: Sharing phone numbers, national IDs, or direct contact info is prohibited for privacy and safety reasons.' 
        }, 
        { status: 400 }
      );
    }

    // 3. Create message
    const message = await prisma.chatMessage.create({
      data: {
        conversationId,
        senderId: session.userId,
        senderName: session.name,
        content: content.trim(),
      },
    });

    // Update conversation's updatedAt timestamp
    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(message);
  } catch (error: any) {
    console.error('Post chat message API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
