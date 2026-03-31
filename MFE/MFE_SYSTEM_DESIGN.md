# Micro-Frontend System Design
### Architect-level guide written so anyone can understand it

> Every concept here is backed by real code in this repo: `shell/` + `product/` + `cart/`

---

## The One-Line Mental Model

> Think of MFE like a shopping mall.
> The **mall building** (shell) owns the entrance, signage, and security.
> Each **store** (MFE) is independently owned, decorated, and stocked.
> Stores don't talk to each other directly — they use the mall's PA system (custom events).

---

## 1. Why Does MFE Exist?

### The problem it solves — a real scenario

Imagine Amazon has 50 teams. The Cart team wants to ship a fix today. But they share one giant frontend repo with the Search team, Payments team, and Recommendations team.

**Without MFE:**
- Cart team finishes their fix at 2pm
- Payments team has a broken build at 3pm
- Nobody can deploy until Payments is fixed
- Cart's fix ships 2 days late

**With MFE:**
- Cart team builds and deploys their own app
- Payments being broken is Payments' problem
- Cart ships at 2pm as planned

### The four pains MFE removes

| Pain | What it feels like | MFE fix |
|---|---|---|
| Deploy coupling | "We can't ship until Team X fixes their bug" | Each team deploys independently |
| Tech lock-in | "We can't upgrade React — 8 teams would break" | Each MFE can use different versions |
| Merge conflicts | 10 teams editing the same files daily | Each team has their own repo/codebase |
| No ownership | "Who owns this component?" | Team boundary = code boundary |

### When NOT to use MFE

MFE adds real complexity. Don't use it when:
- You have fewer than 3–4 teams
- One team owns the whole product
- You're just starting out — monolith first, split later when pain is real

> Rule of thumb: if your teams never block each other on deploys, you don't need MFE yet.

---

## 2. The Architecture — Layer by Layer

```
┌──────────────────────────────────────────────────┐
│              CDN / Edge Layer                    │
│        CloudFront · Caching · Geo-routing        │
│  (Serves the JS bundles to users globally fast)  │
└─────────────────────┬────────────────────────────┘
                      │
┌─────────────────────▼────────────────────────────┐
│              App Shell  (port 3000)              │
│   Routing · Auth · Shared Nav · Error Boundaries │
│         THE MALL BUILDING — owns the frame       │
└──────┬──────────────┬───────────────────┬────────┘
       │              │                   │
┌──────▼──────┐ ┌─────▼──────┐   more MFEs...
│ Product MF  │ │  Cart MF   │
│ (port 3001) │ │ (port 3002)│
│ Team: Store │ │Team:Checkout│
└──────┬──────┘ └─────┬──────┘
       │              │
┌──────▼──────────────▼──────────────────────────┐
│           Shared npm packages                  │
│     react · react-dom · react-router-dom       │
│   (loaded ONCE, shared across all MFEs)        │
└────────────────────────────────────────────────┘
```

---

## 3. The App Shell — The Mall Building

### What it is
The shell is the first thing the browser loads. It owns the page frame — header, navigation, routing. It has **zero business logic** of its own.

### What we built
```jsx
// shell/src/App.jsx
function Layout() {
  return (
    <div>
      <h1>ECommerce</h1>
      <nav>
        <NavLink to="/products">Products</NavLink>  ← shell's nav
        <NavLink to="/cart">Cart</NavLink>
      </nav>
      <Outlet />  ← MFEs render here, inside the shell's frame
    </div>
  );
}
```

### Why this matters
The `<Outlet />` is the "store slot" in the mall. The shell stays mounted. Only the content inside `<Outlet />` swaps when you navigate. No full page reload.

### What happens if you skip this
Without a shell, every MFE would be its own separate website. Users would see a full white flash on every navigation. Header and nav would have to be duplicated in every MFE and kept in sync manually.

---

## 4. Module Federation — How MFEs Talk to the Shell

### The simple explanation
Module Federation lets one app (shell) import code from another app (product) **at runtime** — without bundling it in at build time.

Think of it like a plugin system. The shell doesn't know what's inside the Product MFE. It just knows where to find it.

### The manifest file (`remoteEntry.js`)
When Product MFE is built, it generates a tiny file called `remoteEntry.js`. This is like a **menu** — it lists what the MFE exposes, without containing the actual code yet.

