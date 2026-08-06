import os

API_DIR = "c:/AppDev 2026/41.DrHuxon/temp_skillmarket/src/app/api"

for root, dirs, files in os.walk(API_DIR):
    for f in files:
        if "razorpay" in root.lower() or "pay" in f.lower():
            print(os.path.join(root, f))
