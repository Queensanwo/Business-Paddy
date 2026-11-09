export type ProfileLink = { label: string; url: string };
export type WorkspaceKind = 'BUSINESS' | 'PROFESSIONAL';
export type ProfessionalProfile = {
  specialty: string;
  email: string;
  socials: ProfileLink[];
  portfolio: ProfileLink[];
};

export const emptyProfessionalProfile: ProfessionalProfile = {
  specialty: '', email: '', socials: [], portfolio: [],
};

export function parseProfessionalProfile(input: unknown): ProfessionalProfile {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid professional profile.');
  const profile = input as Record<string, unknown>;
  function field(value: unknown, max: number, label: string) {
    if (typeof value !== 'string' || value.trim().length > max) throw new Error(`${label} must be text of up to ${max} characters.`);
    return value.trim();
  }
  function links(value: unknown, label: string) {
    if (!Array.isArray(value) || value.length > 6) throw new Error(`Add up to six ${label}.`);
    return value.map((item: unknown) => {
      if (item === null || typeof item !== 'object') throw new Error(`Invalid ${label} entry.`);
      const entry = item as Record<string, unknown>;
      const title = field(entry.label, 80, 'Link label');
      const address = field(entry.url, 500, 'Link URL');
      let url: URL;
      try { url = new URL(address); } catch { throw new Error('Enter a full HTTPS link.'); }
      if (!title || url.protocol !== 'https:' || url.username || url.password) {
        throw new Error('Each link needs a label and a full HTTPS URL without login details.');
      }
      return { label: title, url: url.href };
    });
  }
  const email = field(profile.email, 254, 'Public email');
  if (email && !/^[a-z0-9._+\-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(email)) {
    throw new Error('Enter a valid public business email.');
  }
  return {
    specialty: field(profile.specialty, 100, 'Specialty'),
    email,
    socials: links(profile.socials, 'social links'),
    portfolio: links(profile.portfolio, 'work samples'),
  };
}
