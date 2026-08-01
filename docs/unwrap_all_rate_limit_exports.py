import os
import re

API_DIR = "c:/AppDev 2026/41.DrHuxon/temp_skillmarket/src/app/api"

limiters = ["apiLimit", "adminLimit", "strictLimit", "transferLimit", "messageLimit"]

count = 0
for root, dirs, files in os.walk(API_DIR):
    for f in files:
        if f == "route.ts":
            path = os.path.join(root, f)
            with open(path, "r", encoding="utf-8") as file:
                content = file.read()

            new_content = content
            for lim in limiters:
                pattern = rf'export\s+const\s+(GET|POST|PATCH|PUT|DELETE)\s*=\s*{lim}\(\s*async\s+function\s*(?:[A-Za-z0-9_]*)\s*\(([^)]*)\)\s*\{{(.*)\}}\s*\)'
                # Check for matches
                matches = list(re.finditer(pattern, new_content, re.DOTALL))
                if matches:
                    for match in matches:
                        method = match.group(1)
                        arg_name = match.group(2).strip() or "req"
                        body = match.group(3)
                        replacement = f"""export async function {method}({arg_name}: Request) {{
  return {lim}(async function({arg_name}: Request) {{{body}}})({arg_name})
}}"""
                        new_content = new_content.replace(match.group(0), replacement)
                        count += 1

            if new_content != content:
                with open(path, "w", encoding="utf-8") as file:
                    file.write(new_content)
                print(f"Unwrapped rate-limit wrapper in {os.path.relpath(path, API_DIR)}")

print(f"Unwrapped rate limit wrappers in {count} handlers.")
