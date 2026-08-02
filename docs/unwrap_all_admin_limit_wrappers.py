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

            # Replace export const (POST|PUT|PATCH|DELETE) = adminLimit(async function \1(...) { ... })
            # or export const (POST|PUT|PATCH|DELETE) = adminLimit(async function \1() { ... })
            
            pattern = r'export\s+const\s+(POST|PUT|PATCH|DELETE)\s*=\s*adminLimit\(\s*async\s+function\s+\1\s*\(([^\)]*)\)\s*\{'
            
            def replace_wrapper(match):
                method = match.group(1)
                args = match.group(2).strip()
                req_arg = "req: Request"
                ctx_arg = ""
                if "params" in args or "ctx" in args:
                    ctx_arg = ", ctx: any"
                return f"export async function {method}({req_arg}{ctx_arg}) {{\n  if (process.env.NEXT_PHASE === 'phase-production-build') return NextResponse.json({{ success: true, data: {{}} }})\n  return adminLimit(async ({args}) => {{"

            new_content = re.sub(pattern, replace_wrapper, content)
            
            if new_content != content:
                with open(path, "w", encoding="utf-8") as file:
                    file.write(new_content)
                print(f"Unwrapped adminLimit in {os.path.relpath(path, API_DIR)}")
                count += 1

print(f"Unwrapped adminLimit in {count} route files.")
