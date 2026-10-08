'use client';

import { useRef, useState } from 'react';
import { Conversation, channelLabel, Channel } from '@/types/conversation';
import { Badge } from '@/components/UI/Badge';

export interface PendingAttachment {
  storageKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface AssignableStaff {
  id: string;
  name: string;
  role?: string;
}

interface ConversationThreadProps {
  conversation: Conversation | undefined;
  onSendReply: (text: string, attachments: PendingAttachment[]) => void;
  onAddNote: (text: string) => void;
  onResolve: (conversationId: string) => void;
  onEscalate: (conversationId: string, managerId: string, reason: string, note: string) => void;
  currentUserId: string | null;
  canAssignOthers: boolean;
  staff: AssignableStaff[];
  onAssign: (conversationId: string, assigneeId: string | null) => void;
}

function AttachmentView({ a }: { a: { id: string; fileName: string; mimeType: string } }) {
  const url = `/api/files/${a.id}`;
  if (a.mimeType.startsWith('image/')) {
    return (
      <a href={url} target="_blank" rel="noreferrer">
        <img src={url} alt={a.fileName} style={{ maxWidth: '100%', borderRadius: '8px', marginTop: '6px' }} />
      </a>
    );
  }
  if (a.mimeType.startsWith('audio/')) {
    return (
      <div style={{ marginTop: '6px' }}>
        <div className="who">{a.fileName}</div>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <audio controls preload="none" src={url} style={{ maxWidth: '100%' }} />
      </div>
    );
  }
  return (
    <div style={{ marginTop: '6px' }}>
      <a href={url} target="_blank" rel="noreferrer">📎 {a.fileName}</a>
    </div>
  );
}

export function ConversationThread({
  conversation,
  onSendReply,
  onAddNote,
  onResolve,
  onEscalate,
  currentUserId,
  canAssignOthers,
  staff,
  onAssign,
}: ConversationThreadProps) {
  const [pending, setPending] = useState<PendingAttachment[]>([]);
  const [uploadNote, setUploadNote] = useState('');
  const [mode, setMode] = useState<'reply' | 'note'>('reply');
  const [escalating, setEscalating] = useState(false);
  const [escManager, setEscManager] = useState('');
  const [escReason, setEscReason] = useState('Difficult customer');
  const [escNote, setEscNote] = useState('');
  const [recording, setRecording] = useState(false);
  const [replyText, setReplyText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function uploadFile(file: File) {
    setUploadNote('');
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch('/api/uploads', { method: 'POST', body: form });
      const json = (await res.json()) as PendingAttachment & { error?: string };
      if (!res.ok) throw new Error(json.error || 'Upload failed.');
      setPending((prev) => [...prev, json].slice(0, 5));
    } catch (err) {
      setUploadNote(err instanceof Error ? err.message : 'Upload failed.');
    }
  }

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
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (blob.size > 0) {
          uploadFile(new File([blob], `voice-note.${blob.type.includes('mp4') ? 'm4a' : 'webm'}`, { type: blob.type }));
        }
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setUploadNote('');
    } catch {
      setUploadNote('Microphone unavailable in this browser.');
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (mode === 'note') {
      if (!replyText.trim()) return;
      onAddNote(replyText);
    } else {
      if (!replyText.trim() && pending.length === 0) return;
      onSendReply(replyText, pending);
    }
    setReplyText('');
    setPending([]);
    setUploadNote('');
  }

