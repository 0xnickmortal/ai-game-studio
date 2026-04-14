import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { validateInvite, isInviteRequired } from '@/lib/invite';
import LandingPage from '@/components/landing/LandingPage';

// Disable caching — env vars and cookies must be re-evaluated every request
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Home({ searchParams }: { searchParams: { code?: string } }) {
  const needsInvite = isInviteRequired();

  // Open mode: skip landing, go straight to app
  if (!needsInvite) {
    redirect('/generate');
  }

  // If code in URL, validate and set cookie
  const code = searchParams?.code;
  if (code) {
    const invite = validateInvite(code);
    if (invite) {
      cookies().set('invite_token', code, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
      });
      redirect('/generate');
    }
  }

  // Already have valid cookie? skip landing
  const existing = cookies().get('invite_token')?.value;
  if (existing && validateInvite(existing)) {
    redirect('/generate');
  }

  // Show landing page
  return <LandingPage hasInvalidCode={!!code} />;
}
