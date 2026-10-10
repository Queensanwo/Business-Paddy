const CHANNELS = ['WhatsApp', 'Instagram', 'TikTok', 'Email', 'Website', 'Paddy Chat'];

export function ChannelsCard() {
  return (
    <article className="card received">
      <div className="label">Channel connections</div>
      <div className="conv-list" style={{ marginTop: '10px' }}>
        {CHANNELS.map((ch) => (
          <div key={ch} className="conv" style={{ cursor: 'default' }}>
            <div className="conv-top">
              <strong>{ch}</strong>
              <span className="status">Not connected yet</span>
            </div>
            <div className="preview">Official connection arrives in a later phase.</div>
          </div>
        ))}
      </div>
      <p className="assignee" style={{ marginTop: '8px' }}>
        No channel or storage integration is connected yet. Payments above run in
        Paystack test mode only and move no real money.
      </p>
    </article>
  );
}
