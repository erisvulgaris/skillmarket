import requests
import json

DOKPLOY_URL = "http://152.53.111.217:3005"
API_KEY = "UIoOLzCywHozJQVxSkRSkCGxIgETYcxjfjGJBohBeolAVXaONCWvJtcLFVrInDxl"
APP_ID = "D2WEVGcagZDHunlcBmc-U"

headers = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json"
}

# Try application.getLog or container logs
resp = requests.get(
    f"{DOKPLOY_URL}/api/trpc/application.one?input=" + json.dumps({"json": {"applicationId": APP_ID}}),
    headers=headers
)
app_data = resp.json()['result']['data']['json']
print("App Data Keys:", list(app_data.keys()))
print("App Status:", app_data.get("applicationStatus"))

# Try fetching logs endpoint
try:
    log_resp = requests.get(
        f"{DOKPLOY_URL}/api/trpc/application.readLogs?input=" + json.dumps({"json": {"applicationId": APP_ID}}),
        headers=headers
    )
    print("Logs response:", log_resp.text[:500])
except Exception as e:
    print("Log fetch error:", e)
