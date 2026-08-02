import os
import re

API_DIR = "c:/AppDev 2026/41.DrHuxon/temp_skillmarket/src/app/api"

count = 0
for root, dirs, files in os.walk(API_DIR):
    for f in files:
        if f == "route.ts":
            path = os.path.join(root, f)
            with open(path, "r", encoding="utf-8") as file:
                content = file.read()

            if "phase-production-build" not in content and ("export async function GET" in content or "export function GET" in content):
                print(f"Adding build phase early exit to {os.path.relpath(path, API_DIR)}")
                pattern = r'(export\s+async\s+function\s+GET\s*\([^\)]*\)\s*\{)'
                replacement = r"\1\n  if (process.env.NEXT_PHASE === 'phase-production-build') return NextResponse.json({ success: true, data: {} })"
                new_content = re.sub(pattern, replacement, content)
                if "import { NextResponse }" not in new_content and "NextResponse" in new_content:
                    new_content = "import { NextResponse } from 'next/server'\n" + new_content
                with open(path, "w", encoding="utf-8") as file:
                    file.write(new_content)
                count += 1

print(f"Added build phase early exit to {count} route files.")
