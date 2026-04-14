import { NextResponse, type NextRequest } from 'next/server';

// All app routes (anything that's not / or static)
// require a valid invite cookie when INVITE_TOKENS is set
const PUBLIC_PATHS = ['/']; // landing page only

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // If invite gating is OFF, allow everything
  const inviteRequired = !!process.env.INVITE_TOKENS?.trim();
  if (!inviteRequired) return NextResponse.next();

  // Allow landing page itself
  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();

  // Allow health checks (Railway uses this)
  if (pathname === '/api/health') return NextResponse.next();

  // Check invite cookie
  const token = request.cookies.get('invite_token')?.value;
  const validTokens = (process.env.INVITE_TOKENS || '')
    .split(',')
    .map((s) => s.trim().split(':')[0])
    .filter(Boolean);

  if (!token || !validTokens.includes(token)) {
    // Redirect to landing — even API routes return 401-ish redirect
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
  // Match all routes except Next.js internals and static assets
  matcher: [
    '/((?!_next/static|_next/image|_next/data|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|css|js)).*)',
  ],
};
