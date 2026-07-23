# Tekion Round 1 — JavaScript Reference & Drills

Round 1 = 60 min, live coding. Part 1: JS internals / polyfills. Part 2: a DSA problem.
For an **Integration/Architect** flavor, expect emphasis on async orchestration (sequential promises, API chaining, error handling).

Interviewers here don't just want working code — they push on the *why*. Each block below flags the follow-up they'll ask.

---

## PART A — Reference Implementations

### 1. `bind` polyfill  ⭐ (most-asked)

```js
Function.prototype.myBind = function (context, ...boundArgs) {
  if (typeof this !== 'function') {
    throw new TypeError('myBind must be called on a function');
  }
  const targetFn = this;

  function boundFn(...callArgs) {
    // If invoked with `new`, ignore the bound context and use the fresh instance
    const calledWithNew = this instanceof boundFn;
    return targetFn.apply(
      calledWithNew ? this : context,
      [...boundArgs, ...callArgs]   // partial application: bound args first
    );
  }

  // Preserve the prototype chain so `new boundFn()` works
  if (targetFn.prototype) {
    boundFn.prototype = Object.create(targetFn.prototype);
  }
  return boundFn;
};
```

**The follow-up:** "What happens if someone does `new` on the bound function?" — The naive one-liner
(`return () => targetFn.apply(context, ...)`) fails here because an arrow fn can't be constructed and
you'd wrongly keep the bound `context`. Mentioning `new`-support and prototype preservation is the
senior signal. Also mention partial application (bound args prepended to call args).

---

### 2. `call` and `apply` polyfills (quick wins)

```js
Function.prototype.myCall = function (context, ...args) {
  context = context ?? globalThis;          // null/undefined → global
  const key = Symbol('fn');                 // avoid clobbering an existing property
  context[key] = this;
  const result = context[key](...args);
  delete context[key];
  return result;
};

Function.prototype.myApply = function (context, argsArray = []) {
  context = context ?? globalThis;
  const key = Symbol('fn');
  context[key] = this;
  const result = context[key](...argsArray);
  delete context[key];
  return result;
};
```

**The follow-up:** "Why the Symbol?" — so you don't overwrite a real key on `context`. Using a plain
string like `context.fn = this` is the common bug they look for.

---

### 3. Currying — fixed arity (uses `fn.length`)

```js
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);          // enough args → invoke
    }
    return (...next) => curried.apply(this, [...args, ...next]); // gather more
  };
}

const add = (a, b, c) => a + b + c;
const c = curry(add);
c(1, 2, 3);   // 6
c(1)(2)(3);   // 6
c(1, 2)(3);   // 6
```

**The follow-up:** "How does it know when to stop?" — `fn.length` (declared parameter count).
Caveat worth saying out loud: `fn.length` ignores rest params and defaults, so fixed-arity currying
doesn't work for variadic functions — which is why the infinite version below exists.

---

### 4. Currying — infinite (`sum(1)(2)(3)...()`)

```js
function sum(a) {
  return function (b) {
    if (b === undefined) return a;   // terminator: called with no arg
    return sum(a + b);
  };
}
sum(1)(2)(3)();   // 6

// Variant they sometimes want: auto-coerce via valueOf, no final ()
function total(a) {
  const fn = (b) => total(a + b);
  fn.valueOf = () => a;              // `+total(1)(2)` or string context returns the number
  return fn;
}
+total(1)(2)(3);  // 6
```

---

### 5. `Promise.all` polyfill  ⭐

```js
function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    const results = [];
    let completed = 0;
    if (promises.length === 0) return resolve(results);

    promises.forEach((p, i) => {
      Promise.resolve(p).then(          // wrap non-promise values
        (value) => {
          results[i] = value;           // preserve order by index, NOT push
          completed++;
          if (completed === promises.length) resolve(results);
        },
        reject                          // first rejection rejects the whole thing
      );
    });
  });
}
```

**The two follow-ups:** (1) "Why index assignment instead of `push`?" — results must stay in input
order regardless of resolution order. (2) "What if an input isn't a promise?" — `Promise.resolve(p)`
handles raw values. (3) "Empty array?" — resolves immediately with `[]`.

---

### 6. `race`, `any`, `allSettled` (round out the set)

```js
function promiseRace(promises) {
  return new Promise((resolve, reject) => {
    promises.forEach((p) => Promise.resolve(p).then(resolve, reject)); // first to settle wins
  });
}

function promiseAny(promises) {                // first FULFILLMENT wins; rejects only if all reject
  return new Promise((resolve, reject) => {
    const errors = [];
    let rejectedCount = 0;
    if (promises.length === 0) {
      return reject(new AggregateError([], 'All promises were rejected'));
    }
    promises.forEach((p, i) => {
      Promise.resolve(p).then(resolve, (err) => {
        errors[i] = err;
        if (++rejectedCount === promises.length) {
          reject(new AggregateError(errors, 'All promises were rejected'));
        }
      });
    });
  });
}

function promiseAllSettled(promises) {         // never rejects
  return Promise.all(
    promises.map((p) =>
      Promise.resolve(p).then(
        (value)  => ({ status: 'fulfilled', value }),
        (reason) => ({ status: 'rejected',  reason })
      )
    )
  );
}
```

