import type { ProfessionalProfile, ProfileLink } from '@/lib/professionalProfile';
import { profileAccentStyle } from '@/lib/professionalProfile';
import { ProfessionalPhotos, professionalPhotoUrl } from '@/components/ProfessionalPhotos';
import { ProfessionalContactForm } from '@/components/ProfessionalContactForm';
import styles from './ProfessionalOverview.module.css';

function LinkList({ entries }: { entries: ProfileLink[] }) {
  return <ul className={styles.links}>{entries.map(({ label, url }, index) => (
    <li key={index}><a href={url} target="_blank" rel="noopener noreferrer">{label} <span aria-hidden="true">↗</span></a></li>
  ))}</ul>;
}

export function ProfessionalOverview({ business }: { business: {
  id: string; name: string; logoUrl: string | null; chatUrl: string; description: string | null;
  products: string | null; hours: string | null; contact: string | null; profile: ProfessionalProfile | null;
} }) {
  const { id, name, logoUrl, chatUrl, description, products, hours, contact, profile } = business;
  const services = profile?.services ?? [];
  const photos = profile?.photos ?? [];
  const portfolio = profile?.portfolio ?? [];
  const socials = profile?.socials ?? [];
  const portrait = profile?.portraitId ? professionalPhotoUrl(profile.portraitId, id) : logoUrl;
  const accent = profileAccentStyle(profile?.accent ?? '#1d4fb8');
  return (
    <div className={styles.page}>
      <main className={styles.container}>
        <nav className={styles.nav} aria-label="Profile sections">
          <a className={styles.brand} href="#overview">Business Paddy</a>
          <div>
            {(products || services.length > 0) && <a href="#services">Services</a>}
            {(photos.length > 0 || portfolio.length > 0) && <a href="#work">Work</a>}
            <a href="#contact">Contact</a>
          </div>
        </nav>
        <header id="overview" className={styles.hero}>
          <div className={styles.identity}>
            {portrait ? <img src={portrait} alt={`${name} profile`} className={styles.portrait} />
              : <span aria-hidden="true" className={styles.portrait} style={accent}>{name.trim().slice(0, 1).toUpperCase()}</span>}
            <div>
              <p className={styles.eyebrow}>{profile?.specialty || 'Professional profile'}</p>
              <h1>{name}</h1>
            </div>
          </div>
          <div className={styles.actions}>
            <a className={styles.primary} style={accent} href={chatUrl}>Enquire on Paddy Chat <span aria-hidden="true">↗</span></a>
            <a className={styles.secondary} href="#contact">Request a reply</a>
          </div>
          <p className={styles.heroNote}>No account or download needed to chat.</p>
        </header>
        {description && <section className={styles.panel}><h2>About</h2><p className={styles.prose}>{description}</p></section>}
        {(products || services.length > 0) && (
          <section id="services" className={styles.section}>
            <h2>Services</h2>
            {products && <p className={styles.prose}>{products}</p>}
            {services.length > 0 && <div className={styles.grid}>{services.map((service) => (
              <article className={styles.service} key={service.id}>
                <h3>{service.name}</h3>
                {service.description && <p className={styles.prose}>{service.description}</p>}
                <p className={styles.price}>{service.price || 'Request a quote'}</p>
                <a className={styles.serviceLink} href={`${chatUrl}?service=${encodeURIComponent(service.id)}`}>Ask about {service.name} <span aria-hidden="true">↗</span></a>
              </article>
            ))}</div>}
          </section>
        )}
        {(photos.length > 0 || portfolio.length > 0) && (
          <section id="work" className={styles.section}>
            <h2>Selected work</h2>
            <ProfessionalPhotos photos={photos} workspaceId={id} />
            {portfolio.length > 0 && <LinkList entries={portfolio} />}
          </section>
        )}
        <div id="contact" className={styles.contact}>
          <section className={styles.panel}>
            <h2>Get in touch</h2>
            <p>Ask a question directly or leave your details for a reply.</p>
            {hours && <p className={styles.prose}>{hours}</p>}
            {contact && <p className={styles.prose}>{contact}</p>}
            {profile?.email && <p><a href={`mailto:${profile.email.replace(/\+/g, '%2B')}`}>{profile.email}</a></p>}
            {socials.length > 0 && <LinkList entries={socials} />}
          </section>
          <ProfessionalContactForm key={id} workspaceId={id} />
        </div>
        <footer className={styles.footer}>Powered by <a href="/">Business Paddy</a></footer>
      </main>
    </div>
  );
}
