import os

API_DIR = "c:/AppDev 2026/41.DrHuxon/temp_skillmarket/src/app/api"

count = 0
for root, dirs, files in os.walk(API_DIR):
    for f in files:
        if f == "route.ts":
            path = os.path.join(root, f)
            with open(path, "r", encoding="utf-8") as file:
                content = file.read()

            if "NextNextResponse" in content:
                print(f"Fixing NextNextResponse -> NextResponse in {os.path.relpath(path, API_DIR)}")
                new_content = content.replace("NextNextResponse", "NextResponse")
                with open(path, "w", encoding="utf-8") as file:
                    file.write(new_content)
                count += 1

print(f"Fixed NextNextResponse in {count} route files.")
