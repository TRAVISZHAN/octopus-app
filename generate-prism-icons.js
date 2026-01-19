#!/usr/bin/env node

/**
 * Prism Icon Generator
 *
 * Generates app icons (cyan) and tray icons (white) from SVG
 * Requires: npm install sharp
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('❌ Error: sharp is not installed');
  console.error('Please run: npm install sharp');
  process.exit(1);
}

// SVG path data (from HTML-Artifacts.html)
const SVG_PATH = 'M50 5 L90 28 L90 72 L50 95 L10 72 L10 28 Z M10 28 L50 5 L90 28 M10 72 L50 95 L90 72 M10 28 L28 65 L72 65 L90 28 M28 65 L50 95 L72 65 M50 5 L50 45 L28 65 M50 45 L72 65 M10 28 L50 45 L90 28';

// Icon configurations
const CONFIGS = {
  app: {
    name: 'app',
    color: '#466551',
    strokeWidth: 5,
    glow: false,
    sizes: [32, 128, 256, 512, 1024],
    outputDir: 'src-tauri/icons'
  },
  tray: {
    name: 'tray',
    color: '#ffffff',
    strokeWidth: 5,
    glow: false,
    sizes: [16, 32],
    outputDir: 'src-tauri/icons'
  }
};

/**
 * Generate SVG string
 */
function generateSVG(config, size) {
  const viewBoxSize = 100;

  // Scale down the icon content to 80% and center it
  const iconScale = config.name === 'tray' ? 1.0 : 0.8;
  const iconSize = viewBoxSize * iconScale;
  const offset = (viewBoxSize - iconSize) / 2;

  let background = '';
  if (config.name === 'app' || config.name === 'web') {
    // iOS-style rounded corners (22% of size)
    const cornerRadius = viewBoxSize * 0.22;
    background = `<rect width="${viewBoxSize}" height="${viewBoxSize}" rx="${cornerRadius}" ry="${cornerRadius}" fill="#ffffff"/>`;
  }

  let filter = '';
  if (config.glow) {
    filter = `
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
    `;
  }

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" xmlns="http://www.w3.org/2000/svg">
      ${background}
      ${filter}
      <g transform="translate(${offset}, ${offset}) scale(${iconScale})">
        <path
          d="${SVG_PATH}"
          fill="none"
          stroke="${config.color}"
          stroke-width="${config.strokeWidth}"
          stroke-linecap="round"
          stroke-linejoin="round"
          ${config.glow ? 'filter="url(#glow)"' : ''}
        />
      </g>
    </svg>
  `.trim();
}

/**
 * Generate icon file
 */
async function generateIcon(config, size) {
  const svg = generateSVG(config, size);
  const outputPath = path.join(config.outputDir, `${config.name}-${size}x${size}.png`);

  try {
    await sharp(Buffer.from(svg))
      .png()
      .toFile(outputPath);

    console.log(`✓ Generated: ${outputPath}`);
  } catch (error) {
    console.error(`✗ Failed to generate ${outputPath}:`, error.message);
  }
}

/**
 * Generate .icns file for macOS (requires iconutil)
 */
async function generateIcns(config) {
  const iconsetDir = path.join(config.outputDir, `${config.name}.iconset`);

  // Create iconset directory
  if (!fs.existsSync(iconsetDir)) {
    fs.mkdirSync(iconsetDir, { recursive: true });
  }

  // Generate required sizes for .icns
  const icnsSizes = [
    { size: 16, name: 'icon_16x16.png' },
    { size: 32, name: 'icon_16x16@2x.png' },
    { size: 32, name: 'icon_32x32.png' },
    { size: 64, name: 'icon_32x32@2x.png' },
    { size: 128, name: 'icon_128x128.png' },
    { size: 256, name: 'icon_128x128@2x.png' },
    { size: 256, name: 'icon_256x256.png' },
    { size: 512, name: 'icon_256x256@2x.png' },
    { size: 512, name: 'icon_512x512.png' },
    { size: 1024, name: 'icon_512x512@2x.png' }
  ];

  console.log(`\nGenerating .icns iconset for ${config.name}...`);

  for (const { size, name } of icnsSizes) {
    const svg = generateSVG(config, size);
    const outputPath = path.join(iconsetDir, name);

    try {
      await sharp(Buffer.from(svg))
        .png()
        .toFile(outputPath);

      console.log(`✓ Generated: ${name}`);
    } catch (error) {
      console.error(`✗ Failed to generate ${name}:`, error.message);
    }
  }

  console.log(`\n📦 Iconset created at: ${iconsetDir}`);
  console.log(`To create .icns file, run:`);
  console.log(`  iconutil -c icns ${iconsetDir}`);
}

/**
 * Generate .ico file for Windows
 */
async function generateIco(config) {
  // For .ico generation, we'll just note that it needs to be done manually
  // or with a separate tool, as sharp doesn't support .ico output directly
  console.log(`\n💡 For Windows .ico file:`);
  console.log(`  Use the generated PNG files with a tool like ImageMagick:`);
  console.log(`  convert ${config.name}-{32,128,256}.png ${config.name}.ico`);
}

/**
 * Generate web icons (favicon, apple-icon, PWA icons)
 */
async function generateWebIcons() {
  const webConfig = {
    name: 'web',
    color: '#466551',
    strokeWidth: 5,
    glow: false,
    outputDir: 'web/public'
  };

  const webIconSizes = [
    { size: 180, name: 'apple-icon.png' },
    { size: 192, name: 'web-app-manifest-192x192.png' },
    { size: 512, name: 'web-app-manifest-512x512.png' }
  ];

  console.log('\nGenerating web icons...');

  for (const { size, name } of webIconSizes) {
    const svg = generateSVG(webConfig, size);
    const outputPath = path.join(webConfig.outputDir, name);

    try {
      await sharp(Buffer.from(svg))
        .png()
        .toFile(outputPath);

      console.log(`✓ Generated: ${outputPath}`);
    } catch (error) {
      console.error(`✗ Failed to generate ${outputPath}:`, error.message);
    }
  }

  console.log('\n💡 For favicon.ico:');
  console.log('  Use ImageMagick or online tool to convert PNG to ICO');
  console.log('  Or use: convert web/public/apple-icon.png -define icon:auto-resize=16,32,48 web/public/favicon.ico');
}

/**
 * Main function
 */
async function main() {
  console.log('🎨 Prism Icon Generator\n');

  // Create output directories
  for (const config of Object.values(CONFIGS)) {
    if (!fs.existsSync(config.outputDir)) {
      fs.mkdirSync(config.outputDir, { recursive: true });
    }
  }

  // Generate app icons (cyan)
  console.log('Generating app icons (Aurora Cyan with white background)...');
  for (const size of CONFIGS.app.sizes) {
    await generateIcon(CONFIGS.app, size);
  }

  // Generate tray icons (white)
  console.log('\nGenerating tray icons (White)...');
  for (const size of CONFIGS.tray.sizes) {
    await generateIcon(CONFIGS.tray, size);
  }

  // Generate .icns iconset for macOS
  await generateIcns(CONFIGS.app);

  // Note about .ico
  await generateIco(CONFIGS.app);

  // Generate web icons
  await generateWebIcons();

  console.log('\n✅ Icon generation complete!');
  console.log('\nNext steps:');
  console.log('1. Run: iconutil -c icns src-tauri/icons/app.iconset');
  console.log('2. Update web/public/logo.svg and logo-dark.svg with Prism design');
  console.log('3. Check web/public/manifest.json for app name');
}

// Run
main().catch(console.error);
