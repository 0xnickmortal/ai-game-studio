import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { validateInvite, isInviteRequired } from '@/lib/invite';
import LandingPage from '@/components/landing/LandingPage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Home({ searchParams }: { searchParams: { code?: string; error?: string } }) {
  const needsInvite = isInviteRequired();

  // Open mode: skip landing
  if (!needsInvite) {
    redirect('/generate');
  }

  // Note: ?code=xxx validation + cookie set is handled in middleware.ts
  // (Server Components cannot mutate cookies; middleware can)

  // Already have a valid cookie? skip landing
  const existing = cookies().get('invite_token')?.value;
  if (existing && validateInvite(existing)) {
    redirect('/generate');
  }

  // Show landing page (with optional error)
  return <LandingPage hasInvalidCode={searchParams?.error === 'invalid'} />;
}
