import os

API_DIR = "c:/AppDev 2026/41.DrHuxon/temp_skillmarket/src/app/api"

count = 0
for root, dirs, files in os.walk(API_DIR):
    for f in files:
        if f == "route.ts":
            path = os.path.join(root, f)
            with open(path, "r", encoding="utf-8") as file:
                content = file.read()

            if "export const dynamic = 'force-dynamic'" not in content and 'export const dynamic = "force-dynamic"' not in content:
                print(f"Adding force-dynamic to {os.path.relpath(path, API_DIR)}")
                new_content = "export const dynamic = 'force-dynamic'\n" + content
                with open(path, "w", encoding="utf-8") as file:
                    file.write(new_content)
                count += 1

print(f"Added force-dynamic to {count} route.ts files.")
