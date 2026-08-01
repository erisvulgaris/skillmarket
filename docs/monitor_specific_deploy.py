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
    target_id = "Rfep40ILo7B5eqYwM7D1I"
    for i in range(40):
        try:
            app_details = get("application.one", {"applicationId": app_id})
            deployments = app_details.get("deployments", [])
            target = next((d for d in deployments if d.get('deploymentId') == target_id), None)
            if target:
                d_status = target.get('status')
                print(f"[{i*10}s] Target Deploy ({target_id}): Status={d_status} | App Status={app_details.get('applicationStatus')}")
                if d_status == "done":
                    print("SUCCESS: Target deployment finished successfully!")
                    break
                elif d_status == "error":
                    print("FAILURE: Target deployment error!")
                    break
            else:
                print(f"[{i*10}s] Deployment ID {target_id} not found")
        except Exception as e:
            print("Error polling:", e)
        time.sleep(10)
