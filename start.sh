#!/bin/sh
mkdir -p /data
npx prisma db push --accept-data-loss
npx tsx src/scripts/create-admin.ts
node .next/standalone/server.js
