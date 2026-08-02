FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat openssl sqlite
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV IS_BUILD_TIME=true
ENV NEXT_PHASE=phase-production-build
ENV SESSION_SECRET="skillcart-dokploy-production-build-secret-999"
ENV DATABASE_URL="file:/data/skillmarket.db"
RUN mkdir -p /data && npx prisma generate
RUN npx prisma db push --accept-data-loss
RUN chmod -R 777 /data
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache openssl sqlite

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/start.sh ./start.sh
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

COPY --from=builder /data /data

RUN chmod -R 777 /data && chmod +x start.sh
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/data/skillmarket.db"

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
EXPOSE 3000

CMD ["sh", "start.sh"]
