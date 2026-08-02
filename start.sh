#!/bin/sh
mkdir -p /data
export DATABASE_URL="${DATABASE_URL:-file:/data/skillmarket.db}"
export PORT="${PORT:-3000}"
export HOSTNAME="0.0.0.0"
npx prisma db push --accept-data-loss || true
node .next/standalone/server.js
