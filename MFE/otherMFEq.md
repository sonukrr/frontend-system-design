This is the comprehensive, **Staff-level Interview Guide** for Micro Frontend (MFE) Architecture. It covers the full lifecycle—from rendering and performance to scaling 15+ teams and dynamic discovery.

***

# 📘 The Staff Engineer’s MFE Interview Guide

## 1. Rendering & Performance Strategy

### **Q: When should an MFE use SSR (Server-Side) vs. CSR (Client-Side)?**
**A:** We use a **hybrid strategy** based on the route's purpose.
* **SSR:** Reserved for SEO-critical, high-traffic landing pages (e.g., "Deals"). It optimizes for **LCP** (Largest Contentful Paint) and ensures search engines index the content immediately.
* **CSR:** Used for authenticated, highly interactive tools (e.g., "User Profile," "Internal Coupons"). This saves server costs and provides a fluid SPA experience.
**Staff Nuance:** Mention that you maintain an **Isomorphic Contract** (using `typeof window` guards and `window.__INITIAL_DATA__`) so the Shell can toggle between modes without code changes.

### **Q: How do you prevent the "Flash of Unstyled Content" (FOUC) in SSR?**
**A:** By inlining **Critical CSS** in the HTML `<head>`. During the server-side `renderToString` pass, a **Style Collector** (like Styled Components' `ServerStyleSheet` or Emotion’s cache) extracts the CSS for the rendered components and injects it as a `<style>` block. This ensures the page is fully styled before the JavaScript even begins to download.


---

## 2. Scaling & Governance (15+ Teams)

### **Q: How do you stop 15 MFEs from making 15 parallel `/me` API calls on load?**
**A:** We use **Request Deduplication** via a **Shared Singleton Service**.
* **The Fix:** Instead of returning raw data, the service returns a **Promise**. When the first MFE calls `getUser()`, the service initiates the fetch and stores the "in-flight" Promise. All subsequent calls from other MFEs receive that same pending Promise.
* **The Result:** 15 code-level calls collapse into **1 network request**, preserving browser concurrency for other critical assets.


### **Q: How do you handle Design System upgrades without a "UI Mismatch"?**
**A:** We treat the Design System as a set of **Global Tokens (CSS Variables)**.
1.  **Centralization:** The Shell injects a global `:root` stylesheet with variables like `--ds-brand-primary`.
2.  **Instant Update:** If the brand changes from Blue to Red, we update the variable in the Shell, and all 15 MFEs reflect the change instantly without a redeploy.
3.  **Versioning:** For major breaking logic, we use **Sub-path Versioning** (e.g., `@ds/v3`) and provide **Codemods** to automate the migration for feature teams.

---

## 3. Dynamic Discovery & Orchestration

### **Q: How do you add new MFEs without redeploying the Shell's code or config?**
**A:** We shift from **Static Configuration** to a **Dynamic Discovery Pattern**.
* **The Manifest:** We host a `manifest.json` on a CDN that acts as a service registry (mapping MFE names to their `remoteEntry.js` URLs).
* **Build-time:** In the Shell's Vite/Webpack config, we use a **Promise-based Remote** that resolves URLs from a global variable at runtime.
* **Runtime:** The Shell's `App.js` uses a **Generic MFE Wrapper**. When a user hits a new route, the Shell looks up the remote in the manifest and injects the script on the fly.


### **Q: What is the technical difference between Module Federation and Script Injection?**
**A:** Script injection is just "loading a file." **Module Federation** is a **Runtime Orchestrator**.
* **Deduplication:** MF ensures that if 5 MFEs use React 18, the browser downloads it **only once**.
* **Version Negotiation:** It handles semantic versioning (SemVer) at runtime, preventing crashes if a remote needs a different version of a library than the host provides.


---

## 4. Quality & Observability

### **Q: How do you ensure a shared MFE (like a Header) doesn't break other pages?**
**A:** We implement **Playwright Visual Regression Testing**.
* **Golden Images:** We maintain baseline screenshots for every MFE.
* **CI Gates:** Any change that causes a pixel-mismatch (e.g., a button shifting 2px) fails the build.
* **Dockerization:** We run these tests in **Docker** to ensure consistent font and pixel rendering between local developer machines and the CI environment.


### **Q: How do you debug errors across a distributed MFE setup?**
**A:** We enforce **Correlation IDs** and **MFE Metadata tagging**. Every request is tagged with the `mfe_name` and `mfe_version`. Using centralized tracing (OpenTelemetry), we can trace a single user click from the Shell, through the MFE container, and down to the specific backend microservice that failed.

---

## 5. The "Staff" Perspective

### **Q: How does a Platform Team avoid becoming a bottleneck?**
**A:** By moving from "Active Management" to **"Self-Service Governance."**
* **Automation:** Provide CLI templates for new MFE onboarding.
* **Contract Testing:** Use automated CI gates to validate manifest updates so the Platform Team doesn't have to manually review every MFE deployment.
* **Focus:** The Platform Team focuses on the "Engine" (Orchestration, Performance, Theming), while feature teams own their "Driver's Seat" (Product Logic).

***

**Final Interview Advice:** Always emphasize that these architectures are built to support **Team Autonomy**. The goal isn't just a fast website; it's a system where 15 teams can deploy 15 times a day without ever needing a meeting with each other.