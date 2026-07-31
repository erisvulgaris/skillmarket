import json
import urllib.request
import urllib.parse
import time
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
    print("Updating application environment variables via application.update...")
    
    env_content = "NIXPACKS_NODE_VERSION=20\nDATABASE_URL=file:/data/skillmarket.db\nNODE_ENV=production\nNEXT_PUBLIC_BASE_URL=https://skillcart.shop\nRAZORPAY_KEY_ID=rzp_live_RyhshDxLuZASF6\nNEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_RyhshDxLuZASF6\nRAZORPAY_KEY_SECRET=5qhoE4dsqCuLLWic8ALhn43K"

    post("application.update", {
        "applicationId": app_id,
        "env": env_content,
        "cleanCache": True
    })

    print("Triggering deployment for commit 5727e6e...")
    res = post("application.deploy", {"applicationId": app_id})
    print("Deploy response:", res)

    time.sleep(5)
    for i in range(40):
        try:
            app_details = get("application.one", {"applicationId": app_id})
            status = app_details.get("applicationStatus")
            deployments = app_details.get("deployments", [])
            latest_deploy = deployments[0] if deployments else {}
            title = latest_deploy.get('title', '')
            d_status = latest_deploy.get('status', '')
            print(f"[{i*10}s] App Status: {status} | Deploy Status: {d_status} | Title: {title}")
            
            if d_status == "done" and "razorpay" in title.lower():
                print("Deployment completed successfully!")
                break
            elif d_status == "error" and "razorpay" in title.lower():
                print("Deployment failed!")
                break
        except Exception as e:
            print("Error polling status:", e)
        time.sleep(10)
