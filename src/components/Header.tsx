interface HeaderProps {
  siteTitle: string
  currentUrl: string
}

export function Header({ siteTitle, currentUrl }: HeaderProps) {
  const isActive = (href: string) => currentUrl === href || currentUrl.startsWith(href + '?')

  return (
    <header class="site-header">
      <div class="header-inner">
        <a href="/" class="site-title">
          {siteTitle}
        </a>
        <nav class="header-nav">
          <a
            href="/tags/"
            class={`nav-link${isActive('/tags/') ? ' nav-link--active' : ''}`}
            aria-current={isActive('/tags/') ? 'page' : undefined}
          >
            タグ一覧
          </a>
          <a
            href="/search/"
            class={`nav-link${isActive('/search/') ? ' nav-link--active' : ''}`}
            aria-current={isActive('/search/') ? 'page' : undefined}
          >
            検索
          </a>
        </nav>
      </div>
    </header>
  )
}
