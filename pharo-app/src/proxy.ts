import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'pharo-fallback-secret'
);

const ADMIN_PREFIXES = ['/admin'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPath = ADMIN_PREFIXES.some((p) =>
    pathname === p || pathname.startsWith(p + '/')
  );

  // Only protect admin paths with this middleware (API routes do their own auth)
  if (!isAdminPath || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('session')?.value;

  if (!token) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  } catch {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};