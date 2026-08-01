import requests
import json

DOKPLOY_URL = "http://152.53.111.217:3005"
API_KEY = "UIoOLzCywHozJQVxSkRSkCGxIgETYcxjfjGJBohBeolAVXaONCWvJtcLFVrInDxl"
LOG_PATH = "/etc/dokploy/logs/app-index-primary-port-q3l9v5/app-index-primary-port-q3l9v5-2026-08-01:09:11:24.log"

headers = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json"
}

url = f"{DOKPLOY_URL}/api/trpc/deployment.readLogs?input=" + json.dumps({"json": {"deploymentId": "1iPn85SMONJNRgWFkGK02"}})
res = requests.get(url, headers=headers)
log_text = res.json()['result']['data']['json']
with open("c:/AppDev 2026/41.DrHuxon/temp_skillmarket/docs/build_log.txt", "w", encoding="utf-8") as f:
    f.write(log_text)

print("Wrote build log to docs/build_log.txt. Last 20 lines:")
lines = log_text.split('\n')
for line in lines[-25:]:
    print(line)
