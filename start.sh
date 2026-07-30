#!/bin/sh
mkdir -p /data
npx prisma db push --accept-data-loss
node .next/standalone/server.js
