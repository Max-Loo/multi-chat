# Proposal: Web 存储 Keyring 兼容层

## Why

当前应用仅支持 Tauri 桌面环境，无法在 Web 浏览器中运行。应用依赖 `@tauri-apps/plugin-store`（键值存储）和 `@tauri-plugin-keyring-api`（系统钥匙串存储）插件，这些插件在 Web 环境中不可用。为了实现 Web 端支持，需要为这两个插件提供兼容层，在 Web 端降级为 IndexedDB 方案，同时保持 Tauri 端的现有逻辑不变。

## What Changes

- **新增** `@tauri-apps/plugin-store` 插件的 Web 兼容层，使用 IndexedDB 实现键值存储
- **新增** `@tauri-plugin-keyring-api` 插件的 Web 兼容层，使用 IndexedDB 实现安全存储
- **修改** 主密钥存储逻辑：
  - Tauri 端：继续使用 `@tauri-plugin-keyring-api` 存储到系统钥匙串
  - Web 端：使用 IndexedDB 存储主密钥（加密存储）
- **扩展** `src/utils/tauriCompat/` 目录结构，添加 `store.ts` 和 `keyring.ts` 模块
- **保持** 兼容层 API 与 Tauri 原生 API 的类型一致性

## Capabilities

### New Capabilities

- **web-store-compat**: 为 `@tauri-apps/plugin-store` 提供 Web 兼容层，使用 IndexedDB 实现键值存储，确保与 Tauri 原生 API 的行为一致
- **web-keyring-compat**: 为 `@tauri-plugin-keyring-api` 提供 Web 兼容层，使用 IndexedDB 实现安全存储，为主密钥提供 Web 端存储方案

### Modified Capabilities

- **tauri-plugin-web-compat**: 扩展现有的 Tauri 插件 Web 兼容层框架，从 Shell 和 OS 插件扩展到 store 和 keyring 插件。增加 IndexedDB 降级方案（而非 Null Object 模式）的规范要求。
- **app-master-key**: 修改主密钥存储逻辑，支持 Web 端使用 IndexedDB 存储主密钥（替代 keyring），同时保持 Tauri 端使用系统钥匙串
- **secure-key-storage**: 修改安全密钥存储规范，支持 Web 端使用 IndexedDB 加密存储（替代 keyring），同时保持 Tauri 端使用系统钥匙串

## Impact

**受影响的代码**:
- `src/store/keyring/masterKey.ts` - 主密钥初始化和存储逻辑
- `src/utils/tauriCompat/index.ts` - 导出新的兼容层 API
- `src/store/storage/` - 使用 store 插件的存储模块

**新增的依赖**:
- Web 端不需要额外的运行时依赖，使用浏览器原生 IndexedDB API

**受影响的文档**:
- `AGENTS.md` - 需要更新跨平台兼容性章节，添加 store 和 keyring 兼容层的文档

**兼容性**:
- 保持完全向后兼容，Tauri 端的现有逻辑和行为不变
- Web 端提供降级方案，确保应用在浏览器中正常运行
