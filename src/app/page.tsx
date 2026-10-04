import Link from 'next/link';

function Logo() {
  return (
    <span className="lp-logo">
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
        <path
          d="M17 3C9.3 3 3 8.6 3 15.5c0 3.9 2 7.4 5.1 9.6L6.5 31l6.6-2.9c1.2.3 2.5.4 3.9.4 7.7 0 14-5.6 14-12.5S24.7 3 17 3z"
          fill="#1d4fb8"
        />
        <circle cx="11.5" cy="15.5" r="1.7" fill="#fff" />
        <circle cx="17" cy="15.5" r="1.7" fill="#fff" />
        <circle cx="22.5" cy="15.5" r="1.7" fill="#fff" />
      </svg>
      <strong>Business Paddy</strong>
    </span>
  );
}

const PREVIEW_CONVERSATIONS = [
  { initials: 'SM', name: 'Sarah Mitchell', time: '10:24', preview: 'Hi, do you have this in stock?', channel: 'Website' },
  { initials: 'JC', name: 'James Carter', time: '09:41', preview: 'Thanks for your help!', channel: 'Instagram' },
  { initials: 'PS', name: 'Priya Sharma', time: '08:17', preview: 'Can I change my order?', channel: 'WhatsApp' },
  { initials: 'DL', name: 'Daniel Lee', time: 'Yesterday', preview: 'What are your opening hours?', channel: 'Email' },
  { initials: 'EW', name: 'Emma Wilson', time: 'Yesterday', preview: 'Do you offer gift wrapping?', channel: 'TikTok' },
];

function ProductPreview() {
  return (
    <div className="lp-shot" aria-label="Product preview (illustration with fictional data)">
      <span className="lp-shot-tag">Product preview</span>
      <div className="lp-shot-side">
        <span className="lp-shot-brand">
          <svg width="20" height="20" viewBox="0 0 34 34" aria-hidden="true">
            <path
              d="M17 3C9.3 3 3 8.6 3 15.5c0 3.9 2 7.4 5.1 9.6L6.5 31l6.6-2.9c1.2.3 2.5.4 3.9.4 7.7 0 14-5.6 14-12.5S24.7 3 17 3z"
              fill="#e8c56b"
            />
          </svg>
          Business Paddy
        </span>
        {['Inbox', 'Customers', 'Reminders', 'Templates', 'Settings'].map((item, i) => (
          <span key={item} className={i === 0 ? 'lp-shot-link active' : 'lp-shot-link'}>
            {item}
          </span>
        ))}
      </div>
      <div className="lp-shot-main">
        <div className="lp-shot-top">
          <strong>Inbox</strong>
          <span className="lp-shot-search">Search conversations…</span>
        </div>
        <div className="lp-shot-tabs">
          {['All', 'WhatsApp', 'Instagram', 'Email', 'TikTok', 'Website'].map((t, i) => (
            <span key={t} className={i === 0 ? 'on' : ''}>{t}</span>
          ))}
        </div>
        <div className="lp-shot-cards">
          <div className="lp-shot-card"><span>Received</span><strong>24</strong></div>
          <div className="lp-shot-card good"><span>Answered</span><strong>18</strong></div>
          <div className="lp-shot-card warn"><span>Unanswered</span><strong>6</strong></div>
        </div>
        <div className="lp-shot-cols">
          <div className="lp-shot-list">
            {PREVIEW_CONVERSATIONS.map((c) => (
              <div key={c.name} className="lp-shot-row">
                <span className="lp-shot-avatar">{c.initials}</span>
                <span className="lp-shot-rowtext">
                  <strong>{c.name} <em>{c.time}</em></strong>
                  <span>{c.preview}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="lp-shot-thread">
            <strong>Sarah Mitchell</strong>
            <div className="lp-bubble in">Hi, do you have this in stock?</div>
            <div className="lp-bubble out">Yes, it&apos;s in stock! Would you like me to reserve one for you?</div>
            <div className="lp-bubble in">That would be great, thank you!</div>
            <span className="lp-shot-composer">Type a message…</span>
          </div>
        </div>
        <p className="lp-shot-note">Illustration with fictional data.</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="lp">
      <header className="lp-nav">
        <Logo />
        <nav>
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <Link href="/sign-in">Sign in</Link>
          <Link href="/sign-up" className="lp-btn">Get started</Link>
        </nav>
      </header>

      <main>
        <section className="lp-hero">
          <div className="lp-hero-copy">
            <p className="lp-eyebrow">Welcome to Business Paddy</p>
            <h1>Customer conversations. Made simple.</h1>
            <p className="lp-sub">
              A simpler way to organise chats, follow up with customers, and keep your business moving.
            </p>
            <div className="lp-cta-row">
              <Link href="/sign-up" className="lp-btn big">Get started</Link>
              <a href="#features" className="lp-btn ghost big">Explore features</a>
            </div>
          </div>
          <ProductPreview />
        </section>

        <section className="lp-features" id="features">
          <h2>Less switching. More connection.</h2>
          <div className="lp-cards">
            <article>
              <span className="lp-icon" aria-hidden="true">💬</span>
              <h3>Organise conversations</h3>
              <p>Keep all your customer chats in one place, with a clear and simple inbox.</p>
            </article>
            <article>
              <span className="lp-icon" aria-hidden="true">👤</span>
              <h3>Keep customer details together</h3>
              <p>See past conversations and important details, so every chat feels personal.</p>
            </article>
            <article>
              <span className="lp-icon" aria-hidden="true">📊</span>
              <h3>See your response progress</h3>
              <p>Quickly see what&apos;s been received, answered, and still needs attention.</p>
            </article>
          </div>
        </section>

        <section className="lp-how" id="how">
          <h2>How it works</h2>
          <ol>
            <li><strong>1. Create your workspace.</strong> Sign up in minutes with just your business name.</li>
            <li><strong>2. Answer from one inbox.</strong> Read and reply to every conversation in a single familiar view.</li>
            <li><strong>3. Follow up and track.</strong> Claim, assign, resolve and review how each customer was helped.</li>
          </ol>
        </section>

        <section className="lp-banner">
          <h2>Give every customer a little more attention.</h2>
          <Link href="/sign-up" className="lp-btn light">Get started</Link>
        </section>
      </main>

      <footer className="lp-foot">
        <Logo />
        <p>© Business Paddy · Screenshots on this page are illustrations with fictional data.</p>
      </footer>
    </div>
  );
}
