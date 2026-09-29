# Web 运行时模块

本文档说明应用的纯 Web 运行时模块（`src/utils/webRuntime/`），包括 IndexedDB 持久化、加密密钥环、Null Object 模式与语言检测。

> **历史说明**：本模块前身为 Tauri/Web 双环境兼容层（`tauriCompat/`）。自 v0.6.0 起应用移除 Tauri 桌面端，Web 实现成为唯一实现，模块更名并删除全部环境分支逻辑。

## 动机

- **统一入口**：浏览器能力（存储、加密、fetch、语言检测）集中封装，调用方无需直接操作 IndexedDB/Web Crypto
- **可测试**：模块边界清晰，测试可通过 mock 工厂隔离
- **零运行时错误**：不可用的能力（如执行系统命令）以 Null Object 提供，不抛错

## 架构

### Null Object 模式

浏览器不支持的能力返回空实现（Null Object），而非抛出错误：
- 避免运行时错误
- 允许代码继续执行
- 通过 `isSupported()` 显式判断真实可用性

### 模块目录

```
src/utils/webRuntime/
├── index.ts         # 统一导出（barrel）
├── env.ts           # 测试环境检测与 PBKDF2 迭代次数
├── shell.ts         # Shell 功能（window.open + Null Object Command）
├── os.ts            # 浏览器语言检测（navigator.language）
├── http.ts          # 原生 fetch 薄封装
├── store.ts         # IndexedDB 键值存储
├── keyring.ts       # 加密密钥存储（IndexedDB + AES-256-GCM）
├── keyringMigration.ts # Keyring V1 → V2 数据迁移
├── crypto-helpers.ts   # AES-256-GCM 加解密公共函数
└── indexedDB.ts        # IndexedDB 初始化公共函数
```

## 模块说明

### 1. Shell 功能（shell.ts）

| 功能 | 实现 |
|-----|------|
| 打开链接 | `window.open(url, '_blank', 'noopener,noreferrer')` |
| 执行命令 | Null Object（浏览器不可执行系统命令，`isSupported()` 恒为 `false`） |

**API**：
```typescript
export const Command: {
  create(program: string, args?: string[]): {
    isSupported(): boolean;          // 恒为 false
    execute(): Promise<ChildProcess>; // 返回模拟成功结果
  };
};

export const shell: {
  open(path: string): Promise<void>; // window.open 实现
  isSupported(): boolean;            // 恒为 true
};
```

`ChildProcess` 类型在项目内定义（形状与原命令执行结果一致），不依赖任何第三方包。

### 2. 语言检测（os.ts）

**实现**：`locale()` 返回 `navigator.language`（BCP 47 标签，如 "zh-CN"）。

- 返回的是浏览器首选语言（非系统语言）
- 用户在应用内手动选择的语言（localStorage 持久化）优先级更高

### 3. HTTP（http.ts）

**实现**：原生 `window.fetch` 薄封装，转发全部参数与返回值。

**API**：
```typescript
export const fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>
export const getFetchFunc = (): FetchFunc // 返回与 fetch 相同的函数实例，用于第三方库注入
```

**特性**：
- 请求受浏览器 CORS 策略约束；跨域被拦截时 fetch 以 `TypeError` reject，由调用方按现有错误处理流程提示
- 开发环境可通过 Vite `server.proxy` 配置代理（见 `vite.config.ts`）

### 4. 键值存储（store.ts）

**实现**：IndexedDB 数据库 `multi-chat-store`（对象存储 `store`，主键 `key`）。

**API**：
```typescript
export const createLazyStore = (filename: string): StoreCompat

interface StoreCompat {
  init(): Promise<void>
  get<T>(key: string): Promise<T | null>
  set(key: string, value: unknown): Promise<void>
  delete(key: string): Promise<void>
  keys(): Promise<string[]>
  save(): Promise<void>   // 空操作（IndexedDB 自动持久化）
  close(): void           // 仅供测试清理
  isSupported(): boolean  // 基于 IndexedDB 支持判定
}
```

**特性**：
- 延迟初始化（首次访问时才连接）
- `filename` 参数保留（既有调用方 API 形状），Web 实现忽略

### 5. 加密密钥环（keyring.ts）

**实现**：IndexedDB 数据库 `multi-chat-keyring`（对象存储 `keys`，复合主键 `[service, user]`）+ AES-256-GCM 加密。

**API**（统一入口为 `keyring` 实例，类型 `KeyringPublicAPI`）：
```typescript
export const keyring: KeyringPublicAPI

interface KeyringPublicAPI {
  setPassword(service: string, user: string, password: string): Promise<void>
  getPassword(service: string, user: string): Promise<string | null>
  deletePassword(service: string, user: string): Promise<void>
  isSupported(): boolean // 基于 IndexedDB + Web Crypto 支持判定
  resetState(): void     // 关闭连接并清除密钥缓存（测试清理/迁移后重置）
}
```

