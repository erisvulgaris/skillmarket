import json
import urllib.request
import urllib.parse
import time

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
    print("Triggering deployment...")
    post("application.deploy", {"applicationId": app_id})
    time.sleep(5)
    
    for i in range(40):
        app_details = get("application.one", {"applicationId": app_id})
        status = app_details.get("applicationStatus")
        deployments = app_details.get("deployments", [])
        latest_deploy = deployments[0] if deployments else {}
        title = latest_deploy.get('title', '')
        d_status = latest_deploy.get('status', '')
        print(f"[{i*10}s] App Status: {status} | Deploy Status: {d_status} | Title: {title}")
        
        if d_status == "done" and "delete unused create-admin.ts" in title.lower():
            print("Deployment completed successfully!")
            break
        elif d_status == "error" and "delete unused create-admin.ts" in title.lower():
            print("Deployment failed on latest commit!")
            break
        time.sleep(10)
