import requests
import json

DOKPLOY_URL = "http://152.53.111.217:3005"
API_KEY = "UIoOLzCywHozJQVxSkRSkCGxIgETYcxjfjGJBohBeolAVXaONCWvJtcLFVrInDxl"

headers = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json"
}

resp = requests.get(
    f"{DOKPLOY_URL}/api/trpc/application.readLogs?input=" + json.dumps({"json": {"applicationId": "D2WEVGcagZDHunlcBmc-U"}}),
    headers=headers
)
print(json.dumps(resp.json(), indent=2))
