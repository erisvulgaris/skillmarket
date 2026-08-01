import requests
import json

DOKPLOY_URL = "http://152.53.111.217:3005"
API_KEY = "UIoOLzCywHozJQVxSkRSkCGxIgETYcxjfjGJBohBeolAVXaONCWvJtcLFVrInDxl"

headers = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json"
}

print("1. Calling application.reload...")
res1 = requests.post(
    f"{DOKPLOY_URL}/api/trpc/application.reload",
    headers=headers,
    json={"json": {"applicationId": "D2WEVGcagZDHunlcBmc-U", "appName": "skillcart-shop"}}
)
print("Reload response:", res1.json())

print("2. Calling application.deploy...")
res2 = requests.post(
    f"{DOKPLOY_URL}/api/trpc/application.deploy",
    headers=headers,
    json={"json": {"applicationId": "D2WEVGcagZDHunlcBmc-U", "title": "Deploy latest main commit"}}
)
print("Deploy response:", res2.json())
