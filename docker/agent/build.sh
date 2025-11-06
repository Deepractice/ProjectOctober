#!/bin/bash

#
# Build agent image
#

set -e

VERSION="${1:-latest}"
IMAGE_NAME="deepracticexs/agent"
RUNTIME_VERSION="${RUNTIME_VERSION:-latest}"

echo "🏗️  Building Agent v${VERSION}..."
echo "📦 Image: ${IMAGE_NAME}:${VERSION}"
echo "🔧 Runtime: deepracticexs/agent-runtime:${RUNTIME_VERSION}"
echo ""

# Navigate to project root
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "📂 Project root: $PROJECT_ROOT"
cd "$PROJECT_ROOT"

# Verify required files exist
if [ ! -f "package.json" ] || [ ! -d "apps/agent-web" ] || [ ! -d "services/agent-service" ] || [ ! -d "packages/agent-sdk" ] || [ ! -d "packages/agent-config" ]; then
  echo "❌ Error: Not in project root or missing required directories"
  echo "   Expected: package.json, apps/agent-web/, services/agent-service/, packages/agent-sdk/, packages/agent-config/"
  exit 1
fi

echo "✅ Build context verified"
echo ""

docker build \
  --build-arg RUNTIME_VERSION=${RUNTIME_VERSION} \
  -t ${IMAGE_NAME}:${VERSION} \
  -f docker/agent/Dockerfile \
  .

echo ""
echo "✅ Build complete!"
echo ""
echo "📋 Quick start:"
echo "  docker run -p 5200:5200 \\"
echo "    -e ANTHROPIC_API_KEY=your-key \\"
echo "    -v \$(pwd):/project \\"
echo "    ${IMAGE_NAME}:${VERSION}"
echo ""
