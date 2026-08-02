import os

API_DIR = "c:/AppDev 2026/41.DrHuxon/temp_skillmarket/src/app/api"

count = 0
for root, dirs, files in os.walk(API_DIR):
    for f in files:
        if f == "route.ts":
            path = os.path.join(root, f)
            with open(path, "r", encoding="utf-8") as file:
                content = file.read()

            if "adminLimit(" in content:
                lines = content.splitlines()
                new_lines = []
                in_admin_limit = False
                method_name = ""
                has_params = False

                for line in lines:
                    if "export const GET = adminLimit(" in line or "export const POST = adminLimit(" in line or "export const PUT = adminLimit(" in line or "export const PATCH = adminLimit(" in line or "export const DELETE = adminLimit(" in line:
                        m = line.split("export const ")[1].split(" = adminLimit")[0]
                        method_name = m
                        has_params = "params" in line or "ctx" in line
                        in_admin_limit = True
                        
                        args = "(req: Request, ctx: any)" if has_params else "(req: Request)"
                        pass_args = "(req, ctx)" if has_params else "(req)"
                        
                        new_lines.append(f"export async function {method_name}{args} {{")
                        if method_name == "GET":
                            new_lines.append("  if (process.env.NEXT_PHASE === 'phase-production-build') return NextResponse.json({ success: true, data: {} })")
                        inner_args = "(r: Request, c: any)" if has_params else "(r: Request)"
                        new_lines.append(f"  return adminLimit(async {inner_args} => {{")
                    elif in_admin_limit and line.strip() == "})":
                        in_admin_limit = False
                        pass_args = "(req, ctx)" if has_params else "(req)"
                        new_lines.append(f"  }}{pass_args}")
                        new_lines.append("}")
                    else:
                        new_lines.append(line)

                new_content = "\n".join(new_lines) + "\n"
                if "import { NextResponse }" not in new_content and "NextResponse" in new_content:
                    new_content = "import { NextResponse } from 'next/server'\n" + new_content

                if new_content != content:
                    with open(path, "w", encoding="utf-8") as file:
                        file.write(new_content)
                    print(f"Unwrapped adminLimit in {os.path.relpath(path, API_DIR)}")
                    count += 1

print(f"Unwrapped adminLimit perfectly in {count} route files.")
