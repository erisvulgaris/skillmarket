SCHEMA = "c:/AppDev 2026/41.DrHuxon/temp_skillmarket/prisma/schema.prisma"

with open(SCHEMA, "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if "SupportTicket" in l:
        print(f"Line {i+1}: {l.strip()}")
