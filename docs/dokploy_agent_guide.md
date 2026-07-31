# Dokploy Usage & Integration Guide for AI Agents

Welcome, Agent! This document outlines how to use the self-hosted **Dokploy** instance installed on this server (`152.53.111.217`) to manage deployments, create new projects, and inspect existing applications.

---

## 1. System Topology & Port Mappings

This server runs several key services. Do **NOT** modify or bind anything to the standard ports of the existing services:

*   **Nginx Proxy Manager:** Port `80` (HTTP), `443` (HTTPS), and `81` (Admin Dashboard, path `/access`).
*   **Webmin / Virtualmin:** Port `10000` (HTTPS) and `20000` (miniserv).
*   **Pocketbase:** Port `8091` (HTTP).
*   **Upscone Frontend:** Port `3000` (HTTP).
*   **Dokploy Dashboard:** Port **`3005`** (HTTP).
*   **Dokploy Traefik (Edge Routing):** Port **`8085`** (HTTP) and **`8443`** (HTTPS/UDP).

---

## 2. API Authentication

Dokploy has a built-in tRPC-based API that handles all resource creation and deployment tasks. Authentication is performed via the `x-api-key` header.

*   **API Key:** `UIoOLzCywHozJQVxSkRSkCGxIgETYcxjfjGJBohBeolAVXaONCWvJtcLFVrInDxl`
*   **Header Format:** `x-api-key: UIoOLzCywHozJQVxSkRSkCGxIgETYcxjfjGJBohBeolAVXaONCWvJtcLFVrInDxl`
*   **API Base URL:** `http://localhost:3005/api/trpc` (or `http://152.53.111.217:3005/api/trpc`)

---

## 3. Common tRPC API Operations

Dokploy uses tRPC with SuperJSON serialization. For mutation operations (POST), payloads must be wrapped inside a `json` field in the request body.

### A. List All Projects
*   **Method:** `GET`
*   **Endpoint:** `/api/trpc/project.all`
*   **cURL Example:**
    ```bash
    curl -X GET "http://localhost:3005/api/trpc/project.all" \
      -H "x-api-key: UIoOLzCywHozJQVxSkRSkCGxIgETYcxjfjGJBohBeolAVXaONCWvJtcLFVrInDxl"
    ```

### B. Create a New Project
*   **Method:** `POST`
*   **Endpoint:** `/api/trpc/project.create`
*   **Payload Format:**
    ```json
    {
      "json": {
        "name": "my-new-project",
        "description": "Optional project description"
      }
    }
    ```
*   **cURL Example:**
    ```bash
    curl -X POST "http://localhost:3005/api/trpc/project.create" \
      -H "Content-Type: application/json" \
      -H "x-api-key: UIoOLzCywHozJQVxSkRSkCGxIgETYcxjfjGJBohBeolAVXaONCWvJtcLFVrInDxl" \
      -d '{"json":{"name":"my-new-project"}}'
    ```

### C. Deploy an Application
To trigger the deployment or redeployment of an application:
*   **Method:** `POST`
*   **Endpoint:** `/api/trpc/application.deploy`
*   **Payload Format:**
    ```json
    {
      "json": {
        "applicationId": "YOUR-APPLICATION-ID"
      }
    }
    ```
*   **cURL Example:**
    ```bash
    curl -X POST "http://localhost:3005/api/trpc/application.deploy" \
      -H "Content-Type: application/json" \
      -H "x-api-key: UIoOLzCywHozJQVxSkRSkCGxIgETYcxjfjGJBohBeolAVXaONCWvJtcLFVrInDxl" \
      -d '{"json":{"applicationId":"some-app-id"}}'
    ```

---

## 4. Reverse Proxying Deployed Apps via Nginx Proxy Manager

Because Nginx Proxy Manager (NPM) owns ports `80`/`443`, all public traffic to the server flows through NPM first. Dokploy's internal Traefik router listens on alternative host ports `8085`/`8443`.

To deploy an app (e.g. `myapp.domain.com`) on Dokploy and make it publicly accessible:

1.  **Configure in Dokploy:**
    *   Deploy the application inside a project.
    *   In the app settings, set the domain name (e.g. `myapp.domain.com`). Traefik will map this route internally.
2.  **Configure in Nginx Proxy Manager:**
    *   Log in to NPM (`http://152.53.111.217:81/access`).
    *   Create a new **Proxy Host**.
    *   **Domain Names:** `myapp.domain.com`
    *   **Scheme:** `http`
    *   **Forward Hostname / IP:** `152.53.111.217` (or Docker bridge gateway `172.17.0.1`)
    *   **Forward Port:** `8085` (HTTP port of Dokploy's Traefik).
    *   **SSL Option:** Enable SSL and request a Let's Encrypt certificate inside NPM.

---

## 5. Direct Database & Credentials Access

If you need to query or verify the Postgres database directly (e.g. inspecting schema modifications, checking users, or API keys):

*   **Psql Query Command:**
    ```bash
    docker exec -it $(docker ps -q -f name=dokploy-postgres) psql -U dokploy -d dokploy
    ```
*   **Saved Credentials Sheet:**
    Full details on credentials (including Postgres password, auth secrets, etc.) are saved on the server at:
    `/root/dokploy_credentials.txt`
