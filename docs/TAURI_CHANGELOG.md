# Tauri Desktop App - Changelog

> 记录 Tauri 桌面应用相关的文件变更

## 2026-01-17 - 初始实现

### 新增文件

#### Tauri 核心文件 (`src-tauri/`)

| 文件 | 说明 |
|------|------|
| `src-tauri/Cargo.toml` | Rust 依赖配置，包含 tauri v2、shell 插件、tokio 等 |
| `src-tauri/build.rs` | Tauri 构建脚本 |
| `src-tauri/src/main.rs` | 桌面应用入口点 |
| `src-tauri/src/lib.rs` | 核心逻辑：进程管理 + 系统托盘 |
| `src-tauri/tauri.conf.json` | Tauri 配置文件（窗口、打包、sidecar 等） |
| `src-tauri/capabilities/default.json` | 权限配置（shell:spawn 等） |

#### 图标文件 (`src-tauri/icons/`)

| 文件 | 说明 |
|------|------|
| `src-tauri/icons/icon.svg` | 源 SVG 图标（从 web/public/logo.svg 复制） |
| `src-tauri/icons/32x32.png` | 32x32 PNG 图标 |
| `src-tauri/icons/128x128.png` | 128x128 PNG 图标 |
| `src-tauri/icons/128x128@2x.png` | 256x256 PNG 图标（Retina） |
| `src-tauri/icons/icon.png` | 512x512 PNG 图标 |
| `src-tauri/icons/icon.icns` | macOS 图标 |
| `src-tauri/icons/icon.ico` | Windows 图标 |

#### 构建脚本 (`scripts/`)

| 文件 | 说明 |
|------|------|
| `scripts/build-go-binaries.sh` | Go 多平台构建脚本，生成 `octopus-server-*` sidecar 二进制 |
| `scripts/generate-icons.sh` | 从 SVG 生成各平台图标 |

#### 前端集成 (`web/src/`)

| 文件 | 说明 |
|------|------|
| `web/src/lib/desktop.ts` | 桌面模式检测，API URL 适配 |
| `web/src/lib/tauri-events.ts` | Tauri 事件监听和命令调用封装 |
| `web/src/components/modules/log/TauriLogViewer.tsx` | 实时日志查看器组件 |

#### 根目录

| 文件 | 说明 |
|------|------|
| `package.json` | 根目录 package.json，包含 Tauri CLI 和构建脚本 |

### 修改文件

| 文件 | 变更内容 |
|------|----------|
| `web/package.json` | 添加 `@tauri-apps/api` 依赖 |
| `web/src/api/client.ts` | 使用 `getApiBaseUrl()` 支持桌面模式 |
| `web/src/components/app.tsx` | 集成 `TauriLogViewer` 组件 |
| `.gitignore` | 添加 Tauri 构建产物忽略规则 |

---

## 文件结构概览

```
octopus-app/
├── package.json                    # [新增] 根目录 package.json
├── .gitignore                      # [修改] 添加 Tauri 忽略规则
├── scripts/
│   ├── build-go-binaries.sh        # [新增] Go 构建脚本
│   └── generate-icons.sh           # [新增] 图标生成脚本
├── src-tauri/
│   ├── Cargo.toml                  # [新增] Rust 依赖
│   ├── build.rs                    # [新增] 构建脚本
│   ├── tauri.conf.json             # [新增] Tauri 配置
│   ├── src/
│   │   ├── main.rs                 # [新增] 入口点
│   │   └── lib.rs                  # [新增] 核心逻辑
│   ├── capabilities/
│   │   └── default.json            # [新增] 权限配置
│   ├── icons/                      # [新增] 应用图标
│   └── binaries/                   # [gitignore] Go 二进制
├── web/
│   ├── package.json                # [修改] 添加 Tauri API
│   └── src/
│       ├── api/
│       │   └── client.ts           # [修改] 桌面模式支持
│       ├── components/
│       │   ├── app.tsx             # [修改] 集成日志查看器
│       │   └── modules/log/
│       │       └── TauriLogViewer.tsx  # [新增] 日志查看器
│       └── lib/
│           ├── desktop.ts          # [新增] 桌面检测
│           └── tauri-events.ts     # [新增] 事件处理
├── docs/
│   ├── TAURI_CHANGELOG.md          # [新增] 本文件
│   ├── TAURI_FEATURES.md           # [新增] 功能文档
│   └── TAURI_BUILD.md              # [新增] 构建指南
└── .claude/
    └── plan/
        └── tauri-desktop-plan.md   # [新增] 实施计划
```
