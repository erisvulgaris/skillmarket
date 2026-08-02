import os
import re

API_DIR = "c:/AppDev 2026/41.DrHuxon/temp_skillmarket/src/app/api"

count = 0
for root, dirs, files in os.walk(API_DIR):
    for f in files:
        if f == "route.ts":
            path = os.path.join(root, f)
            with open(path, "r", encoding="utf-8") as file:
                content = file.read()

            modified = False
            lines = content.splitlines()
            new_lines = []
            for line in lines:
                if "if (!req || !req.url" in line or "process.env.IS_BUILD_TIME" in line:
                    if "isBuildOrWorker" not in line:
                        line = "  if (isBuildOrWorker(req)) return NextResponse.json({ success: true, data: {} })"
                        modified = True
                new_lines.append(line)

            if modified:
                new_content = "\n".join(new_lines)
                if "isBuildOrWorker" not in content:
                    if "import { ok," in new_content:
                        new_content = new_content.replace("import { ok,", "import { isBuildOrWorker, ok,")
                    elif "import { ok }" in new_content:
                        new_content = new_content.replace("import { ok }", "import { isBuildOrWorker, ok }")
                    elif "from '@/lib/api'" in new_content:
                        new_content = new_content.replace("from '@/lib/api'", ", isBuildOrWorker } from '@/lib/api'")
                    else:
                        new_content = "import { isBuildOrWorker } from '@/lib/api'\n" + new_content

                with open(path, "w", encoding="utf-8") as file:
                    file.write(new_content)
                print(f"Applied isBuildOrWorker in {os.path.relpath(path, API_DIR)}")
                count += 1

print(f"Updated {count} route files.")
