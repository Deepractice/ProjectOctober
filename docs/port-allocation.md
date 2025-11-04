# Port Allocation Specification

## Overview

Deepractice AI products use standardized port ranges to ensure consistency and avoid conflicts. Each product family has a dedicated port range that serves as its network identity.

## Port Range: 5200-5299

The Agent project uses the **5200 series** as its signature port range.

## Port Assignments

| Port | Service       | Description                        | Public Access    |
| ---- | ------------- | ---------------------------------- | ---------------- |
| 5200 | agent-web     | Web application (dev & production) | ✅ Public        |
| 5201 | agent-service | Backend API server                 | ❌ Internal only |

## Architecture

### Production Environment

```
User/Client
    ↓
[Port 5200] - agent-web (production build)
    ↓
    ├─→ /api/*  → [Port 5201] agent-service (API endpoints)
    └─→ /*      → Static files (served by agent-web)
```

In production, **agent-web** runs on port 5200 and serves both static UI files and proxies API requests to agent-service (5201).

### Development Environment

```
Developer
    ↓
[Port 5200] - agent-web (Vite dev server with HMR)
    ↓
    ├─→ /api/*  → [Port 5201] agent-service (API proxy)
    ├─→ /ws/*   → [Port 5201] agent-service (WebSocket proxy)
    └─→ /*      → packages/agent-ui (UI components)

[Port 5201] - agent-service (API server)
```

In both development and production, agent-web runs on 5200 and proxies all API/WebSocket requests to agent-service on 5201.

## Deepractice Port Standards

| Product  | Port Range | Primary Port | Description                        |
| -------- | ---------- | ------------ | ---------------------------------- |
| Agent    | 5200-5209  | 5200         | AI Agent orchestration platform    |
| PromptX  | 5203       | 5203         | MCP server and AI context platform |
| Reserved | 5210-5299  | -            | Future products                    |

## Implementation Guidelines

### Backend Service (agent-service)

**Default configuration:**

```javascript
const PORT = process.env.PORT || 5201;
```

**Development:**

```bash
PORT=5201 npm run dev
```

**Production:**

```bash
PORT=5201 npm start
# Note: In production, this runs behind the gateway on port 5200
```

### Frontend (agent-web)

**Development server:**

```bash
# In apps/agent-web/
pnpm dev  # Runs on port 5200
```

**Production build:**

```bash
# Build the web application
pnpm build

# Run production server on port 5200
PORT=5200 node server.js
```

The agent-web application imports UI components from `packages/agent-ui`.

### Production Deployment

In production, agent-web can be deployed with a reverse proxy:

```nginx
# Nginx configuration example
server {
    listen 80;
    server_name agent.deepractice.ai;

    location / {
        proxy_pass http://localhost:5200;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Or run agent-web directly on port 5200 (recommended for simplicity).

## Port Conflict Prevention

### Check Port Availability

```bash
# macOS/Linux
lsof -i :5200
lsof -i :5201
lsof -i :5202

# Windows
netstat -ano | findstr :5200
netstat -ano | findstr :5201
netstat -ano | findstr :5202
```

### Reserved Ports Registry

Maintain a registry of all used ports across Deepractice infrastructure:

```text
5200 - Agent Web (agent-web)
5201 - Agent Service (agent-service)
5203 - PromptX MCP Server
```

## Best Practices

1. **Never hardcode ports in application logic** - Always use configuration/environment variables
2. **Document port changes** - Update this file when adding new services
3. **Use port ranges consistently** - Keep related services in the same hundred (52xx)
4. **Separate development from production** - Dev servers use different ports (5202)
5. **Gateway abstraction** - Public access always through the gateway (5200)

## Firewall Rules

### Production Server

```bash
# Allow public access to gateway only
ufw allow 5200/tcp

# Block direct access to internal services
ufw deny 5201/tcp from any
ufw deny 5202/tcp from any

# Allow internal network access
ufw allow from 10.0.0.0/8 to any port 5201
```

### Development Machine

```bash
# Allow all ports for local development
# No firewall restrictions needed
```

## Future Considerations

- **5203-5209**: Reserved for Agent sub-services or modules
- **5210-5299**: Reserved for future Deepractice products
- Port 5200 may eventually become a unified gateway for all Deepractice services

---

**Last Updated**: 2025-11-04
**Maintainer**: Deepractice Infrastructure Team