```
remoteEntry.js  ≈ 2KB   ← just the menu (fetched immediately)
ProductApp.js   ≈ 80KB  ← the actual meal (fetched only when user visits /products)
```

### What we built

**Product MFE says: "I expose my ProductApp component"**
```js
// product/vite.config.js
federation({
  name: 'product',
  filename: 'remoteEntry.js',
  exposes: {
    './ProductApp': './src/ProductApp',  // "here's what I'm offering"
  },
})
```

**Shell says: "I'll load Product from this URL"**
```js
// shell/vite.config.js
federation({
  remotes: {
    product: 'http://localhost:3001/assets/remoteEntry.js',
  },
})
```

**Shell uses it like a normal import — but it's remote:**
```js
// shell/src/App.jsx
const ProductApp = lazy(() => import('product/ProductApp'))
//                                    ↑ this is a REMOTE import, not local
```

### What happens if you skip this
Without Module Federation, you'd have to either:
1. Bundle all MFEs together (defeats the purpose — back to monolith)
2. Use iframes (terrible UX, no shared state, impossible to style consistently)

---

## 5. Bundle Hygiene — Managing Duplicate Dependencies

> **Layman version:** Imagine every store in the mall had their own security guard, their own PA system, and their own elevator. That's wasteful. The mall provides one of each. MFE dependencies work the same way.

Duplicate dependencies are the **silent killers of MFE performance**. They don't cause errors. They don't throw warnings by default. They just quietly add hundreds of KB to every page load.

### The problem — visualized

```
Without any shared dependency config:

  Shell   loads React 18 → 150KB downloaded ✓
  Product loads React 18 → 150KB downloaded ← DUPLICATE
  Cart    loads React 18 → 150KB downloaded ← DUPLICATE

  Total JavaScript: 450KB — 300KB of it is pure waste.
  Plus: two React instances = two virtual DOMs = context not shared between MFEs.
```

**The worst part:** this fails silently. No red error. No console warning. The page works — just 3x heavier.

---

### Step 1 — Runtime Sharing with Module Federation (`singleton: true`)

This is the primary tool. We configure the shell and all MFEs to **negotiate** a single shared copy of React at runtime.

**What we built:**
```js
// shell/vite.config.js
shared: {
  react: {
    singleton: true,    // ← only ONE copy allowed across all MFEs
    eager: true,        // ← shell includes it in its own initial bundle (no async wait)
    requiredVersion: '^18.2.0',
  },
  'react-dom': { singleton: true, eager: true },
  'react-router-dom': { singleton: true },
}
```

```js
// product/vite.config.js  (and cart/vite.config.js)
shared: {
  react: {
    singleton: true,
    // NO eager: true here — MFEs rely on shell's copy, not their own
    requiredVersion: '^18.2.0',
  },
  'react-dom': { singleton: true },
  'react-router-dom': { singleton: true },
}
```

**What `singleton: true` actually does at runtime:**
```
1. Shell boots → loads React 18.2 → registers it in Module Federation's shared scope
2. Product MFE boots → asks: "does anyone have React ^18.2.0 already?"
3. Shell's copy qualifies → Product reuses it → zero bytes downloaded for React
4. Cart MFE boots → same check → reuses shell's copy → zero bytes downloaded
```

**Result:**
```
With shared + singleton:
  Shell   loads React 18 → 150KB ✓
  Product reuses shell's copy    → 0KB
  Cart    reuses shell's copy    → 0KB
  Total: 150KB  ← 66% savings
```

**Why `eager: true` only on the shell, not MFEs:**
- Shell sets `eager: true` → React is included in shell's initial JS bundle, available immediately on page load
- MFEs do NOT set `eager` → they wait for shell to provide React rather than bundling their own
- If an MFE also set `eager: true`, it would race the shell on startup and risk two React instances loading simultaneously

---

### Step 2 — Build-time Contract with `peerDependencies`

Runtime sharing alone isn't enough. A developer might accidentally `npm install react` in an MFE repo and the build will happily bundle its own React copy, bypassing the shared config entirely.

`peerDependencies` is the build-time lock that prevents this.

**What we built:**
```json
// product/package.json
{
  "peerDependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

**What this declaration means:** "I, the Product MFE, formally declare that I will NOT bundle React. I expect whoever hosts me — the shell — to provide it. If the shell doesn't provide it, this will fail loudly at runtime, not silently."

**Without `peerDependencies`:**
```
Developer on Product team runs: npm install react
package.json: "dependencies": { "react": "^18.2.0" }

