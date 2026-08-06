import os

SRC_DIR = "c:/AppDev 2026/41.DrHuxon/temp_skillmarket/src"

for root, dirs, files in os.walk(SRC_DIR):
    for f in files:
        if f.endswith(".tsx") or f.endswith(".ts"):
            path = os.path.join(root, f)
            with open(path, "r", encoding="utf-8") as file:
                content = file.read()
            if "rounded" in content and "bg-emerald" in content and "S" in content:
                print(f"Found in {os.path.relpath(path, SRC_DIR)}")
            elif "isLoading" in content or "initialLoad" in content or "loading" in content and "setLoading" in content:
                if "S" in content:
                    print(f"Potential loading screen in {os.path.relpath(path, SRC_DIR)}")
