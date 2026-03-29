import type { ComponentChildren } from 'preact'
import type { SiteConfig } from '../types.js'
import { Header } from './Header.js'
import { Footer } from './Footer.js'

interface LayoutProps {
  config: SiteConfig
  title: string
  description: string
  url: string
  children: ComponentChildren
  sidebar?: ComponentChildren
}

export function Layout({ config, title, description, url, children, sidebar }: LayoutProps) {
  const lang = config.language ?? 'ja'
  const fullUrl = `${config.baseUrl.replace(/\/$/, '')}${url}`

  const theme = config.theme ?? 'choco-mint'

  return (
    <html lang={lang} data-theme={theme}>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <meta name="description" content={description} />

        {/* OGP */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={fullUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={config.title} />

        {/* CSS */}
        <link rel="stylesheet" href="/assets/style.css" />
      </head>
      <body>
        <Header siteTitle={config.title} currentUrl={url} />
        <div class="page-wrapper">
          <main class="main-content">{children}</main>
          {sidebar && <aside class="sidebar">{sidebar}</aside>}
        </div>
        <Footer config={config} />
      </body>
    </html>
  )
}
