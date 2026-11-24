# ─────────────────────────────────────────────────────────────────
# Stage 1: Node builder
#   Installs deps and builds the Vite production bundle.
# ─────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy manifests first — Docker cache skips npm ci when unchanged
COPY package.json package-lock.json ./

# Vite uses Rolldown's platform-specific optional dependency.
RUN npm ci

# Copy only source — exclude node_modules, dist, .env files via .dockerignore
COPY index.html vite.config.ts tsconfig*.json tailwind.config.ts postcss.config.js ./
COPY public/ ./public/
COPY src/ ./src/
COPY biome.json ./

# Build the production bundle
RUN npm run build

# ─────────────────────────────────────────────────────────────────
# Stage 2: Production nginx image
#   Serves the static dist/ with a minimal nginx configuration.
#   The final image contains no Node.js, no source, no node_modules.
# ─────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Remove the default nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy the built static files from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the production nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost/index.html || exit 1

CMD ["nginx", "-g", "daemon off;"]
