import { NextResponse, type NextRequest } from 'next/server';

// Pages that require invite (leave landing + api/health public)
const PROTECTED_PATHS = [
  '/generate', '/dashboard', '/studio', '/workflows',
  '/sprints', '/skills', '/files', '/setup', '/settings',
];

export function middleware(request: NextRequest) {
  const inviteRequired = !!process.env.INVITE_TOKENS?.trim();
  if (!inviteRequired) return NextResponse.next();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get('invite_token')?.value;
  const validTokens = (process.env.INVITE_TOKENS || '')
    .split(',')
    .map((s) => s.trim().split(':')[0]);

  if (!token || !validTokens.includes(token)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/health|_next|favicon|.*\\..*).*)/'],
};
