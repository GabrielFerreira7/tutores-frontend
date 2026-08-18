import type { Connect, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Espelha o rewrite "/embed-demo" -> "/embed-demo.html" de public/serve.json (usado no
// Docker) dentro do dev server do Vite. Sem isto, "npm run dev" servia o shell da SPA
// (index.html) para /embed-demo em vez do arquivo estático real — 200 OK, mas a página
// errada, silenciosamente inconsistente com o comportamento documentado no README.
function embedDemoRewrite(): Plugin {
  return {
    name: "embed-demo-rewrite",
    configureServer(server) {
      server.middlewares.use((req: Connect.IncomingMessage, res, next) => {
        if (req.url === "/embed-demo") {
          req.url = "/embed-demo.html";
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), embedDemoRewrite()],
  server: {
    headers: {
      // Espelha public/serve.json (usado pelo Dockerfile): permissão explícita de
      // embed via iframe para qualquer origem, documentada como aceitável só para
      // demo — em produção isso viraria uma allow-list dos domínios integradores.
      "Content-Security-Policy": "frame-ancestors *",
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./tests/setup.ts",
    globals: true,
  },
});
