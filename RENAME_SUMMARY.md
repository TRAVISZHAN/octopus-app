# Octopus → Prism 改名总结

## 完成时间
2026-01-18

## 图标设计

### 原始设计（保留）
- **形状**: 六边形棱镜
- **SVG Path**: `M50 5 L90 28 L90 72 L50 95 L10 72 L10 28 Z M10 28 L50 5 L90 28 M10 72 L50 95 L90 72 M10 28 L28 65 L72 65 L90 28 M28 65 L50 95 L72 65 M50 5 L50 45 L28 65 M50 45 L72 65 M10 28 L50 45 L90 28`

### 配色方案
- **极光青 (Aurora Cyan)**: `#00f2ff`
  - 用途: App 图标、内部 UI
  - 特点: 带光晕效果 (drop-shadow)
  - 文件: `app-*.png`, `app.icns`

- **极简白 (Minimalist White)**: `#ffffff`
  - 用途: 系统托盘图标
  - 特点: 无光晕，适配 macOS 模板图标
  - 文件: `tray-*.png`

### 生成的图标文件
```
src-tauri/icons/
├── app-32x32.png
├── app-128x128.png
├── app-256x256.png
├── app-512x512.png
├── app-1024x1024.png
├── app.icns              # macOS 应用图标
├── app.iconset/          # iconset 源文件
├── tray-16x16.png
└── tray-32x32.png        # macOS 托盘图标
```

## 代码改动

### 1. Tauri 配置 (`src-tauri/tauri.conf.json`)
```diff
- "productName": "Octopus"
+ "productName": "Prism"

- "identifier": "com.octopus.app"
+ "identifier": "com.prism.app"

- "externalBin": ["binaries/octopus-server"]
+ "externalBin": ["binaries/prism-server"]

- "icon": ["icons/32x32.png", "icons/128x128.png", ...]
+ "icon": ["icons/app-32x32.png", "icons/app-128x128.png", "icons/app.icns", ...]

- "resources": ["icons/icon-template.png"]
+ "resources": ["icons/tray-32x32.png"]

- "title": "Octopus"
+ "title": "Prism"
```

### 2. Rust 代码 (`src-tauri/src/lib.rs`)
```diff
- .sidecar("octopus-server")
+ .sidecar("prism-server")

- .env("OCTOPUS_CORS_ALLOW_ORIGINS", "*")
- .env("OCTOPUS_DATA_DIR", ...)
+ .env("PRISM_CORS_ALLOW_ORIGINS", "*")
+ .env("PRISM_DATA_DIR", ...)

- let icon_path = resource_dir.join("icons/icon-template.png");
+ let icon_path = resource_dir.join("icons/tray-32x32.png");
```

### 3. Go 代码

#### `internal/conf/const.go`
```diff
- APP_NAME = "octopus"
+ APP_NAME = "prism"
```

#### `internal/conf/config.go`
```diff
- dataDir := os.Getenv("OCTOPUS_DATA_DIR")
+ dataDir := os.Getenv("PRISM_DATA_DIR")
```

#### `internal/server/middleware/cors.go`
```diff
- allowed := os.Getenv("OCTOPUS_CORS_ALLOW_ORIGINS")
+ allowed := os.Getenv("PRISM_CORS_ALLOW_ORIGINS")
```

### 4. 前端代码

#### `web/src/lib/info.ts`
```diff
- GITHUB_REPO = 'https://github.com/bestruirui/octopus'
- DESKTOP_REPO = 'https://github.com/TRAVISZHAN/octopus-app'
+ GITHUB_REPO = 'https://github.com/bestruirui/prism'
+ DESKTOP_REPO = 'https://github.com/TRAVISZHAN/prism-app'
```

#### `web/src/app/layout.tsx`
```diff
- <meta name="application-name" content="Octopus" />
- <title>Octopus</title>
+ <meta name="application-name" content="Prism" />
+ <title>Prism</title>
```

#### `web/src/components/modules/login/index.tsx`
```diff
- <h1 className="text-2xl font-bold">Octopus</h1>
+ <h1 className="text-2xl font-bold">Prism</h1>
```

### 5. 构建脚本 (`scripts/build-go-binaries.sh`)
```diff
- LDFLAGS="$LDFLAGS -X 'github.com/bestruirui/octopus/internal/conf.Version=$VERSION'"
+ LDFLAGS="$LDFLAGS -X 'github.com/bestruirui/prism/internal/conf.Version=$VERSION'"

- TARGET="octopus-server-aarch64-apple-darwin"
+ TARGET="prism-server-aarch64-apple-darwin"

(所有平台的二进制名称都已更新)
```

