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

    const userId = params.id;
    const { isBlocked } = await request.json();

    // Prevent self-blocking
    if (userId === session.userId) {
      return NextResponse.json({ error: 'Action forbidden: cannot suspend your own account.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isBlocked },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: isBlocked ? 'USER_SUSPENDED' : 'USER_REACTIVATED',
        details: `Admin ${session.name} updated user account ${user.email} (Role: ${user.role}) status to Suspended=${isBlocked}`,
      },
    });

    return NextResponse.json({ success: true, user: { id: updated.id, isBlocked: updated.isBlocked } });
  } catch (error: any) {
    console.error('User suspension API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
