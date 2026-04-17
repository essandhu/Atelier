// Vitest runs in Node, not in Next.js's react-server resolver, so the real
// `server-only` package would throw at import. This stub is aliased in
// vitest.config.ts so tests can import server-only modules directly.
export {};
