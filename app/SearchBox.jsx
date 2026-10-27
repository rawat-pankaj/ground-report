import { MAX_QUERY_LENGTH } from "../lib/search";

// Plain GET form to /search: works without JavaScript and needs no CSP change
// (form-action 'self' already allows it). Used on the homepage and on the
// results page, where it is prefilled with the current query.
export default function SearchBox({ defaultValue = "" }) {
  return (
    <form action="/search" method="get" role="search" className="search-row">
      <label htmlFor="search-q" className="sr-only">
        Search stories
      </label>
      <input
        id="search-q"
        name="q"
        type="search"
        defaultValue={defaultValue}
        maxLength={MAX_QUERY_LENGTH}
        placeholder="Search stories, channels, places"
        autoComplete="off"
        enterKeyHint="search"
        className="search-input"
      />
      <button type="submit" className="search-btn">
        Search
      </button>
    </form>
  );
}
