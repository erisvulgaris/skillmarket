import os

API_DIR = "c:/AppDev 2026/41.DrHuxon/temp_skillmarket/src/app/api"

count = 0
for root, dirs, files in os.walk(API_DIR):
    for f in files:
        if f == "route.ts":
            path = os.path.join(root, f)
            with open(path, "r", encoding="utf-8") as file:
                content = file.read()

            if "Response.json" in content:
                new_content = content.replace("Response.json", "NextResponse.json")
                if "import { NextResponse }" not in new_content and "NextResponse" in new_content:
                    new_content = "import { NextResponse } from 'next/server'\n" + new_content
                with open(path, "w", encoding="utf-8") as file:
                    file.write(new_content)
                count += 1

print(f"Updated Response.json -> NextResponse.json in {count} route files.")
