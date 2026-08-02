import os

ADMIN_DIR = "c:/AppDev 2026/41.DrHuxon/temp_skillmarket/src/app/api/admin"

files_to_fix = [
    "cms/[slug]/route.ts",
    "support/[id]/notes/route.ts",
    "users/[id]/route.ts",
    "wallets/[id]/route.ts"
]

for rel_path in files_to_fix:
    path = os.path.join(ADMIN_DIR, rel_path)
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as file:
            content = file.read()

        if content.endswith("  })(req)\n}\n"):
            print(f"Fixing closing brace in {rel_path}")
            content = content[:-4]
            with open(path, "w", encoding="utf-8") as file:
                file.write(content)

print("Fixed closing braces.")
