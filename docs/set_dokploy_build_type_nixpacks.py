import requests
import json

DOKPLOY_URL = "http://152.53.111.217:3005"
API_KEY = "UIoOLzCywHozJQVxSkRSkCGxIgETYcxjfjGJBohBeolAVXaONCWvJtcLFVrInDxl"
APP_ID = "D2WEVGcagZDHunlcBmc-U"

headers = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json"
}

print("Updating Dokploy application configuration...")
requests.post(
    f"{DOKPLOY_URL}/api/trpc/application.update",
    headers=headers,
    json={"json": {
        "applicationId": APP_ID,
        "buildType": "nixpacks",
        "command": "sh start.sh"
    }}
)
print("Updated application config.")
