import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  output: "server",
  adapter: process.env.DEPLOY_TARGET === "vercel" ? vercel() : node({ mode: "standalone" }),
  vite: { plugins: [tailwindcss()] },
});
