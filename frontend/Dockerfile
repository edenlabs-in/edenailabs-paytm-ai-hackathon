# ── Build stage: compile the Vite app ──
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Vite bakes env at build time. Supabase URL + publishable key are passed in;
# the API base is left empty so the app calls same-origin /webhook/* (nginx proxies it).
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_N8N_WEBHOOK_URL=
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY \
    VITE_N8N_WEBHOOK_URL=$VITE_N8N_WEBHOOK_URL
RUN npm run build

# ── Serve stage: nginx serves the SPA and proxies the API to the backend ──
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
