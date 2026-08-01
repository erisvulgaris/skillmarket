import os
import re

API_DIR = "c:/AppDev 2026/41.DrHuxon/temp_skillmarket/src/app/api"

count = 0
for root, dirs, files in os.walk(API_DIR):
    for f in files:
        if f == "route.ts" and ("[" in root and "]" in root):
            path = os.path.join(root, f)
            with open(path, "r", encoding="utf-8") as file:
                content = file.read()

            new_content = content
            if "export const revalidate = 0" not in new_content:
                new_content = "export const revalidate = 0\n" + new_content

            # Replace { params }: { params: ... } with ctx: any
            new_content = re.sub(
                r'(export\s+async\s+function\s+(?:GET|POST|PATCH|PUT|DELETE))\s*\(\s*([^,\)]+)\s*,\s*\{\s*params\s*\}\s*:\s*\{\s*params\s*:[^\}]+\}\s*\)',
                r'\1(\2, ctx: any)',
                new_content
            )

            if new_content != content:
                with open(path, "w", encoding="utf-8") as file:
                    file.write(new_content)
                print(f"Updated dynamic route params in {os.path.relpath(path, API_DIR)}")
                count += 1

print(f"Updated {count} dynamic route files.")
