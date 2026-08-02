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

            # Pattern: const url = new URL(variable.url) or const url = new URL(req.url)
            pattern = r'const\s+([A-Za-z0-9_]+)\s*=\s*new\s+URL\(\s*([A-Za-z0-9_]+(?:\.url)?)\s*\)'

            def replace_url(match):
                var_name = match.group(1)
                req_expr = match.group(2)
                if not req_expr.endswith(".url"):
                    req_expr = f"{req_expr}?.url"
                return f"const _u = {req_expr} || 'http://localhost'\n    const {var_name} = _u.startsWith('http') ? new URL(_u) : new URL(_u, 'http://localhost')"

            new_content = re.sub(pattern, replace_url, content)

            if new_content != content:
                with open(path, "w", encoding="utf-8") as file:
                    file.write(new_content)
                print(f"Fixed URL construction in {os.path.relpath(path, API_DIR)}")
                count += 1

print(f"Fixed URL constructions in {count} route files.")
