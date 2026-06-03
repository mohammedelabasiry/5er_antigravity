import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Role } from '@prisma/client';
import TicketsClientPage from './TicketsClientPage';

export const dynamic = 'force-dynamic';

async function getTickets(session: { userId: string; role: string }) {
  const { role, userId } = session;

  if (role === Role.ADMIN || role === Role.SUPER_ADMIN) {
    const raw = await prisma.ticket.findMany({
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
    return raw.map(t => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));
  } else {
    const raw = await prisma.ticket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return raw.map(t => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));
  }
}

export default async function TicketsPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const tickets = await getTickets(session);

  return (
    <TicketsClientPage
      initialTickets={tickets}
      userRole={session.role}
    />
  );
}
