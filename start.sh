#!/bin/sh
mkdir -p /data
./node_modules/.bin/prisma db push --accept-data-loss
node .next/standalone/server.js
