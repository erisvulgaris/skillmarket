import urllib.request
import json

urls = [
    "http://152.53.111.217:8085/",
    "http://152.53.111.217:8085/api/marketplace/services",
    "http://152.53.111.217:8085/api/marketplace/categories"
]

for url in urls:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Host": "152.53.111.217:8085"})
        with urllib.request.urlopen(req, timeout=10) as res:
            body = res.read().decode('utf-8')
            print(f"[{res.status}] {url} -> {len(body)} bytes")
            if "application/json" in res.headers.get('Content-Type', ''):
                print(f"   JSON snippet: {body[:150]}")
    except Exception as e:
        print(f"Error fetching {url}: {e}")
