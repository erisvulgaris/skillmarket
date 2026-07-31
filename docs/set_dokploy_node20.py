import json
import urllib.request
import urllib.parse
import sys

sys.stdout.reconfigure(encoding='utf-8')

API_URL = "http://152.53.111.217:3005/api/trpc"
API_KEY = "UIoOLzCywHozJQVxSkRSkCGxIgETYcxjfjGJBohBeolAVXaONCWvJtcLFVrInDxl"
HEADERS = {
    "Content-Type": "application/json",
    "x-api-key": API_KEY
}

def post(endpoint, payload):
    url = f"{API_URL}/{endpoint}"
    data = json.dumps({"json": payload}).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=HEADERS, method='POST')
    with urllib.request.urlopen(req, timeout=30) as resp:
        res_data = json.loads(resp.read().decode('utf-8'))
        return res_data['result']['data']['json']

if __name__ == '__main__':
    app_id = "D2WEVGcagZDHunlcBmc-U"
    print("Setting NIXPACKS_NODE_VERSION=20 via application.update...")
    
    env_str = "NIXPACKS_NODE_VERSION=20\nDATABASE_URL=file:/data/skillmarket.db\nNODE_ENV=production\nNEXT_PUBLIC_BASE_URL=https://skillcart.shop"

    res1 = post("application.update", {
        "applicationId": app_id,
        "env": env_str,
        "cleanCache": True
    })
    print("Update response:", res1.get("appName"), res1.get("env"))
    
    print("Triggering fresh deploy...")
    res2 = post("application.deploy", {"applicationId": app_id})
    print("Deploy response:", res2)
