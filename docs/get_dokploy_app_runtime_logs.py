import requests
import json
import sys

DOKPLOY_URL = "http://152.53.111.217:3005"
API_KEY = "UIoOLzCywHozJQVxSkRSkCGxIgETYcxjfjGJBohBeolAVXaONCWvJtcLFVrInDxl"
APP_ID = "D2WEVGcagZDHunlcBmc-U"

headers = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json"
}

log_resp = requests.get(
    f"{DOKPLOY_URL}/api/trpc/application.readLogs?input=" + json.dumps({"json": {"applicationId": APP_ID}}),
    headers=headers
)
logs = log_resp.json()['result']['data']['json']
with open("c:/AppDev 2026/41.DrHuxon/temp_skillmarket/docs/runtime_log.txt", "w", encoding="utf-8") as f:
    f.write(logs)

lines = logs.splitlines()
print(f"Total log lines: {len(lines)}")
for l in lines[-30:]:
    print(l.encode('ascii', errors='backslashreplace').decode('ascii'))