  const composer = (
    <form className="composer" id="replyForm" onSubmit={handleSubmit}>
      <div>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
          <button type="button" className={`chip${mode === 'reply' ? ' active' : ''}`} onClick={() => setMode('reply')}>
            Reply
          </button>
          <button type="button" className={`chip${mode === 'note' ? ' active' : ''}`} onClick={() => setMode('note')}>
            Internal note
          </button>
        </div>
        <textarea
          id="replyBox"
          name="reply"
          placeholder={mode === 'note' ? 'Write a private note for staff only…' : 'Write a reply the customer will see on their channel…'}
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
        />
        {pending.length > 0 ? (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
            {pending.map((p) => (
              <span key={p.storageKey} className="status">
                📎 {p.fileName}
                <button
                  type="button"
                  aria-label={`Remove ${p.fileName}`}
                  style={{ border: 0, background: 'transparent', cursor: 'pointer', marginLeft: '4px' }}
                  onClick={() => setPending((prev) => prev.filter((x) => x.storageKey !== p.storageKey))}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        ) : null}
        {uploadNote ? <div className="assignee" style={{ marginTop: '4px' }}>{uploadNote}</div> : null}
        {mode === 'reply' ? (
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
            <input
              ref={fileRef}
              type="file"
              hidden
              accept="image/png,image/jpeg,image/gif,image/webp,application/pdf,text/plain,audio/mpeg,audio/wav,audio/webm,audio/mp4"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadFile(f);
                e.target.value = '';
              }}
            />
            <button type="button" className="chip" onClick={() => fileRef.current?.click()}>
              Attach file
            </button>
            <button type="button" className={`chip${recording ? ' active' : ''}`} onClick={toggleRecording}>
              {recording ? '● Stop voice note' : '🎙 Voice note'}
            </button>
          </div>
        ) : (
          <div className="assignee" style={{ marginTop: '6px' }}>Staff only — never sent to the customer.</div>
        )}
      </div>
      <button className="send" type="submit">{mode === 'note' ? 'Save Note' : 'Send Reply'}</button>
    </form>
  );

  if (!conversation) {
    return (
      <div className="thread-wrap">
        <div className="thread-head">
          <div>
            <h3 id="custName">Select a conversation</h3>
            <div className="assignee" id="custMeta"></div>
          </div>
          <div id="custBadges"></div>
        </div>
        <div className="messages" id="messages"></div>
        {composer}
      </div>
    );
  }

  return (
    <div className="thread-wrap">
      <div className="thread-head">
        <div>
          <h3 id="custName">{conversation.name}</h3>
          <div className="assignee" id="custMeta">
            {channelLabel[conversation.channel as Channel]} · {conversation.status} · Assigned to {conversation.assignee}
          </div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
            {!conversation.assigneeId && currentUserId ? (
              <button className="chip" type="button" onClick={() => onAssign(conversation.id, currentUserId)}>
                Claim
              </button>
            ) : null}
            {canAssignOthers && staff.length > 0 ? (
              <select
                aria-label="Assign conversation"
                value={conversation.assigneeId ?? ''}
                onChange={(e) => onAssign(conversation.id, e.target.value || null)}
                style={{ border: '1px solid var(--line)', borderRadius: '999px', padding: '5px 10px', fontSize: '0.75rem', background: 'var(--off-white)', color: 'var(--ink)' }}
              >
                <option value="">Unassigned</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            ) : null}
            {conversation.status !== 'Resolved' ? (
              <button className="chip" type="button" onClick={() => onResolve(conversation.id)}>
                Resolve
              </button>
            ) : null}
            {conversation.status !== 'Escalated' ? (
              <button className="chip" type="button" onClick={() => setEscalating((v) => !v)}>
                Escalate
              </button>
            ) : null}
          </div>
          {escalating ? (
            <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                aria-label="Escalate to manager"
                value={escManager}
                onChange={(e) => setEscManager(e.target.value)}
                style={{ border: '1px solid var(--line)', borderRadius: '999px', padding: '5px 10px', fontSize: '0.75rem', background: 'var(--off-white)', color: 'var(--ink)' }}
              >
                <option value="">Select manager…</option>
                {staff
                  .filter((s) => !s.role || s.role === 'OWNER' || s.role === 'MANAGER')
                  .map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
              </select>
              <select
                aria-label="Escalation reason"
                value={escReason}
                onChange={(e) => setEscReason(e.target.value)}
                style={{ border: '1px solid var(--line)', borderRadius: '999px', padding: '5px 10px', fontSize: '0.75rem', background: 'var(--off-white)', color: 'var(--ink)' }}
              >
                {['Difficult customer', 'Refund request', 'Technical issue', 'Complaint', 'Needs approval', 'Other'].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <input
                aria-label="Escalation note (optional)"
                value={escNote}
                onChange={(e) => setEscNote(e.target.value)}
                placeholder="Note (optional)"
                style={{ border: '1px solid var(--line)', borderRadius: '999px', padding: '5px 10px', fontSize: '0.75rem', background: 'var(--off-white)', color: 'var(--ink)' }}
              />
              <button
                className="chip"
                type="button"
                disabled={!escManager}
                onClick={() => {
                  onEscalate(conversation.id, escManager, escReason, escNote);
                  setEscalating(false);
                  setEscNote('');
                }}
              >
                Confirm
              </button>
            </div>
          ) : null}
        </div>
        <div id="custBadges">
          <Badge variant={conversation.channel}>{channelLabel[conversation.channel as Channel]}</Badge>
          <Badge variant="status" statusType={conversation.statusClass}>{conversation.status}</Badge>
        </div>
      </div>
      <div className="messages" id="messages">
        {conversation.messages.map((m, i) => (
          <div
            key={i}
            className={`bubble ${m.role === 'staff' ? 'staff' : 'customer'}`}
            style={m.kind === 'NOTE' ? { background: '#fdf3d8', color: 'var(--ink)', border: '1px dashed var(--sand)' } : undefined}
          >
            <div className="who">{m.who}{m.kind === 'NOTE' ? ' · internal note, staff only' : ''}</div>
            {m.text}
            {(m.attachments ?? []).map((a) => (
              <AttachmentView key={a.id} a={a} />
            ))}
          </div>
        ))}
      </div>
      {composer}
    </div>
  );
}
