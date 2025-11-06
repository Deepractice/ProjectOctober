# Deepractice Agent Docker

Lightweight Docker image using `@deepractice-ai/agent-cli` from npm.

## Quick Start

### Option 1: Docker Run

```bash
docker run -d \
  --name agent \
  -p 5200:5200 \
  -e ANTHROPIC_API_KEY=your-key-here \
  -v $(pwd):/project \
  deepracticexs/agent:latest
```

**Access**: http://localhost:5200

### Option 2: Docker Compose (Recommended)

1. Create `.env` file:

```bash
cp .env.example .env
```

2. Edit `.env` with your API key:

```env
ANTHROPIC_API_KEY=sk-ant-xxxxx
ANTHROPIC_BASE_URL=https://api.anthropic.com
PROJECT_PATH=.
```

3. Start the service:

```bash
docker-compose up -d
```

4. View logs:

```bash
docker-compose logs -f
```

5. Stop the service:

```bash
docker-compose down
```

## Configuration

### Required Environment Variables

- `ANTHROPIC_API_KEY`: Your Anthropic API key ([Get one here](https://console.anthropic.com/))

### Optional Environment Variables

- `ANTHROPIC_BASE_URL`: API endpoint (default: `https://api.anthropic.com`)
- `PROJECT_PATH`: Project directory to mount (default: current directory `.`)
- `PORT`: Server port (default: `5200`)

## Architecture

This lightweight Docker image:

- Uses `node:20-alpine` (~180MB compressed)
- Installs `@deepractice-ai/agent-cli` from npm
- Runs `agentx http` command
- Mounts your project directory at `/project`

**Single container serving**:

- Frontend (React SPA)
- Backend (Express API)
- WebSocket (Agent communication)

```
Container (port 5200)
├─ agentx CLI
   └─ agent-service
      ├─ Static files (/)
      ├─ API (/api/*)
      └─ WebSocket (/ws, /shell)
```

## Build from Source

```bash
# Build the image
docker build -t deepracticexs/agent:latest .

# Or use the build script
./build.sh
```

## Port Specification

Deepractice standard port allocation:

- **5200**: Agent service (unified production port)
- 5173: Vite dev server (development only, not in Docker)
- 5203: Reserved for future MCP service

## Volumes

- `/project`: Your project directory (read/write)
  - This is where the agent can read and modify your code

## Health Check

The container includes a health check endpoint:

```bash
curl http://localhost:5200/api/health
```

Expected response:

```json
{ "status": "ok", "service": "agent-service" }
```

## Troubleshooting

### Port Already in Use

Use a different host port:

```bash
docker run -p 8080:5200 ...
# Access at http://localhost:8080
```

### Permission Issues

Ensure your project directory is readable:

```bash
ls -la $(pwd)
```

### View Logs

```bash
# Docker run
docker logs -f agent

# Docker compose
docker-compose logs -f
```

### Container Won't Start

Check if ANTHROPIC_API_KEY is set:

```bash
docker exec agent env | grep ANTHROPIC
```

## Image Size

- **Base**: node:20-alpine (~120MB)
- **With agent-cli**: ~180MB compressed
- **Disk space**: ~450MB uncompressed

Much smaller than the previous full-build image (~900MB).

## Upgrading

```bash
# Pull latest image
docker pull deepracticexs/agent:latest

# Restart container
docker-compose down
docker-compose up -d
```

## Related

- [Main README](../README.md) - Project overview
- [Agent CLI](../apps/agent-cli/README.md) - CLI documentation
- [Development Guide](../CONTRIBUTING.md) - Build from source
