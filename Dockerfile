FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY apps/server/package*.json ./apps/server/
COPY apps/web/package*.json ./apps/web/
RUN npm ci --ignore-scripts

COPY . .
RUN npm run db:setup && npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Hugging Face uchun majburiy portni muhit o'zgaruvchisiga o'rnatamiz
ENV PORT=7860

COPY --from=builder /app /app
RUN mkdir -p /app/apps/server/data

# Portni 4000 dan 7860 ga o'zgartiramiz
EXPOSE 7860

# Healthcheckni ham yangi portga moslaymiz
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:7860/api/health || exit 1

CMD ["sh", "-1c", "npm run db:setup && npm run start"]
