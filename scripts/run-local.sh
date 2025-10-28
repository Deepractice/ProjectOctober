#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Run the Claude Code UI container locally.

Usage: scripts/run-local.sh [options]

Options:
  --image <name>       Image tag to use/build (default: claude-code-ui:local)
  --name <name>        Container name (default: claude-code-ui-local)
  --project <path>     Mount a project directory at /project inside the container
  --skip-build         Skip building the image, assume it already exists
  --rebuild            Force a fresh docker build before running
  --foreground         Run in the foreground (omit docker -d)
  -h, --help           Show this help message

Environment overrides:
  HOST_CONFIG_DIR      Host directory to persist Claude data (default: ~/.claude-code-ui)
  PORT                 Host port for the API server (default: 3001)
  VITE_PORT            Host port for the Vite dev server (default: 5173)
  JWT_SECRET           JWT secret passed into the container (default: local-dev-secret)
  API_KEY              Optional API key forwarded into the container
EOF
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  usage
  exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

IMAGE_NAME="${IMAGE_NAME:-claude-code-ui:local}"
CONTAINER_NAME="${CONTAINER_NAME:-claude-code-ui-local}"
HOST_CONFIG_DIR="${HOST_CONFIG_DIR:-$HOME/.claude-code-ui}"
HOST_PORT="${PORT:-3001}"
HOST_VITE_PORT="${VITE_PORT:-5173}"
JWT_SECRET_VALUE="${JWT_SECRET:-local-dev-secret}"

SKIP_BUILD=false
FORCE_REBUILD=false
DETACH=true
PROJECT_MOUNT_PATH=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --image)
      IMAGE_NAME="$2"
      shift 2
      ;;
    --name)
      CONTAINER_NAME="$2"
      shift 2
      ;;
    --project)
      PROJECT_MOUNT_PATH="$2"
      shift 2
      ;;
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --rebuild)
      FORCE_REBUILD=true
      shift
      ;;
    --foreground)
      DETACH=false
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if ! command -v docker >/dev/null 2>&1; then
  echo "docker command not found. Please install Docker first." >&2
  exit 1
fi

if [[ "$FORCE_REBUILD" == true ]]; then
  echo "Rebuilding image ${IMAGE_NAME}..."
  docker build -t "${IMAGE_NAME}" "${PROJECT_ROOT}"
elif [[ "$SKIP_BUILD" != true ]]; then
  if ! docker image inspect "${IMAGE_NAME}" >/dev/null 2>&1; then
    echo "Image ${IMAGE_NAME} not found. Building..."
    docker build -t "${IMAGE_NAME}" "${PROJECT_ROOT}"
  fi
else
  echo "Skipping docker build step."
fi

if docker ps -a --format '{{.Names}}' | grep -wq "${CONTAINER_NAME}"; then
  echo "Stopping existing container ${CONTAINER_NAME}..."
  docker rm -f "${CONTAINER_NAME}" >/dev/null
fi

mkdir -p "${HOST_CONFIG_DIR}/.claude"

docker_args=(
  --name "${CONTAINER_NAME}"
  -p "${HOST_PORT}:3001"
  -p "${HOST_VITE_PORT}:5173"
  -e "NODE_ENV=production"
  -e "PORT=3001"
  -e "CLAUDE_CLI_PATH=claude"
  -e "JWT_SECRET=${JWT_SECRET_VALUE}"
  -v "${HOST_CONFIG_DIR}:/opt/claude-config"
)

if [[ -n "${API_KEY:-}" ]]; then
  docker_args+=(-e "API_KEY=${API_KEY}")
fi

if [[ -d "${HOME}/.ssh" ]]; then
  docker_args+=(-v "${HOME}/.ssh:/home/node/.ssh:ro")
fi

if [[ -f "${HOME}/.gitconfig" ]]; then
  docker_args+=(-v "${HOME}/.gitconfig:/home/node/.gitconfig:ro")
fi

if [[ -n "${PROJECT_MOUNT_PATH}" ]]; then
  if [[ ! -d "${PROJECT_MOUNT_PATH}" ]]; then
    echo "Project path ${PROJECT_MOUNT_PATH} does not exist or is not a directory." >&2
    exit 1
  fi
  PROJECT_ABS_PATH="$(cd "${PROJECT_MOUNT_PATH}" && pwd)"
  docker_args+=(-v "${PROJECT_ABS_PATH}:/project")
fi

if [[ "${DETACH}" == true ]]; then
  docker_args+=(-d)
else
  docker_args+=(-it)
fi

docker_args+=("${IMAGE_NAME}")

echo "Starting ${CONTAINER_NAME} from image ${IMAGE_NAME}..."
docker run "${docker_args[@]}"

if [[ "${DETACH}" == true ]]; then
  echo "Container is running in the background."
  echo "API: http://localhost:${HOST_PORT}"
  echo "Vite dev server (if active): http://localhost:${HOST_VITE_PORT}"
  echo "To watch logs: docker logs -f ${CONTAINER_NAME}"
fi
