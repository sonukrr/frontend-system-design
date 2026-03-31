# Agoda MFE Platform — Complete Interview Refresher
> System Design Mock Q&A + Curveballs — Read before your interview

---

## 1. Intro & Framing

**Q: Walk me through your background.**

10+ years in frontend engineering. Currently frontend technical architect. Progressed through lead engineer, tech lead, and engineering manager roles. Focus areas: scalable web platforms, performance optimization, developer productivity, and UI systems for B2C and B2B products. 70% hands-on IC, 30% architectural decisions.

**Q: What is this question asking?**

We have a large React monolith shared across many teams. To reduce organizational complexity and enable independent deployments, we need to migrate to a Micro Frontend architecture.

**Key framing to state early:**
> "MFE is not a performance solution. It is an organizational solution. A well-built SPA with hybrid rendering will outperform MFE on pure performance metrics. The benefit of MFE is team autonomy, independent deployments, and clear ownership boundaries."

---

## 2. Requirement Gathering

### Questions to ask the interviewer

**Current state:**
- What is the current structure of the monolith?
- How many teams are committing to the same repo?
- What is the current deployment cycle and what pain points are you seeing?
- What is the current tech stack — frontend, SSR, CI/CD?
- Do you have a BFF layer? What is it doing?
- Do you have a common design system?

**Target state:**
- What TAT do you want for go-live per team?
- Are all teams migrating at once or phased?
- What tech stack do you want to move toward?
- What is your availability and performance SLA?

---

### Agoda context (memorize this)

- **Structure:** Single React monolith. 15 product teams, 120 frontend engineers. All in one repo.
- **Teams:** Hotel search, flights, packages, account, loyalty, payments, coupons, deals — all one app.
- **Deployment:** Fortnightly releases. Any team's bug blocks everyone. 3 rollbacks last quarter.
- **Target TAT:** Each MFE deploys in under 30 minutes. Teams ship independently, same day.
- **Pain points:** Daily merge conflicts, no ownership, shared component changes break others, 3–4 week onboarding, testing one feature requires full app spin-up.
- **Current stack:** React 17, Webpack 4, Jenkins, Node.js BFF, REST APIs. Custom Express SSR — not Next.js.
- **Target stack:** Open — you define it.
- **Migration:** Phased. 2–3 pilot teams first.
- **Design system:** Internal npm component library on React 17.

---

### BFF Layer — what it does

- API aggregation — hotel search hits 6–8 microservices, BFF combines into one frontend-shaped response
- Auth / session management — validates tokens, manages cookies, handles SSO
- SSR — renders initial HTML via `ReactDOMServer.renderToString()`
- Data transformation — backend responses to flat frontend-friendly shapes
- A/B experiment config — injects experiment flags per user
- Edge caching — caches aggregated responses for popular searches

**BFF is also a monolith today.** When you split the frontend into MFEs, decide: one shared BFF or each MFE owns its own BFF slice?

---

### SSR scope today

| Page | Strategy | Reason |
|------|----------|--------|
| Hotel listing `/hotels/bangkok` | SSR | SEO critical |
| Hotel detail `/hotel/name` | SSR | Rich meta, schema markup |
| Landing / destination pages | SSR | SEO |
| Homepage | Hybrid — SSR shell + CSR hydration | Above-the-fold LCP |
| Search results with filters | CSR | User-driven, not indexed |
| Account / profile | CSR | No SEO need |
| Booking / payment | CSR | Transactional |
| Loyalty dashboard | CSR | Personalized |

SSR is done via Express + `ReactDOMServer.renderToString()`. No Next.js. No streaming. All hand-rolled.

---

### NFRs

- Availability SLA: **99.99%**
- Page load: **< 3 seconds**
- INP: **< 100ms**
- LCP: **< 1.8 seconds**
- CLS: **< 0.1**
- Independent deploy TAT: **< 30 minutes**

---

## 3. Why Canary, Not A/B

> "Since we are not adding new features, A/B testing is not appropriate. A/B is for feature optimization. Canary is for deployment safety. I want to roll out to 0.1% of users, measure, then increase progressively."

Traffic split controlled via **Webgate layer** between CDN and UI. `/hotels` goes to monolith, `/new-hotels` goes to MFE. Feature flag controls %. Start 0.1%, increase incrementally. Measure via Prometheus or APM.

---

## 4. MVP Scope

**Chosen MFEs:** Coupons and Deals — low traffic, low payment risk, good for learning.

**Phased approach:**
- Phase 1: Simple project split. No stack change. React + Node.
- Phase 2: Harden contracts, versioning, observability.
- Phase 3: Scale to remaining 13 teams.

