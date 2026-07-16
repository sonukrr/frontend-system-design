# Search Bar (Auto-suggest)

A minimal React + Vite search component that fetches live autocomplete suggestions from Google Suggest, with debouncing and client-side caching.

---

## How to create the app from scratch

```bash
# 1. Scaffold a new Vite React project
npm create vite@latest search-bar -- --template react

# 2. Move into the project
cd search-bar

# 3. Install dependencies
npm install

# 4. Start the dev server
npm run dev
```

Build / preview commands:

```bash
npm run build    # production bundle
npm run preview  # preview production build
npm run lint     # run ESLint
```

---

## Key functionalities

- **Debounced input** – waits 200ms after the user stops typing before firing the API call, avoiding a request on every keystroke.
- **Google Suggest API** – queries `https://www.google.com/complete/search?client=firefox&q=...` and renders the returned string array as selectable suggestions.
- **Client-side cache** – stores results for each trimmed query in an object so revisiting the same term does not trigger a new network request.
- **Show / hide suggestions** – dropdown is visible only when the input is focused and has results. Clicking a suggestion fills the input and closes the dropdown (uses `onMouseDown` to win over the blur event).
- **Hover state** – list items highlight on mouse enter/leave via inline style toggling.
- **Loading state** – a flag is toggled, although the fetch itself does not start the spinner.

---

## Features

- React 19 + Vite 8 setup
- Functional component with `useState` and `useEffect`
- Minimal dependencies (`react`, `react-dom`)
- No external UI library; plain inline styles
- Responsive width centered layout

---

## Gaps to fix / take care of before a machine coding round

Below are the most common things an interviewer will look for in a search-bar component. The current code has several issues that should be addressed.

### 1. Debounce cleanup
- The `setLoading(false)` is called in `finally`, but `setLoading(true)` is never called before the fetch. This makes the loading state effectively unused.
- Fix: set `loading` to `true` at the start of `getAutoSuggetions` and `false` in `finally`.

### 2. Memoization of the debounce function
- The debounce is currently implemented with a `useEffect` and manual timer. That is fine, but wrapping it in `useEffect` is the right pattern. If using a util, use `useMemo` to keep the function stable across renders.
- Consider extracting a reusable `useDebounce` hook.

### 3. Race conditions
- Rapid typing can cause older, slower responses to overwrite newer, faster ones.
- Fix: keep a request counter / cancel token / `AbortController` and ignore stale results, or use a stable debounce timer.

### 4. Empty / whitespace-only queries
- A query of only spaces is currently trimmed but still triggers `getAutoSuggetions` because `searchText.trim().length > 0` is checked after the state update. This is already handled, but double-check edge cases like single characters and special characters in the URL.

### 5. URL encoding
- `searchText` is concatenated directly into the URL.
- Fix: use `encodeURIComponent(searchText)` to safely encode special characters and spaces.

### 6. Error handling / UX
- Errors are only `console.log`-ed. The user sees no feedback if Google Suggest fails or is blocked by CORS.
- Fix: add an error state and render a friendly message (e.g. "Could not fetch suggestions"). Handle CORS gracefully because the public Google endpoint may not be accessible in all environments.

### 7. Accessibility (a11y)
- The input is missing `aria-label`, `aria-expanded`, `aria-activedescendant`, and listbox roles.
- Keyboard navigation (arrow keys, Enter, Escape) is not supported.
- Fix: add `role="combobox"`, `aria-autocomplete="list"`, and implement keyboard selection.

### 8. Styling consistency
- Inline styles are hard to maintain. Consider moving to a CSS module or a styled-components approach if the team prefers it, or keep styles in a constants object.
- The hover effect uses inline styles; prefer CSS classes or `:hover` pseudo-classes.

### 9. Caching strategy
- Cache grows unbounded. In a long interview session, this could leak memory.
- Fix: cap cache size (e.g. LRU with 50 entries) or use `Map` with `LRU` eviction.

### 10. State naming & cleanup
- `debounceInput` is a confusing name for the raw input state; `setDebouncedInput` is actually the *un-debounced* value. Rename to `inputValue` / `setInputValue` and `debouncedValue` / `setDebouncedValue`.
- `suggestors` is misspelled; use `suggestions`.
- `getAutoSuggetions` is misspelled; use `getAutoSuggestions`.

### 11. Testing
- There are no unit tests. In a machine coding round, adding tests for the debounce, caching, and keyboard navigation can differentiate a good solution.
- Suggested tools: `vitest` + `@testing-library/react`.

### 12. Mocking the API in local dev
- The Google endpoint may be blocked by CORS in some browsers or behind a proxy. Provide a local mock or fallback suggestions so the app is runnable everywhere.

### 13. Loading state UX
- The spinner is only shown when `loading` is true, but the flag is never set to true. Ensure it is visible while fetching and hidden when done.

---

## Suggested file structure for a production-ready version

```
search-bar/
├── src/
│   ├── components/
│   │   ├── SearchBar.jsx
│   │   ├── SuggestionList.jsx
│   │   └── SearchBar.module.css
│   ├── hooks/
│   │   └── useDebounce.js
│   ├── utils/
│   │   └── fetchSuggestions.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
└── vite.config.js
```

---

## Quick wins before the interview

1. Set `loading` correctly and add a real spinner/loader.
2. Add `encodeURIComponent` and an `AbortController`.
3. Implement keyboard navigation (ArrowUp/ArrowDown/Enter/Escape).
4. Add accessible ARIA attributes.
5. Rename confusing state variables and fix typos.
6. Add a fallback mock API for offline / CORS-free development.
7. Write at least one test for the debounce behavior.
