'use client';

import { useEffect, useState } from 'react';

interface ReplySettings {
  toneGuidance: string | null;
  autoReplyEnabled: boolean;
  autoReplyGreeting: string | null;
  requireTraineeApproval: boolean;
  feedbackEnabled: boolean;
}

export function ReplyControlsCard({ canManage }: { canManage: boolean }) {
  const [settings, setSettings] = useState<ReplySettings | null>(null);
  const [tone, setTone] = useState('');
  const [greeting, setGreeting] = useState('');
  const [autoOn, setAutoOn] = useState(false);
  const [traineeApproval, setTraineeApproval] = useState(true);
  const [feedbackOn, setFeedbackOn] = useState(true);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/reply-settings')
      .then((res) => (res.ok ? res.json() : { settings: null }))
      .then((json) => {
        const s = (json as { settings: ReplySettings | null }).settings;
        if (s) {
          setSettings(s);
          setTone(s.toneGuidance ?? '');
          setGreeting(s.autoReplyGreeting ?? '');
          setAutoOn(s.autoReplyEnabled);
          setTraineeApproval(s.requireTraineeApproval);
          setFeedbackOn(s.feedbackEnabled !== false);
        }
      })
      .catch(() => {});
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    setBusy(true);
    try {
      const res = await fetch('/api/reply-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toneGuidance: tone,
          autoReplyEnabled: autoOn,
          autoReplyGreeting: greeting,
          requireTraineeApproval: traineeApproval,
          feedbackEnabled: feedbackOn,
        })
      });
      const json = (await res.json()) as { settings?: ReplySettings; error?: string };
      if (!res.ok || !json.settings) throw new Error(json.error || 'Could not save.');
      setSettings(json.settings);
      setMsg('Reply controls saved.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not save.');
    }
    setBusy(false);
  }

  return (
    <article className="card received">
      <div className="label">Reply controls (tone, auto-replies, approvals)</div>
      {!settings && <p className="assignee">Loading…</p>}
      {settings && (
        <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
          <label className="auth-field">
            Tone guidance for staff and AI drafts (optional)
            <textarea
              value={tone}
              maxLength={500}
              onChange={(e) => setTone(e.target.value)}
              placeholder="e.g. Friendly, short sentences, no slang."
              disabled={!canManage}
              style={{ border: '1px solid var(--line)', borderRadius: '12px', padding: '10px 12px', background: 'var(--off-white)', color: 'var(--ink)', minHeight: '56px' }}
            />
          </label>
          <label className="auth-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" checked={autoOn} onChange={(e) => setAutoOn(e.target.checked)} disabled={!canManage} />
            Send an automatic greeting when a guest starts a Paddy Chat
          </label>
          <label className="auth-field">
            Automatic greeting (only sent when enabled)
            <textarea
              value={greeting}
              maxLength={500}
              onChange={(e) => setGreeting(e.target.value)}
              placeholder="e.g. Hello! Thanks for contacting us — a team member will reply shortly."
              disabled={!canManage}
              style={{ border: '1px solid var(--line)', borderRadius: '12px', padding: '10px 12px', background: 'var(--off-white)', color: 'var(--ink)', minHeight: '56px' }}
            />
          </label>
          <label className="auth-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" checked={traineeApproval} onChange={(e) => setTraineeApproval(e.target.checked)} disabled={!canManage} />
            Trainee replies need owner/manager approval
          </label>
          <label className="auth-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" checked={feedbackOn} onChange={(e) => setFeedbackOn(e.target.checked)} disabled={!canManage} />
            Ask customers for a Helpful / Not helpful rating after resolved chats
          </label>
          {msg ? <p className="assignee">{msg}</p> : null}
          {canManage ? (
            <button className="send" type="submit" disabled={busy} style={{ width: '100%' }}>
              {busy ? 'Saving…' : 'Save reply controls'}
            </button>
          ) : (
            <p className="assignee">Only owners and managers can change these. AI drafts always need review before sending.</p>
          )}
        </form>
      )}
    </article>
  );
}
