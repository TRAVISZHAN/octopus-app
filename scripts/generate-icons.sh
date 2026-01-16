#!/bin/bash

# Generate Tauri icons from SVG
# Requires: ImageMagick (convert) or librsvg (rsvg-convert)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ICONS_DIR="$PROJECT_ROOT/src-tauri/icons"
SOURCE_SVG="$ICONS_DIR/icon.svg"

echo "Generating icons from $SOURCE_SVG..."

# Check if source exists
if [ ! -f "$SOURCE_SVG" ]; then
    echo "Error: $SOURCE_SVG not found"
    echo "Please copy your logo.svg to $SOURCE_SVG first"
    exit 1
fi

# Try to use rsvg-convert (better SVG support) or fall back to ImageMagick
if command -v rsvg-convert &> /dev/null; then
    CONVERT_CMD="rsvg-convert"
    echo "Using rsvg-convert..."

    # Generate PNG icons
    rsvg-convert -w 32 -h 32 "$SOURCE_SVG" -o "$ICONS_DIR/32x32.png"
    rsvg-convert -w 128 -h 128 "$SOURCE_SVG" -o "$ICONS_DIR/128x128.png"
    rsvg-convert -w 256 -h 256 "$SOURCE_SVG" -o "$ICONS_DIR/128x128@2x.png"
    rsvg-convert -w 512 -h 512 "$SOURCE_SVG" -o "$ICONS_DIR/icon.png"

elif command -v convert &> /dev/null; then
    CONVERT_CMD="convert"
    echo "Using ImageMagick..."

    # Generate PNG icons
    convert -background none -resize 32x32 "$SOURCE_SVG" "$ICONS_DIR/32x32.png"
    convert -background none -resize 128x128 "$SOURCE_SVG" "$ICONS_DIR/128x128.png"
    convert -background none -resize 256x256 "$SOURCE_SVG" "$ICONS_DIR/128x128@2x.png"
    convert -background none -resize 512x512 "$SOURCE_SVG" "$ICONS_DIR/icon.png"

else
    echo "Error: Neither rsvg-convert nor ImageMagick (convert) found"
    echo "Please install one of them:"
    echo "  macOS: brew install librsvg"
    echo "  Ubuntu: sudo apt install librsvg2-bin"
    exit 1
fi

# Generate ICO for Windows (requires ImageMagick)
if command -v convert &> /dev/null; then
    echo "Generating Windows ICO..."
    convert "$ICONS_DIR/32x32.png" "$ICONS_DIR/128x128.png" "$ICONS_DIR/icon.ico"
else
    echo "Warning: ImageMagick not found, skipping ICO generation"
    # Create a placeholder
    cp "$ICONS_DIR/128x128.png" "$ICONS_DIR/icon.ico" 2>/dev/null || true
fi

# Generate ICNS for macOS
if command -v iconutil &> /dev/null; then
    echo "Generating macOS ICNS..."

    ICONSET_DIR="$ICONS_DIR/icon.iconset"
    mkdir -p "$ICONSET_DIR"

    # Generate all required sizes for iconset
    if [ "$CONVERT_CMD" = "rsvg-convert" ]; then
        rsvg-convert -w 16 -h 16 "$SOURCE_SVG" -o "$ICONSET_DIR/icon_16x16.png"
        rsvg-convert -w 32 -h 32 "$SOURCE_SVG" -o "$ICONSET_DIR/icon_16x16@2x.png"
        rsvg-convert -w 32 -h 32 "$SOURCE_SVG" -o "$ICONSET_DIR/icon_32x32.png"
        rsvg-convert -w 64 -h 64 "$SOURCE_SVG" -o "$ICONSET_DIR/icon_32x32@2x.png"
        rsvg-convert -w 128 -h 128 "$SOURCE_SVG" -o "$ICONSET_DIR/icon_128x128.png"
        rsvg-convert -w 256 -h 256 "$SOURCE_SVG" -o "$ICONSET_DIR/icon_128x128@2x.png"
        rsvg-convert -w 256 -h 256 "$SOURCE_SVG" -o "$ICONSET_DIR/icon_256x256.png"
        rsvg-convert -w 512 -h 512 "$SOURCE_SVG" -o "$ICONSET_DIR/icon_256x256@2x.png"
        rsvg-convert -w 512 -h 512 "$SOURCE_SVG" -o "$ICONSET_DIR/icon_512x512.png"
        rsvg-convert -w 1024 -h 1024 "$SOURCE_SVG" -o "$ICONSET_DIR/icon_512x512@2x.png"
    else
        convert -background none -resize 16x16 "$SOURCE_SVG" "$ICONSET_DIR/icon_16x16.png"
        convert -background none -resize 32x32 "$SOURCE_SVG" "$ICONSET_DIR/icon_16x16@2x.png"
        convert -background none -resize 32x32 "$SOURCE_SVG" "$ICONSET_DIR/icon_32x32.png"
        convert -background none -resize 64x64 "$SOURCE_SVG" "$ICONSET_DIR/icon_32x32@2x.png"
        convert -background none -resize 128x128 "$SOURCE_SVG" "$ICONSET_DIR/icon_128x128.png"
        convert -background none -resize 256x256 "$SOURCE_SVG" "$ICONSET_DIR/icon_128x128@2x.png"
        convert -background none -resize 256x256 "$SOURCE_SVG" "$ICONSET_DIR/icon_256x256.png"
        convert -background none -resize 512x512 "$SOURCE_SVG" "$ICONSET_DIR/icon_256x256@2x.png"
        convert -background none -resize 512x512 "$SOURCE_SVG" "$ICONSET_DIR/icon_512x512.png"
        convert -background none -resize 1024x1024 "$SOURCE_SVG" "$ICONSET_DIR/icon_512x512@2x.png"
    fi

    iconutil -c icns "$ICONSET_DIR" -o "$ICONS_DIR/icon.icns"
    rm -rf "$ICONSET_DIR"
else
    echo "Warning: iconutil not found (not on macOS?), skipping ICNS generation"
fi

echo ""
echo "Icons generated successfully!"
ls -la "$ICONS_DIR"
