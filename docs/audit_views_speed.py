import os

VIEWS_DIR = "c:/AppDev 2026/41.DrHuxon/temp_skillmarket/src/components/views"

for f in os.listdir(VIEWS_DIR):
    if f.endswith(".tsx"):
        path = os.path.join(VIEWS_DIR, f)
        with open(path, "r", encoding="utf-8") as file:
            content = file.read()
        if "loading" in content or "Loader2" in content or "Skeleton" in content:
            lines = content.splitlines()
            for i, line in enumerate(lines):
                if ("if (loading" in line or "if (!data" in line or "if (isLoading" in line) and "return" in lines[i+1]:
                    print(f"{f}: line {i+1} -> {line.strip()} | next line -> {lines[i+1].strip()}")
