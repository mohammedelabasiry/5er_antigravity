import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'khairlink-secret-key-2026-governance-layer-sadaqah'
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define route protection rules
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isApiRoute = pathname.startsWith('/api');
  const isPublicAsset = pathname.startsWith('/_next') || pathname.includes('.');

  // Allow public assets, Next.js internal routes, and Auth API routes without session checks
  if (isPublicAsset || (isApiRoute && pathname.includes('/api/auth'))) {
    return NextResponse.next();
  }

  // Read session cookie
  const sessionToken = request.cookies.get('session')?.value;

  let session = null;
  if (sessionToken) {
    try {
      const { payload } = await jwtVerify(sessionToken, JWT_SECRET, {
        algorithms: ['HS256'],
      });
      session = payload;
    } catch (e) {
      // Invalid token, clear it
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('session');
      return response;
    }
  }

  const role = (session?.role as string) || '';

  // 1. If not logged in and trying to access a protected route
  if (!session) {
    if (isAuthRoute || pathname === '/') {
      return NextResponse.next();
    }
    // Redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. If logged in and trying to access login/register
  if (isAuthRoute) {
    return redirectToDashboard(role, request.url);
  }

  // 3. Role-based Route Guarding
  if (pathname.startsWith('/admin') && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    return redirectToDashboard(role, request.url);
  }

  if (pathname.startsWith('/charity') && role !== 'CHARITY_ADMIN') {
    return redirectToDashboard(role, request.url);
  }

  if (pathname.startsWith('/donor') && role !== 'DONOR') {
    return redirectToDashboard(role, request.url);
  }

  if (pathname.startsWith('/beneficiary') && role !== 'BENEFICIARY') {
    return redirectToDashboard(role, request.url);
  }

  return NextResponse.next();
}

function redirectToDashboard(role: string, baseUrl: string) {
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/admin/dashboard', baseUrl));
  }
  if (role === 'CHARITY_ADMIN') {
    return NextResponse.redirect(new URL('/charity/dashboard', baseUrl));
  }
  if (role === 'DONOR') {
    return NextResponse.redirect(new URL('/donor/dashboard', baseUrl));
  }
  if (role === 'BENEFICIARY') {
    return NextResponse.redirect(new URL('/beneficiary/dashboard', baseUrl));
  }
  return NextResponse.redirect(new URL('/', baseUrl));
}

// Limit the middleware to match specific dashboard paths and APIs
export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
    '/admin/:path*',
    '/charity/:path*',
    '/donor/:path*',
    '/beneficiary/:path*',
    '/chat/:path*',
    '/transactions/:path*',
    '/resources/:path*',
    '/api/:path*',
  ],
};
