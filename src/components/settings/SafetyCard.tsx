export function SafetyCard() {
  return (
    <article className="card received">
      <div className="label">WhatsApp Cost &amp; Safety Centre</div>
      <p className="assignee" style={{ marginTop: '8px' }}>
        <span className="status">No WhatsApp account connected</span>
      </p>
      <p className="assignee" style={{ marginTop: '8px' }}>
        <strong>How WhatsApp business messaging works.</strong> Businesses reply free
        inside an open 24-hour customer-service window. Starting a conversation
        outside the window — or sending bulk notifications — uses pre-approved
        message templates, which Meta bills per message.
      </p>
      <p className="assignee" style={{ marginTop: '8px' }}>
        <strong>Estimates, not charges.</strong> No live usage exists yet, so every
        figure here is illustrative. Real per-message rates depend on your country,
        template category (utility, marketing or authentication) and Meta&apos;s
        current pricing. Nothing below is a bill.
      </p>
      <p className="assignee" style={{ marginTop: '8px' }}>
        <strong>Sending limits &amp; trust.</strong> New numbers start with low
        throughput and earn higher limits with quality history. Limits will be shown
        per business once an account is connected; nothing is enforced yet.
      </p>
      <p className="assignee" style={{ marginTop: '8px' }}>
        <strong>Stay safe.</strong> Always honour opt-outs, never spam, keep
        templates truthful, and warm new numbers gradually. Poor quality ratings
        can restrict or ban a number.
      </p>
      <p className="auth-alt" style={{ marginTop: '8px' }}>
        Official docs:{' '}
        <a href="https://developers.facebook.com/docs/whatsapp/pricing" target="_blank" rel="noreferrer">Pricing</a>
        {' · '}
        <a href="https://developers.facebook.com/docs/whatsapp/conversation-types" target="_blank" rel="noreferrer">Conversation types</a>
        {' · '}
        <a href="https://developers.facebook.com/docs/whatsapp/message-templates" target="_blank" rel="noreferrer">Templates</a>
      </p>
    </article>
  );
}
