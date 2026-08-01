#!/bin/sh
mkdir -p /data
export DATABASE_URL="${DATABASE_URL:-file:/data/skillmarket.db}"
npx prisma@6.19.2 generate || true
npx prisma@6.19.2 db push --accept-data-loss || true
node .next/standalone/server.js
