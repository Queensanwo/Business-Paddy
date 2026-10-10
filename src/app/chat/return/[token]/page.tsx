'use client';

import { useEffect, useRef, useState } from 'react';

interface GuestAttachment {
  id: string;
  fileName: string;
  mimeType: string;
}

interface GuestMessage {
  who: string;
  role: 'customer' | 'staff';
  text: string;
  attachments: GuestAttachment[];
}

interface GuestThread {
  businessName: string;
  guestName: string;
  status: string;
  messages: GuestMessage[];
  feedbackEnabled?: boolean;
  rating?: string | null;
}

export default function GuestReturnPage({ params }: { params: { token: string } }) {
  const [thread, setThread] = useState<GuestThread | null>(null);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [voiceMsg, setVoiceMsg] = useState('');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [contactMsg, setContactMsg] = useState('');
  const [contactDone, setContactDone] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackComment, setFeedbackComment] = useState('');

  useEffect(() => {
    fetch(`/api/paddy-chat/thread/${params.token}`)
      .then(async (res) => {
        const json = (await res.json()) as GuestThread & { error?: string };
        if (!res.ok) throw new Error(json.error || 'Chat unavailable.');
        setThread(json);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Chat unavailable.'));
  }, [params.token]);

  async function toggleRecording() {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (blob.size === 0) return;
        setVoiceMsg('Sending voice note…');
        try {
          const form = new FormData();
          form.append('file', new File([blob], `voice-note.${blob.type.includes('mp4') ? 'm4a' : 'webm'}`, { type: blob.type }));
          const res = await fetch(`/api/paddy-chat/thread/${params.token}/voice`, {
            method: 'POST',
            body: form,
          });
          const json = (await res.json()) as GuestThread & { error?: string };
          if (!res.ok) throw new Error(json.error || 'Could not send.');
          setThread(json);
          setVoiceMsg('');
        } catch (err) {
          setVoiceMsg(err instanceof Error ? err.message : 'Could not send.');
        }
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setVoiceMsg('');
    } catch {
      setVoiceMsg('Microphone unavailable in this browser.');
    }
  }

  async function onReply(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/paddy-chat/thread/${params.token}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      });
      const json = (await res.json()) as GuestThread & { error?: string };
      if (!res.ok) throw new Error(json.error || 'Could not send.');
      setThread(json);
      setText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send.');
    }
    setBusy(false);
  }

  async function onRate(rating: 'HELPFUL' | 'NOT_HELPFUL') {
    setFeedback('');
    try {
      const res = await fetch(`/api/paddy-chat/thread/${params.token}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment: feedbackComment }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || 'Could not save.');
      setThread((prev) => (prev ? { ...prev, rating } : prev));
      setFeedback(rating === 'HELPFUL' ? 'Thanks — glad we helped!' : 'Thanks — we will do better.');
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Could not save.');
    }
  }

  async function onSaveContact(e: React.FormEvent) {
    e.preventDefault();
    setContactMsg('');
    try {
      const res = await fetch(`/api/paddy-chat/thread/${params.token}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: contactEmail, phone: contactPhone, consent }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || 'Could not save.');
      setContactDone(true);
      setContactMsg('Saved. The business can now reach you about this chat.');
    } catch (err) {
      setContactMsg(err instanceof Error ? err.message : 'Could not save.');
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card" style={{ width: 'min(560px, 100%)' }}>
        <div className="brand" style={{ borderBottom: '1px solid var(--line)', paddingBottom: '12px' }}>
          <div className="logo">BP</div>
          <div>
            <h1>{thread?.businessName ?? 'Business Paddy'}</h1>
            <p>{thread ? `Chatting as ${thread.guestName}` : 'Loading your chat…'}</p>
          </div>
        </div>
        {error ? <p className="auth-error">{error}</p> : null}
        {thread ? (
          <>
            <div className="messages" style={{ borderRadius: '12px', maxHeight: '320px' }}>
              {thread.messages.map((m, i) => (
                <div key={i} className={`bubble ${m.role === 'staff' ? 'staff' : 'customer'}`}>
                  <div className="who">{m.who}</div>
                  {m.text}
                  {(m.attachments ?? []).map((a) => (
                    <div key={a.id} style={{ marginTop: '6px' }}>
                      <div className="who">{a.fileName}</div>
                      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                      <audio controls preload="none" src={`/api/paddy-chat/thread/${params.token}/file/${a.id}`} style={{ maxWidth: '100%' }} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {voiceMsg ? <div className="assignee">{voiceMsg}</div> : null}
            {thread.status === 'Resolved' && !contactDone ? (
              <form onSubmit={onSaveContact} style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid var(--line)', borderRadius: '12px', padding: '10px 12px' }}>
                <strong style={{ fontSize: '0.85rem' }}>Stay in touch? (optional)</strong>
                <input
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="Email address"
                  style={{ border: '1px solid var(--line)', borderRadius: '8px', padding: '8px 10px', background: 'var(--off-white)', color: 'var(--ink)' }}
                />
                <input
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Phone number"
                  style={{ border: '1px solid var(--line)', borderRadius: '8px', padding: '8px 10px', background: 'var(--off-white)', color: 'var(--ink)' }}
                />
                <label style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '0.8rem' }}>
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                  I agree the business may contact me about this chat.
                </label>
                {contactMsg ? <div className="assignee">{contactMsg}</div> : null}
                <button className="chip" type="submit">Save contact</button>
              </form>
            ) : null}
            {contactDone && contactMsg ? <div className="assignee">{contactMsg}</div> : null}
            {thread.status === 'Resolved' && thread.feedbackEnabled !== false ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid var(--line)', borderRadius: '12px', padding: '10px 12px' }}>
                <strong style={{ fontSize: '0.85rem' }}>Did we help?</strong>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="chip" type="button" onClick={() => onRate('HELPFUL')}>👍 Helpful</button>
                  <button className="chip" type="button" onClick={() => onRate('NOT_HELPFUL')}>👎 Not helpful</button>
                </div>
                <input
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Tell us more (optional)"
                  maxLength={500}
                  style={{ border: '1px solid var(--line)', borderRadius: '8px', padding: '8px 10px', background: 'var(--off-white)', color: 'var(--ink)' }}
                />
                {feedback ? <div className="assignee">{feedback}</div> : null}
                {thread.rating ? <div className="assignee">Your rating: {thread.rating === 'HELPFUL' ? 'Helpful' : 'Not helpful'} — tap again to change it.</div> : null}
              </div>
            ) : null}
            <form onSubmit={onReply} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px' }}>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write a message…"
                required
                style={{ border: '1px solid var(--line)', borderRadius: '12px', padding: '10px 12px', background: 'var(--off-white)', color: 'var(--ink)', minHeight: '56px' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button className="send" type="submit" disabled={busy}>Send</button>
                <button className="chip" type="button" onClick={toggleRecording}>
                  {recording ? '● Stop' : '🎙 Voice'}
                </button>
              </div>
            </form>
          </>
        ) : null}
      </div>
    </div>
  );
}
