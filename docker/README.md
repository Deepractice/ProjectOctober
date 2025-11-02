# Claude Code UI - Docker Deployment

Simple 3-variable configuration. Everything else is fixed.

## Quick Start

### 1. Configure 3 Variables

Edit `docker/.env.docker`:

```bash
# 1. Your API key (required)
ANTHROPIC_API_KEY=sk-ant-xxx

# 2. API endpoint (optional)
ANTHROPIC_BASE_URL=https://api.anthropic.com

# 3. Your project path on host machine
PROJECT_PATH=/Users/sean/myproject
```

### 2. Run

```bash
cd docker
docker-compose up -d
```

### 3. Access

Open: http://localhost:3000

That's it. No other configuration needed.

## Architecture

**3 Core Variables**:
1. `ANTHROPIC_API_KEY` - Your API key
2. `ANTHROPIC_BASE_URL` - API endpoint
3. `PROJECT_PATH` - Host project path → mounted to `/project` in container

**Everything else is fixed**:
- Frontend: Port 3000 (exposed)
- Backend: Port 3001 (internal only)
- Container project path: `/project` (fixed)

### Port Mapping

- **3000** → Frontend (exposed)
- **3001** → Backend (internal, not exposed)

### Volume Mounts

| Host | Container | Purpose |
|------|-----------|---------|
| `${PROJECT_PATH}` | `/project` | Your project |
| `claude-data` | `/opt/claude-config` | Sessions & config |
| `~/.ssh` | `/home/node/.ssh` | Git SSH keys (optional) |
| `~/.gitconfig` | `/home/node/.gitconfig` | Git config (optional) |

**Key Point**: No matter what host path you mount, inside container it's always `/project`.

## Usage Example

Mount your project directory:

```bash
# Edit docker-compose.yml or set in .env.docker
PROJECT_PATH=/Users/sean/myproject docker-compose up
```

Or use docker run directly:

```bash
docker run -d \
  -p 3000:3000 \
  -v /host/path/to/project:/project \
  -v claude-data:/opt/claude-config \
  --env-file docker/.env.docker \
  --name claude-code-ui \
  claude-code-ui
```

## Development Environment

The image includes:
- Ubuntu 22.04 LTS
- Node.js 20 LTS + npm
- Claude Code CLI
- Python 3 + pip
- Git, vim, nano
- Full build toolchain (gcc, g++, make)
- Network and database tools

## File Structure

```
docker/
├── Dockerfile           # Main image definition
├── entrypoint.js        # Startup script (Node.js)
├── .env.docker          # Environment template
├── .dockerignore        # Build exclusions
├── docker-compose.yml   # Orchestration config
└── README.md           # This file
```

## Troubleshooting

### Permission Issues

If you encounter permission errors with mounted volumes:

```bash
# Check container user UID (should be 1000)
docker exec claude-code-ui id

# Fix host directory permissions
sudo chown -R 1000:1000 /host/path/to/project
```

### API Connection Issues

Check your API key and base URL:

```bash
# View environment variables
docker exec claude-code-ui env | grep ANTHROPIC

# Test API connectivity
docker exec claude-code-ui curl -I https://api.anthropic.com
```

### View Logs

```bash
# All logs
docker-compose logs -f

# Entrypoint logs only
docker logs claude-code-ui
```

## Security Notes

- Container runs as non-root user (node, UID=1000)
- API keys should be stored securely (use Docker secrets in production)
- SSH keys are mounted read-only
- Use `.env.docker.local` and add to `.gitignore` for sensitive data
