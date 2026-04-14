import { NextResponse, type NextRequest } from 'next/server';

const COOKIE_NAME = 'invite_token';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getValidTokens(): string[] {
  return (process.env.INVITE_TOKENS || '')
    .split(',')
    .map((s) => s.trim().split(':')[0])
    .filter(Boolean);
}

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  const inviteRequired = !!process.env.INVITE_TOKENS?.trim();
  if (!inviteRequired) return NextResponse.next();

  const validTokens = getValidTokens();

  // Handle ?code=xxx on landing page — validate, set cookie, redirect
  if (pathname === '/') {
    const code = searchParams.get('code');
    if (code) {
      if (validTokens.includes(code)) {
        // Valid — set cookie and redirect to /generate
        const response = NextResponse.redirect(new URL('/generate', request.url));
        response.cookies.set(COOKIE_NAME, code, {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          maxAge: COOKIE_MAX_AGE,
          path: '/',
        });
        return response;
      } else {
        // Invalid — strip the code from URL so user sees landing with error
        const url = new URL('/', request.url);
        url.searchParams.set('error', 'invalid');
        return NextResponse.redirect(url);
      }
    }
    // No code — let landing page render
    return NextResponse.next();
  }

  // Allow Railway health checks
  if (pathname === '/api/health') return NextResponse.next();

  // All other routes require valid cookie
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token || !validTokens.includes(token)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Invalid or missing invite token' },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|_next/data|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|css|js)).*)',
  ],
};
