# Dokploy Deployment Troubleshooting and Solutions Reference

This document serves as a reference for deploying Next.js (and similar Node/ESM/database-backed) projects using self-hosted Dokploy instances, detailing critical pitfalls, error signatures, and their fixes.

---

## 1. Next.js Node Version Build Failure

### Problem / Error Signature
The Nixpacks build process fails during the Next.js compile stage:
```
TypeError: Cannot read properties of null (reading 'properties')
...
npm ERR! nextjs_tailwind_shadcn_ts@0.2.0 build: `next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/`
```
Or similar ESM syntax/engine errors because Nixpacks falls back to Node `18.x`, while Next.js 16 requires Node `>= 20.9.0`.

### Solution
Force Nixpacks to use Node 20 by setting the environment variable in Dokploy:
1. In the Dokploy app configuration, add:
   * **Key:** `NIXPACKS_NODE_VERSION`
   * **Value:** `20`
2. Keep `NODE_ENV=production`.

---

## 2. Docker Swarm Command Execution Crash Loop

### Problem / Error Signature
The container builds successfully, but goes into a continuous crash/restart loop.
`docker service ps` shows:
```
Shutdown    Complete 5 seconds ago
```
Looking at `docker inspect` for the service:
```json
"Command": [
    "npx",
    "prisma",
    "db",
    "push",
    "&&",
    "node",
    ".next/standalone/server.js"
]
```
* **Explanation:** Docker Swarm does not execute command overrides inside a shell context by default. Passing `"npx prisma db push && node ..."` directly means the `&&` is treated as a literal argument to `npx`. The container runs the prisma migration, completes successfully, and exits immediately (status 0). Swarm thinks the long-running web process stopped and recycles it endlessly.

### Solution
Use a dedicated startup script wrapped in a shell execution:
1. Create a `start.sh` file in the root of the repository:
   ```bash
   #!/bin/sh
   npx prisma db push
   node .next/standalone/server.js
   ```
2. **Crucial:** Ensure `start.sh` is saved with Unix line endings (`LF`, not `CRLF`), otherwise it will crash with interpreter syntax errors (`\r: command not found`).
3. Commit and push `start.sh` to the repository.
4. Set the Dokploy application start command to:
   ```
   /bin/sh start.sh
   ```

---

## 3. Cloudflare 525 SSL Handshake Failed

### Problem / Error Signature
Browsing the custom domain gives a Cloudflare **525 SSL Handshake Failed** screen.
* **Explanation:** Your domain DNS points to the server. Cloudflare proxy (orange cloud) sends SSL requests to host port `443` (Nginx Proxy Manager). However, NPM has no proxy host or certificate matching the domain name, failing the handshake.

### Solution
Configure Nginx Proxy Manager (NPM) to forward traffic to Dokploy's Traefik Edge Router:
1. Register the domain in Dokploy's app settings (this lets Traefik route the traffic internally when it arrives on port `8085`).
2. Log in to the NPM Admin panel (`http://<SERVER_IP>:81/access`).
3. Create a **Proxy Host**:
   * **Domain Names:** `yourdomain.com`, `www.yourdomain.com`
   * **Scheme:** `http`
   * **Forward Hostname/IP:** `<SERVER_IP>` (or local bridge gateway `172.17.0.1`)
   * **Forward Port:** `8085` (Dokploy's Traefik HTTP Port)
   * **WebSockets Support:** `true`
   * **SSL:** Request a new Let's Encrypt Certificate, agree to terms, and check **Force SSL**.
