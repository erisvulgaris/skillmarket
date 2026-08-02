import os
import re

files_to_fix = [
    "c:/AppDev 2026/41.DrHuxon/temp_skillmarket/src/app/api/admin/cms/route.ts",
    "c:/AppDev 2026/41.DrHuxon/temp_skillmarket/src/app/api/admin/dashboard/route.ts",
    "c:/AppDev 2026/41.DrHuxon/temp_skillmarket/src/app/api/admin/feature-flags/route.ts",
    "c:/AppDev 2026/41.DrHuxon/temp_skillmarket/src/app/api/admin/fraud/route.ts",
    "c:/AppDev 2026/41.DrHuxon/temp_skillmarket/src/app/api/admin/settings/route.ts",
    "c:/AppDev 2026/41.DrHuxon/temp_skillmarket/src/app/api/payments/razorpay/key/route.ts",
    "c:/AppDev 2026/41.DrHuxon/temp_skillmarket/src/app/api/users/block/route.ts"
]

for path in files_to_fix:
    with open(path, "r", encoding="utf-8") as file:
        content = file.read()
    content = re.sub(r'\}\)\(req as Request\)\s*\}', '})()\n}', content)
    with open(path, "w", encoding="utf-8") as file:
        file.write(content)
    print(f"Fixed {os.path.basename(path)}")