Vite bundles it into ProductApp.js regardless of Module Federation config.
300KB of duplicate React ships to every user.
No warning. No error. Just silent bloat.
```

**With `peerDependencies`:**
```
npm install react → react goes into peerDependencies, NOT bundled
Vite sees peerDep → skips it during bundling → relies on host to provide it
If host doesn't have it → clear runtime error pointing at the missing dep
```

---

### Step 3 — Version Mismatch Guard (CI Check)

Even with `singleton: true`, there's a risk: what if Product requires React 19 but the shell provides React 18?

Module Federation's behavior: it logs a warning and uses the shell's version. Product may silently break in subtle ways — hooks that work in React 19 failing in React 18.

**What to build for production:**

Add a CI step that validates version compatibility across all MFEs before merge:

```bash
# ci/check-shared-deps.sh
# Fails the pipeline if any MFE's required React version doesn't overlap shell's version
node scripts/validate-dep-matrix.js
```

```
[CI] Checking shared dependency compatibility...
  shell provides:   react ^18.2.0
  product requires: react ^18.2.0  ✓ compatible
  cart requires:    react ^19.0.0  ✗ INCOMPATIBLE — pipeline blocked
```

**What happens without this check:** A Cart team upgrade silently shifts which React version runs in production. Product team's features start behaving oddly. No one knows why. Debugging takes days.

---

### What happens if you skip bundle hygiene entirely

| Skipped step | Consequence |
|---|---|
| No `singleton: true` | 150KB × N MFEs downloaded on every page visit |
| No `peerDependencies` | Each MFE silently bundles its own React even with singleton config |
| No CI version check | A version mismatch ships to prod silently; React hooks break in unexpected ways |
| Two React instances running | `useContext` stops working across MFE boundaries — auth context, themes don't propagate |

---

## 6. Loading Strategy — Don't Load What You Don't Need

> **Layman version:** A restaurant doesn't cook every dish on the menu before you arrive. They prep the popular ones and cook the rest when you order. MFE loading works the same way.

A "load everything at once" approach fails at scale. With 10 MFEs, loading all of them upfront would send 2–5MB of JavaScript to a user who might only visit one page.

We implement a **three-tier loading strategy**:

---

### Tier 1 — Eager Loading (Shell only)

The shell loads immediately on page open. It's tiny — just the frame, nav, and router. **No MFE code is included in the shell bundle at all.**

```
Page opens:
  shell.js   → 20KB  ← downloads immediately (frame + router + nav)
  product.js → NOT downloaded yet
  cart.js    → NOT downloaded yet
```

**Why the shell is kept tiny:** If the shell bundle grew large (e.g., accidentally bundling an MFE), every user pays that cost even before seeing a single product or cart item.

---

### Tier 2 — Lazy Loading (On route visit)

MFE code is only downloaded when the user actually navigates to that route.

**What we built:**
```js
// shell/src/App.jsx
const ProductApp = lazy(() => import('product/ProductApp'))
const CartApp    = lazy(() => import('cart/CartApp'))

// Wrapped in Suspense so the shell shows a loading state while the bundle downloads
<Suspense fallback={<div>Loading...</div>}>
  <ProductApp />
</Suspense>
```

**What `lazy()` actually does:**
```
User visits /products for first time:
  → import('product/ProductApp') fires
  → browser fetches ProductApp.js (80KB)
  → component renders

User visits /cart (same session):
  → import('cart/CartApp') fires
  → browser fetches CartApp.js (60KB)
  → component renders

User never visits /cart:
  → CartApp.js is NEVER downloaded
  → 60KB saved for that user
```

**What happens without lazy loading:**
Every MFE bundle downloads on the first page visit, even routes the user never visits. A user opening the homepage downloads Product, Cart, Payments, Profile, Settings — all at once. First load becomes 5–10x slower.

---

### Tier 3 — Predictive Prefetch (On hover — before the click)

Lazy loading is good, but it still creates a spinner when the user clicks. Prefetching eliminates the spinner by starting the download **before** the click, using hover intent as a signal.

**What we built:**
```jsx
// shell/src/App.jsx
const prefetch = {
  product: () => import('product/ProductApp'),  // trigger download early
  cart:    () => import('cart/CartApp'),
}

