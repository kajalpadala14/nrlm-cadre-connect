// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    server: { entry: "server" },
  },
  // Enable the Nitro deploy plugin targeting Vercel.
  // Without this, @lovable.dev/vite-tanstack-config skips Nitro outside the
  // Lovable sandbox, leaving no server bundle for production.
  // The "vercel" preset writes to .vercel/output/ (Vercel Build Output API v3),
  // which Vercel picks up automatically — no manual vercel.json routing needed.
  nitro: {
    preset: "vercel",
    noExternals: ["tslib"],
  },
});
