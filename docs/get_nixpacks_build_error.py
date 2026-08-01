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
data = resp.json()
deployments = data['result']['data']['json']
if deployments:
    latest = deployments[0]
    print("Latest deployment ID:", latest['deploymentId'])
    print("LogPath:", latest.get('logPath'))
