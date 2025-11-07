# @deepractice-ai/agent

A full-stack AI Agent application with web UI, server, and CLI - powered by Claude.

## Features

- 🎨 **Modern Web UI** - React-based interface for interacting with Claude
- 🚀 **Express Server** - HTTP + WebSocket support for real-time communication
- ⚡ **CLI Tool** - Command-line interface for quick deployments
- 📦 **All-in-One** - Server, web UI, and CLI bundled together
- 🔧 **Configurable** - Environment-based configuration management

## Quick Start

### Using npx (Recommended)

```bash
npx @deepractice-ai/agent http --anthropic-api-key YOUR_API_KEY
```

### Global Installation

```bash
npm install -g @deepractice-ai/agent
agentx http --anthropic-api-key YOUR_API_KEY
```

Visit http://localhost:5200 to access the web UI.

### Using Environment Variables

Create a `.env` file:

```env
ANTHROPIC_API_KEY=your_api_key_here
PORT=5200
PROJECT_PATH=/path/to/your/project
```

Then run:

```bash
agentx http
```

## CLI Options

```bash
agentx http [options]

Options:
  --host <host>                 Host to bind to (default: "0.0.0.0")
  --port <port>                 Port to listen on (default: "5200")
  --project <path>              Project directory path
  --anthropic-api-key <key>     Anthropic API key
  --anthropic-base-url <url>    Anthropic API base URL
  -h, --help                    Display help
  -V, --version                 Display version
```

## Environment Variables

| Variable             | Description               | Default      |
| -------------------- | ------------------------- | ------------ |
| `ANTHROPIC_API_KEY`  | Claude API key (required) | -            |
| `PORT`               | Server port               | `5200`       |
| `HOST`               | Server host               | `0.0.0.0`    |
| `PROJECT_PATH`       | Project directory path    | Current dir  |
| `ANTHROPIC_BASE_URL` | Custom API endpoint       | Official API |
| `NODE_ENV`           | Environment mode          | `production` |

## Accessing the Application

After starting the server, access the web UI at:

```
http://localhost:5200
```

The server provides:

- **Web UI**: `http://localhost:5200`
- **WebSocket**: `ws://localhost:5200/ws`
- **API**: `http://localhost:5200/api/*`

## Docker

### Using Docker Hub

```bash
docker run -d -p 5200:5200 \
  -e ANTHROPIC_API_KEY=your_api_key \
  -v $(pwd):/project \
  deepracticexs/agent:latest
```

### Using Aliyun ACR (China)

```bash
docker run -d -p 5200:5200 \
  -e ANTHROPIC_API_KEY=your_api_key \
  -v $(pwd):/project \
  registry.cn-hangzhou.aliyuncs.com/deepractice/agent:latest
```

## Development

This package is part of the Deepractice AI Agent monorepo. For development:

```bash
git clone https://github.com/Deepractice/Agent.git
cd Agent
pnpm install
pnpm dev
```

Access development server at http://localhost:5173 (with HMR).

## Architecture

- **Frontend**: React + Vite + TypeScript
- **Backend**: Express + WebSocket
- **CLI**: Commander.js
- **SDK**: [@deepractice-ai/agent-sdk](https://www.npmjs.com/package/@deepractice-ai/agent-sdk)

## License

MIT

## Links

- [GitHub Repository](https://github.com/Deepractice/Agent)
- [Issues](https://github.com/Deepractice/Agent/issues)
- [Documentation](https://docs.deepractice.ai)
