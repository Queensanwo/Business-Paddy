'use client';

import { useState } from 'react';

export function ProfessionalContactForm({ workspaceId }: { workspaceId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [returnLink, setReturnLink] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fields = new FormData(event.currentTarget);
    const email = String(fields.get('email') ?? '').trim();
    const phone = String(fields.get('phone') ?? '').trim();
    setError('');
    if (!email && !phone) {
      setError('Leave a phone number or email so the professional can reply.');
      return;
    }
    setBusy(true);
    try {
      const response = await fetch('/api/paddy-chat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId, name: fields.get('name'), text: fields.get('message'),
          profileContact: { email, phone, consent: fields.get('consent') === 'on' },
        }),
      });
      const result = await response.json();
      if (!response.ok || typeof result.token !== 'string') throw new Error(result.error || 'Could not send your enquiry.');
      setReturnLink(`/chat/return/${encodeURIComponent(result.token)}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not send your enquiry.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card received">
      <h2 className="label">Request a reply</h2>
      {returnLink ? <p role="status">Your enquiry was sent. <a href={returnLink}>Open your private chat</a> to follow up.</p> : (
        <form onSubmit={submit} style={{ display: 'grid', gap: '10px', marginTop: '10px' }}>
          <p>Leave a phone number, an email, or both so the professional can get back to you.</p>
          <label className="auth-field">Your name<input name="name" autoComplete="name" required maxLength={60} /></label>
          <label className="auth-field">Phone number<input name="phone" type="tel" autoComplete="tel" maxLength={25} /></label>
          <label className="auth-field">Email<input name="email" type="email" autoComplete="email" maxLength={254} /></label>
          <label className="auth-field">What would you like to ask?
            <textarea name="message" required maxLength={2000} rows={3} />
          </label>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <input type="checkbox" name="consent" required />
            <span>I agree to share these details with this professional so they can respond to my enquiry.</span>
          </label>
          <p>See our <a href="/privacy">privacy notice</a> for how we handle enquiries.</p>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="send" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send enquiry'}</button>
        </form>
      )}
    </section>
  );
}
