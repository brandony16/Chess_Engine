import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/Chess_Engine/",
  plugins: [react(), tailwindcss()],
  test: {
    testTimeout: 0,
  },
});
