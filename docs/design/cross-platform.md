# 平台存储层

本文档说明应用的平台能力封装层（历史名称 `tauriCompat` 保留以减少路径变更），包括浏览器存储、加密密钥存储和外部链接打开等纯 Web 能力。

> 应用已移除 Tauri 桌面形态，本层为唯一的 Web 实现（IndexedDB + Web Crypto API + 浏览器标准 API）。

## 架构

### 目录结构

```
src/utils/tauriCompat/
├── index.ts            # 统一导出
├── env.ts              # 测试环境检测与 PBKDF2 参数
├── shell.ts            # 外部链接打开（window.open）
├── os.ts               # 语言检测（navigator.language）
├── store.ts            # 键值存储（IndexedDB）
├── keyring.ts          # 安全密钥存储（IndexedDB + AES-256-GCM）
├── keyringMigration.ts # 密钥数据版本迁移
├── indexedDB.ts        # IndexedDB 公共初始化函数
└── crypto-helpers.ts   # AES-256-GCM 加解密公共函数
```

### 浏览器能力检测

所有能力暴露 `isSupported()` 方法，供 UI 层判断功能可用性：

- **Store**：`typeof indexedDB !== 'undefined'`
- **Keyring**：`IndexedDB + Web Crypto API` 同时可用

能力缺失时 UI 层禁用相关功能并提示，不向用户暴露实现细节。

## 模块说明

### 1. 外部链接打开（shell.ts）

| 功能 | 实现 |
|-----|------|
| 打开 URL | `window.open(url, '_blank', 'noopener,noreferrer')` |

```typescript
export const shell: {
  open(url: string): Promise<void>
  isSupported(): boolean
}
```

### 2. 语言检测（os.ts）

| 功能 | 实现 |
|-----|------|
| 获取语言 | `navigator.language` |

返回 BCP 47 语言标签（如 `zh-CN`）。用户在应用内手动选择的语言（localStorage）优先级更高。

### 3. 键值存储（store.ts）

| 功能 | 实现 |
|-----|------|
| 数据持久化 | IndexedDB（数据库名：`multi-chat-store`） |

```typescript
export const createLazyStore = (filename: string): StoreCompat

interface StoreCompat {
  init(): Promise<void>
  get<T>(key: string): Promise<T | null>
  set(key: string, value: unknown): Promise<void>
  delete(key: string): Promise<void>
  keys(): Promise<string[]>
  save(): Promise<void>   // IndexedDB 自动持久化，空操作
  close(): void
  isSupported(): boolean
}
```

**特性**：
- 延迟初始化（首次访问时才连接）
- `filename` 参数保留以兼容既有调用方（Web 环境忽略）

### 4. 安全密钥存储（keyring.ts）

| 功能 | 实现 |
|-----|------|
| 密码管理 | IndexedDB 加密存储（数据库名：`multi-chat-keyring`） |

```typescript
export const keyring: KeyringPublicAPI

interface KeyringPublicAPI {
  setPassword(service: string, account: string, password: string): Promise<void>
  getPassword(service: string, account: string): Promise<string | null>
  deletePassword(service: string, account: string): Promise<void>
  isSupported(): boolean
  resetState(): void
}
```

**加密方案**：
- 使用 Web Crypto API 加密（AES-256-GCM，256 位密钥，12 字节随机 IV）
- 密钥通过 PBKDF2（SHA-256，100,000 次迭代）从 localStorage 中的种子派生
- 密钥派生仅依赖种子，不依赖 navigator.userAgent（V2 方式）
- 加密数据存储在 IndexedDB（记录含 `createdAt` 毫秒时间戳）
- 种子存储键：`multi-chat-keyring-seed`（明文存储，已知安全权衡）

**数据迁移**：
- 位置：`src/utils/tauriCompat/keyringMigration.ts`
- V1 → V2 迁移在应用启动时自动执行
- 详见 `openspec/changes/archive/2026-03-18-keyring-migration-v1-to-v2/`

## 统一 API 设计

### 导入方式

```typescript
// 导入测试环境检测
import { isTestEnvironment } from '@/utils/tauriCompat';

// 导入外部链接打开 API
import { shell } from '@/utils/tauriCompat';

// 导入语言检测 API
import { locale } from '@/utils/tauriCompat';

// 导入 Store API
import { createLazyStore, type StoreCompat } from '@/utils/tauriCompat';

// 导入 Keyring API
import { keyring, type KeyringPublicAPI } from '@/utils/tauriCompat';
```

### 使用示例

```typescript
// 打开外部链接（新标签页）
await shell.open('https://example.com');

// 获取浏览器语言
const language = await locale();
console.log(language); // "zh-CN" 或 "en-US"

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

// HTTP 请求直接使用全局 fetch
const response = await fetch('https://api.example.com/data');
const data = await response.json();
```

## 设计原则

### 1. 能力检测优先

所有能力通过 `isSupported()` 暴露浏览器能力状态，缺失时 UI 层优雅降级：

```typescript
if (keyring.isSupported()) {
  await keyring.setPassword(service, user, password);
} else {
  // UI 提示：浏览器不支持安全存储
}
```

### 2. 数据库隔离

不同模块使用独立的 IndexedDB 数据库，互不干扰：

- `multi-chat-store`：业务键值数据
- `multi-chat-keyring`：加密密钥数据

### 3. 数据格式稳定

存储位置与记录格式是用户数据兼容性契约，变更需走迁移流程：
- 数据库名称、对象存储与主键结构保持不变
- 密钥派生方式升级需通过 `keyringMigration` 自动迁移

### 4. 命名说明

目录名 `tauriCompat` 为历史名称。Tauri 桌面形态移除后，本层职责已收敛为纯 Web 平台能力封装；目录改名涉及大量导入路径变更，作为独立的后续小变更处理。