**One-line differences to recite:** `all` = all succeed or first failure; `allSettled` = wait for all,
never rejects; `race` = first to *settle* (fulfill OR reject); `any` = first to *fulfill*, rejects only
if all fail.

---

### 7. Run promises in SERIES ⭐ (the integration-role favorite)

> Critical distinction interviewers hunt for: an array of **already-created promises** has *already
> started* (promises are eager). To truly run in series you need an array of **functions that return
> promises** (thunks).

```js
// tasks = array of functions, each returns a promise
async function runSeries(tasks) {
  const results = [];
  for (const task of tasks) {
    results.push(await task());   // next only starts after previous resolves
  }
  return results;
}

// reduce version (no async/await)
function runSeriesReduce(tasks) {
  return tasks.reduce(
    (chain, task) => chain.then((acc) => task().then((r) => [...acc, r])),
    Promise.resolve([])
  );
}
```

---

### 8. Sequential API calls from an array of URLs ⭐

```js
function fetchInSeries(urls) {
  return urls.reduce(
    (promise, url) =>
      promise.then((acc) =>
        fetch(url)
          .then((res) => res.json())
          .then((data) => [...acc, data])
      ),
    Promise.resolve([])
  );
}

// async/await equivalent (cleaner to explain)
async function fetchInSeriesAsync(urls) {
  const out = [];
  for (const url of urls) {
    const res = await fetch(url);
    out.push(await res.json());
  }
  return out;
}
```

**The follow-up:** "Now do it in parallel with a concurrency limit of N." Be ready to sketch a pool:
keep N workers pulling from a shared index. This is a very common escalation.

---

## PART B — Output Prediction Drills

Cover the answer, then read the reasoning. Golden rule: **sync stack → drain ALL microtasks
(Promise callbacks, `await` continuations) → then ONE macrotask (`setTimeout`) → repeat.**

### Q1 — sync vs micro vs macro
```js
console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => console.log('C'));
console.log('D');
```
**Output:** `A  D  C  B`
Sync (`A`,`D`) → microtask (`C`) → macrotask (`B`).

---

### Q2 — the `var` loop classic
```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
```
**Output:** `3  3  3`
`var` is function-scoped; all callbacks close over the same `i`, which is `3` by the time they run.
Fix: `let i` (per-iteration binding) → `0 1 2`, or an IIFE capturing `i`.

---

### Q3 — async/await ordering
```js
async function foo() {
  console.log(1);
  await bar();
  console.log(2);
}
function bar() { console.log(3); }
console.log(4);
foo();
console.log(5);
```
**Output:** `4  1  3  5  2`
`4` sync → `foo()` logs `1`, `bar()` logs `3`, `await` suspends and queues the rest as a microtask →
`5` sync → microtask resumes → `2`.

---

### Q4 — chained microtasks beat the timer
```js
console.log('start');
setTimeout(() => console.log('timeout'), 0);
Promise.resolve()
  .then(() => console.log('promise1'))
  .then(() => console.log('promise2'));
console.log('end');
```
**Output:** `start  end  promise1  promise2  timeout`
The whole microtask *chain* drains before the macrotask fires.

---

### Q5 — the interview boss level
```js
async function async1() {
  console.log('async1 start');
  await async2();
  console.log('async1 end');
}
async function async2() { console.log('async2'); }

console.log('script start');
setTimeout(() => console.log('setTimeout'), 0);
async1();
Promise.resolve().then(() => console.log('promise1'));
console.log('script end');
```
**Output:** `script start → async1 start → async2 → script end → async1 end → promise1 → setTimeout`
Trace: sync prints `script start`; timer queued (macro); `async1` prints `async1 start`, `async2`
prints `async2`, then `await` queues `async1 end` as the *first* microtask; `.then` queues `promise1`
as the *second* microtask; sync prints `script end`; drain microtasks in order (`async1 end`,
`promise1`); finally the macrotask (`setTimeout`).

---

### Q6 — the promise executor is synchronous
```js
console.log('1');
const p = new Promise((resolve) => {
  console.log('2');
  resolve();
  console.log('3');
});
p.then(() => console.log('4'));
console.log('5');
```
**Output:** `1  2  3  5  4`
The executor body runs *synchronously* (`2`,`3`). Only the `.then` callback is deferred to the
microtask queue → `4` last.

---

### Q7 — closures with `let` (the fixed version)
```js
const fns = [];
for (let i = 0; i < 3; i++) fns.push(() => i);
console.log(fns.map((f) => f()));
```
**Output:** `[0, 1, 2]`
`let` creates a fresh binding each iteration, so each closure captures its own `i`. Swap to `var` and
it's `[3, 3, 3]` — know both.

---

## 30-second self-check before you walk in
- [ ] Write `bind` from memory *with* `new`-support and partial application.
- [ ] `Promise.all` with index-ordered results + empty-array + non-promise handling.
- [ ] Series runner — and articulate "array of thunks, not array of promises."
- [ ] Recite `all` / `allSettled` / `race` / `any` differences in one breath.
- [ ] Trace Q5 out loud without hesitating on micro-vs-macro ordering.
- [ ] DSA half: warm up sliding-window + two-pointer (Trapping Rain Water, Min Size Subarray Sum).