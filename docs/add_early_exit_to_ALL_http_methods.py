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
                content = file.read()

            modified = False
            for m in methods:
                # Case 1: export const METHOD = adminLimit(...)
                pattern1 = rf'export\s+const\s+{m}\s*=\s*adminLimit\(\s*async\s+function\s+{m}\s*\(([^\)]*)\)\s*\{{'
                def repl1(match):
                    args = match.group(1).strip()
                    req_arg = "req: Request"
                    ctx_arg = ", ctx: any" if "params" in args or "ctx" in args else ""
                    return f"export async function {m}({req_arg}{ctx_arg}) {{\n  if (process.env.NEXT_PHASE === 'phase-production-build') return NextResponse.json({{ success: true, data: {{}} }})\n  return adminLimit(async ({args}) => {{"
                
                new_content1 = re.sub(pattern1, repl1, content)
                if new_content1 != content:
                    content = new_content1
                    # Ensure matching closing })(req)
                    content = content.replace("  } catch (e) {\n    return handleError(e)\n  }\n})\n", "  } catch (e) {\n    return handleError(e)\n  }\n  })(req)\n}\n")
                    modified = True

                # Case 2: export async function METHOD(...) { without early exit
                pattern2 = rf'export\s+async\s+function\s+{m}\s*\(([^\)]*)\)\s*\{{'
                def repl2(match):
                    args = match.group(1)
                    return f"export async function {m}({args}) {{\n  if (process.env.NEXT_PHASE === 'phase-production-build') return NextResponse.json({{ success: true, data: {{}} }})"
                
                if f"process.env.NEXT_PHASE === 'phase-production-build'" not in content:
                    new_content2 = re.sub(pattern2, repl2, content)
                    if new_content2 != content:
                        content = new_content2
                        modified = True

            if modified:
                if "import { NextResponse }" not in content and "NextResponse" in content:
                    content = "import { NextResponse } from 'next/server'\n" + content
                with open(path, "w", encoding="utf-8") as file:
                    file.write(content)
                print(f"Updated {os.path.relpath(path, API_DIR)}")
                count += 1

print(f"Updated {count} route files.")
