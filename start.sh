#!/bin/sh
mkdir -p /data
npx prisma db push --accept-data-loss
node src/scripts/create-admin.js
node .next/standalone/server.js
