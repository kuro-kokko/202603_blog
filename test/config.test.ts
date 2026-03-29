import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { SiteConfig } from '../src/types.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** テストビルドの出力先 */
export const TEST_OUT_DIR = path.resolve(__dirname, 'out')

/** テスト用コンテンツディレクトリ */
export const TEST_CONTENT_DIR = path.resolve(__dirname, 'content')

/** テスト用 SiteConfig */
export const testConfig: SiteConfig = {
  title: 'テストブログ',
  baseUrl: 'https://test.example.com',
  description: 'テスト用ブログ',
  language: 'ja',

  profile: {
    enabled: true,
    name: 'Test User',
    bio: 'テストユーザーです。',
    links: [{ label: 'GitHub', url: 'https://github.com/test' }],
  },

  calendar: {
    enabled: true,
    dateField: 'createDateTime',
  },

  build: {
    outDir: TEST_OUT_DIR,
    excludeDrafts: true,
    excludeUnderscored: true,
  },

  backlinks: {
    position: 'below',
  },
}
