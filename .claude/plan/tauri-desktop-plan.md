# 实施计划：Octopus 桌面应用 + 系统托盘

> 生成时间: 2026-01-17
> 分发方式: Notarized 分发（非 App Store）
> 框架选择: Tauri v2

## 技术方案概述

使用 **Tauri v2** 将 Octopus 包装为桌面应用：
- Go 后端作为 **sidecar**（子进程）由 Tauri 管理
- Next.js 前端静态导出后嵌入 Tauri
- 系统托盘提供服务控制和状态监控

```
┌─────────────────────────────────────────────────────────────┐
│                    Tauri Desktop App                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────────────────────────────┐  │
│  │ System Tray │  │        WebView Window               │  │
│  │ (Rust)      │  │  ┌─────────────────────────────┐    │  │
│  │ • Status    │  │  │   Next.js Frontend          │    │  │
│  │ • Start     │  │  │   (static export)           │    │  │
│  │ • Stop      │  │  └─────────────────────────────┘    │  │
│  │ • Restart   │  │                                     │  │
│  │ • Logs      │  │                                     │  │
│  │ • Quit      │  │                                     │  │
│  └─────────────┘  └─────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                 Go Backend (sidecar process)                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Existing Octopus Core                    │  │
│  │  (server, relay, transformer, db, op, task...)       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 实施步骤

### Step 1: 初始化 Tauri 项目

**操作**: 在项目根目录创建 `src-tauri/` 目录

```bash
# 安装 Tauri CLI
npm install -D @tauri-apps/cli

# 初始化 Tauri（选择 Next.js 模板）
npx tauri init
```

**新增文件**:
| 文件 | 说明 |
|------|------|
| `src-tauri/Cargo.toml` | Rust 依赖配置 |
| `src-tauri/tauri.conf.json` | Tauri 配置 |
| `src-tauri/src/main.rs` | 桌面入口 |
| `src-tauri/src/lib.rs` | 主逻辑 |

### Step 2: 配置 Go Sidecar

**操作**: 构建多平台 Go 二进制并配置为 sidecar

1. 创建构建脚本 `scripts/build-go-binaries.sh`:
```bash
#!/bin/bash
OUTPUT_DIR="src-tauri/binaries"
mkdir -p "$OUTPUT_DIR"

# macOS Apple Silicon
GOOS=darwin GOARCH=arm64 go build -o "$OUTPUT_DIR/octopus-aarch64-apple-darwin" main.go

# macOS Intel
GOOS=darwin GOARCH=amd64 go build -o "$OUTPUT_DIR/octopus-x86_64-apple-darwin" main.go

# Windows
GOOS=windows GOARCH=amd64 go build -o "$OUTPUT_DIR/octopus-x86_64-pc-windows-msvc.exe" main.go

# Linux
GOOS=linux GOARCH=amd64 go build -o "$OUTPUT_DIR/octopus-x86_64-unknown-linux-gnu" main.go
```

2. 配置 `src-tauri/tauri.conf.json`:
```json
{
  "bundle": {
    "externalBin": ["binaries/octopus"]
  }
}
```

**新增文件**:
| 文件 | 说明 |
|------|------|
| `scripts/build-go-binaries.sh` | Go 多平台构建脚本 |
| `src-tauri/binaries/` | Go 二进制目录 |

### Step 3: 实现进程管理

**操作**: 在 Rust 中实现 Go 进程的启动/停止/重启

`src-tauri/src/lib.rs` 核心逻辑:
```rust
// 状态管理
struct GoProcess {
    child: Mutex<Option<CommandChild>>,
}

