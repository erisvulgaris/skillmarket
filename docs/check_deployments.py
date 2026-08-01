import requests
import json

DOKPLOY_URL = "http://152.53.111.217:3005"
API_KEY = "UIoOLzCywHozJQVxSkRSkCGxIgETYcxjfjGJBohBeolAVXaONCWvJtcLFVrInDxl"

headers = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json"
}

resp = requests.get(
    f"{DOKPLOY_URL}/api/trpc/deployment.all?input=" + json.dumps({"json": {"applicationId": "D2WEVGcagZDHunlcBmc-U"}}),
    headers=headers
)
deployments = resp.json()['result']['data']['json']
print(f"Total Deployments found for D2WEVGcagZDHunlcBmc-U: {len(deployments)}")
for d in deployments[:5]:
    print(f"ID: {d['deploymentId']}, Status: {d['status']}, Title: {d.get('title')}")