---

## 5. High Level Design

```
User → CDN → Webgate → Shell App → MFEs (Coupons / Deals)
```

### Three apps

**Shell (Host):**
- Authorization and session context
- App-level routing
- Shared navbar
- Error boundaries per MFE slot
- Shared npm packages (React, React Router, Design System)
- Lazy loads MFEs on demand
- Listens to `mfe:navigate` events
- Fetches MFE manifest at runtime to resolve remoteEntry URLs

**Coupons MFE (Remote):**
- Owns full coupon lifecycle
- CSR only
- Exposes `./CouponsApp` via Module Federation

**Deals MFE (Remote):**
- Owns full deals lifecycle
- SSR via separate Node/edge server for SEO-critical pages
- Exposes `./DealsApp` via Module Federation

---

## 6. Module Federation

**Tool:** Vite + `@originjs/vite-plugin-federation`

**Shell (host):**
- Declares remotes pointing to each MFE's `remoteEntry.js`
- Lazy loads: `import('coupons/CouponsApp')` and `import('deals/DealsApp')`

**Remotes:**
- Expose their app component
- Declare shared deps but do not load them eagerly

**Shared dependencies:**
- `react`, `react-dom`, `react-router-dom`
- Shell: `singleton: true`, `eager: true`
- Remotes: shared, not eager, declared as `peerDependencies`
- Prevents duplicate React — one instance at runtime

---

### Webpack Module Federation vs Vite Federation — key differences

| | Webpack MF | Vite Federation (`@originjs`) |
|--|-----------|-------------------------------|
| Maturity | Production-proven, widely used | Newer, less battle-tested |
| Build output | CommonJS + ESM | ESM only |
| HMR support | Strong | Limited in federation mode |
| Config API | More flexible | Simpler but fewer options |
| SSR support | Better documented | Limited |
| Ecosystem | Larger — more community solutions | Smaller |

**Why Vite here:** Teams are moving away from Webpack 4. Vite gives faster dev builds and modern ESM output. For MVP with Coupons and Deals (CSR only), Vite Federation is sufficient. For SSR-heavy MFEs later, may need to revisit Webpack MF or a framework like Next.js with its own federation support.

---

## 7. Routing Strategy

**Cross-MFE navigation** (Coupons → Deals):
- MFE fires `mfe:navigate('/deals')` custom browser event
- Shell listens and updates the route
- Why not History API? History API triggers full page reload and re-downloads bundles. Custom events keep navigation within the SPA.

**Internal MFE navigation** (Coupons → Coupons detail):
- Managed by the MFE itself via React Router
- Shell is not involved

**Browser back/forward:**
- Shell manages the History API — pushes state on every navigation
- Back/forward triggers `popstate` event — shell reads the URL and loads the correct MFE
- Each MFE reads its own route params from the URL on mount
- This ensures deep links and browser history work correctly

---

## 8. Auth & Shared User Context

- Auth via **HTTP-only cookies** — JWT token sent with every API call
- Shell makes one `/me` call on load, shares via shared module or event
- **At scale (15 MFEs):** Request deduplication — shell fetches once, result shared. Prevents 15 parallel `/me` calls.
- No shared global Redux/Zustand store — global state is a conscious trade-off. Backend is source of truth.
- Cart count lives in shell state (header is shell-owned). MFEs fire `cart:updated` event. Shell updates header. No direct MFE-to-MFE coupling.

Eg:
Step 1: The Shell fetches the user data from the BFF.

Step 2: Once the data arrives, the Shell dispatches a CustomEvent:

```JavaScript
const event = new CustomEvent('user:authenticated', { detail: userData });
window.dispatchEvent(event);
Step 3: MFEs attach a listener in their root component's useEffect or onMount hook:
window.addEventListener('user:authenticated', (e) => setUser(e.detail));
```
- Catching latecomers: If an MFE loads after the event fired, the Shell usually stores the data in window.__USER_CONTEXT__ as a fallback so the MFE can read it immediately on mount.

---

## 9. Versioning & Manifest

- `remoteEntry.js` is the manifest per MFE (~2KB)
- Shell fetches at **runtime**, not build time
- Lives on CDN: `https://cdn.agoda.com/mfe-manifest.json`
- Each MFE CI/CD pipeline writes its entry to manifest on deploy
- CDN cache for `remoteEntry.js` purged on each deploy

**Breaking change protection:**
- Intentional: Never rename exposed module. Add new → migrate shell → remove old.
- Unintentional: Contract manifest (protected file per MFE). CI verifies new output against contract. Build fails if contract broken.