### 6. Package 配置 (`package.json`)
```diff
- "name": "octopus-desktop"
- "description": "Octopus Desktop Application"
+ "name": "prism-desktop"
+ "description": "Prism Desktop Application"
```

## 环境变量变更

| 旧名称 | 新名称 | 用途 |
|--------|--------|------|
| `OCTOPUS_DATA_DIR` | `PRISM_DATA_DIR` | 数据目录路径 |
| `OCTOPUS_CORS_ALLOW_ORIGINS` | `PRISM_CORS_ALLOW_ORIGINS` | CORS 白名单 |
| `OCTOPUS_*` | `PRISM_*` | 所有配置环境变量 |

## 二进制文件名变更

| 平台 | 旧名称 | 新名称 |
|------|--------|--------|
| macOS (ARM64) | `octopus-server-aarch64-apple-darwin` | `prism-server-aarch64-apple-darwin` |
| macOS (Intel) | `octopus-server-x86_64-apple-darwin` | `prism-server-x86_64-apple-darwin` |
| Windows | `octopus-server-x86_64-pc-windows-msvc.exe` | `prism-server-x86_64-pc-windows-msvc.exe` |
| Linux | `octopus-server-x86_64-unknown-linux-gnu` | `prism-server-x86_64-unknown-linux-gnu` |

## 图标生成工具

创建了 `generate-prism-icons.js` 脚本，用于从 SVG 生成多尺寸 PNG 图标：

```bash
# 安装依赖
npm install sharp

# 生成图标
node generate-prism-icons.js

# 生成 macOS .icns 文件
iconutil -c icns src-tauri/icons/app.iconset
```

## 下一步操作

### 必须完成
1. **更新 Go 模块路径**: 需要在所有 Go 文件中将 `github.com/bestruirui/octopus` 替换为 `github.com/bestruirui/prism`
2. **更新文档**: 更新 README.md 和 CLAUDE.md 中的项目名称
3. **清理旧文件**: 删除旧的图标文件和临时文件

### 可选操作
1. **生成 Windows .ico 文件**: 使用 ImageMagick 或其他工具
2. **更新 Git 仓库**: 如果需要，更新远程仓库 URL
3. **更新翻译文件**: 检查 `web/messages/` 中的翻译文件

## 测试清单

- [ ] 桌面应用启动正常
- [ ] 系统托盘图标显示正确（白色）
- [ ] 应用图标显示正确（极光青）
- [ ] Go 后端启动正常
- [ ] 环境变量读取正确
- [ ] 数据目录创建正常
- [ ] CORS 配置生效
- [ ] 前端页面标题正确
- [ ] 登录页面显示正确

## 注意事项

1. **Go 模块路径**: 当前代码中仍然使用 `github.com/bestruirui/octopus` 作为模块路径，需要全局替换
2. **数据迁移**: 用户的旧数据目录可能需要迁移（从 `octopus` 到 `prism`）
3. **向后兼容**: 考虑是否需要支持旧的环境变量名称
4. **文档更新**: 所有文档中的 "Octopus" 需要更新为 "Prism"

## 文件清单

### 新增文件
- `generate-prism-icons.js` - 图标生成脚本
- `prism-icon-options.html` - 图标方案对比页面
- `src-tauri/icons/app-*.png` - 应用图标
- `src-tauri/icons/tray-*.png` - 托盘图标
- `src-tauri/icons/app.icns` - macOS 应用图标
- `src-tauri/icons/app.iconset/` - iconset 源文件

### 修改文件
- `src-tauri/tauri.conf.json`
- `src-tauri/src/lib.rs`
- `internal/conf/const.go`
- `internal/conf/config.go`
- `internal/server/middleware/cors.go`
- `web/src/lib/info.ts`
- `web/src/app/layout.tsx`
- `web/src/components/modules/login/index.tsx`
- `scripts/build-go-binaries.sh`
- `package.json`

### 待删除文件（可选）
- `HTML-Artifacts.html` - 临时设计文件
- `prism-icon-options.html` - 临时对比文件
- `generate-icons.js` - 旧的图标生成脚本（如果存在）
- `src-tauri/icons/icon.icns` - 旧的应用图标
- `src-tauri/icons/icon-template.png` - 旧的托盘图标
