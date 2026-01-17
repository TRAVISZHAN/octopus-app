#!/bin/bash

# Octopus Desktop App - Clean Script
# Removes build artifacts and caches

set -e

echo "🧹 Cleaning Octopus Desktop App..."

# Clean web build artifacts
if [ -d "web/.next" ]; then
    echo "  Removing web/.next..."
    rm -rf web/.next
fi

if [ -d "web/out" ]; then
    echo "  Removing web/out..."
    rm -rf web/out
fi

# Clean Rust build artifacts (optional - takes long to rebuild)
if [ "$1" = "--full" ]; then
    if [ -d "src-tauri/target" ]; then
        echo "  Removing src-tauri/target..."
        rm -rf src-tauri/target
    fi
fi

# Clean .DS_Store files
echo "  Removing .DS_Store files..."
find . -name ".DS_Store" -type f -not -path "*/node_modules/*" -delete 2>/dev/null || true

# Clean log files
echo "  Removing log files..."
find . -name "*.log" -type f -not -path "*/node_modules/*" -not -path "*/target/*" -delete 2>/dev/null || true

echo "✅ Clean complete!"
echo ""
echo "Note: Run with --full flag to also clean Rust target directory (5.3GB)"
echo "      This will make the next build slower."
