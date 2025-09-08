# 🔥 Flare

**Blazing fast event aggregator for JavaScript & TypeScript**  
A lightweight, flexible, and type-safe alternative to traditional event emitters.  

<!-- [![npm version](https://img.shields.io/npm/v/flare.svg)](https://www.npmjs.com/package/flare)   -->
[![License](https://img.shields.io/github/license/xafans/flare)](./LICENSE)&nbsp;&nbsp;[![Build Status](https://github.com/xafans/flare/actions/workflows/ci.yml/badge.svg)](https://github.com/xafans/flare/actions)  

---

## ✨ Features
- 🚀 **Blazing fast**: optimized for performance.  
- 🛠️ **Middleware & interceptors**: intercept events before/after firing.  
- 🎯 **Strategies**: run handlers in parallel or serial.  
- ⏱️ **Timeouts & error handling**: stop long-running handlers.  
- 🧹 **Release**: remove specific handlers or all at once.  
- ✅ **Type-safe**: written in TypeScript, works seamlessly in JS & TS projects.  

---

## 📦 Installation

```bash
npm install flare
# or
yarn add flare
# or
pnpm add flare
````

---

## 🚀 Quick Start

```ts
import { flare } from "flare";

// Register a handler
flare.catch("userLogin", (user) => {
  console.log(`User logged in: ${user.name}`);
});

// Fire an event
flare.fire("userLogin", { id: "123", name: "Alice" });
```

---

## ⚙️ API

- [catch(event, handler, options?)](#catchevent-handler-options)
- [fire(event, payload, options?)](#fireevent-payload-options)
- [in(interceptor)](#ininterceptor)
- [use(middleware)](#usemiddleware)
- [release(event, handler) / releaseAll()](#releaseevent-handler--releaseall)

---

### `catch(event, handler, options?)`

Register an event handler. Returns a cleanup function.

```ts
const unsubscribe = flare.catch("message", (msg) => {
  console.log("Message:", msg);
});

// Remove handler
unsubscribe();
```

**Options:**

* `once?: boolean` → auto-remove after first call.

---

### `fire(event, payload, options?)`

Trigger an event.

```ts
await flare.fire("message", "Hello World", {
  strategy: "serial",
  timeout: 1000,
  haltOnError: true,
});
```

**Options:**

* `strategy`: `"parallel"` (default) | `"serial"`
* `timeout`: number (ms)
* `haltOnError`: stop on first error (serial mode)

---

### `in(interceptor)`

Add interceptors (before/after hooks).

```ts
flare.in({
  id: "logger",
  before(event, payload) {
    console.log(`[Before] ${String(event)}:`, payload);
  },
  after(event, payload) {
    console.log(`[After] ${String(event)}:`, payload);
  },
});
```

---

### `use(middleware)`

Add async middlewares to transform or stop events.

```ts
flare.use(async (ctx, next) => {
  if (ctx.event === "message" && ctx.payload.includes("bad")) {
    ctx.stop(); // prevent event
    return;
  }
  ctx.set(ctx.payload.toUpperCase());
  await next();
});
```

---

### `release(event, handler)` / `releaseAll()`

Remove specific handler(s) or clear all handlers.

```ts
// Remove one
flare.release("message", handler);

// Remove everything
flare.releaseAll();
```

---

## 🧪 Example with Middleware + Interceptors

```ts
type Events = {
  message: string;
};

const flare = new Flare<Events>();

flare.in({
  before(event, payload) {
    console.log("Before:", event, payload);
  },
  after(event, payload) {
    console.log("After:", event, payload);
  },
});

flare.use(async (ctx, next) => {
  console.log("Middleware 1");
  await next();
});

flare.catch("message", (msg) => console.log("Handler:", msg));

flare.fire("message", "Hello Flare!");
```

---

## 🛠 Development

Clone and build locally:

```bash
git clone https://github.com/xafans/flare.git
cd flare
npm install
npm run build
npm test
```

---

## 📜 License

[MIT](./LICENSE) © 2025 [xafans](https://github.com/xafans)

