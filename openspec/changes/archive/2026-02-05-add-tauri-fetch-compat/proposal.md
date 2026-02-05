# HTTP Fetch 跨平台兼容层 - 提案

## Why

项目支持 Tauri 桌面和 Web 浏览器两种运行模式，当前使用的 `@tauri-apps/plugin-http` 的 `tauriFetch` 在 Web 环境中不可用，导致应用在 Web 端无法正常运行。需要创建统一的 fetch 兼容层，根据运行环境自动选择合适的实现，确保代码在开发和生产环境、Tauri 和 Web 平台上都能正常工作。

## What Changes

- 创建新的兼容层模块 `src/utils/tauriCompat/http.ts`，提供统一的 fetch API 和获取 fetch 函数的方法
- 实现环境检测逻辑：
  - **开发环境**：使用原生 Web `fetch` API
  - **生产环境 + Web 端**：使用原生 Web `fetch` API
  - **生产环境 + Tauri 端**：使用 `@tauri-apps/plugin-http` 的 `tauriFetch`
- 提供两种使用方式：
  - 直接调用 `fetch()` 函数
  - 通过 `getFetchFunc()` 方法获取 fetch 函数实例（用于第三方库注入或自定义封装）
- 定义并导出自定义 `RequestInfo` 类型：`type RequestInfo = string | URL | Request`
- 其他类型（RequestInit、Response、Headers 等）使用原生类型定义，避免重复定义
- 在 `src/utils/tauriCompat/index.ts` 中导出所有 HTTP 兼容层 API（fetch、getFetchFunc、RequestInfo）
- 更新所有直接使用 `@tauri-apps/plugin-http` 的代码，替换为兼容层 API
- 更新 AGENTS.md 文档，添加 HTTP 兼容层的使用说明和示例代码

## Capabilities

### New Capabilities
- `http-fetch-compat`: HTTP fetch 跨平台兼容层，提供统一的 fetch API，根据运行环境自动选择原生 fetch 或 Tauri fetch 实现

### Modified Capabilities
无（此变更不涉及现有功能的需求变更，仅添加新的兼容层）

## Impact

- **代码变更**：所有使用 `@tauri-apps/plugin-http` 的模块需要更新导入路径
- **API 变更**：
  - 从 `import { fetch as tauriFetch } from '@tauri-apps/plugin-http'`
  - 改为 `import { fetch, getFetchFunc, RequestInfo } from '@/utils/tauriCompat'`
- **使用场景**：
  - 直接使用 fetch：适用于常规 HTTP 请求场景
  - 使用 getFetchFunc()：适用于第三方库 fetch 注入（如 Axios）或自定义请求方法封装
- **依赖项**：不新增外部依赖，复用现有的 `@tauri-apps/plugin-http`
- **平台兼容性**：确保 HTTP 请求在 Tauri 桌面和 Web 浏览器环境中均可正常工作
- **类型安全**：RequestInfo 自定义定义，其他类型使用原生定义，保持类型兼容性
- **文档更新**：在 AGENTS.md 中新增 HTTP 兼容层章节和使用示例
