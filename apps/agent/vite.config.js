import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    root: "./web",
    resolve: {
      alias: {
        "~": path.resolve(__dirname, "./web/src"),
      },
    },
    server: {
      // Use Vite default port (5173), no custom configuration needed
      proxy: {
        "/api": `http://localhost:${env.PORT || 5200}`,
        "/ws": {
          target: `ws://localhost:${env.PORT || 5200}`,
          ws: true,
        },
        "/shell": {
          target: `ws://localhost:${env.PORT || 5200}`,
          ws: true,
        },
      },
    },
    build: {
      outDir: "../dist/web",
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom", "react-router-dom"],
            "vendor-codemirror": [
              "@uiw/react-codemirror",
              "@codemirror/lang-css",
              "@codemirror/lang-html",
              "@codemirror/lang-javascript",
              "@codemirror/lang-json",
              "@codemirror/lang-markdown",
              "@codemirror/lang-python",
              "@codemirror/theme-one-dark",
            ],
            "vendor-xterm": [
              "@xterm/xterm",
              "@xterm/addon-fit",
              "@xterm/addon-clipboard",
              "@xterm/addon-webgl",
            ],
          },
        },
      },
    },
  };
});
