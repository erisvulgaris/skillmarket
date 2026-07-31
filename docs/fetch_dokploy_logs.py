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

def get(endpoint, params=None):
    url = f"{API_URL}/{endpoint}"
    if params:
        param_str = urllib.parse.quote(json.dumps({"json": params}))
        url += f"?input={param_str}"
    req = urllib.request.Request(url, headers=HEADERS, method='GET')
    with urllib.request.urlopen(req, timeout=30) as resp:
        res_data = json.loads(resp.read().decode('utf-8'))
        return res_data['result']['data']['json']

if __name__ == '__main__':
    app_id = "D2WEVGcagZDHunlcBmc-U"
    app_details = get("application.one", {"applicationId": app_id})
    print("Application Status:", app_details.get("applicationStatus"))
    deployments = app_details.get("deployments", [])
    for d in deployments[:5]:
        print(f"Deployment: ID={d.get('deploymentId')}, Status={d.get('status')}, Title={d.get('title')}")
