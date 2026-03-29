import type { SiteConfig } from '../types.js'

interface ProfileProps {
  profile: SiteConfig['profile']
}

export function Profile({ profile }: ProfileProps) {
  if (!profile || !profile.enabled) return null

  const initials = profile.name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <section class="profile-card">
      <div class="profile-avatar">
        {profile.avatar ? (
          <img src={profile.avatar} alt={profile.name} class="profile-avatar__img" />
        ) : (
          <div class="profile-avatar__placeholder" aria-hidden="true">
            {initials}
          </div>
        )}
      </div>
      <div class="profile-info">
        <p class="profile-name">{profile.name}</p>
        {profile.bio && <p class="profile-bio">{profile.bio}</p>}
        {profile.links && profile.links.length > 0 && (
          <ul class="profile-links">
            {profile.links.map((link) => (
              <li key={link.url} class="profile-links__item">
                <a href={link.url} target="_blank" rel="noopener noreferrer" class="profile-links__anchor">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