<NavLink onMouseEnter={prefetch.cart} to="/cart">Cart</NavLink>
//              ↑ user hovers → download starts immediately in background
```

**The timeline difference this creates:**

```
WITHOUT prefetch:
  User clicks "Cart"  → browser starts download → spinner → 300ms → Cart renders

WITH prefetch:
  User hovers "Cart"  → browser starts download in background  (200ms head start)
  User clicks "Cart"  → CartApp.js already in cache → Cart renders instantly
```

**Why hover works as a signal:**
- Average time between hover and click: 200–400ms
- Average time to download a 60KB bundle on broadband: 100–200ms
- The download finishes before the click lands → zero-wait navigation

**What happens without prefetch:** Users see a loading spinner on every MFE navigation. The app feels sluggish even though it's technically correct.

---

### Loading Strategy Decision Matrix

| Scenario | Strategy | Why |
|---|---|---|
| Shell frame, nav, router | Eager | User needs it immediately; it's tiny |
| MFE for current entry route | Lazy | Downloaded when route is matched |
| MFE behind a hovered link | Prefetch | User signaled intent; start early |
| MFE behind a tab the user never opens | Never downloaded | That's the whole point |

---

## 7. Navigation Optimization — Fast First Load AND Fast Subsequent Visits

> **Layman version:** Performance has two problems: getting to the website fast for the first time, and making it feel instant once you're already there. They need different solutions.

---

### First Load — Getting the Page on Screen Fast

When a user opens the app for the very first time, every byte must travel from a server to their browser. The goal is to minimize what travels and how far it travels.

#### CDN + Brotli Compression

**What we do:** All JS bundles are uploaded to a CDN (e.g., CloudFront, Cloudflare). When Vite builds the shell or an MFE, the output goes to S3, which CloudFront serves globally.

```
Without CDN:
  User in Tokyo → request → server in US-East → 180ms round-trip latency

With CDN (edge node in Tokyo):
  User in Tokyo → request → CDN node in Tokyo → 8ms round-trip latency
