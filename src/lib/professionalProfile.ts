export type ProfileLink = { label: string; url: string };
export type WorkspaceKind = 'BUSINESS' | 'PROFESSIONAL';
export type ProfileService = { id: string; name: string; description: string; price: string };
export type ProfilePhoto = { id: string; caption: string };
export const MAX_WORK_PHOTOS = 6;
export type ProfessionalProfile = {
  specialty: string;
  email: string;
  socials: ProfileLink[];
  portfolio: ProfileLink[];
  services: ProfileService[];
  portraitId: string | null;
  photos: ProfilePhoto[];
  accent: string | null;
};
export type ProfessionalDraft = {
  description: string;
  products: string;
  hours: string;
  contact: string;
  profile: ProfessionalProfile;
};

export function parseProfessionalDraft(input: unknown): ProfessionalDraft {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid website draft.');
  const draft = input as Record<string, unknown>;
  function read(key: string, limit: number) {
    const value = draft[key];
    if (typeof value !== 'string' || value.length > limit) throw new Error(`Invalid ${key}.`);
    return value.trim();
  }
  return {
    description: read('description', 2000),
    products: read('products', 2000),
    hours: read('hours', 500),
    contact: read('contact', 500),
    profile: parseProfessionalProfile(draft.profile),
  };
}

export const emptyProfessionalProfile: ProfessionalProfile = {
  specialty: '', email: '', socials: [], portfolio: [], services: [],
  portraitId: null, photos: [], accent: null,
};

export function profileImageIds(profile: ProfessionalProfile): string[] {
  return [...(profile.portraitId ? [profile.portraitId] : []), ...profile.photos.map((photo) => photo.id)];
}

export function profileAccentStyle(accent: string | null | undefined) {
  if (!accent || !/^#[0-9a-f]{6}$/i.test(accent)) return {};
  const luminance = [1, 3, 5].reduce((total, offset, i) => {
    const channel = parseInt(accent.slice(offset, offset + 2), 16) / 255;
    return total + [0.2126, 0.7152, 0.0722][i] * (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  }, 0);
  return { background: accent, color: luminance > 0.179 ? '#000' : '#fff' };
}

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
  const rawServices = profile.services === undefined ? [] : profile.services;
  if (!Array.isArray(rawServices) || rawServices.length > 8) throw new Error('Add up to eight services.');
  const ids = new Set<string>();
  const services = rawServices.map((item: unknown): ProfileService => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error('Invalid service.');
    const row = item as Record<string, unknown>;
    const id = field(row.id, 36, 'Service ID');
    const name = field(row.name, 100, 'Service name');
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id) || ids.has(id) || !name) {
      throw new Error('Each service needs a name and a unique ID.');
    }
    ids.add(id);
    return { id, name, description: field(row.description, 500, 'Service description'), price: field(row.price, 80, 'Service price') };
  });
  function imageId(value: unknown) {
    if (typeof value !== 'string' || !/^c[a-z0-9]{24}$/.test(value)) throw new Error('Invalid photo reference.');
    return value;
  }
  const portraitId = profile.portraitId == null ? null : imageId(profile.portraitId);
  const rawPhotos = profile.photos === undefined ? [] : profile.photos;
  if (!Array.isArray(rawPhotos) || rawPhotos.length > MAX_WORK_PHOTOS) throw new Error('Add up to six work photos.');
  const photoIds = new Set(portraitId ? [portraitId] : []);
  const photos = rawPhotos.map((item: unknown): ProfilePhoto => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error('Invalid work photo.');
    const row = item as Record<string, unknown>;
    const id = imageId(row.id);
    if (photoIds.has(id)) throw new Error('Choose a different photo for each slot.');
    photoIds.add(id);
    return { id, caption: field(row.caption, 160, 'Photo caption') };
  });
  const accent = profile.accent == null ? null : field(profile.accent, 7, 'Profile colour');
  if (accent !== null && !/^#[0-9a-f]{6}$/i.test(accent)) throw new Error('Choose a valid profile colour.');
  return {
    specialty: field(profile.specialty, 100, 'Specialty'),
    email,
    socials: links(profile.socials, 'social links'),
    portfolio: links(profile.portfolio, 'work samples'),
    services,
    portraitId,
    photos,
    accent,
  };
}
