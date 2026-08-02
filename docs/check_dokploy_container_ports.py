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
data = resp.json()['result']['data']['json']
print("Name:", data.get("name"))
print("Port:", data.get("port"))
print("Domains:", data.get("domains"))
print("Redirects:", data.get("redirects"))
