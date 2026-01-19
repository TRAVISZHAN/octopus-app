# 实施计划：图标更新 - App 图标添加白底 + 替换前端章鱼图标

## 任务类型
- [x] 前端
- [x] 资源文件
- [ ] 后端

## 问题分析

**问题 1：App 图标无白底**
- 当前 `generate-prism-icons.js` 生成的 App 图标是极光青色描边，透明背景
- 需要为 App 图标添加白色背景，以符合应用图标规范

**问题 2：前端仍使用章鱼图标**
- `web/src/components/modules/logo/index.tsx` 使用章鱼形状的 SVG path
- `web/public/logo.svg` 和 `web/public/logo-dark.svg` 是章鱼图标
- `web/src/app/layout.tsx` 的初始加载器使用章鱼 SVG
- `web/public/favicon.ico`、`apple-icon.png`、PWA 图标等都需要更新
- `web/public/manifest.json` 可能还引用旧的应用名称

## 技术方案

**方案：更新图标生成器 + 替换所有前端资源**

1. **修改 `generate-prism-icons.js`**：
   - 为 App 图标添加白色背景矩形
   - 保持托盘图标为白色描边透明背景（系统托盘需要）
   - 重新生成所有图标文件

2. **更新前端 Logo 组件**：
   - 将 `web/src/components/modules/logo/index.tsx` 中的章鱼 SVG path 替换为 Prism 六边形 path
   - 更新 `web/src/app/layout.tsx` 初始加载器的 SVG

3. **更新静态资源**：
   - 替换 `web/public/logo.svg` 和 `web/public/logo-dark.svg`
   - 重新生成 `favicon.ico`、`apple-icon.png`、PWA 图标
   - 更新 `web/public/manifest.json` 的应用名称

## 实施步骤

### Step 1: 更新图标生成器
**文件**: `generate-prism-icons.js`

**操作**: 修改 `generateSVG` 函数，为 App 图标添加白色背景

```javascript
function generateSVG(config, size) {
  const padding = size * 0.1;
  const viewBoxSize = 100;

  let background = '';
  if (config.name === 'app') {
    // 为 App 图标添加白色背景
    background = `<rect width="${viewBoxSize}" height="${viewBoxSize}" fill="#ffffff"/>`;
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
      <path
        d="${SVG_PATH}"
        fill="none"
        stroke="${config.color}"
        stroke-width="${config.strokeWidth}"
        stroke-linecap="round"
        stroke-linejoin="round"
        ${config.glow ? 'filter="url(#glow)"' : ''}
      />
    </svg>
  `.trim();
}
```

### Step 2: 重新生成图标
**命令**:
```bash
node generate-prism-icons.js
iconutil -c icns src-tauri/icons/app.iconset
```

### Step 3: 更新前端 Logo 组件
**文件**: `web/src/components/modules/logo/index.tsx:14-20`

**操作**: 替换章鱼 SVG paths 为 Prism 六边形 paths

```typescript
const paths = [
    "M50 5 L90 28 L90 72 L50 95 L10 72 L10 28 Z",
    "M10 28 L50 5 L90 28",
    "M10 72 L50 95 L90 72",
    "M10 28 L28 65 L72 65 L90 28",
    "M28 65 L50 95 L72 65",
    "M50 5 L50 45 L28 65",
    "M50 45 L72 65",
    "M10 28 L50 45 L90 28",
];
```

### Step 4: 更新初始加载器
**文件**: `web/src/app/layout.tsx:98-106`

**操作**: 替换加载器中的章鱼 SVG paths

```tsx
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <g className="octo-group">
    <path pathLength="1" d="M50 5 L90 28 L90 72 L50 95 L10 72 L10 28 Z" />
    <path pathLength="1" d="M10 28 L50 5 L90 28" />
    <path pathLength="1" d="M10 72 L50 95 L90 72" />
    <path pathLength="1" d="M10 28 L28 65 L72 65 L90 28" />
    <path pathLength="1" d="M28 65 L50 95 L72 65" />
    <path pathLength="1" d="M50 5 L50 45 L28 65" />
    <path pathLength="1" d="M50 45 L72 65" />
    <path pathLength="1" d="M10 28 L50 45 L90 28" />
  </g>
</svg>
```

### Step 5: 更新 public 目录的 SVG 文件
**文件**: `web/public/logo.svg`

**操作**: 创建新的 Prism SVG（极光青色）

```svg
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 5 L90 28 L90 72 L50 95 L10 72 L10 28 Z M10 28 L50 5 L90 28 M10 72 L50 95 L90 72 M10 28 L28 65 L72 65 L90 28 M28 65 L50 95 L72 65 M50 5 L50 45 L28 65 M50 45 L72 65 M10 28 L50 45 L90 28"
          fill="none"
          stroke="#00f2ff"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"/>
</svg>
```

**文件**: `web/public/logo-dark.svg`

**操作**: 创建深色模式版本（白色）

```svg
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 5 L90 28 L90 72 L50 95 L10 72 L10 28 Z M10 28 L50 5 L90 28 M10 72 L50 95 L90 72 M10 28 L28 65 L72 65 L90 28 M28 65 L50 95 L72 65 M50 5 L50 45 L28 65 M50 45 L72 65 M10 28 L50 45 L90 28"
          fill="none"
          stroke="#ffffff"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"/>
</svg>
```

### Step 6: 生成 Web 图标资源
**操作**: 使用 sharp 或其他工具从新的 SVG 生成 favicon 和 PWA 图标

需要生成：
- `web/public/favicon.ico` (16x16, 32x32, 48x48)
- `web/public/apple-icon.png` (180x180)
- `web/public/web-app-manifest-192x192.png`
- `web/public/web-app-manifest-512x512.png`

可以扩展 `generate-prism-icons.js` 或创建新脚本。

### Step 7: 更新 manifest.json
**文件**: `web/public/manifest.json`

**操作**: 确认应用名称为 "Prism"

```json
{
  "name": "Prism",
  "short_name": "Prism",
  ...
}
```

## 关键文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `generate-prism-icons.js` | 修改 | 为 App 图标添加白色背景 |
| `src-tauri/icons/app-*.png` | 重新生成 | 带白底的 App 图标 |
| `src-tauri/icons/app.icns` | 重新生成 | macOS App 图标 |
| `web/src/components/modules/logo/index.tsx:14-20` | 修改 | 替换 SVG paths |
| `web/src/app/layout.tsx:98-106` | 修改 | 替换加载器 SVG |
| `web/public/logo.svg` | 替换 | Prism 极光青 SVG |
| `web/public/logo-dark.svg` | 替换 | Prism 白色 SVG |
| `web/public/favicon.ico` | 重新生成 | 网站图标 |
| `web/public/apple-icon.png` | 重新生成 | iOS 图标 |
| `web/public/web-app-manifest-*.png` | 重新生成 | PWA 图标 |
| `web/public/manifest.json` | 检查 | 确认应用名称 |

## 风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| 白底图标在深色背景下不美观 | 仅 App 启动图标使用白底，UI 内部仍使用透明背景 |
| SVG path 数量变化导致动画异常 | 调整动画参数以适配新的 path 数量 |
| 图标生成失败 | 保留旧图标作为备份，测试后再替换 |
| PWA 图标缓存问题 | 更新 manifest.json 版本号，清除浏览器缓存 |

## SESSION_ID
- CODEX_SESSION: 019bd528-9a27-73b3-9b23-9898f1ce7b6c
- GEMINI_SESSION: (不可用)
