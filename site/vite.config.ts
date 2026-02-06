import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Keep dev behavior unchanged while ensuring production assets resolve at domain root.
  base: command === "build" ? "/" : "./",
}));
