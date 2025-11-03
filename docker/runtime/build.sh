#!/bin/bash

#
# Build agent-runtime base image
#

set -e

VERSION="${1:-1.0.0}"
IMAGE_NAME="deepracticexs/agent-runtime"
REGISTRY="${REGISTRY:-docker.io}"

echo "🏗️  Building Agent Runtime v${VERSION}..."
echo "📦 Image: ${REGISTRY}/${IMAGE_NAME}:${VERSION}"
echo ""

# Build the image
docker build \
  -t ${IMAGE_NAME}:${VERSION} \
  -t ${IMAGE_NAME}:latest \
  -f Dockerfile \
  .

echo ""
echo "✅ Build complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Test: docker run -it ${IMAGE_NAME}:${VERSION}"
echo "  2. Push: docker push ${IMAGE_NAME}:${VERSION}"
echo "  3. Push: docker push ${IMAGE_NAME}:latest"
echo ""
echo "Or push to custom registry:"
echo "  docker tag ${IMAGE_NAME}:${VERSION} ${REGISTRY}/${IMAGE_NAME}:${VERSION}"
echo "  docker push ${REGISTRY}/${IMAGE_NAME}:${VERSION}"