**Manifest CDN down — fallback:**
- Shell has hardcoded fallback URL per MFE
- Service worker caches last known good remoteEntry
- Graceful degradation — serve cached version, not blank page

---

## 10. CI/CD Per MFE

Each MFE has independent pipeline (Jenkins + Kubernetes):

```
merge → build → unit tests → contract validation → 
dependency compatibility check → upload dist/ to CDN/S3 → 
update manifest → purge CDN cache for remoteEntry.js
```

Shell does not redeploy when an MFE ships. That is the whole point.

---

## 11. SSR Strategy

| MFE | Strategy | Reason |
|-----|----------|--------|
| Deals landing pages | SSR via separate Node/edge server | SEO, LCP |
| Coupons | CSR | Session-driven, not indexed |

**How SSR + shell coexist:**
- Webgate routes `/deals` to SSR service, `/coupons` to SPA shell
- No composing SSR fragments inside a CSR shell — avoids hydration mismatch and layout shift
- Route-level ownership: Deals SSR server owns its full HTML response
- Initial data injected: `window.__INITIAL_DATA__ = {...}` to avoid refetch on hydration

---

## 12. Observability & Monitoring

- Every MFE wrapped in ErrorBoundary — catches crashes, shows retry UI, isolates failure
- Errors tagged with MFE name and version
- Correlation IDs passed through all requests for end-to-end tracing
- Centralized logging — all MFEs emit to same pipeline
- Core Web Vitals tracked per MFE route
- Prometheus / APM for traffic, latency, error rate per MFE

---

## 13. Shell Bootstrap Failure

**What happens if the shell itself fails to load?**

- CDN serves a minimal fallback HTML — static error page with retry button
- Service worker (if registered from a previous visit) can serve the cached shell
- Critical: shell must be the most stable, least-changing part of the system
- Shell should have its own independent health monitoring and rollback pipeline separate from MFEs
- Shell deploys should be treated as high-risk — require additional approval gates

---

## 14. MFE Granularity — How Small Is Too Small?

**Micro vs Macro Frontend split:**

| Granularity | Too Fine | Too Coarse |
|------------|----------|------------|
| Example | One MFE per UI component | One MFE for entire hotel vertical |
| Problem | Explosion of remoteEntry files, version management nightmare, network overhead | Back to mini-monolith, teams still coupled |
| Sweet spot | One MFE per product domain / team boundary | |

**Rule of thumb:** One MFE per team. Team owns a vertical slice of the product — from UI to BFF to backend API. If two teams need to modify the same MFE regularly, it is probably too coarse. If one team owns 5 MFEs, they are probably too fine.

For Agoda: each of the 15 product teams owns one MFE. Hotel search, hotel detail, account, loyalty, coupons, deals — each a separate MFE.

---

## 15. MFE Approaches — Why Module Federation Over Alternatives

### iFrame-based MFE
- Strongest isolation — completely separate browsing context
- Use when: embedding third-party content, strong security boundaries needed (payments in iframe)
- Why not here: poor UX (scrolling, focus management, resize complexity), no shared state, no shared styling, SEO invisible

### Web Components
- Framework-agnostic — works across React, Vue, Angular
- Use when: teams use different frameworks and you need a neutral boundary
- Why not here: Agoda is all React. Web Components add complexity (shadow DOM, custom element lifecycle) with no benefit when everyone is on the same framework. Module Federation is simpler and more powerful within a React ecosystem.

### npm packages (shared component library)
- Not MFE — this is just a design system
- No independent deployment — consumers must update their dependency and redeploy
- Use for: shared UI components, utilities, design tokens

### Single-SPA framework
- Orchestrator for multiple SPAs
- More opinionated than Module Federation
- Module Federation is preferred because it is more lightweight and integrates naturally with Vite/Webpack build tooling

### Module Federation (chosen)
- Runtime composition — shell loads MFE bundles at runtime, not build time
- Independent deploy without shell redeploy
- Shared dependencies — no duplicate React
- Best fit for: same-framework teams, runtime composition, independent deploys

---

## 16. Synchronous vs Asynchronous MFE Loading

| | Synchronous | Asynchronous (chosen) |
|--|-------------|----------------------|
| Load timing | All MFEs loaded on shell init | MFE loaded on demand when route is hit |
| Initial load | Slow — loads everything upfront | Fast — shell boots immediately |
| UX | No loading state needed | Need loading skeleton per MFE |
| Use case | Very small MFEs with tiny bundles | Standard — most production MFE systems |

