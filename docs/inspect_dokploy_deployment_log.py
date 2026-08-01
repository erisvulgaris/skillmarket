import requests
import json

DOKPLOY_URL = "http://152.53.111.217:3005"
API_KEY = "UIoOLzCywHozJQVxSkRSkCGxIgETYcxjfjGJBohBeolAVXaONCWvJtcLFVrInDxl"

headers = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json"
}

# 1. Get deployment list
resp = requests.get(
    f"{DOKPLOY_URL}/api/trpc/deployment.all?input=" + json.dumps({"json": {"applicationId": "Rfep40ILo7B5eqYwM7D1I"}}),
    headers=headers
)
data = resp.json()
deployments = data['result']['data']['json']

if deployments:
    latest = deployments[0]
    print(f"Latest Deployment ID: {latest['deploymentId']}, Status: {latest['status']}")

    # 2. Get deployment log
    log_resp = requests.get(
        f"{DOKPLOY_URL}/api/trpc/deployment.byDeploymentId?input=" + json.dumps({"json": {"deploymentId": "gXTpU9yWEnxSlddE6eTSX"}}),
        headers=headers
    )
    log_data = log_resp.json()
    print("LOG:", log_data['result']['data']['json'].get('log'))