// Tauri 命令
#[tauri::command]
async fn start_go_backend(app: AppHandle, state: State<'_, GoProcess>) -> Result<String, String>

#[tauri::command]
async fn stop_go_backend(state: State<'_, GoProcess>) -> Result<String, String>

#[tauri::command]
async fn restart_go_backend(app: AppHandle, state: State<'_, GoProcess>) -> Result<String, String>

#[tauri::command]
async fn get_backend_status(state: State<'_, GoProcess>) -> Result<bool, String>
```

**修改文件**:
| 文件 | 操作 | 说明 |
|------|------|------|
| `src-tauri/src/lib.rs` | 新增 | 进程管理逻辑 |
| `src-tauri/capabilities/default.json` | 新增 | shell:allow-spawn 权限 |

### Step 4: 实现系统托盘

**操作**: 使用 Tauri 内置托盘 API

托盘菜单项:
- 状态指示（Running/Stopped）
- Start Service
- Stop Service
- Restart Service
- View Logs
- Show Window
- Quit

`src-tauri/src/lib.rs` 托盘逻辑:
```rust
fn create_tray(app: &AppHandle) -> tauri::Result<()> {
    let menu = Menu::with_items(app, &[
        &MenuItem::with_id(app, "show", "Show Window", true, None::<&str>)?,
        &PredefinedMenuItem::separator(app)?,
        &MenuItem::with_id(app, "start", "Start Service", true, None::<&str>)?,
        &MenuItem::with_id(app, "stop", "Stop Service", true, None::<&str>)?,
        &MenuItem::with_id(app, "restart", "Restart Service", true, None::<&str>)?,
        &PredefinedMenuItem::separator(app)?,
        &MenuItem::with_id(app, "logs", "View Logs", true, None::<&str>)?,
        &PredefinedMenuItem::separator(app)?,
        &MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?,
    ])?;

    TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .on_menu_event(handle_tray_event)
        .build(app)?;
    Ok(())
}
```

**修改文件**:
| 文件 | 操作 | 说明 |
|------|------|------|
| `src-tauri/src/lib.rs` | 修改 | 添加托盘逻辑 |
| `src-tauri/Cargo.toml` | 修改 | 添加 `tray-icon` feature |

### Step 5: 实现日志流

**操作**: 捕获 Go 进程 stdout/stderr 并推送到前端

Rust 端（已在 Step 3 中实现）:
```rust
// 在 spawn 后监听输出
while let Some(event) = rx.recv().await {
    match event {
        CommandEvent::Stdout(line) => {
            app_handle.emit("go-backend-log", String::from_utf8_lossy(&line)).ok();
        }
        CommandEvent::Stderr(line) => {
            app_handle.emit("go-backend-error", String::from_utf8_lossy(&line)).ok();
        }
        _ => {}
    }
}
```

前端监听:
```typescript
// web/src/lib/tauri-events.ts
import { listen } from '@tauri-apps/api/event';

export async function subscribeToLogs(onLog: (log: string) => void) {
    return listen<string>('go-backend-log', (event) => onLog(event.payload));
}
```

**新增文件**:
| 文件 | 说明 |
|------|------|
| `web/src/lib/tauri-events.ts` | Tauri 事件监听 |

### Step 6: 前端适配

**操作**: 检测 Tauri 环境并调整 API 调用

1. 安装 Tauri API:
```bash
cd web && pnpm add @tauri-apps/api
```

2. 创建桌面模式检测:
```typescript
// web/src/lib/desktop.ts
import { isTauri } from '@tauri-apps/api/core';

export const isDesktopApp = async () => {
    try {
        return await isTauri();
    } catch {
        return false;
    }
};
```

3. 修改 API client:
```typescript
// web/src/api/client.ts
const API_BASE_URL = await isDesktopApp()
    ? 'http://127.0.0.1:8080'  // 桌面模式：连接本地 Go 后端
    : (process.env.NEXT_PUBLIC_API_BASE_URL || '');
```

**修改文件**:
| 文件 | 操作 | 说明 |
|------|------|------|
| `web/package.json` | 修改 | 添加 @tauri-apps/api |
| `web/src/lib/desktop.ts` | 新增 | 桌面模式检测 |
| `web/src/api/client.ts` | 修改 | 支持桌面模式 |

### Step 7: 日志查看器组件

**操作**: 创建独立的日志查看器组件（用于托盘"View Logs"）

```typescript
// web/src/components/modules/log/TauriLogViewer.tsx
export function TauriLogViewer() {
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        const unlisten = listen<string>('go-backend-log', (event) => {
            setLogs(prev => [...prev.slice(-500), event.payload]); // 保留最近500条
        });
        return () => { unlisten.then(fn => fn()); };
    }, []);

    return (
        <div className="h-full overflow-auto font-mono text-sm">
            {logs.map((log, i) => <div key={i}>{log}</div>)}
        </div>
    );
}
```

**新增文件**:
| 文件 | 说明 |
|------|------|
| `web/src/components/modules/log/TauriLogViewer.tsx` | 系统日志查看器 |

### Step 8: 应用图标和资源

**操作**: 准备应用图标

```bash
# 使用 Tauri 图标生成工具
npx tauri icon public/logo.svg
```

**新增文件**:
| 文件 | 说明 |
|------|------|
| `src-tauri/icons/icon.icns` | macOS 图标 |
| `src-tauri/icons/icon.ico` | Windows 图标 |
| `src-tauri/icons/icon.png` | Linux 图标 |
| `src-tauri/icons/tray-running.png` | 托盘图标（运行中） |
| `src-tauri/icons/tray-stopped.png` | 托盘图标（已停止） |

### Step 9: 构建配置

**操作**: 配置完整的 Tauri 构建

`src-tauri/tauri.conf.json`:
```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "Octopus",
  "version": "1.0.0",
  "identifier": "com.octopus.app",
  "build": {
    "beforeDevCommand": "cd web && pnpm run dev",
    "beforeBuildCommand": "cd web && pnpm run build",
    "devUrl": "http://localhost:3000",
    "frontendDist": "../web/out"
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "externalBin": ["binaries/octopus"],
    "icon": ["icons/icon.icns", "icons/icon.ico", "icons/icon.png"],
    "macOS": {
      "minimumSystemVersion": "10.15"
    }
  },
  "app": {
    "windows": [{
      "title": "Octopus",
      "width": 1200,
      "height": 800,
      "resizable": true
    }],
    "security": {
      "csp": null
    }
  }
}
```

根目录 `package.json` 添加脚本:
```json
{
  "scripts": {
    "tauri:dev": "tauri dev",
    "tauri:build": "sh scripts/build-go-binaries.sh && tauri build"
  }
}
```

**修改文件**:
| 文件 | 操作 | 说明 |
|------|------|------|
| `src-tauri/tauri.conf.json` | 修改 | 完整配置 |
| `package.json` | 修改 | 添加 tauri 脚本 |

### Step 10: macOS 签名和公证

**操作**: 配置 Apple 签名（Notarized 分发）

1. 设置环境变量:
```bash
export APPLE_SIGNING_IDENTITY="Developer ID Application: Your Name (XXXXXXXXXX)"
export APPLE_ID="your@email.com"
export APPLE_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="XXXXXXXXXX"
```

2. 构建并公证:
```bash
npm run tauri:build
```

## 关键文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src-tauri/Cargo.toml` | 新增 | Rust 依赖 |
| `src-tauri/tauri.conf.json` | 新增 | Tauri 配置 |
| `src-tauri/src/main.rs` | 新增 | 桌面入口 |
| `src-tauri/src/lib.rs` | 新增 | 进程管理 + 托盘 |
| `src-tauri/capabilities/default.json` | 新增 | 权限配置 |
| `src-tauri/binaries/` | 新增 | Go 二进制 |
| `src-tauri/icons/` | 新增 | 应用图标 |
| `scripts/build-go-binaries.sh` | 新增 | Go 构建脚本 |
| `web/src/lib/desktop.ts` | 新增 | 桌面模式检测 |
| `web/src/lib/tauri-events.ts` | 新增 | Tauri 事件 |
| `web/src/components/modules/log/TauriLogViewer.tsx` | 新增 | 日志查看器 |
| `web/src/api/client.ts` | 修改 | 支持桌面模式 |
| `web/package.json` | 修改 | 添加 @tauri-apps/api |
| `package.json` | 修改 | 添加 tauri 脚本 |

## 风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| Rust 工具链学习曲线 | 提供完整代码模板，减少 Rust 编写量 |
| Go 进程异常退出 | 监听 Terminated 事件，自动重启或提示用户 |
| 端口冲突 | 实现端口检测，自动选择可用端口 |
| macOS 签名问题 | 使用 Apple Developer 证书，配置 entitlements |
| Linux WebKitGTK 兼容性 | 测试主流发行版，提供安装说明 |

## 验证方法

### 开发模式测试
```bash
# 1. 构建 Go 二进制
sh scripts/build-go-binaries.sh

# 2. 启动 Tauri 开发模式
npm run tauri:dev

# 3. 验证功能
# - 窗口正常显示 Next.js UI
# - 托盘图标出现
# - 点击 Start Service 启动 Go 后端
# - 访问 http://127.0.0.1:8080/api/v1/health 确认后端运行
# - 点击 View Logs 查看日志
# - 点击 Stop Service 停止后端
# - 点击 Quit 退出应用
```

### 生产构建测试
```bash
# 1. 构建应用
npm run tauri:build

# 2. 安装并运行
# macOS: open src-tauri/target/release/bundle/dmg/Octopus_*.dmg
# Windows: 运行 src-tauri/target/release/bundle/msi/Octopus_*.msi

# 3. 验证同上
```

## 依赖项

### Rust 依赖 (src-tauri/Cargo.toml)
```toml
[dependencies]
tauri = { version = "2", features = ["tray-icon"] }
tauri-plugin-shell = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }
```

### 前端依赖
```bash
cd web && pnpm add @tauri-apps/api
```

### 系统依赖
- **macOS**: Xcode Command Line Tools
- **Windows**: WebView2 Runtime (Windows 10/11 自带)
- **Linux**: `webkit2gtk-4.1`, `gtk3`
