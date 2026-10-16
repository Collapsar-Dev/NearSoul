#!/usr/bin/env bash
# Builds the Flutter web app for the same-origin alpha deployment and copies it to deploy/web (committed).
# Run before pushing UI changes: bash scripts/build-web-dist.sh
set -euo pipefail
cd "$(dirname "$0")/../apps/app"
FLUTTER="${FLUTTER:-flutter}"
command -v "$FLUTTER" >/dev/null || FLUTTER="$HOME/development/flutter/bin/flutter"
"$FLUTTER" build web --release --dart-define=APP_ENV=alpha --dart-define=BUILD_NUMBER="$(git rev-parse --short HEAD)"
rm -rf ../../deploy/web && mkdir -p ../../deploy && cp -r build/web ../../deploy/web && find ../../deploy/web -name "*.symbols" -delete && rm -rf ../../deploy/web/canvaskit
echo "deploy/web updated"
