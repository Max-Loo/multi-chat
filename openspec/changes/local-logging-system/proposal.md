# 本地日志采集系统

## Why

当前项目没有统一的日志系统，导致问题排查困难。用户遇到问题时，开发者无法获取足够的上下文信息来诊断问题。同时，日志中可能包含敏感信息（API Key、聊天内容等），需要自动脱敏处理。

建立本地日志采集系统可以：
1. 统一采集前端 React 和后端 Rust 的日志到本地文件
2. 为问题排查提供结构化的日志数据
3. 支持用户导出日志文件用于问题反馈
4. 自动脱敏敏感信息，保护用户隐私

## What Changes

### 新增功能

- **前端 Logger 模块**：统一的前端日志接口，支持多级别日志（DEBUG/INFO/WARN/ERROR）
- **后端日志命令**：Rust 侧的日志写入、导出、清除命令
- **敏感信息脱敏器**：自动识别并脱敏 API Key、聊天内容、个人信息等
- **日志设置 UI**：在设置页面提供日志状态显示、导出和清除功能
- **日志轮转**：按天轮转日志文件，保留 30 天
- **开发/生产模式区分**：开发模式输出到控制台，生产模式仅写入文件

### 修改内容

- **错误处理增强**：现有代码中的 console.* 调用将迁移到 Logger
- **全局错误捕获**：集成 window.onerror 和 unhandledrejection 捕获

## Capabilities

### New Capabilities

- `logger-service`：日志服务的核心能力，包括日志写入、存储、轮转和脱敏
- `log-export`：日志导出能力，支持导出为 JSON 格式文件
- `log-settings`：日志设置能力，包括日志状态显示、清除日志等功能

### Modified Capabilities

无。这是新增功能，不修改现有能力的规格要求。

## Impact

### 代码影响

| 区域 | 变更 |
|------|------|
| `src/utils/logger/` | 新增前端日志模块 |
| `src/pages/Setting/` | 新增日志设置组件 |
| `src-tauri/src/commands/` | 新增 log.rs 命令文件 |
| `src-tauri/src/logging/` | 新增日志模块 |
| `src-tauri/Cargo.toml` | 新增 tracing 依赖 |

### 依赖影响

**Rust 新增依赖**：
- `tracing` - 结构化日志框架
- `tracing-subscriber` - 日志订阅器
- `tracing-appender` - 文件轮转支持

### 存储影响

- **日志文件位置**：
  - macOS: `~/Library/Logs/multi-chat/`
  - Windows: `%APPDATA%/multi-chat/logs/`
  - Linux: `~/.local/share/multi-chat/logs/`
- **存储空间**：预计每天 1-5MB，30 天约 30-150MB

### 用户影响

- 用户可在设置页面导出日志用于问题反馈
- 用户可清除日志释放存储空间
- 日志自动脱敏，无需担心敏感信息泄露
