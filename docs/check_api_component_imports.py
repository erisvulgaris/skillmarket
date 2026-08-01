import os

API_DIR = "c:/AppDev 2026/41.DrHuxon/temp_skillmarket/src/app/api"

found = 0
for root, dirs, files in os.walk(API_DIR):
    for f in files:
        if f.endswith(".ts"):
            path = os.path.join(root, f)
            with open(path, "r", encoding="utf-8") as file:
                lines = file.readlines()
            for idx, line in enumerate(lines):
                if "@/components/" in line:
                    print(f"File {os.path.relpath(path, API_DIR)} line {idx+1}: {line.strip()}")
                    found += 1

print(f"Found {found} imports from @/components/ in API routes.")
