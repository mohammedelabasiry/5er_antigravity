import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword, setSessionCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        beneficiaryProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.isBlocked) {
      return NextResponse.json({ error: 'Account has been suspended' }, { status: 403 });
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Set session cookie
    await setSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        details: `User logged in: ${user.email} (${user.role})`,
      },
    });

    // Direct user to correct page
    let redirectUrl = '/';
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      redirectUrl = '/admin/dashboard';
    } else if (user.role === 'CHARITY_ADMIN') {
      redirectUrl = '/charity/dashboard';
    } else if (user.role === 'DONOR') {
      redirectUrl = '/donor/dashboard';
    } else if (user.role === 'BENEFICIARY') {
      if (!user.beneficiaryProfile) {
        redirectUrl = '/beneficiary/onboarding';
      } else {
        redirectUrl = '/beneficiary/dashboard';
      }
    }

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, role: user.role },
      redirectUrl,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
