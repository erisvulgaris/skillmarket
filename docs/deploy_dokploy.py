import requests
import json
import time

DOKPLOY_URL = "http://152.53.111.217:3005"
API_KEY = "UIoOLzCywHozJQVxSkRSkCGxIgETYcxjfjGJBohBeolAVXaONCWvJtcLFVrInDxl"
APP_ID = "D2WEVGcagZDHunlcBmc-U"

headers = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json"
}

# 1. Update app git branch & clear cache
print("Setting git branch main & clearing cache...")
requests.post(
    f"{DOKPLOY_URL}/api/trpc/application.update",
    headers=headers,
    json={"json": {"applicationId": APP_ID, "customGitBranch": "main", "cleanCache": True}}
)

# 2. Trigger deployment
print("Triggering deployment...")
dep_res = requests.post(
    f"{DOKPLOY_URL}/api/trpc/application.deploy",
    headers=headers,
    json={"json": {"applicationId": APP_ID, "title": "Deploy latest main commit with custom WebP thumbnails"}}
)
print("Deploy response:", dep_res.json())

# 3. Poll for deployment status
for _ in range(30):
    time.sleep(5)
    resp = requests.get(
        f"{DOKPLOY_URL}/api/trpc/deployment.all?input=" + json.dumps({"json": {"applicationId": APP_ID}}),
        headers=headers
    )
    deployments = resp.json()['result']['data']['json']
    if deployments:
        latest = deployments[0]
        print(f"Status: {latest['status']} | Title: {latest.get('title')}")
        if latest['status'] in ['done', 'error']:
            print("Log output:")
            print(latest.get('log'))
            break
