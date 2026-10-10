# Multi-stage production build for Railway & Cloud deployment
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Build frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

COPY frontend ./frontend
RUN cd frontend && npm run build

# 2. Setup backend
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

COPY backend ./backend
COPY supabase/migrations ./supabase/migrations
COPY forge-growth-plugin ./forge-growth-plugin

# 3. Production runner stage
FROM node:20-alpine
RUN apk add --no-cache ffmpeg

WORKDIR /app
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY --from=builder /app/supabase/migrations ./supabase/migrations
COPY --from=builder /app/forge-growth-plugin ./forge-growth-plugin

ENV NODE_ENV=production
EXPOSE 3010

CMD ["node", "backend/src/index.js"]
