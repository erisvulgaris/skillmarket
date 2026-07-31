#!/bin/sh
mkdir -p /data
export DATABASE_URL="${DATABASE_URL:-file:/data/skillmarket.db}"
./node_modules/.bin/prisma generate
./node_modules/.bin/prisma db push --accept-data-loss
node .next/standalone/server.js
