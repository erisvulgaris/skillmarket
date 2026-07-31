#!/bin/sh
mkdir -p /data
export DATABASE_URL="${DATABASE_URL:-file:/data/skillmarket.db}"
npx prisma db push --accept-data-loss || true
node .next/standalone/server.js
