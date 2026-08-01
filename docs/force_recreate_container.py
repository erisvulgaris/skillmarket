import requests
import json

DOKPLOY_URL = "http://152.53.111.217:3005"
API_KEY = "UIoOLzCywHozJQVxSkRSkCGxIgETYcxjfjGJBohBeolAVXaONCWvJtcLFVrInDxl"
APP_ID = "D2WEVGcagZDHunlcBmc-U"

headers = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json"
}

print("Setting buildType to dockerfile...")
res = requests.post(
    f"{DOKPLOY_URL}/api/trpc/application.update",
    headers=headers,
    json={"json": {
        "applicationId": APP_ID,
        "buildType": "dockerfile",
        "dockerfile": "Dockerfile",
        "cleanCache": True
    }}
)
print("Update response:", res.json())

print("Triggering fresh deploy with Dockerfile...")
res_deploy = requests.post(
    f"{DOKPLOY_URL}/api/trpc/application.deploy",
    headers=headers,
    json={"json": {"applicationId": APP_ID, "title": "Deploy with production Dockerfile"}}
)
print("Deploy response:", res_deploy.json())
