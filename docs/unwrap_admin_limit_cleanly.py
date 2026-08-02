import os

ADMIN_DIR = "c:/AppDev 2026/41.DrHuxon/temp_skillmarket/src/app/api/admin"

count = 0
for root, dirs, files in os.walk(ADMIN_DIR):
    for f in files:
        if f == "route.ts":
            path = os.path.join(root, f)
            with open(path, "r", encoding="utf-8") as file:
                content = file.read()

            if "export const GET = adminLimit(" in content:
                print(f"Unwrapping adminLimit in {os.path.relpath(path, ADMIN_DIR)}")
                
                # Replace export const GET = adminLimit(async function GET(...) {
                content = content.replace("export const GET = adminLimit(async function GET() {", "export async function GET(req: Request) {\n  if (process.env.NEXT_PHASE === 'phase-production-build') return NextResponse.json({ success: true, data: {} })\n  return adminLimit(async (r: Request) => {")
                content = content.replace("export const GET = adminLimit(async function GET(req: Request) {", "export async function GET(req: Request) {\n  if (process.env.NEXT_PHASE === 'phase-production-build') return NextResponse.json({ success: true, data: {} })\n  return adminLimit(async (r: Request) => {")
                
                # Replace ending }) at the end of file with })(req)\n}
                if content.strip().endswith("})"):
                    content = content.strip()[:-2] + "  })(req)\n}\n"
                
                if "import { NextResponse }" not in content:
                    content = "import { NextResponse } from 'next/server'\n" + content
                
                with open(path, "w", encoding="utf-8") as file:
                    file.write(content)
                count += 1

print(f"Unwrapped adminLimit cleanly in {count} admin route files.")