**With prefetching:** asynchronous loading + hover prefetch gives near-synchronous feel without the upfront cost.

---

## 17. Bundle Size Enforcement

- Each MFE has a **bundle size budget** enforced in CI
- Vite build fails if output exceeds budget (e.g., Coupons MFE: 100KB uncompressed)
- Shared deps (React, Router) not counted against MFE budget — they are loaded by shell
- `bundlesize` or Vite's built-in `chunkSizeWarningLimit` used for enforcement
- Regular audits via `webpack-bundle-analyzer` equivalent for Vite

---

## 18. Performance — Module Federation Runtime Cost

When shell and MFE negotiate shared dependencies at runtime:

1. Shell loads, registers shared scope with its React version
2. MFE `remoteEntry.js` loads, checks shared scope
3. If versions are compatible → reuses shell's React. Zero extra cost.
4. If versions are incompatible → MFE loads its own React. **Duplicate React in memory. Both instances run.**

**Cost of negotiation itself:** ~5–10ms per MFE on first load. Negligible. The real cost is duplicate bundle loading if versions drift.

**Mitigation:**
- CI dependency compatibility check before deploy
- Pin React version across all MFEs via shared platform standards
- `singleton: true` in Module Federation config forces one instance and throws warning on mismatch

---

## 19. Trade-offs Summary

### MFE vs Single SPA
| | MFE | Single SPA |
|--|-----|------------|
| Deployments | Independent | Coupled |
| Failure isolation | Yes | No |
| Cross-app coordination | Harder | Easier |
| Duplicate logic | Yes — auth, data fetching | Shared naturally |
| Team autonomy | High | Low |

### Monorepo vs Polyrepo
- At 15 teams, autonomy outweighs central control → **Polyrepo**
- Shared standards and tooling enforce consistency
- Platform team maintains shared npm packages (design system, shared utils, MFE template)

### Event bus vs shared state
- Events preserve MFE independence
- Weaker consistency — accepted trade-off
- Backend is source of truth — compensates for lack of shared client state

### Canary vs A/B
- Canary for migration safety. A/B for feature optimization. Different tools for different problems.

---

## 20. Evolution — 2 MFEs to 15

### What breaks and how to fix it

**1. Duplicate data fetching at scale**
- 15 MFEs × `/me` call = 15 parallel backend hits on page load
- Fix: Shell fetches once, shares via shared module with request deduplication

**2. Version and dependency drift**
- Teams independently update React or API contracts. Works in isolation, breaks at runtime.
- Fix: Singleton shared deps, peerDependencies, CI compatibility checks, versioned APIs with backward compatibility

**3. Debugging and observability**
- At 2 MFEs: manual tracing works. At 15: impossible.
- Fix: Correlation IDs, centralized logging, every request tagged with MFE name + version

**4. Platform team becomes a bottleneck**
- All 15 teams asking platform team for shell changes, manifest updates, design system questions
- Fix: Self-service MFE onboarding template, documented contracts, automated CI gates. Platform team focuses on platform — not hand-holding.

**5. Design system upgrades**
- Upgrading design system requires coordination across 15 teams
- Fix: Semantic versioning, deprecation warnings in old versions, migration guides, teams upgrade on their own schedule within a defined window

---

## 21. Grilling Questions — Standard

**Q: Your shell loads MFEs lazily. What happens to LCP if the shell itself is heavy?**

Shell must be minimal — routing, navbar, error boundaries only. No business logic. Target shell bundle under 50KB. Critical CSS inlined. Shell's job is to boot fast and get out of the way.

**Q: How do you handle the design system upgrade across 15 MFEs?**

Design system is a peerDependency. Upgrades are opt-in. Breaking changes are versioned. Teams migrate on their own schedule. Shell pins a minimum version. CI enforces compatibility floor.

**Q: How do you prevent a rogue MFE from importing a different React version?**

Module Federation singleton config enforces one React instance. If remote tries mismatched version, MF uses shell's version. CI dependency check catches drift before deploy.

**Q: How do you test an MFE in isolation vs integrated?**

Isolation: MFE runs standalone with mock shell (stub events, auth, routing). Integration: E2E tests against full composed app in staging where all MFEs are deployed.

**Q: Your canary is at 0.1%. How long before increasing?**

Minimum 24–48 hours at each stage to capture full day/night traffic patterns. Gate on: error rate < baseline, LCP within target, no P1 alerts. Automate promotion via feature flag if gates pass.

**Q: What is your rollback strategy?**

