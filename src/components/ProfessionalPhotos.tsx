import type { ProfilePhoto } from '@/lib/professionalProfile';

export function professionalPhotoUrl(id: string, workspaceId?: string) {
  return `/api/site/photos/${encodeURIComponent(id)}${workspaceId ? `?site=${encodeURIComponent(workspaceId)}` : ''}`;
}

export function ProfessionalPhotos({ photos, workspaceId }: { photos: ProfilePhoto[]; workspaceId?: string }) {
  if (!photos.length) return null;
  return (
    <section className="card received">
      <h2 className="label">Work gallery</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: '12px', marginTop: '10px' }}>
        {photos.map((photo, index) => (
          <figure key={photo.id} style={{ margin: 0, minWidth: 0, overflowWrap: 'anywhere' }}>
            <img src={professionalPhotoUrl(photo.id, workspaceId)} alt={photo.caption || `Work sample ${index + 1}`}
              loading="lazy" style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'contain', background: 'var(--off-white)', borderRadius: '10px' }} />
            {photo.caption && <figcaption>{photo.caption}</figcaption>}
          </figure>
        ))}
      </div>
    </section>
  );
}
