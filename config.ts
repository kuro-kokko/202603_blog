import type { SiteConfig } from './src/types.js'

export const config: SiteConfig = {
  title: 'My Blog',
  baseUrl: 'https://example.com',
  description: 'シンプルな静的サイトブログ',
  language: 'ja',

  profile: {
    enabled: true,
    name: 'Your Name',
    bio: 'ここに自己紹介文を書きます。',
    avatar: '/assets/avatar.png',
    links: [
      { label: 'GitHub', url: 'https://github.com/' },
      { label: 'X (Twitter)', url: 'https://x.com/' },
    ],
  },

  calendar: {
    enabled: true,
    dateField: 'createDateTime',
  },

  build: {
    outDir: 'out',
    excludeDrafts: true,
    excludeUnderscored: true,
  },

  backlinks: {
    position: 'below',
  },
}
