# Tauri Desktop App - 功能文档

> Octopus 桌面应用功能说明

## 概述

Octopus 桌面应用使用 Tauri v2 框架，将 Go 后端作为 sidecar 进程管理，Next.js 前端嵌入 WebView 中运行。

## 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    Tauri Desktop App                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────────────────────────────┐  │
│  │ System Tray │  │        WebView Window               │  │
│  │ (Rust)      │  │  ┌─────────────────────────────┐    │  │
│  │ • Status    │  │  │   Next.js Frontend          │    │  │
│  │ • Start     │  │  │   (static export)           │    │  │
│  │ • Stop      │  │  │   + TauriLogViewer          │    │  │
│  │ • Restart   │  │  └─────────────────────────────┘    │  │
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

## 功能列表

### 1. 系统托盘 (System Tray)

位置：`src-tauri/src/lib.rs`

托盘菜单项：

| 菜单项 | 功能 | 快捷操作 |
|--------|------|----------|
| Status | 显示当前状态（Running/Stopped） | 仅显示，不可点击 |
| Show Window | 显示主窗口 | 左键点击托盘图标 |
| Start Service | 启动 Go 后端 | 仅在停止时可用 |
| Stop Service | 停止 Go 后端 | 仅在运行时可用 |
| Restart Service | 重启 Go 后端 | 仅在运行时可用 |
| View Logs | 打开日志查看器 | 触发前端事件 |
| Quit | 退出应用 | 先停止后端再退出 |

### 2. 进程管理

位置：`src-tauri/src/lib.rs`

#### Tauri 命令

```rust
// 启动后端
#[tauri::command]
async fn start_go_backend(app: AppHandle, state: State<'_, GoProcess>) -> Result<String, String>

// 停止后端
#[tauri::command]
async fn stop_go_backend(state: State<'_, GoProcess>) -> Result<String, String>

// 重启后端
#[tauri::command]
async fn restart_go_backend(app: AppHandle, state: State<'_, GoProcess>) -> Result<String, String>

// 获取状态
#[tauri::command]
async fn get_backend_status(state: State<'_, GoProcess>) -> Result<bool, String>
```

#### 特性

- **自动启动**：应用启动后自动启动 Go 后端
- **日志流**：捕获 stdout/stderr 并推送到前端
- **优雅退出**：退出前先停止后端进程
- **macOS 隐藏**：关闭窗口时隐藏而非退出（可从托盘恢复）

### 3. 日志查看器

位置：`web/src/components/modules/log/TauriLogViewer.tsx`

#### 功能

- **实时日志**：显示 Go 后端的 stdout/stderr
- **日志类型**：区分普通日志（白色）、错误（红色）、系统消息（蓝色）
- **自动滚动**：新日志自动滚动到底部，手动滚动时暂停
- **日志上限**：保留最近 1000 条日志
- **控制按钮**：
  - Start/Stop/Restart：控制后端
  - Clear：清空日志
  - Export：导出日志为 txt 文件
  - Minimize：最小化为状态指示器

#### 状态指示器

最小化后显示为右下角的小圆点：
- 绿色：后端运行中
- 红色：后端已停止

### 4. 桌面模式检测

位置：`web/src/lib/desktop.ts`

```typescript
// 异步检测（首次使用）
export async function isDesktopApp(): Promise<boolean>

// 同步检测（后续使用）
export function isDesktopAppSync(): boolean

// 获取 API 基础 URL
export function getApiBaseUrl(): string
// 桌面模式返回 'http://127.0.0.1:8080'
// Web 模式返回 process.env.NEXT_PUBLIC_API_BASE_URL || '.'
```

### 5. Tauri 事件系统

位置：`web/src/lib/tauri-events.ts`

#### 事件监听

```typescript
// 监听日志
subscribeToLogs(onLog: (log: string) => void): Promise<UnlistenFn>

// 监听错误
subscribeToErrors(onError: (error: string) => void): Promise<UnlistenFn>

// 监听进程终止
subscribeToTermination(onTerminated: (info: string) => void): Promise<UnlistenFn>

// 监听显示日志事件（托盘菜单触发）
subscribeToShowLogs(onShowLogs: () => void): Promise<UnlistenFn>
```

#### 命令调用

```typescript
// 启动后端
startBackend(): Promise<string>

// 停止后端
stopBackend(): Promise<string>

// 重启后端
restartBackend(): Promise<string>

// 获取状态
getBackendStatus(): Promise<boolean>
```

## 事件流程图

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Rust      │     │   Events    │     │  Frontend   │
│  (Tauri)    │     │             │     │  (React)    │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │ spawn sidecar     │                   │
       ├──────────────────►│                   │
       │                   │                   │
       │ stdout line       │                   │
       ├──────────────────►│ go-backend-log   │
       │                   ├──────────────────►│
       │                   │                   │ addLog('log', ...)
       │                   │                   │
       │ stderr line       │                   │
       ├──────────────────►│ go-backend-error │
       │                   ├──────────────────►│
       │                   │                   │ addLog('error', ...)
       │                   │                   │
       │ process exit      │                   │
       ├──────────────────►│ go-backend-terminated
       │                   ├──────────────────►│
       │                   │                   │ setIsRunning(false)
       │                   │                   │
```

## 配置说明

### tauri.conf.json 关键配置

```json
{
  "bundle": {
    "externalBin": ["binaries/octopus"]  // Go sidecar 路径
  },
  "app": {
    "trayIcon": {
      "id": "main",
      "iconPath": "icons/icon.png",
      "iconAsTemplate": true  // macOS 模板图标
    }
  },
  "plugins": {
    "shell": {
      "scope": [{
        "name": "octopus",
        "sidecar": true,
        "args": true
      }]
    }
  }
}
```

### capabilities/default.json 权限

```json
{
  "permissions": [
    "core:default",
    "core:window:allow-show",
    "core:window:allow-hide",
    "core:event:allow-emit",
    "core:event:allow-listen",
    "shell:allow-spawn",
    "shell:allow-kill"
  ]
}
```

## 平台特性

### macOS

- 关闭窗口时隐藏到托盘（不退出）
- 支持 Retina 图标
- 最低系统版本：10.15

### Windows

- 需要 WebView2 Runtime（Windows 10/11 自带）
- 托盘图标显示在系统托盘

### Linux

- 需要 webkit2gtk-4.1 和 gtk3
- 托盘图标显示在系统托盘（如果桌面环境支持）
