import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { validateInvite, isInviteRequired } from '@/lib/invite';

export default function Home({ searchParams }: { searchParams: { code?: string } }) {
  const needsInvite = isInviteRequired();

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
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      redirect('/generate');
    }
  }

  // Check existing cookie
  const existing = cookies().get('invite_token')?.value;
  if (existing && validateInvite(existing)) {
    redirect('/generate');
  }

  // Show invite required page
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#000',
        color: '#f7f8f8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Inter", sans-serif',
        padding: 20,
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ fontSize: 24, fontWeight: 400, letterSpacing: '-0.9px', marginBottom: 12 }}>
          AI Game Studio
        </div>
        <div style={{ fontSize: 14, color: '#767d88', marginBottom: 24, lineHeight: 1.5 }}>
          {code ? 'Invalid invite code' : 'This is a private preview'}
        </div>
        <div style={{ fontSize: 13, color: '#7d848e' }}>
          Access requires an invite link.<br />
          Contact us if you&apos;d like to try it out.
        </div>
      </div>
    </div>
  );
}