```

**Brotli compression:** Vite's build output is compressed before uploading. Brotli shrinks JS files by ~70%.

```
ProductApp.js uncompressed: 80KB
ProductApp.js with Brotli:  24KB  ← 70% smaller — 3x faster download
```

**What happens without CDN + compression:** Users in geographically distant locations wait 2–4x longer on first load. A user in Southeast Asia loading from a US-East server is a 180–250ms penalty on every network request, multiplied by the number of bundles.

#### Critical CSS Inlined in Shell

The shell's `index.html` contains a small block of critical CSS (layout, header background, loading skeleton colors) **inlined directly in the HTML**. This means the page renders a visible, correct-looking frame while JavaScript is still downloading.

```html
<!-- shell/index.html -->
<head>
  <style>
    /* Critical: layout visible instantly before JS loads */
    body { margin: 0; font-family: 'Inter', sans-serif; }
    .header { height: 60px; background: #222; display: flex; align-items: center; }
    .loading-skeleton { background: #eee; border-radius: 4px; }
  </style>
</head>
```

**What users see without this:**
```
0ms:    Blank white screen
300ms:  Shell JS loads → header appears → layout jumps into place
600ms:  MFE JS loads → content appears

← Users see "flash of unstyled content" and layout shift (bad LCP score)
```

**With critical CSS inlined:**
```
0ms:    HTML arrives → header renders immediately (CSS is in the HTML)
300ms:  Shell JS loads → interactivity activates
600ms:  MFE JS loads → content fills in

← No layout shift, no blank flash, instant perceived performance
```

---

### Subsequent Navigation — Making It Feel Instant Once They're There

After the first load, the user is clicking around the app. The goal shifts: avoid re-downloading anything that hasn't changed.

#### Content Hashing — Bust Only What Changed

Vite automatically appends a content hash to every built file:

```
ProductApp.abc123.js   ← "abc123" is derived from the file's content
CartApp.def456.js
```

When Cart ships a new version, only the Cart bundle gets a new hash. The Product bundle hash doesn't change.

```
Cart team ships new version:
  CartApp.def456.js  → new file CartApp.xyz789.js  ← browser fetches fresh copy
  ProductApp.abc123.js → unchanged hash             ← browser uses cached copy

User only downloads the Cart bundle. Product is served from cache.
```

**Without content hashing:** You'd either use versioned URLs (`/v3.1.0/cart.js`) and need to invalidate CDN caches on every deploy, or use no versioning and users get stale code until their browser cache expires.

#### Long-Term Cache Headers

Because content-hashed files are **immutable** (same hash = same content, always), we set aggressive cache headers:

```
Cache-Control: public, max-age=31536000, immutable
```

This tells the browser: "Cache this forever. It will never change." When a new version ships, it has a new hash and a new URL — the old cached copy is never touched.

#### Service Worker — Instant on Return Visits

**What is a service worker?** A small JavaScript file that runs in the browser background, intercepts network requests, and serves responses from its own cache. Think of it as a local proxy server living inside the browser.

**What we built:**
```js
// shell/public/sw.js

// Strategy 1: remoteEntry.js → Network First
// Always try to get a fresh copy. Fall back to cache only if offline.
if (request.url.includes('remoteEntry.js')) {
  return networkFirst(request)
}

// Strategy 2: /assets/*.js → Cache First
// If we have it, serve it immediately. Don't hit the network at all.
if (request.url.includes('/assets/')) {
  return cacheFirst(request)
}
```

**Why two different strategies?**

| File | Strategy | Reason |
|---|---|---|
| `remoteEntry.js` | Network first | This is the "menu" — it points to the current version of each MFE. Must be fresh so users get new deploys. |
| `/assets/*.js` | Cache first | Content-hashed — same URL = same file forever. Safe to cache aggressively. |

**The full lifecycle:**

```
FIRST VISIT (no service worker cache yet):
  Browser → CDN → shell.js, remoteEntry.js, ProductApp.js downloaded
  Service worker stores all of these in its local cache

RETURN VISIT (next day):
  Browser → service worker intercepts requests
  assets/*.js → served from SW cache instantly (0ms network time)
  remoteEntry.js → checked against network (2KB, fast)

  Result: page loads feel INSTANT. Most bytes come from local cache.

AFTER A NEW DEPLOY:
  remoteEntry.js → network returns new content → SW cache updated
  CartApp.xyz789.js (new hash) → not in cache → fetched from network
  ProductApp.abc123.js (same hash) → still in cache → served instantly

  Result: user gets new Cart immediately; Product loads from cache
```

**What happens without a service worker:**
Every return visit re-downloads all bundles from the CDN. On a slow or unreliable network (3G, spotty WiFi), this makes navigation feel broken. The service worker is what makes the app feel "native" on repeat visits.

---

### Navigation Optimization: Summary

| Problem | Solution | Impact |
|---|---|---|
| Slow first load for distant users | CDN + Gzip/Brotli compression | 3x faster downloads globally |
| Blank screen before JS loads | Critical CSS inlined in shell HTML | Instant visual frame on load |
| Re-downloading unchanged bundles | Content hashing + long-term cache headers | Only changed MFEs re-download |
| Slow navigation on return visits | Service worker cache-first for assets | Near-instant navigation offline or on flaky networks |
| Stale MFE code after deploys | Network-first for `remoteEntry.js` | New versions always propagate |

---

## 8. Communication Between MFEs — The PA System

### The rule
MFEs must **never** directly import from each other. If Product imports from Cart, they become coupled — Cart can't deploy without potentially breaking Product.

### Pattern 1 — Custom Events (what we use)

Think of it as the mall's PA system. Product makes an announcement. The shell hears it and acts.

```js
// product/src/ProductApp.jsx
// After successful POST to backend:
function requestNavigate(path) {
  window.dispatchEvent(new CustomEvent('mfe:navigate', { detail: path }))
}

// On "Add to Cart" success → ask shell to go to /cart
await postAddToCart(item)
requestNavigate('/cart')   ← Product doesn't navigate itself
```

```js
// shell/src/App.jsx — the shell hears the announcement and acts
function NavigationListener() {
  const navigate = useNavigate()
  useEffect(() => {
    window.addEventListener('mfe:navigate', (e) => navigate(e.detail))
  }, [])
}
```

**Why Product doesn't call `useNavigate('/cart')` directly:**
- Product doesn't know Cart exists. It's decoupled.
- Shell owns the router — it's the only one who should push to browser history
- If Cart is renamed to `/checkout` tomorrow, only the shell config changes, not Product

### Pattern 2 — URL State (for data across routes)
```
/cart?from=product&productId=42
```
Survives page refresh. Good for passing lightweight context between MFEs.

### Pattern 3 — Shell Context (for global data)
```jsx
// Shell provides auth to all MFEs
<UserContext.Provider value={{ userId: 1, name: 'Alice' }}>
  <Outlet />
</UserContext.Provider>

// Any MFE reads it
const { userId } = useContext(UserContext)
```
Use for: auth, feature flags, theme. MFE declares a dependency on shell's contract — use sparingly.

### What happens if you allow direct MFE-to-MFE imports
```js
// ❌ Product directly imports from Cart
import CartStore from 'cart/CartStore'

// Now: Cart team can't rename CartStore without breaking Product
// Cart team can't change CartStore's API without coordinating with Product team
// You've recreated the coupling you were trying to escape
```

---

## 9. Routing — Shell Owns the Map

### Structure we built
```
/                    → redirects to /products
/products            → ProductApp list view
/products/:product   → ProductApp detail view  (child route)
/cart                → CartApp list view
/cart/:cart          → CartApp item detail      (child route)
```

### How child routes work
```jsx
// shell/src/App.jsx
<Route path="products">
  <Route index element={<MFESlot name="Product"><ProductApp /></MFESlot>} />
  <Route path=":product" element={<MFESlot name="Product"><ProductApp /></MFESlot>} />
</Route>
```

`/products` and `/products/42` both render `ProductApp`. The MFE reads `:product` param and decides whether to show list or detail view:

```js
// product/src/ProductApp.jsx
const { product } = useParams()

if (product) {
  // show detail for product ID = product
} else {
  // show list
}
```

### Why MFEs use `requestNavigate`, not `useNavigate`
When a remote bundle (MFE) is lazy-loaded, it may not reliably access the shell's Router context. Using `useNavigate` inside a remote MFE can break silently. The safe pattern: MFE fires an event, shell navigates.

---

## 10. Error Isolation — One Store Burns, Mall Stays Open

### The problem without error boundaries
```
Cart MFE throws a JavaScript error
  → React crashes the entire component tree
  → Entire page goes blank
  → User loses their session
  → Product team gets blamed for Cart team's bug
```

### What we built
```jsx
// shell/src/App.jsx
function MFESlot({ name, children }) {
  return (
    <ErrorBoundary name={name}>      // catches any crash inside this MFE
      <Suspense fallback={<div>Loading {name}...</div>}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}

// Each MFE gets its own isolated slot
<MFESlot name="Product"><ProductApp /></MFESlot>
<MFESlot name="Cart"><CartApp /></MFESlot>
```

```jsx
// shell/src/ErrorBoundary.jsx
componentDidCatch(error, info) {
  // Tag by MFE name — in production, send to Sentry/Datadog
  console.error(`[MFE Error] ${this.props.name}:`, error)
}

render() {
  if (this.state.error) {
    return (
      <div>
        ⚠ {this.props.name} failed to load
        <button onClick={() => this.setState({ error: null })}>Retry</button>
      </div>
    )
  }
  return this.props.children
}
```

**Result:**
```
Cart MFE throws a JavaScript error
  → ErrorBoundary catches it
  → Cart slot shows "Cart failed to load" + Retry button
  → Product MFE is completely unaffected
  → User can still browse products
  → [MFE Error] Cart: ... logged with team tag
```

### What happens if you skip error boundaries
One bad deploy from any team brings down the entire app for all users. With 5 MFEs and 5 teams deploying independently, this becomes a near-daily incident.

---

## 11. CSS Isolation — Stores Don't Redecorate Each Other

### The problem
```css
/* cart/src/styles.css */
.button { background: red; }   /* Cart team's button style */
```

Without isolation, this `.button` rule applies to **every** button on the page — including Product's "Add to Cart" button.

### Options and trade-offs

| Approach | How it works | Trade-off |
|---|---|---|
| **CSS Modules** | `.button` becomes `.button_abc123` at build time | Best balance — what to use by default |
| **Shadow DOM** | Each MFE renders in a true browser isolation boundary | Breaks shared fonts and design tokens |
| **CSS-in-JS** | Styles are JS, scoped at runtime | Extra JS weight, runtime cost |
| **BEM + namespace** | `.cart__button` by convention | No tooling, relies on discipline |

**Production recommendation:** CSS Modules for component styles + CSS Variables for design tokens shared from shell:
```css
/* shell injects these globally */
:root {
  --color-primary: #222;
  --font-base: 'Inter', sans-serif;
}

/* Each MFE uses variables, not hardcoded values */
.button { background: var(--color-primary); }
```

---

## 12. Deployment — Each Team Ships on Their Own

### How it works in production
```
Cart team finishes a feature
  ↓
Cart CI pipeline runs: npm run build
  ↓
Uploads dist/ to S3: s3://cdn.example.com/cart/v3.1.0/
  ↓
Updates manifest.json: { "cart": "v3.1.0" }
  ↓
Shell reads manifest.json on next page load
  ↓
Shell now loads CartApp from v3.1.0 automatically
  ↓
Zero coordination with Product team or Shell team needed
```

### Why manifest.json matters
If the shell hardcodes `http://cdn.example.com/cart/v2.0.0/remoteEntry.js`, you need to redeploy the shell every time Cart ships. With a manifest file, Cart updates the manifest and the shell picks it up — no shell redeploy needed.

---

## 13. The Full Journey — What Happens When a User Visits

```
1. User opens browser → hits CDN → gets shell's index.html + shell.js (tiny)
   Service worker registers in background

2. Shell boots:
   - Critical CSS already rendered the header (inlined in HTML)
   - Registers service worker
   - Sets up router
   - Listens for mfe:navigate events

3. User is on / → redirected to /products

4. Shell lazy-loads Product MFE:
   - Fetches remoteEntry.js from localhost:3001 (just 2KB manifest)
   - Fetches ProductApp bundle (actual code, ~80KB, Brotli-compressed to ~24KB)
   - Shared React is already in memory — Product reuses it (0KB for React)

5. ProductApp renders, calls fakestoreapi.com for product list

6. User hovers "Cart" in nav:
   - prefetch.cart() fires → browser starts downloading CartApp bundle in background
   - 200ms head start before the click

7. User clicks a product → /products/1
   - Shell's router updates URL (no page reload)
   - ProductApp reads :product param, fetches product detail

8. User clicks "Add to Cart":
   - ProductApp POSTs to fakestoreapi.com/carts
   - On success: fires mfe:navigate event with '/cart'
   - Shell's NavigationListener catches it → navigate('/cart')

9. Shell renders Cart slot:
   - CartApp bundle already downloaded (from hover prefetch) → instant
   - CartApp renders, fetches cart data

10. If Cart crashes:
    - ErrorBoundary catches it
    - Shows "Cart failed to load" + Retry
    - Product still works fine

11. User closes tab and comes back tomorrow:
    - Service worker serves shell, ProductApp from cache
    - remoteEntry.js checked against network (2KB, fast)
    - Only new/changed bundles re-downloaded
```

---

## 14. Monorepo Orchestration — The Root `package.json`

> This file is **not part of any app**. It is the conductor that tells all three apps when and how to start together.

In this repo, all three apps (`shell`, `product`, `cart`) live side-by-side in a single monorepo. In production, each would likely be in its own repo with its own CI/CD. Here, the root `package.json` replaces that coordination overhead for local development.

### What it contains

```json
// /MFE/package.json
{
  "name": "ecommerce-mfe",
  "private": true,
  "scripts": {
    "install:all":    "npm i --prefix shell && npm i --prefix product && npm i --prefix cart",
    "build:remotes":  "npm run build --prefix product && npm run build --prefix cart",
    "start:product":  "npm run preview --prefix product",
    "start:cart":     "npm run preview --prefix cart",
    "start:shell":    "npm run dev --prefix shell",
    "start": "npm run build:remotes && concurrently \"npm run start:product\" \"npm run start:cart\" \"npm run start:shell\"",
    "dev":   "concurrently \"npm run start:product\" \"npm run start:cart\" \"npm run start:shell\""
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

### Script breakdown

| Script | What it does | When to use |
|---|---|---|
| `install:all` | Runs `npm install` inside each app folder using `--prefix` | First time setup — installs all three apps in one command |
| `build:remotes` | Builds `product` and `cart` into their `dist/` folders | Required before `start`, because shell fetches their `remoteEntry.js` from built files |
| `start:product` | Serves the built `product/dist/` via Vite preview on port 3001 | Used internally by `start` |
| `start:cart` | Serves the built `cart/dist/` via Vite preview on port 3002 | Used internally by `start` |
| `start:shell` | Runs `shell` in Vite dev mode (HMR enabled) on port 3000 | Used internally by `start` and `dev` |
| `start` | Builds remotes first, then launches all three concurrently | **Production-like local run** — shell loads real built MFE bundles |
| `dev` | Launches all three in dev mode simultaneously, no build step | **Fast iteration** — but remotes must already be built |

### Why `build:remotes` runs before `start` but not `dev`

The shell fetches `remoteEntry.js` from product and cart at runtime. In `start` mode, the shell points to the built `dist/` output of each MFE — so they **must** be built first or the shell gets a 404 when trying to load them.

In `dev` mode, you're expected to already have the remotes built (or running their own dev servers). Skipping the build step makes `dev` faster for iteration when you're only changing shell code.

```
npm run start flow:
  1. build product/  → dist/assets/remoteEntry.js created
  2. build cart/     → dist/assets/remoteEntry.js created
  3. serve product/dist on :3001  ← shell will fetch from here
  4. serve cart/dist on :3002     ← shell will fetch from here
  5. run shell on :3000 (dev)     ← HMR active for shell changes
```

### Why `concurrently` lives here, not in shell

`concurrently` is not needed by any app at runtime. It is a **developer tool** that runs multiple terminal processes in one command. It belongs at the monorepo root because:
- No single app owns the responsibility of starting the others
- Shell should not depend on product or cart even at the tooling level
- If teams split into separate repos, each takes their own `package.json` and `concurrently` stays as a root-only concern

### What this file is NOT

- It does **not** share dependencies between apps (each app has its own `node_modules`)
- It does **not** affect the built output — Vite never reads this file
- It is **not** needed in production — it only exists to reduce local dev friction

> In a real multi-repo setup, this file wouldn't exist. Each team would have their own repo, their own CI pipeline, and their own deploy scripts. The root `package.json` is a monorepo convenience that simulates independent deployments locally.

---

## 15. Trade-offs — What to Acknowledge in an Q&A

Bringing up trade-offs unprompted is what separates architect-level thinking from senior-level.

| Trade-off | The real cost | How to mitigate |
|---|---|---|
| **Duplicate React if misconfigured** | Silent 150KB regression per extra copy | `singleton: true` + `peerDependencies` + CI version check |
| **Local dev friction** | 3 terminals, 3 servers, build-before-preview | Root `concurrently` script in `package.json` — `npm run start` boots everything; `npm run install:all` sets up all three apps at once |
| **Integration testing is hard** | Unit tests per MFE are easy. A user flow crossing 3 MFEs needs E2E tests | Playwright for cross-MFE flows |
| **UX consistency drift** | Without a shared design system, buttons look different across MFEs after 6 months | Enforce a shared `@company/ui-kit` package |
| **Network waterfall on first load** | Shell → remoteEntry.js → bundle → render. Multiple round trips. | CDN + Brotli + preload hints + service worker |
| **Version mismatch risk** | MFE upgrades React, shell doesn't — subtle hook breakage | CI compatibility matrix check across all MFEs |

---

## 16. Q&A Answer Checklist

Use this order when answering a system design question about MFE:

- [ ] **Start with the problem** — team coupling, deploy coordination, monolith pain
- [ ] **Draw the layers** — CDN → Shell → MFEs → Shared packages → CI/CD
- [ ] **Explain the shell** — routing, auth, error isolation, no business logic
- [ ] **Explain federation** — remoteEntry.js manifest, lazy loading, singleton deps
- [ ] **Bundle hygiene** — singleton + peerDeps + CI version check, why silent failures are the worst kind
- [ ] **Loading strategy** — eager shell, lazy MFEs, hover prefetch and why each tier exists
- [ ] **Navigation performance** — CDN + Brotli for first load, content hashing + SW for return visits
- [ ] **Communication patterns** — custom events → URL state → shell context (low to high coupling)
- [ ] **Routing ownership** — shell owns history, MFEs fire events
- [ ] **Error isolation** — ErrorBoundary per MFE slot, tagged logging
- [ ] **CSS isolation** — CSS Modules + CSS variables for tokens
- [ ] **Deployment** — per-team CI/CD, S3 + CDN, manifest-driven versioning
- [ ] **Trade-offs** — always bring these up unprompted

### The closing line that lands well
> "The real value of MFE isn't technical — it's organizational. A monolith with 10 teams means every deploy needs a meeting. With MFE, each team ships on their own schedule and the shell just picks up the change. At scale with 50+ teams, that compounds into months of recovered engineering time per year. But none of it works without discipline: shared deps must be pinned, bundles must be lazy, and the shell must stay lean. Skipping any of these turns MFE from a performance win into a performance disaster that nobody notices until it's too late."
