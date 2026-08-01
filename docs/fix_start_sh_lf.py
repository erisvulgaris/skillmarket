import os

start_sh_path = "c:/AppDev 2026/41.DrHuxon/temp_skillmarket/start.sh"

content = """#!/bin/sh
mkdir -p /data
export DATABASE_URL="${DATABASE_URL:-file:/data/skillmarket.db}"
npx prisma db push --accept-data-loss || true
node .next/standalone/server.js
"""

# Convert CRLF to LF strictly
content_lf = content.replace('\r\n', '\n')

with open(start_sh_path, 'wb') as f:
    f.write(content_lf.encode('utf-8'))

print("Updated start.sh with strict Unix LF line endings!")
