# 添加 OS 插件 locale() API Web 兼容层支持

## Why

项目已实现 Web 浏览器运行模式支持，当前已有 Shell 插件的 Web 兼容层。代码中使用 `@tauri-apps/plugin-os` 的 `locale()` API 来获取系统语言设置（用于国际化初始化），该 API 在 Web 环境中不可用。需要为 `locale()` 提供 Web 兼容层，确保应用在 Web 环境中能正常获取浏览器语言设置。

同时，项目中使用了 `platform()` API 来检测 macOS 平台（用于处理 Safari 浏览器中文输入法 bug）。在 Web 环境中，应该直接通过浏览器 UserAgent 判断内核，而非依赖 Tauri API。

## What Changes

- 在 `src/utils/tauriCompat/` 目录下新增 `os.ts` 模块
- **仅实现 `locale()` API 的兼容层**：
  - Tauri 环境：调用 `@tauri-apps/plugin-os` 的原生 `locale()` 实现
  - Web 环境：使用浏览器 `navigator.language` API 作为降级实现
- **移除 `platform()` 的使用**：
  - 在 `ChatPanelSender.tsx` 中，将 `platform()` 调用改为浏览器内核检测逻辑
  - 通过 UserAgent 判断是否为 macOS 平台的 Safari 浏览器
- 在 `src/utils/tauriCompat/index.ts` 中导出 `locale()` 函数
- 更新 `src/lib/global.ts` 使用兼容层的 `locale()` API
- 更新 AGENTS.md 文档，添加 OS 插件 locale() 兼容层说明
- 遵循现有的 Shell 插件兼容层设计模式（环境检测 + 降级实现）

## Capabilities

### New Capabilities
- `os-locale-compat`: OS 插件 locale() API 的 Web 兼容层实现，提供统一的语言获取接口，在 Tauri 环境调用原生实现，在 Web 环境使用浏览器 API

### Modified Capabilities
- 无现有 spec 的需求变更（这是对 tauri-plugin-web-compat 通用规范的具体实现）

## Impact

**新增文件**:
- `src/utils/tauriCompat/os.ts`: OS 插件 locale() 兼容层实现

**修改文件**:
- `src/utils/tauriCompat/index.ts`: 添加 `locale()` 函数的导出
- `src/lib/global.ts`: 将 `@tauri-apps/plugin-os` 的导入改为兼容层导入
- `src/pages/Chat/components/ChatContent/components/ChatPanel/components/ChatPanelSender.tsx`: 移除 `platform()` 使用，改为浏览器内核检测

**依赖**:
- `@tauri-apps/plugin-os`: 项目已安装版本 2.3.2（仅 Tauri 环境使用）
- 复用现有的 `@/utils/tauriCompat/env.ts` 环境检测工具

**兼容性**:
- 不影响现有 Tauri 桌面环境的功能
- Web 环境使用浏览器原生 API，不抛出异常
- 保持与 `@tauri-apps/plugin-os` 原生 API 的类型一致性
- **Breaking**: 移除 `platform()` 的使用，改为浏览器检测逻辑（仅在 ChatPanelSender 组件中）