**加密方案**：
- 使用 Web Crypto API 加密（AES-256-GCM，每次加密生成随机 12 字节 IV）
- 加密密钥通过 PBKDF2（100,000 次迭代，测试环境降为 1,000）从 localStorage 种子（`multi-chat-keyring-seed`）派生
- 密钥派生仅依赖种子，不依赖 `navigator.userAgent`（V2 方式）
- 加密后的数据存储在 IndexedDB

**数据迁移**：
- 位置：`src/utils/webRuntime/keyringMigration.ts`
- V1 → V2 迁移在应用启动时自动执行（版本标记 `keyring-data-version`）
- 详见 `openspec/changes/archive/2026-03-18-keyring-migration-v1-to-v2/`

## 统一 API 设计

### 导入方式

始终使用 `@/` 别名导入 barrel 模块：

```typescript
// 导入测试环境检测
import { isTestEnvironment } from '@/utils/webRuntime';

// 导入 Shell API
import { Command, shell } from '@/utils/webRuntime';

// 导入语言检测 API
import { locale } from '@/utils/webRuntime';

// 导入 HTTP API
import { fetch, getFetchFunc } from '@/utils/webRuntime';

// 导入 Store API
import { createLazyStore, type StoreCompat } from '@/utils/webRuntime';

// 导入 Keyring API
import { keyring, type KeyringPublicAPI } from '@/utils/webRuntime';
```

### 使用示例

```typescript
// 使用 Shell API
const cmd = Command.create('ls', ['-la']);
if (cmd.isSupported()) {
  const output = await cmd.execute();
  console.log(output.stdout);
} else {
  console.warn('命令不支持');
}

// 打开外部链接
await shell.open('https://example.com');

// 使用语言检测 API
const language = await locale();
console.log(language); // "zh-CN" 或 "en-US"

// 使用 HTTP API
const response = await fetch('https://api.example.com/data');
const data = await response.json();

// 使用 Store API
const store = createLazyStore('models.json');
await store.init();
await store.set('models', modelList);
await store.save();
const models = await store.get<Model[]>('models');

// 使用 Keyring API
if (keyring.isSupported()) {
  await keyring.setPassword('com.multichat.app', 'master-key', 'my-secret-key');
  const key = await keyring.getPassword('com.multichat.app', 'master-key');
}
```

## 设计原则

### 1. Null Object 模式

不可用的能力返回空实现，而非抛出错误：
```typescript
// Command 在浏览器中永远不可用，但仍返回合法实例
const cmd = Command.create('ls');
cmd.isSupported(); // false
await cmd.execute(); // 返回模拟成功结果，不抛错
```

### 2. 能力检测

各模块提供 `isSupported()`，基于浏览器能力判定真实可用性：
- Store：`typeof indexedDB !== 'undefined'`
- Keyring：IndexedDB + `crypto.subtle` 同时可用
- shell.open：浏览器原生 API，恒可用
- Command：浏览器不可执行系统命令，恒不可用

### 3. 类型自维护

全部类型（`StoreCompat`、`KeyringPublicAPI`、`ChildProcess` 等）在项目内定义，提供完整 TypeScript 提示，不依赖第三方运行时包的类型声明。

### 4. 数据库隔离

每个持久化模块使用独立的 IndexedDB 数据库，命名格式 `multi-chat-<module-name>`：
- `multi-chat-store`：应用键值数据
- `multi-chat-keyring`：加密密钥存储

## 注意事项

1. **功能检查**：使用 `isSupported()` 检查功能是否真实可用
2. **CORS 约束**：所有 HTTP 请求受浏览器 CORS 策略约束，跨域失败以 `TypeError` reject
3. **性能考虑**：IndexedDB 操作为异步 I/O，批量读写建议合并事务
4. **安全性**：密钥安全级别低于操作系统钥匙串（种子明文存于 localStorage），应用已在首次使用时向用户展示安全警告
5. **测试**：`src/__test__/setup/mocks.ts` 提供全局 mock；集成测试可使用 `globalThis.__createWebRuntimeModuleMock()` 工厂

## 扩展指引

新增运行时能力模块时：
1. 在 `src/utils/webRuntime/` 下添加新模块文件（单一职责）
2. 数据持久化能力使用 IndexedDB；系统操作能力使用 Null Object
3. 在 `index.ts` 中导出新模块的 API
4. 数据库命名遵循 `multi-chat-<module-name>` 格式
