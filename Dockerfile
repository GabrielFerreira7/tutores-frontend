FROM node:20-slim AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
# Vite env vars are baked in at build time, not read at container runtime.
ARG VITE_API_BASE_URL=http://localhost:8000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM node:20-slim
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
EXPOSE 5173
# No "-s" (SPA catch-all): it would also swallow real static files like embed-demo.html.
# dist/serve.json (copied from public/ at build time) rewrites only the SPA routes we need.
CMD ["serve", "dist", "-l", "5173"]
