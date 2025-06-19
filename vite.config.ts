import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const backendApiUrl = "http://localhost:5176";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,

    proxy: {
      "/api": {
        target: backendApiUrl,
        changeOrigin: true,
      },
    },
  },
});
