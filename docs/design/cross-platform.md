# 浏览器平台层

本文档说明应用的浏览器平台层（`src/utils/platform/`，原 `tauriCompat` 跨平台兼容层），包括统一 API 设计、能力检测与降级策略。

> 历史说明：应用曾通过 Null Object 模式同时支持 Tauri 桌面端与 Web 端；现已成为纯 Web 应用，平台层仅保留浏览器实现。

## 动机

为浏览器平台能力提供统一、健壮的访问入口：
- **统一接口**：存储、密钥环、HTTP、语言偏好收敛到单一导出点
- **优雅降级**：浏览器能力缺失（如 IndexedDB、Web Crypto）时优雅降级
- **零运行时错误**：避免平台能力缺失导致的崩溃

## 架构

### 能力检测

通过 `isSupported()` 检测浏览器能力，调用方据此禁用功能或提示用户：
```typescript
keyring.isSupported();  // IndexedDB + Web Crypto API 均可用时为 true
```

`isTauri()` 保留为恒返回 `false` 的兼容 API（纯 Web 形态下不存在桌面环境）。

### 平台层目录

```
src/utils/platform/
├── index.ts             # 统一导出
├── env.ts               # 环境检测与 PBKDF2 参数
├── os.ts                # 语言偏好（navigator.language）
├── http.ts              # HTTP（原生 fetch）
├── store.ts             # 键值存储（IndexedDB）
├── keyring.ts           # 密钥存储（IndexedDB + AES-256-GCM）
├── keyringMigration.ts  # Keyring V1 → V2 数据迁移
├── indexedDB.ts         # IndexedDB 共享初始化
└── crypto-helpers.ts    # 加解密共享工具
```

## 平台模块

### 1. 语言偏好（os.ts）

基于浏览器语言偏好检测系统语言：

```typescript
export const locale = (): Promise<string>  // 如 "zh-CN"、"en-US"
```

### 2. HTTP（http.ts）

浏览器原生 `fetch` 的统一封装：

```typescript
export const fetch = (input: RequestInfo, init?: RequestInit): Promise<Response>
export const getFetchFunc = (): FetchFunc
```

**特性**：
- 统一的 fetch 接口（绑定 `window`，避免 Illegal invocation）
- 受浏览器 CORS 策略约束

### 3. 键值存储（store.ts）

基于 IndexedDB 的键值存储：

```typescript
export const createLazyStore = (filename: string): StoreCompat

interface StoreCompat {
  init(): Promise<void>
  get<T>(key: string): Promise<T | null>
  set(key: string, value: unknown): Promise<void>
  delete(key: string): Promise<void>
  keys(): Promise<string[]>
  save(): Promise<void>   // IndexedDB 自动持久化，保持兼容语义
  isSupported(): boolean
}
```

**特性**：
- 延迟初始化（首次访问时才连接）
- 数据库名称 `multi-chat-store`，与其他模块数据隔离
- 支持所有 JSON 可序列化类型

### 4. 密钥存储（keyring.ts）

基于 IndexedDB + AES-256-GCM 加密的安全密钥存储：

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
- 使用 Web Crypto API 加密（AES-256-GCM）
- 密钥通过 PBKDF2 从 localStorage 中的种子派生
- 密钥派生仅依赖种子，不依赖 navigator.userAgent（V2 方式）
- 加密数据存储在 IndexedDB（数据库 `multi-chat-keyring`）

**数据迁移**：
- 位置：`src/utils/platform/keyringMigration.ts`
- V1 → V2 迁移在应用启动时自动执行（Web 端 V1 历史数据仍需迁移）
- 详见 `openspec/specs/keyring-migration/spec.md`

## 统一 API 设计

### 导入方式

```typescript
// 导入环境检测
import { isTauri } from '@/utils/platform';

// 导入语言偏好
import { locale } from '@/utils/platform';

// 导入 HTTP API
import { fetch, getFetchFunc } from '@/utils/platform';

// 导入 Store API
import { createLazyStore, type StoreCompat } from '@/utils/platform';

// 导入 Keyring API
import { keyring, type KeyringPublicAPI } from '@/utils/platform';
```

### 使用示例

```typescript
// 使用语言偏好
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

### 1. 能力检测优先

调用方通过 `isSupported()` 判断功能可用性，UI 层据此禁用功能按钮或显示提示，不向用户暴露降级细节。

### 2. 类型安全

平台层类型为自有维护的 TypeScript 声明，提供完整的类型提示：

```typescript
export interface StoreCompat {
  init(): Promise<void>;
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
  save(): Promise<void>;
  isSupported(): boolean;
}
```

### 3. 数据隔离

每个模块使用独立的 IndexedDB 数据库，名称格式 `multi-chat-<module-name>`，互不干扰。

## 实现位置

- **统一导出**：`src/utils/platform/index.ts`
- **环境检测**：`src/utils/platform/env.ts`
- **语言偏好**：`src/utils/platform/os.ts`
- **HTTP**：`src/utils/platform/http.ts`
- **键值存储**：`src/utils/platform/store.ts`
- **密钥存储**：`src/utils/platform/keyring.ts`

## 降级策略

| 模块 | 能力依赖 | 缺失时行为 |
|-----|---------|-----------|
| Store | IndexedDB | `isSupported()` 返回 false，调用方禁用相关功能 |
| Keyring | IndexedDB + Web Crypto API | `isSupported()` 返回 false，调用方禁用相关功能 |
| HTTP | 原生 fetch | 现代浏览器均支持，无降级路径 |
| locale | navigator.language | 现代浏览器均支持，无降级路径 |

## 注意事项

1. **功能检查**：使用 `isSupported()` 检查功能是否可用
2. **错误处理**：平台层已处理能力差异，错误以可捕获的 Promise rejection 暴露
3. **性能考虑**：IndexedDB 读写为异步操作，批量写入建议合并事务
4. **安全性**：Web 端密钥存储为浏览器本地加密级别（种子明文存于 localStorage 是已知权衡），请在设置页备份主密钥

## 测试建议

1. **能力缺失测试**：stub 掉 IndexedDB / Web Crypto 验证降级行为
2. **错误处理**：测试平台层的错误传播
3. **数据隔离**：验证各模块数据库互不干扰
