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

- [catch(event, handler, options?)](https://github.com/xafans/flare/wiki/API-Reference#catchevent-handler-options)
- [fire(event, payload, options?)](https://github.com/xafans/flare/wiki/API-Reference#fireevent-payload-options)
- [in(interceptor)](https://github.com/xafans/flare/wiki/API-Reference#ininterceptor)
- [use(middleware)](https://github.com/xafans/flare/wiki/API-Reference#usemiddleware)
- [release(event, handler) / releaseAll()](https://github.com/xafans/flare/wiki/API-Reference#releaseevent-handler)

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

