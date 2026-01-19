#!/usr/bin/env node

/**
 * Convert SVG to PNG icons for Tauri
 * Usage: node generate-icons.js
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const SVG_FILE = 'prism-icon.svg';
const OUTPUT_DIR = 'src-tauri/icons';

// Icon sizes needed for Tauri
const SIZES = [
  { size: 32, name: '32x32.png' },
  { size: 128, name: '128x128.png' },
  { size: 256, name: '128x128@2x.png' },
  { size: 512, name: 'icon.png' },
  { size: 1024, name: 'icon@2x.png' }
];

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('Converting SVG to PNG icons...\n');

// Check if we have rsvg-convert (from librsvg)
let converter = null;
try {
  execSync('which rsvg-convert', { stdio: 'ignore' });
  converter = 'rsvg-convert';
  console.log('Using rsvg-convert');
} catch (e) {
  // Try inkscape
  try {
    execSync('which inkscape', { stdio: 'ignore' });
    converter = 'inkscape';
    console.log('Using inkscape');
  } catch (e2) {
    console.error('Error: No SVG converter found!');
    console.error('Please install one of the following:');
    console.error('  - librsvg: brew install librsvg');
    console.error('  - inkscape: brew install inkscape');
    process.exit(1);
  }
}

// Convert each size
SIZES.forEach(({ size, name }) => {
  const outputPath = path.join(OUTPUT_DIR, name);

  try {
    if (converter === 'rsvg-convert') {
      execSync(`rsvg-convert -w ${size} -h ${size} ${SVG_FILE} -o ${outputPath}`);
    } else if (converter === 'inkscape') {
      execSync(`inkscape ${SVG_FILE} -w ${size} -h ${size} -o ${outputPath}`);
    }
    console.log(`✓ Generated ${name} (${size}x${size})`);
  } catch (error) {
    console.error(`✗ Failed to generate ${name}:`, error.message);
  }
});

console.log('\n✓ Icon generation complete!');
console.log('\nNext steps:');
console.log('1. Generate ICNS: iconutil -c icns src-tauri/icons/icon.iconset');
console.log('2. Generate ICO: Use online tool or ImageMagick');
