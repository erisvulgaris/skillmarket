import os

API_DIR = "c:/AppDev 2026/41.DrHuxon/temp_skillmarket/src/app/api"

count = 0
for root, dirs, files in os.walk(API_DIR):
    for f in files:
        if f == "route.ts":
            path = os.path.join(root, f)
            with open(path, "r", encoding="utf-8") as file:
                content = file.read()

            if "return adminLimit(async" in content and "})(req)" not in content:
                print(f"Fixing adminLimit closing call in {os.path.relpath(path, API_DIR)}")
                # Replace trailing }) before export async function GET with })(req)\n}\n
                content = content.replace("  } catch (e) {\n    return handleError(e)\n  }\n})\n", "  } catch (e) {\n    return handleError(e)\n  }\n  })(req)\n}\n")
                with open(path, "w", encoding="utf-8") as file:
                    file.write(content)
                count += 1

print(f"Fixed {count} files.")
