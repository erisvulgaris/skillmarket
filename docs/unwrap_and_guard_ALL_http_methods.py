import os
import re

API_DIR = "c:/AppDev 2026/41.DrHuxon/temp_skillmarket/src/app/api"

methods = ["GET", "POST", "PUT", "PATCH", "DELETE"]

count = 0
for root, dirs, files in os.walk(API_DIR):
    for f in files:
        if f == "route.ts":
            path = os.path.join(root, f)
            with open(path, "r", encoding="utf-8") as file:
                content = file.read()

            modified = False

            # Step 1: Fix unwrapped functions where })(req as Request) was added incorrectly
            for m in methods:
                # Find inner function args
                pattern_fn_args = rf'export\s+async\s+function\s+{m}\s*\(([^\)]*)\)'
                match_fn = re.search(pattern_fn_args, content)
                if match_fn:
                    fn_args = match_fn.group(1).strip()
                    if "params" in fn_args or "ctx" in fn_args:
                        # Dynamic route: expects (req, ctx)
                        call_sig = "})(req as Request, ctx as any)"
                        content = re.sub(r'\}\)\(req as Request\)\s*\}', call_sig + "\n}", content)
                        modified = True
                    elif not fn_args or fn_args == "req?: Request" or fn_args == "req: Request":
                        # Check inner function declaration inside adminLimit
                        pattern_inner = rf'return\s+(adminLimit|rateLimit|strictLimit|transferLimit|messageLimit|apiLimit)\s*\(\s*async\s+function\s+{m}\s*\(([^\)]*)\)'
                        match_inner = re.search(pattern_inner, content)
                        if match_inner:
                            inner_args = match_inner.group(2).strip()
                            if not inner_args:
                                # Inner takes 0 args
                                call_sig = "})()"
                                content = re.sub(r'\}\)\(req as Request\)\s*\}', call_sig + "\n}", content)
                                modified = True
                            elif "params" in inner_args or "ctx" in inner_args:
                                call_sig = "})(req as Request, ctx as any)"
                                content = re.sub(r'\}\)\(req as Request\)\s*\}', call_sig + "\n}", content)
                                modified = True

            if modified:
                with open(path, "w", encoding="utf-8") as file:
                    file.write(content)
                print(f"Fixed call sig in {os.path.relpath(path, API_DIR)}")
                count += 1

print(f"Fixed call sig in {count} route files.")
