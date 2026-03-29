import type { SiteConfig } from '../types.js'

interface FooterProps {
  config: SiteConfig
}

export function Footer({ config }: FooterProps) {
  const year = new Date().getFullYear()
  return (
    <footer class="site-footer">
      <div class="footer-inner">
        <span class="footer-title">{config.title}</span>
        <span class="footer-copy">
          &copy; {year} {config.title}
        </span>
      </div>
    </footer>
  )
}
