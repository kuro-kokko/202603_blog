export function Search() {
  return (
    <section class="search-section">
      <form class="search-form" role="search" onSubmit="return false">
        <label for="search-input" class="search-form__label">
          キーワード検索
        </label>
        <div class="search-form__row">
          <input
            id="search-input"
            type="search"
            class="search-form__input"
            placeholder="キーワードを入力..."
            autoComplete="off"
            aria-label="検索キーワード"
          />
          <button type="submit" class="search-form__btn" aria-label="検索">
            検索
          </button>
        </div>
      </form>
      <div id="search-results" class="search-results" aria-live="polite" aria-atomic="true" />
      <script src="/assets/search.client.js" type="module" />
    </section>
  )
}
