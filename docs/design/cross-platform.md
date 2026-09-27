# 平台服务层

本文档说明 `src/platform/` 平台服务层的设计，它封装应用依赖的浏览器平台能力。

## 动机

将浏览器平台能力的访问收敛到统一模块：
- **统一接口**：业务代码经 `@/platform` 导入，不直接触碰平台 API
- **可测试性**：测试经 `vi.mock('@/platform')` 隔离平台边界
- **自持类型**：不依赖原生容器（如 Tauri 插件）的类型定义

## 架构

### 目录结构

```
src/platform/
├── index.ts           # 统一导出（barrel）
├── env.ts             # 环境检测（isTestEnvironment、PBKDF2 参数）
├── http.ts            # HTTP 服务（恒用原生 Web Fetch）
├── shell.ts           # 外链打开（window.open）
├── os.ts              # 语言服务（navigator.language）
├── store.ts           # 键值持久化（IndexedDB，库名 multi-chat-store）
├── keyring.ts         # 密钥存储（IndexedDB + AES-256-GCM）
├── keyringMigration.ts# Keyring V1 → V2 数据迁移
├── indexedDB.ts       # IndexedDB 初始化共享模块
└── crypto-helpers.ts  # AES-256-GCM 加解密共享模块
```

### 设计要点

- **单一实现**：各服务只保留浏览器实现，无环境分支
- **实例导出**：`keyring` 以受 `KeyringPublicAPI` 类型约束的单例导出；`store` 经 `createLazyStore(filename)` 工厂创建
- **共享模块**：`initIndexedDB`、`encrypt`/`decrypt`、PBKDF2 常量由 `env.ts`/`indexedDB.ts`/`crypto-helpers.ts` 提供，store 与 keyring 复用
- **fetch 注入点**：`getFetchFunc()` 返回与导出 `fetch` 相同的函数实例，供 AI SDK 等第三方库注入

### 测试约定

- 平台层测试位于 `src/__test__/platform/`
- `src/__test__/setup/mocks.ts` 提供全局 `vi.mock('@/platform')` 工厂（`globalThis.__createPlatformModuleMock`）
- `http.ts`/`shell.ts`/`os.ts`/`store.ts`/`env.ts` 依赖浏览器系统 API，列入 vitest 覆盖率排除清单
