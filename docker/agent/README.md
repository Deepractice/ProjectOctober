# Agent Docker Image

Full-stack AI Agent application with frontend and backend in a single container.

## Quick Start

### 1. Using Docker Run

```bash
docker run -d \
  --name agent \
  -p 5200:5200 \
  -e ANTHROPIC_API_KEY=your-key-here \
  -v $(pwd):/project \
  deepracticexs/agent:latest
```

Access at: http://localhost:5200

### 2. Using Docker Compose (Recommended)

```bash
# Create .env file
cp .env.example .env
# Edit .env with your API key

# Start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## Configuration

### Required Environment Variables

- `ANTHROPIC_API_KEY`: Your Anthropic API key

### Optional Environment Variables

- `ANTHROPIC_BASE_URL`: API endpoint (default: https://api.anthropic.com)
- `PROJECT_PATH`: Project directory to mount (default: current directory)

## Port Specification

Deepractice standard port allocation:
- **5200**: Agent (complete application - frontend + backend + WebSocket)
- 5201: Reserved (future: separate frontend)
- 5202: Reserved (future: separate API)
- 5203: Reserved (future: MCP service)

## Architecture

Single container running:
- **Frontend**: React app (built to static files)
- **Backend**: Node.js Express server (serves frontend + API)
- **Port**: 5200 (both UI and API)

```
Container
├─ Node.js (port 5200)
   ├─ Static files (/)
   ├─ API (/api/*)
   └─ WebSocket (/ws, /shell)
```

## Build from Source

```bash
# Build runtime first (one-time)
cd ../runtime
./build.sh

# Build agent
cd ../agent
./build.sh
```

## Volumes

- `/project`: Your project directory (read/write)
- `/opt/claude-config`: Agent data and sessions
- `/home/node/.ssh`: SSH keys (optional, read-only)
- `/home/node/.gitconfig`: Git config (optional, read-only)

## Health Check

```bash
curl http://localhost:5200/health
```

Expected response: `{"status":"ok","service":"agent-service"}`

## Troubleshooting

### Port already in use
```bash
# Use different port (map host port 8080 to container port 5200)
docker run -p 8080:5200 ...
```

### Permission issues
```bash
# Check project directory permissions
ls -la $(pwd)
```

### View logs
```bash
docker logs -f agent
```

## Image Size

Approximately ~900MB (compressed ~350MB)

## Base Image

Built on `deepracticexs/agent-runtime:latest`