Rollback is a CDN operation — point manifest back to previous `remoteEntry.js` URL and purge CDN cache. No shell redeploy. Target: under 5 minutes. Webgate feature flag can also cut traffic back to monolith instantly.

**Q: How do you onboard a new team?**

Platform team maintains a starter template — pre-configured Vite + Module Federation + CI/CD + contract manifest. Team clones template, registers remoteEntry URL in manifest, they are unblocked. Platform owns shell. Product teams own their MFEs.

---

## 22. Curveball Questions — Be Ready For These

**Q: Your MFE loads fine locally but breaks in production. How do you debug?**

Systematic approach:
1. Check if `remoteEntry.js` is resolving correctly in production — URL, CDN cache, CORS headers
2. Check browser console for Module Federation shared scope negotiation errors
3. Check if shared dependency versions match between shell and MFE in production builds
4. Check network tab — is the MFE bundle loading? Is it the right version?
5. Correlation ID — trace the error through centralized logging to find which layer failed
6. Common culprit: environment variables baked into the bundle at build time are different between local and production. Check all `VITE_` env vars.

**Q: Two teams want to own the same UI component — how do you resolve ownership conflicts?**

This is an organizational problem, not a technical one. Three options:
1. Component belongs to the design system team — both MFEs consume it as a shared npm package. Use when component is truly generic.
2. Component belongs to the team whose domain it represents — other team consumes it as a dependency or via the MFE's exposed API. Use when component has clear domain ownership.
3. Each team has their own version — diverge intentionally. Use when teams have genuinely different requirements and forcing sharing creates more coupling than value.

Rule of thumb: if you find yourself debating ownership, the component is probably generic enough to live in the design system.

**Q: A senior engineer says MFE is over-engineering. How do you convince them?**

Don't argue about technology — argue about the pain. "How many times this quarter did your team's deploy get blocked by another team's bug? How long did it take to onboard your last hire? How often do you see merge conflicts on files your team doesn't own?" MFE solves those problems. If those problems do not exist, MFE is over-engineering. If they do, it is the right tool.

**Q: Your shell is down. Do all MFEs go down?**

Yes — in a composition model, shell down means users cannot access the composed app. This is why:
- Shell must be the most stable, least-changing part of the system
- Shell has its own SLA, independent monitoring, and rollback pipeline
- Service worker caches shell for returning users — they get a cached shell even if origin is down
- CDN serves shell's static assets — shell origin being down does not mean CDN is down
- For new users during shell outage: CDN fallback page with status message

**Q: How do you handle MFE routing with browser back/forward navigation?**

Shell manages the History API. Every navigation pushes a state entry. Back/forward fires `popstate` — shell reads the URL and loads the correct MFE. Each MFE reads its own route params from URL on mount. Deep links work because the URL is always the source of truth, not in-memory state.

**Q: What happens to SEO if MFE navigation does not update the URL?**

It breaks SEO and user experience. Every navigation must update the URL via History API `pushState`. Google crawls URLs — if `/deals/summer-sale` is not a real URL, it will not be indexed. Shell is responsible for ensuring URL updates on every `mfe:navigate` event. MFEs must also update the URL for their internal routes. This must be tested explicitly — a missing `pushState` call is a silent bug that only shows up in analytics or SEO audits weeks later.

**Q: How do you do end-to-end testing when MFEs deploy independently?**

Three layers:
1. **MFE-level E2E:** Each MFE has its own E2E suite that runs against it in isolation using a mock shell. Runs on every MFE deploy.
2. **Composition E2E:** A shared E2E suite runs against the fully composed app in a staging environment. Runs nightly or before major releases. Uses pinned versions of all MFEs.
3. **Contract tests:** Each MFE's exposed API is contract-tested — shell verifies it can load and mount each MFE correctly. Runs in CI before every MFE deploy.

The key insight: you cannot run full integration tests on every deploy of every MFE — too slow. Contract tests catch interface breakage fast. Full E2E catches integration issues on a slower cycle.

**Q: Design system team wants to drop React and move to Web Components. How does that affect your MFE platform?**

This is a significant migration but not catastrophic if handled correctly:
1. Web Components work in React — React can render custom elements. Short-term: design system ships both React wrappers and native Web Components. MFEs consume React wrappers while migration happens.
2. Module Federation still works — Web Component-based MFEs can be federated just like React ones.
3. Long-term: if all MFEs migrate to Web Components, Module Federation becomes less necessary for shared dep management (no React to deduplicate). Composition model remains the same.
4. Risk: React 19+ has improved Web Component support. Timing matters — align migration with React version upgrades.

