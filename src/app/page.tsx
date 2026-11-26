import Link from 'next/link';
import styles from './home.module.css';
import type { Metadata } from 'next';

const description = 'Business Paddy is an omnichannel customer service platform that helps business owners manage customer conversations, follow-ups and customer experience from one inbox.';

export const metadata: Metadata = {
  title: 'Business Paddy | Omnichannel Customer Service Made Simple',
  description,
  alternates: { canonical: 'https://businesspaddy.com.ng/' },
  openGraph: {
    title: 'Business Paddy | Omnichannel Customer Service Made Simple',
    description,
    url: 'https://businesspaddy.com.ng/',
    siteName: 'Business Paddy',
    type: 'website',
  },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'Organization', '@id': 'https://businesspaddy.com.ng/#organization',
      name: 'Ohevlishon Enterprise', url: 'https://businesspaddy.com.ng/contact',
      email: 'businesspaddysupport@gmail.com' },
    { '@type': 'WebSite', '@id': 'https://businesspaddy.com.ng/#website',
      name: 'Business Paddy', url: 'https://businesspaddy.com.ng/',
      publisher: { '@id': 'https://businesspaddy.com.ng/#organization' } },
    { '@type': 'SoftwareApplication', name: 'Business Paddy',
      url: 'https://businesspaddy.com.ng/', applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web', description,
      publisher: { '@id': 'https://businesspaddy.com.ng/#organization' },
      featureList: ['Shared inbox for supported connected channels', 'Customer follow-ups',
        'Team conversation management', 'Professional pages and Paddy Chat'] },
  ],
};

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
          {['All', 'WhatsApp', 'Instagram', 'Facebook', 'Email', 'TikTok', 'Website'].map((t, i) => (
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      <header className="lp-nav">
        <Logo />
        <nav>
          <a href="#features">Features</a>
          <a href="#professional">For professionals</a>
          <a href="#how">How it works</a>
          <Link href="/sign-in">Sign in</Link>
          <Link href="/sign-up" className="lp-btn">Get started</Link>
        </nav>
      </header>

      <main>
        <section className="lp-hero">
          <div className="lp-hero-copy">
            <p className="lp-eyebrow">Business Paddy · Omnichannel customer service</p>
            <h1>Customer service and experience. Made simple.</h1>
            <p className="lp-sub">
              Business Paddy brings customer conversations from your connected channels into one inbox.
              As the business owner, you can reply, follow up, and manage how your customers are helped.
            </p>
            <p>Omnichannel simply means helping customers across different channels from one place.</p>
            <div className="lp-cta-row">
              <Link href="/sign-up" className="lp-btn big">Get started</Link>
              <a href="#features" className="lp-btn ghost big">Explore features</a>
            </div>
          </div>
          <ProductPreview />
        </section>

        <section className={styles.professional} id="professional" aria-labelledby="professional-heading">
          <div>
            <p className="lp-eyebrow">Business Paddy Professional</p>
            <h2 id="professional-heading">Build your brand with a page of your own.</h2>
            <p className={styles.description}>Share your services, show your work, and give people a way to reach you through Paddy Chat. All from one link.</p>
            <Link href="/sign-up?type=professional" className="lp-btn">Create my professional page</Link>
          </div>
          <figure className={styles.preview}>
            <figcaption>Example professional page</figcaption>
            <div className={styles.profile}>
              <span className={styles.avatar} aria-hidden="true">AO</span>
              <div>
                <h3>Ada Okafor</h3>
                <p>Brand photographer</p>
              </div>
            </div>
            <ul className={styles.services} aria-label="Example services">
              <li>Brand portraits</li>
              <li>Product photography</li>
            </ul>
            <span className={styles.chat}>Chat with Ada</span>
          </figure>
        </section>

        <section className="lp-features" id="features">
          <h2>Less switching. More connection.</h2>
          <div className="lp-cards">
            <article>
              <span className="lp-icon" aria-hidden="true">💬</span>
              <h3>Organise conversations</h3>
              <p>Find messages from your supported, connected channels in one inbox. See which customers need a reply.</p>
            </article>
            <article>
              <span className="lp-icon" aria-hidden="true">👤</span>
              <h3>Keep customer details together</h3>
              <p>See customer details and past conversations so you and your team can give more personal help.</p>
            </article>
            <article>
              <span className="lp-icon" aria-hidden="true">📊</span>
              <h3>See your response progress</h3>
              <p>As the owner, see what has been answered, assign conversations to your team, and follow up on requests.</p>
            </article>
          </div>
        </section>

        <section className="lp-how" id="how">
          <h2>How it works</h2>
          <ol>
            <li><strong>Create your account.</strong> Choose Business or Professional and add your details.</li>
            <li><strong>Connect your channels.</strong> Open Settings to connect a supported messaging or email account. Each channel needs its own setup and authorization.</li>
            <li><strong>Help customers from one inbox.</strong> Read enquiries and reply yourself, or assign a conversation to someone on your team.</li>
            <li><strong>Follow up.</strong> Check unanswered messages, set reminders, and mark requests as resolved when you have helped the customer.</li>
          </ol>
          <p>For example, a customer asks about an order through a connected channel. You see the message in Business Paddy, reply, and set a reminder to check that everything arrived.</p>
        </section>

        <section className="lp-banner">
          <h2>Give every customer a little more attention.</h2>
          <Link href="/sign-up" className="lp-btn light">Get started</Link>
        </section>
      </main>

      <footer className="lp-foot">
        <Logo />
        <div>
          <p>Business Paddy is a product of Ohevlishon Enterprise.</p>
          <p>Support: <a href="mailto:businesspaddysupport@gmail.com">businesspaddysupport@gmail.com</a></p>
          <nav aria-label="Business information" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Link href="/contact">About and contact</Link>
            <Link href="/privacy">Privacy notice</Link>
            <Link href="/terms">Terms of use</Link>
            <Link href="/data-deletion">Data deletion requests</Link>
          </nav>
          <p>© Ohevlishon Enterprise · Product preview uses fictional data.</p>
        </div>
      </footer>
    </div>
  );
}
