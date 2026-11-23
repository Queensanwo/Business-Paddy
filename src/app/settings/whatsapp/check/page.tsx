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
  const [provider, setProvider] = useState<{ phoneAccessible: boolean; subscriptionChecked: boolean; subscribedApps: { id: string; name: string }[]; problem: string | null } | null>(null);
  const [checking, setChecking] = useState(false);
  const [providerError, setProviderError] = useState('');
  async function checkProvider() {
    setChecking(true);
    setProvider(null);
    setProviderError('');
    try {
      const response = await fetch('/api/channels/whatsapp/health', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not check Meta.');
      setProvider(result);
    } catch (error) {
      setProviderError(error instanceof Error ? error.message : 'Could not check Meta.');
    } finally { setChecking(false); }
  }
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
        {status.ready && <section style={{ borderTop: '1px solid #e5eaf3', marginTop: 24, paddingTop: 20 }}>
          <h2>Check message delivery</h2>
          <p>Check whether Meta accepts your saved token and which apps receive messages for this account. This does not send a message or change settings.</p>
          <button className="menu-btn" style={{ display: 'inline-flex', margin: '16px 0' }} type="button" disabled={checking} onClick={checkProvider}>{checking ? 'Checking Meta…' : 'Check connection with Meta'}</button>
          {providerError && <p role="alert">{providerError}</p>}
          {provider && <div role="status">
            <p><strong>Access to your test number</strong> — {provider.phoneAccessible ? 'Confirmed' : 'Not confirmed'}</p>
            <p><strong>Message subscriptions</strong> — {provider.subscriptionChecked ? `${provider.subscribedApps.length} app(s) identified` : 'Could not check'}</p>
            {provider.subscribedApps.map((app) => <p key={app.id}>{app.name} · App ID {app.id}</p>)}
            {provider.problem && <p><strong>{provider.problem}</strong></p>}
            {!provider.problem && <p>These checks do not prove that messages are arriving. Confirm this app is listed above, check its publishing status in Meta, then send a new reply from your phone.</p>}
          </div>}
        </section>}
      </>}
    </section>
  </main>;
}