**Q: How do you handle authentication token expiry inside an MFE?**

Token expiry is a cross-cutting concern — shell owns it:
1. Shell has a token refresh interceptor in a shared HTTP client module
2. All MFEs use the shared HTTP client (exposed as a shared module via Module Federation)
3. On 401 response: shared client triggers token refresh, queues pending requests, retries after refresh
4. On refresh failure: shell fires `auth:session-expired` event, shell redirects to login
5. MFEs never handle token refresh themselves — they delegate to the shared HTTP client

**Q: What if two MFEs need to load at the same time on a single page — e.g. a page with both a Coupons widget and a Deals widget side by side?**

Module Federation supports this — shell lazy-loads both simultaneously:
```
Promise.all([import('coupons/CouponsWidget'), import('deals/DealsWidget')])
```
Both remoteEntry files load in parallel. Shared deps (React) negotiated once and reused. Each MFE renders independently. Error boundaries isolate each widget — one crashing does not affect the other. The key constraint: each MFE must be designed to work as a widget (no assumptions about owning the full page, no full-page routing).

---

## 23. Bundle Hygiene — The 3-Step System (Often Asked Deep)

Duplicate dependencies are the **silent killers of MFE performance**. They don't cause errors. They don't throw warnings. They just quietly add hundreds of KB to every page load.

### Step 1 — `singleton: true` in Module Federation

```
Shell boots → loads React 18 → registers in shared scope
Product MFE boots → "does anyone have React ^18.2.0?" → reuses shell's copy → 0KB
Cart MFE boots → same check → reuses shell's copy → 0KB

Result: 150KB React loaded once. Not 450KB.
```

- Shell sets `eager: true` — React is in shell's initial bundle, available immediately
- MFEs do NOT set `eager: true` — they wait for shell to provide React
- **Why MFEs must NOT set eager:** If an MFE also sets `eager: true`, it races the shell on startup and risks two React instances loading simultaneously

### Step 2 — `peerDependencies` in each MFE's `package.json`

Runtime sharing alone is not enough. A developer might accidentally `npm install react` in an MFE repo and Vite will happily bundle its own React copy, bypassing the shared config entirely.

`peerDependencies` is the build-time lock:
- Declares "I will NOT bundle React — I expect the shell to provide it"
- Without this: silent 150KB duplicate ships to every user. No warning. No error.
- With this: if shell doesn't provide it → loud runtime error, not silent bloat

### Step 3 — CI Version Compatibility Check

Even with `singleton: true`, if an MFE requires React 19 but shell provides React 18, Module Federation silently uses shell's version. MFE may break in subtle ways — hooks that work in React 19 failing in React 18.

CI check validates version compatibility across all MFEs before merge. Pipeline blocked if incompatible.

### The worst consequence of skipping all three

Two React instances running simultaneously means **`useContext` stops working across MFE boundaries**. Auth context, themes, and any shared context silently stop propagating to MFEs. This is the hardest bug to debug because everything looks correct locally.

---

## 24. Communication Patterns — Low to High Coupling

Use in this order. Only go higher coupling when the lower pattern cannot solve the problem.

| Pattern | How | Coupling | Use for |
|---------|-----|----------|---------|
| Custom events | MFE fires `mfe:navigate`, shell listens | Lowest | Cross-MFE navigation, cart updates, notifications |
| URL state | `/cart?from=product&productId=42` | Low | Passing lightweight context between MFEs, survives refresh |
| Shell context | `UserContext.Provider` wrapping `<Outlet />` | Medium | Auth, feature flags, theme — things every MFE needs |
| Shared module via MF | Shell exposes a shared HTTP client or store | Higher | Request deduplication, token refresh logic |

**Never allow direct MFE-to-MFE imports.** If Product imports from Cart, Cart cannot rename or refactor without breaking Product. You've recreated the coupling you were trying to escape.

---

## 25. CSS Isolation Options

| Approach | How it works | Trade-off |
|----------|-------------|-----------|
| CSS Modules (recommended) | `.button` becomes `.button_abc123` at build time | Best balance — use by default |
| Shadow DOM | Each MFE in a true browser isolation boundary | Breaks shared fonts and design tokens |
| CSS-in-JS | Styles are JS, scoped at runtime | Extra JS weight, runtime cost |
| BEM + namespace | `.cart__button` by convention | No tooling, relies on discipline |

**Production recommendation:** CSS Modules for component styles + CSS Variables for design tokens from shell. Each MFE uses the variables, not hardcoded values. Shell controls the token values globally.

---

## 26. Service Worker Caching Strategy

