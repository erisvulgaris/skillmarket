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

            pattern = r'export\s+async\s+function\s+GET\s*\(([^\)]*)\)\s*\{'
            def repl(match):
                args = match.group(1).strip()
                if not args or args == "req: Request" or args == "req?: Request":
                    new_args = "req?: Request"
                else:
                    new_args = args
                return f"export async function GET({new_args}) {{\n  if (!req || !req.url || process.env.IS_BUILD_TIME === 'true' || process.env.NEXT_PHASE) return NextResponse.json({{ success: true, data: {{}} }})"

            new_content = re.sub(pattern, repl, content)
            if new_content != content:
                if "import { NextResponse }" not in new_content and "NextResponse" in new_content:
                    new_content = "import { NextResponse } from 'next/server'\n" + new_content
                with open(path, "w", encoding="utf-8") as file:
                    file.write(new_content)
                print(f"Updated req check in {os.path.relpath(path, API_DIR)}")
                count += 1

print(f"Updated req check in {count} route files.")
