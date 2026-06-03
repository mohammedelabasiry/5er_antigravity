import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Role } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const { role, userId } = session;

    let tickets;
    if (role === Role.ADMIN || role === Role.SUPER_ADMIN) {
      tickets = await prisma.ticket.findMany({
        include: {
          user: {
            select: {
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      tickets = await prisma.ticket.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({ tickets });
  } catch (error: any) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const { type, subject, message } = await request.json();

    if (!type || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields: type, subject, message' }, { status: 400 });
    }

    const ticket = await prisma.ticket.create({
      data: {
        userId: session.userId,
        type,
        subject,
        message,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'TICKET_CREATED',
        details: `Created a support ticket of type ${type}. Subject: ${subject}`,
      },
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error: any) {
    console.error('Error creating ticket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    // Only admin can reply or update status
    if (session.role !== Role.ADMIN && session.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, status, adminReply } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    const existingTicket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!existingTicket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        status: status || existingTicket.status,
        adminReply: adminReply !== undefined ? adminReply : existingTicket.adminReply,
      },
    });

    // Create notification for ticket submitter
    await prisma.notification.create({
      data: {
        userId: existingTicket.userId,
        title: 'Ticket Update / Reply',
        message: `Your support ticket regarding "${existingTicket.subject}" has been updated to "${status || existingTicket.status}".`,
        type: 'TICKET_UPDATE',
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'TICKET_UPDATED',
        details: `Updated ticket ${id}. Status set to: ${status || existingTicket.status}. Admin reply provided: ${!!adminReply}`,
      },
    });

    return NextResponse.json({ success: true, ticket: updatedTicket });
  } catch (error: any) {
    console.error('Error updating ticket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
