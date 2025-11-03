# Agent Runtime

Base execution environment for AI agents.

## What's Inside

- **OS**: Ubuntu 22.04 LTS
- **Node.js**: v20 LTS (with npm)
- **Package Manager**: pnpm 10.15.1
- **Build Tools**: gcc, g++, make, python3 (for native modules)
- **Version Control**: git
- **Utilities**: curl, wget, vim, nano, jq, tree, htop

## Build

```bash
# Build latest version
./build.sh

# Build specific version
./build.sh 1.0.1
```

## Usage

### As Base Image

```dockerfile
FROM deepractice/agent-runtime:1.0.0

# Your application code
WORKDIR /app
COPY . .
RUN pnpm install
CMD ["node", "index.js"]
```

### Interactive Shell

```bash
docker run -it --rm deepractice/agent-runtime:latest
```

## Image Size

Approximately ~800MB (compressed ~300MB)

## Update Policy

- Rebuild when Node.js LTS version changes
- Rebuild when critical security updates available
- Version format: MAJOR.MINOR.PATCH

## Registry

Default: `docker.io/deepractice/agent-runtime`

Custom registry:
```bash
export REGISTRY=your-registry.com
./build.sh 1.0.0
```
