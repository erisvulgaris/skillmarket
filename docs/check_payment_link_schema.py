with open("c:/AppDev 2026/41.DrHuxon/temp_skillmarket/prisma/schema.prisma", "r", encoding="utf-8") as f:
    schema = f.read()

if "model PaymentLink" in schema:
    print("PaymentLink model exists!")
else:
    print("PaymentLink model does NOT exist yet.")
