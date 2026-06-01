import { NextResponse } from 'next/server';
import { clearSessionCookie, getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST() {
  try {
    const session = await getSession();
    if (session) {
      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: 'USER_LOGOUT',
          details: `User logged out: ${session.email}`,
        },
      });
    }

    await clearSessionCookie();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
