FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Vite env vars are baked in at build time, not read at container runtime.
ARG VITE_API_BASE_URL=http://localhost:8000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM node:20-slim
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
# node:20-slim já traz um usuário não-root "node" (uid 1000) — reaproveitado em vez de
# criar outro, o que colidiria com esse uid já existente na imagem base.
RUN chown -R node:node /app
USER node
EXPOSE 5173
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
    CMD node -e "fetch('http://localhost:5173/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# No "-s" (blanket SPA catch-all): it would also swallow real static files like
# embed-demo.html. dist/serve.json (copied from public/ at build time) rewrites only the
# known SPA routes explicitly. A genuinely unknown path (not one of these, no matching
# file) gets serve's own 404 here — the app's own NotFoundPage only covers "npm run dev"
# and paths under known prefixes like /admin/*, not this static-server fallback. A bare
# "/**" catch-all was tried and reverted: serve-handler reapplies remaining rewrite rules
# to the *output* of a match (needed for rule chaining), so a trailing "/**" would also
# re-catch /embed-demo's own rewritten target and send it to index.html instead.
CMD ["serve", "dist", "-l", "5173"]
