#!/bin/sh
echo "[start.sh] Searching for libssl on container..."
find / -name "libssl.so*" 2>/dev/null
NIX_SSL_DIR=$(find / -name "libssl.so*" 2>/dev/null | head -n 1 | xargs dirname 2>/dev/null)
if [ -n "$NIX_SSL_DIR" ]; then
  echo "[start.sh] Found libssl in $NIX_SSL_DIR, setting LD_LIBRARY_PATH"
  export LD_LIBRARY_PATH="$NIX_SSL_DIR:$LD_LIBRARY_PATH"
fi
mkdir -p /data
export DATABASE_URL="${DATABASE_URL:-file:/data/skillmarket.db}"
npx prisma db push --accept-data-loss || true
node .next/standalone/server.js
