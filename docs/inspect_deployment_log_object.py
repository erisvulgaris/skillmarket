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
    f"{DOKPLOY_URL}/api/trpc/deployment.all?input=" + json.dumps({"json": {"applicationId": APP_ID}}),
    headers=headers
)
deployments = resp.json()['result']['data']['json']
for d in deployments:
    if d['deploymentId'] == '1iPn85SMONJNRgWFkGK02':
        print("Full deployment object:")
        print(json.dumps(d, indent=2))
        break
