# Tauri Desktop App - 构建指南

> Octopus 桌面应用的构建和开发指南

## 前置要求

### 所有平台

- **Node.js** 18+
- **pnpm** (推荐) 或 npm
- **Go** 1.24+
- **Rust** (最新稳定版)

### macOS

```bash
# 安装 Xcode Command Line Tools
xcode-select --install

# 安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 安装图标生成工具（可选，用于重新生成图标）
brew install librsvg
```

### Windows

```powershell
# 安装 Rust
# 下载并运行 https://win.rustup.rs/

# WebView2 Runtime（Windows 10/11 通常已预装）
# 如需手动安装：https://developer.microsoft.com/en-us/microsoft-edge/webview2/
```

### Linux (Ubuntu/Debian)

```bash
# 安装依赖
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev \
    build-essential \
    curl \
    wget \
    file \
    libxdo-dev \
    libssl-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev

# 安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

## 快速开始

### 1. 安装依赖

```bash
# 根目录（Tauri CLI）
npm install

# 前端依赖
cd web && pnpm install && cd ..
```

### 2. 构建 Go 二进制

```bash
# 仅当前平台（开发用）
sh scripts/build-go-binaries.sh --dev

# 所有平台（发布用）
sh scripts/build-go-binaries.sh
```

### 3. 开发模式

```bash
npm run tauri:dev
```

这会：
1. 启动 Next.js 开发服务器 (localhost:3000)
2. 启动 Tauri 开发窗口
3. 自动启动 Go 后端

### 4. 生产构建

```bash
npm run tauri:build
```

构建产物位于 `src-tauri/target/release/bundle/`

## 详细构建步骤

### Go Sidecar 构建

Go 二进制需要按照 Tauri 的命名规范放置：

| 平台 | 文件名 |
|------|--------|
| macOS Apple Silicon | `octopus-server-aarch64-apple-darwin` |
| macOS Intel | `octopus-server-x86_64-apple-darwin` |
| Windows | `octopus-server-x86_64-pc-windows-msvc.exe` |
| Linux | `octopus-server-x86_64-unknown-linux-gnu` |

构建脚本 `scripts/build-go-binaries.sh` 会自动处理这些。

### 图标生成

如果需要更新图标：

```bash
# 1. 将新的 SVG 放到 src-tauri/icons/icon.svg
cp your-new-icon.svg src-tauri/icons/icon.svg

# 2. 运行图标生成脚本
sh scripts/generate-icons.sh
```

### 前端构建

前端会在 Tauri 构建时自动构建（通过 `beforeBuildCommand`）：

```bash
cd web && pnpm run build
```

输出到 `web/out/` 目录（静态导出）。

## 构建配置

### package.json 脚本

```json
{
  "scripts": {
    "tauri:dev": "tauri dev",
    "tauri:build": "sh scripts/build-go-binaries.sh && tauri build",
    "tauri:build:dev": "sh scripts/build-go-binaries.sh --dev && tauri build",
    "go:build": "sh scripts/build-go-binaries.sh",
    "go:build:dev": "sh scripts/build-go-binaries.sh --dev"
  }
}
```

### tauri.conf.json 构建配置

```json
{
  "build": {
    "beforeDevCommand": "cd web && pnpm run dev",
    "beforeBuildCommand": "cd web && pnpm run build",
    "devUrl": "http://localhost:3000",
    "frontendDist": "../web/out"
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "externalBin": ["binaries/octopus"]
  }
}
```

## 平台特定构建

### macOS 签名和公证

对于分发版本，需要 Apple Developer 证书：

```bash
# 设置环境变量
export APPLE_SIGNING_IDENTITY="Developer ID Application: Your Name (XXXXXXXXXX)"
export APPLE_ID="your@email.com"
export APPLE_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="XXXXXXXXXX"

# 构建并签名
npm run tauri:build
```

### Windows 签名

```bash
# 设置证书指纹
# 在 tauri.conf.json 中配置：
# "windows": { "certificateThumbprint": "YOUR_THUMBPRINT" }

npm run tauri:build
```

### Linux AppImage

```bash
npm run tauri:build
# 输出: src-tauri/target/release/bundle/appimage/octopus_*.AppImage
```

## 构建产物

### macOS

```
src-tauri/target/release/bundle/
├── dmg/
│   └── Octopus_1.0.0_aarch64.dmg  # 或 x64
└── macos/
    └── Octopus.app/
```

### Windows

```
src-tauri/target/release/bundle/
├── msi/
│   └── Octopus_1.0.0_x64_en-US.msi
└── nsis/
    └── Octopus_1.0.0_x64-setup.exe
```

### Linux

```
src-tauri/target/release/bundle/
├── appimage/
│   └── octopus_1.0.0_amd64.AppImage
└── deb/
    └── octopus_1.0.0_amd64.deb
```

## 故障排除

### 常见问题

#### 1. Go 二进制找不到

```
Error: Failed to spawn sidecar
```

解决：确保运行了 `sh scripts/build-go-binaries.sh --dev`

#### 2. 前端构建失败

```
Error: beforeBuildCommand failed
```

解决：
```bash
cd web
pnpm install
pnpm run build
```

#### 3. Rust 编译错误

```
Error: could not compile `octopus`
```

解决：
```bash
cd src-tauri
cargo clean
cargo build
```

#### 4. macOS 权限问题

```
"Octopus" is damaged and can't be opened
```

解决：
```bash
xattr -cr /Applications/Octopus.app
```

#### 5. Linux WebKitGTK 缺失

```
Error: webkit2gtk-4.1 not found
```

解决：
```bash
sudo apt install libwebkit2gtk-4.1-dev
```

### 调试模式

```bash
# 启用 Rust 日志
RUST_LOG=debug npm run tauri:dev

# 查看 Tauri 详细输出
npm run tauri:dev -- --verbose
```

## 开发工作流

### 推荐流程

1. **修改前端代码**：直接修改，热重载生效
2. **修改 Rust 代码**：保存后自动重新编译
3. **修改 Go 代码**：需要重新运行 `sh scripts/build-go-binaries.sh --dev`

### 测试清单

- [ ] 窗口正常显示
- [ ] 托盘图标出现
- [ ] Start Service 启动后端
- [ ] 访问 http://127.0.0.1:8080/api/v1/health 确认后端运行
- [ ] View Logs 显示日志
- [ ] Stop Service 停止后端
- [ ] Quit 退出应用

## CI/CD 集成

### GitHub Actions 示例

```yaml
name: Build Desktop App

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        include:
          - os: macos-latest
            target: aarch64-apple-darwin
          - os: macos-latest
            target: x86_64-apple-darwin
          - os: windows-latest
            target: x86_64-pc-windows-msvc
          - os: ubuntu-latest
            target: x86_64-unknown-linux-gnu

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.24'

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Install dependencies (Linux)
        if: matrix.os == 'ubuntu-latest'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev libayatana-appindicator3-dev

      - name: Install Node dependencies
        run: |
          npm install
          cd web && npm install

      - name: Build Go binary
        run: sh scripts/build-go-binaries.sh --dev

      - name: Build Tauri app
        run: npm run tauri:build

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: octopus-${{ matrix.target }}
          path: src-tauri/target/release/bundle/
```