Two different strategies for two different file types:

| File | Strategy | Why |
|------|----------|-----|
| `remoteEntry.js` | Network first | Must be fresh — points to current MFE version. Stale = user gets old deploy. |
| `/assets/*.js` | Cache first | Content-hashed — same URL = same file forever. Safe to cache aggressively. |

**Full lifecycle:**
- First visit: all files downloaded from CDN, service worker stores them in local cache
- Return visit: assets served from SW cache instantly (0ms network). remoteEntry checked from network (2KB, fast).
- After new MFE deploy: remoteEntry has new content → SW cache updated → only new bundle fetched. Unchanged MFEs still served from cache.

**Why this matters in an interview:** Without service worker, every return visit re-downloads all bundles. On mobile or slow networks, this makes navigation feel broken. Service worker is what makes MFE feel native on repeat visits.

---

## 27. Loading Strategy — Three Tiers

| Tier | What | When loaded | Why |
|------|------|-------------|-----|
| Eager | Shell only | Immediately on page open | Tiny — just frame, nav, router. Must be instant. |
| Lazy | MFE bundle | When user navigates to that route | Only download what the user actually visits |
| Prefetch | MFE bundle | On hover, before click | 200–400ms between hover and click = enough time to finish download |

**Shell bundle must stay tiny.** If shell accidentally bundles an MFE, every user pays that cost before seeing anything. Target shell bundle under 50KB. No business logic in shell.

**Prefetch math:** Average hover-to-click: 200–400ms. Average 60KB bundle download on broadband: 100–200ms. Download finishes before click lands → zero-wait navigation.

---

## 28. Cross-Framework Migration — Angular Monolith to React MFE (Your Real Work)

This is your lived experience. Use "in my current migration we solved this by..." — it lands differently than theory.

---

### The Problem

Angular 16 monolith. Multiple business flows — Job Dashboard, Settings, Requisition, Interview Scheduling, Talent Pool, WhatsApp Integration. Significant shared component library. Goal: migrate to React incrementally without a big bang rewrite, while preparing for a future MFE architecture.

---

### The Strategy — Strangler Fig Pattern

Don't rewrite. Strangle the monolith incrementally. New flows go to React. Old flows stay in Angular until they are worth migrating. Angular shell is deprecated last, not first.

**Four phases:**
1. Foundation — React repo, Nginx routing, Web Component bundling working
2. Parallel development — new features in React, strategic component migration
3. Flow migration — migrate one complete flow as pilot, evaluate, refine
4. MFE — split into independently deployable micro-frontends, deprecate Angular shell

---

### Three Integration Patterns — Know When to Use Each

**Pattern 1: Nginx Routing — for complete new flows**

```
User hits /new-flow → Nginx → React App
User hits /insights → Nginx → Angular App
```

- Full isolation between Angular and React
- Independent deployments
- Clean separation
- Trade-off: shared state across apps needs explicit strategy (session storage + custom events)
- Use when: building a complete new flow or migrating an entire page

**Pattern 2: Web Components — for widgets inside Angular pages**

- React component wrapped as a Web Component, bundled and loaded into Angular template
- Framework-agnostic — Angular just sees a custom HTML element
- Enables gradual component migration without touching Angular routing
- Trade-off: **React runtime is bundled into Angular's bundle** — Angular bundle size increases. This is the cost you consciously accept in Phase 1 to move fast.
- Props and events require serialization across the boundary
- Use when: a shared UI widget needs to live inside an existing Angular page today

**Pattern 3: Module Federation — for high-traffic shared components**

- React app exposes components as remote entry
- Angular app loads them at runtime via dynamic import
- React runtime loaded once and shared — no duplication
- Trade-off: more complex build setup, network overhead for remote loading
- Use when: a component is used across many Angular pages and Web Component bundle bloat is unacceptable

---

### Pattern Selection Matrix

| Use Case | Pattern | Why |
|----------|---------|-----|
| New complete flow | Nginx Routing | Full isolation, clean architecture |
| Shared UI widget in existing Angular page | Web Component | Works within existing pages today |
| High-traffic component used everywhere | Module Federation | Avoid bundle bloat, lazy load |
| Experimental feature | Nginx Routing | Easy to remove or change |
| Form library used across many features | Module Federation | Shared across many features |

---

### State Sharing Across Framework Boundary

- **Auth / user context:** Session storage, synced via custom events between Angular and React
- **Feature state:** Isolated within each framework. Angular uses NgRx/Services. React uses Zustand.
- **Cross-boundary communication:** Custom events or shared API calls
- **Never:** Direct state sharing between Angular and React

