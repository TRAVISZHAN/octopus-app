#!/bin/bash

# Build Go binaries for all supported platforms
# These binaries will be bundled as sidecars in the Tauri app

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="$PROJECT_ROOT/src-tauri/binaries"

echo "Building Go binaries..."
echo "Output directory: $OUTPUT_DIR"

mkdir -p "$OUTPUT_DIR"

cd "$PROJECT_ROOT"

# Get version information
VERSION=$(git describe --tags --abbrev=0 2>/dev/null || git rev-parse --short HEAD 2>/dev/null || echo "dev")
COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BUILD_TIME=$(date -u '+%Y-%m-%d %H:%M:%S UTC')

# Build ldflags
LDFLAGS="-s -w"
LDFLAGS="$LDFLAGS -X 'github.com/bestruirui/octopus/internal/conf.Version=$VERSION'"
LDFLAGS="$LDFLAGS -X 'github.com/bestruirui/octopus/internal/conf.Commit=$COMMIT'"
LDFLAGS="$LDFLAGS -X 'github.com/bestruirui/octopus/internal/conf.BuildTime=$BUILD_TIME'"

echo "Version: $VERSION"
echo "Commit: $COMMIT"
echo "Build Time: $BUILD_TIME"

# Build for current platform only (for development)
if [ "$1" == "--dev" ]; then
    echo "Building for current platform only..."

    GOOS=$(go env GOOS)
    GOARCH=$(go env GOARCH)

    case "$GOOS-$GOARCH" in
        darwin-arm64)
            TARGET="octopus-server-aarch64-apple-darwin"
            ;;
        darwin-amd64)
            TARGET="octopus-server-x86_64-apple-darwin"
            ;;
        linux-amd64)
            TARGET="octopus-server-x86_64-unknown-linux-gnu"
            ;;
        windows-amd64)
            TARGET="octopus-server-x86_64-pc-windows-msvc.exe"
            ;;
        *)
            echo "Unsupported platform: $GOOS-$GOARCH"
            exit 1
            ;;
    esac

    echo "Building $TARGET..."
    go build -ldflags="$LDFLAGS" -o "$OUTPUT_DIR/$TARGET" main.go
    echo "Done: $OUTPUT_DIR/$TARGET"
    exit 0
fi

# Build for all platforms
echo ""
echo "=== macOS Apple Silicon (arm64) ==="
GOOS=darwin GOARCH=arm64 go build -ldflags="$LDFLAGS" -o "$OUTPUT_DIR/octopus-server-aarch64-apple-darwin" main.go
echo "Done: octopus-server-aarch64-apple-darwin"

echo ""
echo "=== macOS Intel (amd64) ==="
GOOS=darwin GOARCH=amd64 go build -ldflags="$LDFLAGS" -o "$OUTPUT_DIR/octopus-server-x86_64-apple-darwin" main.go
echo "Done: octopus-server-x86_64-apple-darwin"

echo ""
echo "=== Windows (amd64) ==="
GOOS=windows GOARCH=amd64 go build -ldflags="$LDFLAGS" -o "$OUTPUT_DIR/octopus-server-x86_64-pc-windows-msvc.exe" main.go
echo "Done: octopus-server-x86_64-pc-windows-msvc.exe"

echo ""
echo "=== Linux (amd64) ==="
GOOS=linux GOARCH=amd64 go build -ldflags="$LDFLAGS" -o "$OUTPUT_DIR/octopus-server-x86_64-unknown-linux-gnu" main.go
echo "Done: octopus-server-x86_64-unknown-linux-gnu"

echo ""
echo "All binaries built successfully!"
ls -la "$OUTPUT_DIR"
