import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import viteTsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

export default defineConfig(({ command }) => ({
  plugins: [
    // Redirect TanStack Start's server entry to src/server.ts (SSR error wrapper).
    tanstackStart({ server: { entry: "server" } }),
    viteReact(),
    tailwindcss(),
    viteTsConfigPaths({ projects: ["./tsconfig.json"] }),
    // Production server build. Nitro auto-detects the host (Node, Vercel, Netlify, Cloudflare...).
    // To force a target: nitro({ preset: "node-server" }).
    ...(command === "build" ? [nitro()] : []),
  ],
  // Fixed port so the Supabase Redirect URL (http://localhost:3000/**) always matches.
  server: { port: 3000, strictPort: true },
  resolve: {
    dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-start"],
  },
}));
