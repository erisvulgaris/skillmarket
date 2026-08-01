import os

API_DIR = "c:/AppDev 2026/41.DrHuxon/temp_skillmarket/src/app/api"

count = 0
for root, dirs, files in os.walk(API_DIR):
    for f in files:
        if f == "route.ts":
            path = os.path.join(root, f)
            with open(path, "r", encoding="utf-8") as file:
                content = file.read()

            if "function GET" not in content and "const GET" not in content:
                print(f"Adding GET stub to {os.path.relpath(path, API_DIR)}")
                new_content = content + "\n\nexport async function GET() {\n  return Response.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 405 })\n}\n"
                with open(path, "w", encoding="utf-8") as file:
                    file.write(new_content)
                count += 1

print(f"Added GET stub handler to {count} route files.")
