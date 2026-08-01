import requests
import json

DOKPLOY_URL = "http://152.53.111.217:3005"
API_KEY = "UIoOLzCywHozJQVxSkRSkCGxIgETYcxjfjGJBohBeolAVXaONCWvJtcLFVrInDxl"
APP_ID = "D2WEVGcagZDHunlcBmc-U"
LOG_PATH = "/etc/dokploy/logs/app-index-primary-port-q3l9v5/app-index-primary-port-q3l9v5-2026-08-01:09:11:24.log"

headers = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json"
}

endpoints = [
    ("deployment.readLogs", {"logPath": LOG_PATH}),
    ("deployment.readLogs", {"deploymentId": "1iPn85SMONJNRgWFkGK02"}),
    ("deployment.logs", {"deploymentId": "1iPn85SMONJNRgWFkGK02"}),
    ("settings.readLog", {"logPath": LOG_PATH}),
]

for ep, inp in endpoints:
    url = f"{DOKPLOY_URL}/api/trpc/{ep}?input=" + json.dumps({"json": inp})
    res = requests.get(url, headers=headers)
    if res.status_code == 200:
        print(f"SUCCESS on {ep}:", res.json()['result']['data']['json'])
        break
    else:
        print(f"FAILED on {ep}: {res.status_code}")
