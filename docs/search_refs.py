import os

SRC_DIR = "c:/AppDev 2026/41.DrHuxon/temp_skillmarket/src"

for root, dirs, files in os.walk(SRC_DIR):
    for f in files:
        if f.endswith(".ts") or f.endswith(".tsx"):
            path = os.path.join(root, f)
            with open(path, "r", encoding="utf-8") as file:
                content = file.read()
            if "admin/analytics" in content:
                print(f"Match in {os.path.relpath(path, SRC_DIR)}")
