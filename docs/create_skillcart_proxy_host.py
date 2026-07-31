import requests
import json
import time

NPM_BASE = "http://152.53.111.217:81"

def run():
    print("1. Logging into Nginx Proxy Manager...")
    login_resp = requests.post(f"{NPM_BASE}/api/tokens", json={
        "identity": "eriskota@gmail.com",
        "secret": "xir4MhiRSgA3mmU"
    })
    
    if login_resp.status_code != 200:
        print("Login failed:", login_resp.status_code, login_resp.text)
        return

    token = login_resp.json()["token"]
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Check existing proxy hosts
    hosts_resp = requests.get(f"{NPM_BASE}/api/nginx/proxy-hosts", headers=headers)
    existing_host = None
    if hosts_resp.status_code == 200:
        for host in hosts_resp.json():
            if "skillcart.shop" in host.get("domain_names", []):
                existing_host = host
                print("Found existing proxy host:", host["id"])
                break

    domain_names = ["skillcart.shop", "www.skillcart.shop"]

    if not existing_host:
        print("2. Creating Proxy Host for skillcart.shop...")
        payload = {
            "domain_names": domain_names,
            "forward_scheme": "http",
            "forward_host": "152.53.111.217",
            "forward_port": 8085,
            "caching_enabled": False,
            "block_exploits": True,
            "allow_websocket_upgrade": True,
            "access_list_id": 0,
            "ssl_forced": False,
            "certificate_id": 0
        }
        res = requests.post(f"{NPM_BASE}/api/nginx/proxy-hosts", headers=headers, json=payload)
        print("Create Status:", res.status_code)
        if res.status_code in [200, 201]:
            existing_host = res.json()
            print("Created Host ID:", existing_host["id"])
        else:
            print("Creation response:", res.text)
            return
    
    host_id = existing_host["id"]

    print(f"3. Requesting SSL certificate for host {host_id}...")
    ssl_payload = {
        "domain_names": domain_names,
        "forward_scheme": "http",
        "forward_host": "152.53.111.217",
        "forward_port": 8085,
        "caching_enabled": False,
        "block_exploits": True,
        "allow_websocket_upgrade": True,
        "access_list_id": 0,
        "ssl_forced": True,
        "certificate_id": "new",
        "meta": {
            "letsencrypt_email": "eriskota@gmail.com",
            "letsencrypt_agree": True
        }
    }
    
    ssl_res = requests.put(f"{NPM_BASE}/api/nginx/proxy-hosts/{host_id}", headers=headers, json=ssl_payload)
    print("SSL Update Status Code:", ssl_res.status_code)
    try:
        print(json.dumps(ssl_res.json(), indent=2))
    except Exception:
        print(ssl_res.text)

if __name__ == "__main__":
    run()
