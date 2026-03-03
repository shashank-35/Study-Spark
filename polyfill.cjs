// Polyfill globalThis.crypto for Node.js < 19 (e.g. Node 16/18)
// Must be loaded via `node -r ./polyfill.cjs` so it runs before any ESM module
const { webcrypto } = require('crypto');
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}
