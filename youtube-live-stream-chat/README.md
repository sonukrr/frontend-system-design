# YouTube Live Stream Chat UI

A front-end system design exercise: build the live-stream + chat layout you see on YouTube,
with near real-time comments, using polling instead of sockets.

## 1. Problem Statement

Design the UI for a live stream page:
- Video player on the left.
- A chat panel on the right that shows a live, scrolling feed of viewer comments.
- Viewers can post their own comment into the same feed.

## 2. Requirements

### Functional
1. Show the live video (embedded player) on the left.
2. Show a chat panel on the right.
3. New chat messages should appear automatically without a page refresh (near real-time).
4. A viewer can type and submit a comment, which is appended to the feed immediately.

### Non-functional / scale
1. Traffic can spike to ~10k comments/sec on a popular stream — the client cannot render every
   message as it happens, so the **backend** batches/rate-limits and the client only ever asks
   for a small page of messages (~10) per poll.
2. The chat list must not grow unbounded in the DOM. Only the most recent `MAXLIMIT` (10)
   messages are kept on screen — the oldest is evicted once the limit is exceeded.
3. Any interval/timer started for polling must be cleaned up on unmount to avoid leaks.

## 3. High-Level Design

```
YoutubeStream
├── VideoStream   → <iframe> embed of the live video
└── ChatStream    → polling loop + message list + composer
    ├── Message[]   → one row per chat message (avatar, name, text)
    └── CommentBox  → text input to add a new comment
```

### Real-time strategy: long polling vs. WebSockets
This exercise uses **polling** (`setInterval`) instead of WebSockets/SSE:
- Simpler to implement and reason about for an interview setting.
- Trade-off: higher latency (bounded by poll interval) and more redundant requests vs. a
  persistent socket, but no connection/backpressure management on the client.

**Why YouTube itself actually favors (long) polling over WebSockets in production**, even though a
persistent socket looks like the "obvious" choice for a live chat feed:

- **Plays nicely with standard HTTP infra.** Polling requests are ordinary HTTP requests, so they
  flow through existing load balancers, CDNs/edge caches, reverse proxies, auth, rate limiting, and
  WAF/monitoring tooling unmodified. WebSockets need an HTTP Upgrade and a long-lived connection
  that a lot of that infra (especially older corporate proxies/firewalls) doesn't handle well —
  connections can get silently dropped or blocked.
- **Stateless = trivially scalable.** Each poll is a short-lived, independent request, so it can
  land on *any* backend instance behind a load balancer. A WebSocket connection is stateful and
  pinned to one server for its lifetime, which forces sticky sessions and makes horizontal
  autoscaling and rolling deploys much harder (in-flight sockets have to be drained/migrated).
- **Cheaper to hold at YouTube's scale.** Millions of concurrent viewers means millions of
  potential open sockets, each consuming server memory and a file descriptor for the entire
  stream's duration. Short HTTP requests are far cheaper to hold in aggregate and free up
  resources between polls.
- **Simpler deploys and failure recovery.** Rolling out a new server version just means new polls
  get routed to it — no need to gracefully migrate/close millions of live sockets. If a poll fails,
  the client just retries the next tick; there's no persistent-connection reconnect/backoff state
  machine to manage.
- **The traffic pattern doesn't need a true duplex channel.** Posting a comment is already a
  separate one-off POST request, and the chat feed is overwhelmingly server → client. A
  request/response poll models that pattern naturally; a full-duplex WebSocket buys little extra
  for how the feature is actually used.
- **Easier observability/debugging.** Discrete HTTP requests show up cleanly in standard request
  logs, tracing, and metrics; long-lived socket streams are harder to inspect with the same
  tooling.

The usual counter-argument — "WebSockets have lower latency and less overhead per message" — is
true, but at YouTube's scale the *operational* cost (connection state, infra compatibility, scaling
sockets across a fleet) outweighs the latency win for a chat feed where a ~1s delay is imperceptible.

## 4. Implementation Notes (current code)

- [ChatStream.jsx](src/ChatStream.jsx) polls on a **1s** interval (`setInterval` inside a
  `useEffect`, cleared on unmount) and appends one mock message per tick.
- Messages are capped at `MAXLIMIT = 10` via `array.splice(0, length - MAXLIMIT)` — this is the
  client-side implementation of "evict the oldest message once the 11th arrives."
- A `scrollRef` div at the bottom of the list is scrolled into view on every message update so
  the feed auto-scrolls like a real chat.
- [CommentBox.jsx](src/CommentBox.jsx) is an uncontrolled-ish text input; pressing Enter or
  clicking Submit calls `addComment(text)`, which goes through the **same** capped-list logic as
  polled messages, so a self-posted comment can also push out the oldest message.
- [Message.jsx](src/Message.jsx) renders a single row (avatar, name, message text).
- [VideoStream.jsx](src/VideoStream.jsx) is a static YouTube `<iframe>` embed placeholder for the
  live video.
- Chat data is currently **mocked** (`makeMessage()` generates a random name + fixed message) —
  there is no real backend/API call yet; `fetchChats()` is the seam where a real
  `GET /chats?after=<cursor>` polling call would go.

## 5. Talking Points for the Interview

- **Why cap the DOM list?** Unbounded appends on a hot chat (10k msgs/sec) would blow up memory
  and layout/reflow cost. Capping to a fixed window (here, 10) keeps DOM size constant regardless
  of stream popularity — this is the client half of the mitigation; the backend must also
  rate-limit/batch what it sends per poll.
- **Why 1 poll/sec instead of on every message?** Polling coalesces however many messages arrived
  since the last tick into a single request/render pass, instead of one render per message.
- **Cleanup:** the interval is cleared in the `useEffect` cleanup function to avoid leaking timers
  when `ChatStream` unmounts (e.g., navigating away from the stream).
- **Where this would evolve for production:**
  - Keep polling (this is what YouTube does) rather than reaching for WebSockets — see
    [Real-time strategy](#real-time-strategy-long-polling-vs-websockets) above for why the
    operational/scaling cost of sockets outweighs the latency win here. WebSocket/SSE is still the
    right call for lower-scale, latency-sensitive use cases (e.g. collaborative editing, trading).
  - Virtualize the message list (e.g., `react-window`) instead of a hard cap, if history should
    be scrollable.
  - Move rate-limiting/batching to the backend (fan-in many writers, fan-out a capped, throttled
    stream per client).
  - Optimistic UI + reconciliation for self-posted comments if the server is the source of truth.

## 6. Run Locally

```bash
npm install
npm run dev
```
