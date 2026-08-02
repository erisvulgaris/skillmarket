import requests
import json

DOKPLOY_URL = "http://152.53.111.217:3005"
API_KEY = "UIoOLzCywHozJQVxSkRSkCGxIgETYcxjfjGJBohBeolAVXaONCWvJtcLFVrInDxl"
APP_ID = "D2WEVGcagZDHunlcBmc-U"

headers = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json"
}

resp = requests.get(
    f"{DOKPLOY_URL}/api/trpc/application.one?input=" + json.dumps({"json": {"applicationId": APP_ID}}),
    headers=headers
)
app_data = resp.json()['result']['data']['json']
print("App status:", app_data.get("applicationStatus"))

# Get deployments log
dep_resp = requests.get(
    f"{DOKPLOY_URL}/api/trpc/deployment.all?input=" + json.dumps({"json": {"applicationId": APP_ID}}),
    headers=headers
)
deps = dep_resp.json()['result']['data']['json']
if deps:
    print("Latest deployment status:", deps[0]['status'])
    print("Log head/tail:")
    log = deps[0].get('log', '')
    print(log[-1000:] if log else "No log")
