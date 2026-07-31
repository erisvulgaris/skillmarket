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
    deployments = app_details.get("deployments", [])
    for d in deployments:
        if d.get("status") == "error":
            print(f"Deployment ID: {d.get('deploymentId')} | Title: {d.get('title')}")
            try:
                # Try deployment.log or application.readLogs
                log_data = get("deployment.byDeploymentId", {"deploymentId": d.get("deploymentId")})
                print("Log Data:", log_data)
            except Exception as e:
                print("Could not fetch log directly:", e)
            break
