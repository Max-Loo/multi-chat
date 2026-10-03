# 纯 Web 平台层设计

本文档说明应用的平台层（`src/utils/platform/`），即浏览器能力的统一封装层。应用为纯 Web 端（无 Tauri 桌面运行时），平台层直接实现浏览器平台能力，不包含任何按运行环境分支的代码路径。

## 动机

将浏览器原生能力（存储、加密、语言检测、外部链接打开、HTTP）收敛到统一模块：
- **统一接口**：业务代码通过 `@/utils/platform` 访问平台能力，不直接触碰浏览器 API 细节
- **能力检测**：通过 `isSupported()` 显式暴露浏览器能力边界
- **可测试性**：平台层模块边界清晰，便于 mock 与单测

## 架构

```
src/utils/platform/
├── index.ts           # 统一导出（barrel export）
├── env.ts             # 测试环境检测（isTestEnvironment / getPBKDF2Iterations）
├── shell.ts           # 外部链接打开（window.open）
├── os.ts              # 浏览器语言检测（navigator.language）
├── http.ts            # 统一 fetch（原生 window.fetch）
├── store.ts           # IndexedDB 键值存储
├── keyring.ts         # IndexedDB + AES-256-GCM 加密密钥存储
├── keyringMigration.ts# Keyring V1 → V2 数据迁移（清理计划见文件头注释）
├── crypto-helpers.ts  # 加密/解密辅助函数
└── indexedDB.ts       # IndexedDB 初始化共享函数
```

## 模块说明

### 1. 外部链接打开（shell.ts）

使用浏览器原生 API 以新标签页打开 URL：
```typescript
export const shell: {
  open(path: string): Promise<void>   // window.open(path, '_blank', 'noopener,noreferrer')
  isSupported(): boolean              // 始终 true
}
```

仅支持 URL，不支持本地文件路径。

### 2. 浏览器语言（os.ts）

```typescript
export const locale = async (): Promise<string>  // navigator.language，BCP 47 格式
```

### 3. 统一 fetch（http.ts）

所有环境（开发/生产）统一使用原生 `window.fetch`：
```typescript
export const fetch: FetchFunc
export const getFetchFunc = (): FetchFunc   // 用于 AI SDK provider 注入
export type RequestInfo = string | URL | Request
```

CORS 处理策略：
- **开发环境**：供应商 API 请求经 Vite dev server proxy 转发（`vite.config.ts` 中 /deepseek、/kimi、/zhipuai 等已配置）
- **生产环境**：浏览器原生 fetch 直连供应商 API（线上 GitHub Pages 版本已验证主流供应商可直连）

### 4. 键值存储（store.ts）

IndexedDB 实现，数据库名 `multi-chat-store`：
```typescript
export const createLazyStore = (filename: string): StoreCompat

interface StoreCompat {
  init(): Promise<void>
  get<T>(key: string): Promise<T | null>
  set(key: string, value: unknown): Promise<void>
  delete(key: string): Promise<void>
  keys(): Promise<string[]>
  save(): Promise<void>     // IndexedDB 自动提交，确认为空操作
  close(): void             // 测试清理用
  isSupported(): boolean    // 浏览器是否支持 IndexedDB
}
```

`filename` 参数保留以维持既有 API 形状，实现中忽略。

### 5. 加密密钥存储（keyring.ts）

IndexedDB + AES-256-GCM 加密实现，数据库名 `multi-chat-keyring`：
```typescript
export const keyring: KeyringPublicAPI

interface KeyringPublicAPI {
  setPassword(service: string, user: string, password: string): Promise<void>
  getPassword(service: string, user: string): Promise<string | null>
  deletePassword(service: string, user: string): Promise<void>
  isSupported(): boolean    // IndexedDB + Web Crypto 同时可用
  resetState(): void        // 测试清理用
}
```

加密方案：
- 主密钥使用 Web Crypto `crypto.getRandomValues()` 生成（256-bit）
- 加密密钥由 localStorage 种子（`multi-chat-keyring-seed`）经 PBKDF2（100,000 次迭代，SHA-256）派生
- 每次加密使用 12 字节随机 IV（GCM 推荐）
- 密钥派生仅依赖种子，不依赖 `navigator.userAgent`（跨浏览器版本可访问）
- 加密数据（密文 + IV + 时间戳）存储在 IndexedDB 的 `keys` 对象存储

数据迁移：
- 位置：`src/utils/platform/keyringMigration.ts`
- V1 → V2 迁移在应用启动时自动执行
- 详见 `openspec/changes/archive/2026-03-18-keyring-migration-v1-to-v2/`

## 统一 API 设计

### 导入方式

始终使用 `@/` 别名从 barrel export 导入：
```typescript
// 导入测试环境检测
import { isTestEnvironment } from '@/utils/platform';

// 导入外部链接打开 API
import { shell } from '@/utils/platform';

// 导入浏览器语言 API
import { locale } from '@/utils/platform';

// 导入 HTTP API
import { fetch, getFetchFunc } from '@/utils/platform';

// 导入 Store API
import { createLazyStore, type StoreCompat } from '@/utils/platform';

// 导入 Keyring API
import { keyring, type KeyringPublicAPI } from '@/utils/platform';
```

Keyring 的实现类与独立函数不通过 barrel export 暴露（测试文件直接从 `./keyring` 路径导入）。

## 设计原则

### 1. 单一实现，无环境分支

每个模块只有一条代码路径（浏览器原生实现），模块内不存在按运行环境分支的代码。曾经的 Null Object 模式与环境检测（`isTauri()`）已随桌面端移除而删除；`env.ts` 仅保留测试环境检测（`isTestEnvironment()` / `getPBKDF2Iterations()`），用于降低测试环境的 PBKDF2 迭代次数。

### 2. 能力显式声明

需要浏览器能力（IndexedDB、Web Crypto）的模块提供 `isSupported()`；UI 层据此禁用相关功能或提示不可用。

### 3. 类型安全

使用原生 DOM/ECMAScript 类型（`RequestInfo`、`Response`、`IDBDatabase`）或项目自定义类型，不保留与已移除桌面插件对齐的类型声明。

### 4. 数据库隔离

每个能力使用独立 IndexedDB 数据库，命名格式 `multi-chat-<name>`（`multi-chat-store`、`multi-chat-keyring`），数据互不干扰。

## 测试

- 平台层单测位于 `src/__test__/utils/platform/`，使用 fake-indexeddb 模拟 IndexedDB
- store/keyring/crypto 的测试作为数据格式兼容的回归门禁（IndexedDB 数据格式零变化）
- `http.ts`/`shell.ts`/`os.ts`/`store.ts`/`env.ts` 在覆盖率统计中排除（依赖浏览器宿主 API，node 测试环境无法覆盖真实路径）
