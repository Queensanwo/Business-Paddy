'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface SetupStatus {
  settings: { name: string; present: boolean }[];
  workspaceMatches: boolean;
  ready: boolean;
}

export default function WhatsAppSetupCheck() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    async function check() {
      try {
        const response = await fetch('/api/channels/whatsapp/setup', { cache: 'no-store' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not check settings.');
        if (active) setStatus(result);
      } catch (error) {
        if (active) setError(error instanceof Error ? error.message : 'Could not check settings.');
      }
    }
    void check();
    return () => { active = false; };
  }, []);

  return <main className="auth-wrap">
    <section className="auth-card">
      <Link href="/settings/whatsapp">Back to WhatsApp connection</Link>
      <h1>WhatsApp setup check</h1>
      <p>This checks the settings available to the running app. Secret values stay hidden.</p>
      {error && <p role="alert">{error} <Link href="/sign-in">Sign in</Link></p>}
      {!status && !error && <p role="status">Checking settings…</p>}
      {status && <>
        <h2>{status.ready ? 'Settings are available' : 'Setup needs attention'}</h2>
        <ul style={{ paddingLeft: '20px', overflowWrap: 'anywhere' }}>
          {status.settings.map((setting) => <li key={setting.name} style={{ marginBottom: '12px' }}>
            <code>{setting.name}</code><br />
            <strong>{setting.present ? 'Available' : 'Missing or empty in the running app'}</strong>
          </li>)}
        </ul>
        {!status.workspaceMatches && <p>The test number is not assigned to this workspace. Check WHATSAPP_TEST_WORKSPACE_ID in Netlify.</p>}
        {!status.ready && <p>For a missing setting, check its Production value and Functions scope in Netlify, then publish a new deploy and refresh this page.</p>}
        {status.ready && <p>Return to WhatsApp connection to connect the test number. Sending and receiving still need a separate test.</p>}
      </>}
    </section>
  </main>;
}
