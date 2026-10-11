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

function ProductPreview() {
  // Abstract product illustration — no names, numbers, or conversations.
  // Nothing here is presented as real product data.
  return (
    <div className="lp-shot" aria-label="Product illustration">
      <span className="lp-shot-tag">How it feels</span>
      <div className="lp-shot-abstract">
        <svg width="120" height="120" viewBox="0 0 34 34" aria-hidden="true">
          <path
            d="M17 3C9.3 3 3 8.6 3 15.5c0 3.9 2 7.4 5.1 9.6L6.5 31l6.6-2.9c1.2.3 2.5.4 3.9.4 7.7 0 14-5.6 14-12.5S24.7 3 17 3z"
            fill="#1d4fb8"
          />
          <circle cx="11.5" cy="15.5" r="1.7" fill="#fff" />
          <circle cx="17" cy="15.5" r="1.7" fill="#fff" />
          <circle cx="22.5" cy="15.5" r="1.7" fill="#fff" />
        </svg>
        <ul className="lp-shot-points">
          <li>One shared inbox for every channel</li>
          <li>Clear ownership — nothing answered twice</li>
          <li>Human review before anything sends</li>
        </ul>
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
        <p>© Business Paddy</p>
      </footer>
    </div>
  );
}
