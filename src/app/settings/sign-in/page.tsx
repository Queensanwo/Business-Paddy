'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';

type SavedPasskey = { id: string; name?: string | null };

export default function EasySignInPage() {
  const [passkeys, setPasskeys] = useState<SavedPasskey[]>([]);
  const [supported, setSupported] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function refreshPasskeys() {
    const result = await authClient.passkey.listUserPasskeys();
    if (result.error) throw new Error(result.error.message || 'Please sign in to manage your passkeys.');
    setPasskeys(result.data || []);
  }

  useEffect(() => {
    setSupported(window.isSecureContext && typeof PublicKeyCredential !== 'undefined');
    void refreshPasskeys().catch((error) => setMessage(error.message));
  }, []);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setMessage('');
    try {
      await action();
      await refreshPasskeys();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not complete the request.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-wrap">
      <section className="auth-card">
        <Link href="/settings">Back to Settings</Link>
        <h1>Easy sign-in</h1>
        <p>Add a passkey to sign in using your device’s fingerprint, face unlock, or screen lock.</p>
        <p>Your device keeps your passkey secure. Business Paddy stores the public key used to verify your login.</p>
        {message && <p role="status">{message}</p>}
        {supported ? (
          <button className="send" disabled={busy} onClick={() => void run(async () => {
            const result = await authClient.passkey.addPasskey({ name: 'My Business Paddy passkey' });
            if (result.error) throw new Error(result.error.message || 'Passkey setup was not completed.');
            setMessage('Passkey added. You can now use it on the sign-in page.');
          })}>Add a passkey</button>
        ) : <p>For passkey setup, open Business Paddy in Chrome or Safari on a supported device.</p>}
        <h2>Your passkeys</h2>
        {passkeys.length === 0 && <p>No passkeys added yet.</p>}
        {passkeys.map((key) => (
          <div key={key.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <p>{key.name || 'Passkey'}</p>
            <button className="chip" disabled={busy} onClick={() => void run(async () => {
              const result = await authClient.passkey.deletePasskey({ id: key.id });
              if (result.error) throw new Error(result.error.message || 'Could not remove this passkey.');
              setMessage('Passkey removed.');
            })}>Remove</button>
          </div>
        ))}
        <p>To stay signed in, choose “Remember me on this device” when signing in with your password.</p>
      </section>
    </main>
  );
}
