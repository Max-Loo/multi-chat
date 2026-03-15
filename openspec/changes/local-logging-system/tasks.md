# 本地日志采集系统 - 任务清单

## 0. 代码审计与准备

- [x] 0.1 扫描现有 console.* 使用情况，生成分布报告
- [x] 0.2 分析 try-catch 覆盖率，标记缺失错误处理的位置
- [x] 0.3 识别需要日志埋点的关键流程（聊天、模型管理、初始化）
- [x] 0.4 追踪敏感数据流向，标记需要脱敏的代码位置
- [x] 0.5 检查 Rust 端现有 Tauri 命令和错误处理模式

## 1. Rust 基础设施

- [x] 1.1 添加 Rust 依赖（tracing, tracing-subscriber, tracing-appender）到 Cargo.toml
- [x] 1.2 创建日志配置模块 `src-tauri/src/logging/config.rs`
- [x] 1.3 配置 tracing-subscriber 使用 JSON 格式输出（自定义 formatter）
- [x] 1.4 实现文件写入器 `src-tauri/src/logging/writer.rs`（支持按天轮转）
- [x] 1.5 实现日志文件清理逻辑（删除超过 30 天的日志文件）
- [x] 1.6 创建日志模块入口 `src-tauri/src/logging/mod.rs`
- [x] 1.7 实现 `log_write` Tauri 命令
- [x] 1.8 实现 `log_export` Tauri 命令
- [x] 1.9 实现 `log_clear` Tauri 命令（返回清除的文件数和释放空间）
- [x] 1.10 实现 `log_status` Tauri 命令（返回日志大小、文件数、日期范围）
- [x] 1.11 在 `lib.rs` 中初始化日志系统
- [x] 1.12 在应用启动时触发日志清理检查
- [x] 1.13 更新 `commands/mod.rs` 导出日志命令

## 2. 前端日志器

- [x] 2.1 创建类型定义 `src/utils/logger/types.ts`（LogLevel, LogEntry 等）
- [x] 2.2 实现 API Key 脱敏器 `src/utils/logger/sanitizers/apiKey.ts`
- [x] 2.3 实现内容脱敏器 `src/utils/logger/sanitizers/content.ts`（支持递归遍历）
- [x] 2.4 实现个人信息脱敏器 `src/utils/logger/sanitizers/pii.ts`
- [x] 2.5 实现统一脱敏管道 `src/utils/logger/sanitizers/index.ts`（递归处理嵌套对象和数组）
- [x] 2.6 实现 TauriTransport `src/utils/logger/transports/TauriTransport.ts`
- [x] 2.7 实现 ConsoleTransport `src/utils/logger/transports/ConsoleTransport.ts`
- [x] 2.8 实现日志缓冲机制 `src/utils/logger/LogBuffer.ts`（100ms/10条批量发送）
- [x] 2.9 实现 Logger 类 `src/utils/logger/Logger.ts`（集成缓冲机制）
- [x] 2.10 创建模块入口 `src/utils/logger/index.ts`（导出 logger 实例）
- [x] 2.11 集成全局错误捕获（window.onerror, unhandledrejection）

## 3. UI 集成

- [x] 3.1 创建 LogSettings 组件 `src/pages/Setting/components/LogSettings/index.tsx`
- [x] 3.2 实现日志状态显示（调用 log_status，显示总大小、文件数、日期范围）
- [x] 3.3 实现导出日志按钮和功能（调用 log_export，触发文件下载）
- [x] 3.4 实现清除日志按钮和确认对话框（调用 log_clear）
- [x] 3.5 将 LogSettings 组件集成到设置页面

## 4. 日志埋点

- [x] 4.1 迁移 InitializationManager 中的 console.* 到 Logger
- [x] 4.2 迁移 chat service 中的 console.* 到 Logger
- [x] 4.3 迁移 modelRemote service 中的 console.* 到 Logger
- [x] 4.4 为聊天发送流程添加日志埋点
- [x] 4.5 为模型管理流程添加日志埋点
- [x] 4.6 为 API 调用添加日志埋点（成功/失败）
- [x] 4.7 清理不再需要的调试用 console.*

## 5. 单元测试

- [x] 5.1 脱敏器单元测试（API Key、内容、PII、递归遍历）
- [x] 5.2 Logger 类单元测试（日志级别、上下文合并）
- [x] 5.3 LogBuffer 单元测试（缓冲触发条件、批量发送）
- [x] 5.4 Transport 单元测试（TauriTransport、ConsoleTransport）

## 6. 集成验证

- [x] 6.1 验证日志文件正确创建和按天轮转
- [x] 6.2 验证 30 天清理逻辑正常工作
- [x] 6.3 验证敏感信息正确脱敏（包括嵌套对象）
- [x] 6.4 验证导出功能生成有效 JSON 数组
- [x] 6.5 验证清除功能正确删除日志文件
- [x] 6.6 验证开发/生产模式行为差异
- [x] 6.7 验证全局错误捕获正常工作
- [x] 6.8 验证缓冲机制在高频日志下正常工作
