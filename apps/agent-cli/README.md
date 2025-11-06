# @deepractice-ai/agent-cli

CLI tool for running Deepractice AI Agent - a visual AI agent interface powered by Claude.

## Quick Start

```bash
# Install globally
npm install -g @deepractice-ai/agent-cli

# Run the server
agent-cli http --anthropic-api-key YOUR_API_KEY
```

The server will start on `http://0.0.0.0:5200` by default.

## Installation

### Global Installation (Recommended)

```bash
npm install -g @deepractice-ai/agent-cli
```

### Using npx (No Installation)

```bash
npx @deepractice-ai/agent-cli http --anthropic-api-key YOUR_API_KEY
```

### Local Development

```bash
# Clone the repository
git clone https://github.com/Deepractice/Agent.git
cd Agent

# Install dependencies
pnpm install

# Build agent-cli
pnpm --filter @deepractice-ai/agent-cli build

# Run locally
node apps/agent-cli/dist/bin/agent-cli.js http --anthropic-api-key YOUR_API_KEY
```

## Usage

### Basic Command

```bash
agent-cli http [options]
```

### Options

| Option                       | Description                  | Default                     |
| ---------------------------- | ---------------------------- | --------------------------- |
| `--host <host>`              | Host to bind to              | `0.0.0.0`                   |
| `--port <port>`              | Port to listen on            | `5200`                      |
| `--project <path>`           | Project directory path       | Current directory           |
| `--anthropic-api-key <key>`  | Anthropic API key (required) | -                           |
| `--anthropic-base-url <url>` | Anthropic API base URL       | `https://api.anthropic.com` |
| `--node-env <env>`           | Node environment             | `production`                |

### Examples

#### Basic Usage

```bash
# Start with API key
agent-cli http --anthropic-api-key sk-ant-xxxxx

# Custom port
agent-cli http --port 8080 --anthropic-api-key sk-ant-xxxxx

# Custom project directory
agent-cli http --project /path/to/project --anthropic-api-key sk-ant-xxxxx
```

#### Using Environment Variables

Instead of passing options via CLI, you can use environment variables:

```bash
export ANTHROPIC_API_KEY=sk-ant-xxxxx
export PORT=8080
export PROJECT_PATH=/path/to/project

agent-cli http
```

#### Docker Usage

```bash
docker run -d \
  -p 5200:5200 \
  -v /local/project:/project \
  -e ANTHROPIC_API_KEY=sk-ant-xxxxx \
  deepracticexs/agent:latest
```

## Configuration

The CLI sets up environment variables that are used by the underlying agent-service:

- `NODE_ENV`: Node environment mode
- `PORT`: Server port
- `PROJECT_PATH`: Working directory for the agent
- `ANTHROPIC_API_KEY`: Your Anthropic API key (required)
- `ANTHROPIC_BASE_URL`: Custom API endpoint (optional)

## Architecture

The agent-cli is a lightweight wrapper that:

1. Parses command-line arguments
2. Sets up environment variables
3. Dynamically loads and starts the agent-service

This design allows for:

- Simple deployment (`npm install -g`)
- Easy configuration via CLI or environment variables
- Clean separation between CLI interface and server logic

## Environment Priority

Configuration is loaded in the following priority (highest to lowest):

1. CLI options (e.g., `--port 8080`)
2. Environment variables (e.g., `export PORT=8080`)
3. `.env.local` file
4. `.env.[NODE_ENV]` file
5. `.env` file

## Requirements

- Node.js >= 20.0.0
- Anthropic API key

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 5200
lsof -ti:5200 | xargs kill -9

# Or use a different port
agent-cli http --port 8080
```

### Permission Denied (PROJECT_PATH)

Make sure the specified project path is writable:

```bash
# Use a directory in your home folder
agent-cli http --project ~/my-project
```

### API Key Issues

```bash
# Verify your API key is set
echo $ANTHROPIC_API_KEY

# Or pass it directly
agent-cli http --anthropic-api-key sk-ant-xxxxx
```

## Development

### Build

```bash
pnpm build
```

### Watch Mode

```bash
pnpm dev
```

### Testing

```bash
# Test the built CLI
node dist/bin/agent-cli.js http --help
```

## Related Projects

- [Agent](https://github.com/Deepractice/Agent) - Full monorepo
- [@deepractice-ai/agent-service](../services/agent-service) - Backend service
- [@deepractice-ai/agent-web](./agent-web) - Frontend UI

## License

MIT

## Support

- [GitHub Issues](https://github.com/Deepractice/Agent/issues)
- [Documentation](https://docs.deepractice.ai)

---

**Made with ❤️ by Deepractice Team**
