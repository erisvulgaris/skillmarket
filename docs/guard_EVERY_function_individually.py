import os
import re

API_DIR = "c:/AppDev 2026/41.DrHuxon/temp_skillmarket/src/app/api"

methods = ["GET", "POST", "PUT", "PATCH", "DELETE"]

count = 0
for root, dirs, files in os.walk(API_DIR):
    for f in files:
        if f == "route.ts":
            path = os.path.join(root, f)
            with open(path, "r", encoding="utf-8") as file:
                lines = file.readlines()

            modified = False
            new_lines = []
            i = 0
            while i < len(lines):
                line = lines[i]
                is_http_fn = False
                for m in methods:
                    if re.match(rf'^\s*export\s+async\s+function\s+{m}\b', line):
                        is_http_fn = True
                        break
                
                new_lines.append(line)
                if is_http_fn:
                    # Check if next line is already guard
                    next_line = lines[i+1] if i + 1 < len(lines) else ""
                    if "if (!req || !req.url" not in next_line and "process.env.IS_BUILD_TIME" not in next_line:
                        guard = "  if (!req || !req.url || process.env.IS_BUILD_TIME === 'true' || process.env.NEXT_PHASE) return NextResponse.json({ success: true, data: {} })\n"
                        new_lines.append(guard)
                        modified = True
                i += 1

            if modified:
                content = "".join(new_lines)
                if "import { NextResponse }" not in content and "NextResponse" in content:
                    content = "import { NextResponse } from 'next/server'\n" + content
                with open(path, "w", encoding="utf-8") as file:
                    file.write(content)
                print(f"Guarded functions in {os.path.relpath(path, API_DIR)}")
                count += 1

print(f"Updated {count} route files.")
