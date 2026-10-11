import { NextResponse } from 'next/server';
import { requireStaff } from '@/server/requireStaff';
import { InboxApiError } from '@/server/inboxStore';
import { verifyState } from '@/server/crypto';
import { finishGoogleConnect } from '@/server/gmail';

/**
 * Google OAuth landing page. The signed-in staff member must be an
 * owner/manager of the workspace encoded in the signed state token.
 * Success lands back in Settings with a plain message.
 */
export async function GET(req: Request) {
  const fail = (message: string) =>
    NextResponse.redirect(new URL(`/settings/channels?google=error&message=${encodeURIComponent(message)}`, req.url));
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state') ?? '';
    const err = url.searchParams.get('error');
    if (err) return fail('Google sign-in was cancelled.');
    if (!code) return fail('Google did not return a code.');
    const payload = verifyState(state);
    if (!payload?.workspaceId || !payload?.staffId) return fail('This sign-in request is invalid. Start again from Settings.');
    let staff;
    try {
      staff = await requireStaff();
    } catch {
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }
    if (staff.userId !== payload.staffId || staff.workspaceId !== payload.workspaceId) {
      return fail('This sign-in belongs to a different session. Start again from Settings.');
    }
    if (staff.role !== 'OWNER' && staff.role !== 'MANAGER') {
      return fail('Only owners and managers can connect a mailbox.');
    }
    const { emailAddress } = await finishGoogleConnect({ workspaceId: staff.workspaceId, staffId: staff.userId, code });
    return NextResponse.redirect(
      new URL(`/settings/channels?google=connected&mailbox=${encodeURIComponent(emailAddress)}`, req.url),
    );
  } catch (e) {
    if (e instanceof InboxApiError) return fail(e.message);
    console.error('GET /api/channels/google/callback failed', e);
    return fail(e instanceof Error ? e.message : 'Google sign-in failed.');
  }
}