---

### Decision — React vs Angular for New Work

- Bug fix in existing code → stay in Angular
- New complete flow → React via Nginx routing
- New component used across many Angular pages → Web Component or Module Federation
- New component with long lifespan (2+ years) → React
- Temporary or experimental feature → Angular (less investment)

---

### Hard Interview Questions on This — Be Ready

**Q: How do you handle routing ownership during transition? Who owns the nav?**

Nginx owns the top-level routing — it decides which app gets the request based on the URL prefix. Angular Router owns routing within Angular pages. React Router owns routing within React pages. Shared nav (header, sidebar) is a Web Component built in React and embedded in the Angular shell — so it renders consistently on both sides. When the Angular shell is eventually deprecated, the nav becomes part of the React shell.

**Q: How do you avoid two copies of React — one in Web Components, one in the React app?**

In Phase 1 with Web Components, you cannot fully avoid it — the React runtime is bundled into each Web Component. This is an accepted trade-off for early phase speed. The solution is Phase 3: Module Federation. React remote exposes components, Angular loads them at runtime from the same React bundle. One React runtime, shared across both apps. Web Components are phased out as Module Federation matures.

**Q: How do you handle auth token sharing between Angular session and React pages?**

Auth state lives in session storage and HTTP-only cookies. Both Angular and React read from the same cookie on API calls. For user context (name, role, permissions), Angular writes to session storage on login. React reads from session storage on mount. Custom events notify across the boundary if session expires or user context changes.

**Q: What is the exit condition for the Angular shell? When do you deprecate it?**

Angular shell is deprecated when: all flows have been migrated to React, the shared nav Web Component has been replaced by a React shell component, and Module Federation composition is stable in production. This is Phase 4. We do not set a calendar date — we set a migration completeness threshold: when less than 10% of user traffic is hitting Angular-owned routes, we plan the deprecation sprint.

**Q: What happens to the Angular design system during migration?**

Angular has its own component library. React uses Tailwind + new React components. During migration, we accept temporary visual inconsistency as a trade-off for migration speed. Shared design tokens (colors, spacing, typography) are extracted into CSS variables consumed by both frameworks. Long term, the React component library becomes the single source of truth and Angular components are deprecated with their flows.

**Q: How do you measure if the migration is working?**

Metrics tracked per phase:
- React bundle size < 300KB
- TTI < 3 seconds
- FCP < 1.5 seconds
- Web Component load time < 200ms
- Lighthouse scores before and after each flow migration
- Developer velocity — time to ship a new feature in React vs Angular
- Incident rate per framework — are React pages more or less stable than Angular pages?

---

> "The real value of MFE is not technical — it is organizational. A monolith with 15 teams means every deploy needs coordination. With MFE, each team ships on their own schedule and the shell picks up the change automatically. At scale, that compounds into months of recovered engineering time per year. But none of it works without discipline: shared deps must be pinned with singleton and peerDeps, bundles must be lazy, the shell must stay lean, and contracts must be versioned. Skip any of these and MFE turns from an organizational win into a performance and debugging disaster that nobody notices until it is too late."

---

## 29. One-liners to Remember

- "MFE is an organizational solution, not a performance solution."
- "The shell should be boring — routing, error boundaries, composition. Nothing else."
- "Backend is the source of truth. Global client state is a trade-off we consciously accept."
- "Canary for migration safety. A/B for feature optimization. These are different tools."
- "Independent deploy means the shell must never need to redeploy for an MFE change."
- "Contract manifest prevents accidental breaking changes. Deprecation pattern prevents intentional ones."
- "SSR and MFE are in tension. Resolve it with route-level ownership at MVP, not fragment composition."
- "If two teams are debating ownership of a component, it probably belongs in the design system."
- "Shell down is a P0. Treat shell deploys like infrastructure changes, not feature releases."
- "The URL is always the source of truth. If navigation does not update the URL, you have a bug."
- "Module Federation singleton: one React, one source of truth, no duplicate instances."
- "Two React instances means useContext silently stops working. Auth context dies. Nobody notices until production."
- "peerDependencies is the build-time lock. singleton is the runtime lock. You need both."
- "Never allow direct MFE-to-MFE imports. The moment you do, you have recreated the coupling you were trying to escape."
- "remoteEntry is network-first. Assets are cache-first. These are different files with different staleness requirements."
- "Eager only on shell. Never on MFEs. If an MFE sets eager, it races the shell and risks two React instances."

---

*Good luck tomorrow, Ashish. You've got this.*