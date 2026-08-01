import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Call public seed/toggle API endpoint to disable telegram-services
url = "https://skillcart.shop/api/seed"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        print("Seed API Response:", resp.read().decode('utf-8'))
except Exception as e:
    print("Seed API Error:", e)
