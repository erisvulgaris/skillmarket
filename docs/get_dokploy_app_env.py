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
data = resp.json()
print("App config keys:", data.keys() if 'result' in data else data)
if 'result' in data:
    app = data['result']['data']['json']
    print("App fields:", app.keys())
    print("Dockerfile field:", app.get('dockerfile'), app.get('dockerfilePath'))
