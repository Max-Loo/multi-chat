# 跨平台兼容层

本文档说明应用的跨平台兼容层，包括 Null Object 模式、环境检测和统一 API 设计。

## 动机

应用需要同时支持 Tauri 桌面环境和 Web 浏览器环境：
- **统一接口**：提供一致的 API，无需关心底层平台
- **优雅降级**：Web 环境下提供降级方案
- **零运行时错误**：避免平台不兼容导致的崩溃

## 架构

### Null Object 模式

在 Web 环境下返回空实现（Null Object），而非抛出错误：
- 避免运行时错误
- 允许代码继续执行
- 提供合理的默认行为

### 环境检测

通过 `window.__TAURI__` 判断运行环境：
```typescript
export const isTauri = () => {
  return typeof window !== 'undefined' && window.__TAURI__ !== undefined;
};
```

### 兼容层目录

```
src/utils/tauriCompat/
├── index.ts         # 统一导出
├── env.ts           # 环境检测
├── shell.ts         # Shell 插件兼容
├── os.ts            # OS 插件兼容
├── http.ts          # HTTP 插件兼容
├── store.ts         # Store 插件兼容
└── keyring.ts       # Keyring 插件兼容
```

## 兼容模块

### 1. Shell 插件

| 功能 | Tauri 实现 | Web 降级 |
|-----|-----------|----------|
| 打开链接 | 原实现 | `window.open()` |
| 执行命令 | Command.execute() | Null Object |

**位置**：`src/utils/tauriCompat/shell.ts`

**API**：
```typescript
class Command {
  static create(program: string, args?: string[]): Command
  isSupported(): boolean
  execute(): Promise<ChildProcess>
}

export const shell = {
  open(url: string): Promise<void>
}
```

### 2. OS 插件

| 功能 | Tauri 实现 | Web 降级 |
|-----|-----------|----------|
| 获取系统语言 | locale() | `navigator.language` |
| 获取平台信息 | platform() | `navigator.platform` |

**位置**：`src/utils/tauriCompat/os.ts`

**API**：
```typescript
export const locale = (): Promise<string>
export const platform = (): Promise<string>
```

### 3. HTTP 插件

| 功能 | Tauri 实现 | Web 降级 |
|-----|-----------|----------|
| 发起请求 | Tauri fetch | 原生 Web fetch |

**位置**：`src/utils/tauriCompat/http.ts`

**API**：
```typescript
export const fetch = (input: RequestInfo, init?: RequestInit): Promise<Response>
export const getFetchFunc = (): FetchFunc
```

**特性**：
- 统一的 fetch 接口
- 支持开发环境代理（Tauri 配置）
- 自动环境检测

### 4. Store 插件

| 功能 | Tauri 实现 | Web 降级 |
|-----|-----------|----------|
| 数据持久化 | 文件系统 | IndexedDB |

**位置**：`src/utils/tauriCompat/store.ts`

**API**：
```typescript
export const createLazyStore = (filename: string): StoreCompat

interface StoreCompat {
  init(): Promise<void>
  get<T>(key: string): Promise<T | undefined>
  set(key: string, value: any): Promise<void>
  delete(key: string): Promise<void>
  save(): Promise<void>
}
```

**特性**：
- 延迟初始化（首次访问时才连接）
- 统一的键值存储接口
- 自动序列化/反序列化

### 5. Keyring 插件

| 功能 | Tauri 实现 | Web 降级 |
|-----|-----------|----------|
| 密码管理 | 系统钥匙串 | IndexedDB (加密) |

**位置**：`src/utils/tauriCompat/keyring.ts`

**API**：
```typescript
export const setPassword = (service: string, account: string, password: string): Promise<void>
export const getPassword = (service: string, account: string): Promise<string | null>
export const deletePassword = (service: string, account: string): Promise<void>
export const isKeyringSupported = (): boolean
```

**加密方案**（Web 环境）：
- 使用 Web Crypto API 加密
- 密钥存储在 IndexedDB
- 提供与系统钥匙串相同的安全性

## 统一 API 设计

### 导入方式

```typescript
// 导入环境检测
import { isTauri } from '@/utils/tauriCompat';

// 导入 Shell API
import { Command, shell } from '@/utils/tauriCompat';

// 导入 OS API
import { locale } from '@/utils/tauriCompat';

// 导入 HTTP API
import { fetch, getFetchFunc } from '@/utils/tauriCompat';

// 导入 Store API
import { createLazyStore, type StoreCompat } from '@/utils/tauriCompat';

// 导入 Keyring API
import { setPassword, getPassword, deletePassword, isKeyringSupported } from '@/utils/tauriCompat';
```

### 使用示例

```typescript
// 环境检测
if (isTauri()) {
  console.log('运行在 Tauri 桌面环境');
} else {
  console.log('运行在 Web 浏览器环境');
}

// 使用 Shell API
const cmd = Command.create('ls', ['-la']);
if (cmd.isSupported()) {
  const output = await cmd.execute();
  console.log(output.stdout);
} else {
  console.warn('命令不支持');
}

// 使用 OS API
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
if (isKeyringSupported()) {
  await setPassword('com.multichat.app', 'master-key', 'my-secret-key');
  const key = await getPassword('com.multichat.app', 'master-key');
}
```

## 设计原则

### 1. Null Object 模式

Web 环境下返回空实现，而非抛出错误：
```typescript
// Tauri 环境
export const shell = {
  open: async (url: string) => {
    await tauriShell.open(url);
  }
};

// Web 环境
export const shell = {
  open: async (url: string) => {
    window.open(url, '_blank');
  }
};
```

### 2. 环境检测优先

在兼容层内部自动检测环境，开发者无需手动判断：
```typescript
export const locale = async (): Promise<string> => {
  if (isTauri()) {
    return await tauriLocale.locale();
  } else {
    return navigator.language;
  }
};
```

### 3. 类型安全

提供完整的 TypeScript 类型定义：
```typescript
export interface StoreCompat {
  init(): Promise<void>;
  get<T>(key: string): Promise<T | undefined>;
  set(key: string, value: any): Promise<void>;
  delete(key: string): Promise<void>;
  save(): Promise<void>;
}

export type KeyringCompat = {
  setPassword(service: string, account: string, password: string): Promise<void>;
  getPassword(service: string, account: string): Promise<string | null>;
  deletePassword(service: string, account: string): Promise<void>;
  isKeyringSupported(): boolean;
};
```

### 4. 向后兼容

兼容层 API 与 Tauri 原生 API 保持一致，便于未来迁移：
```typescript
// Tauri 原生 API
import { open } from '@tauri-apps/plugin-shell';
await open('https://example.com');

// 兼容层 API（相同接口）
import { shell } from '@/utils/tauriCompat';
await shell.open('https://example.com');
```

## 实现位置

- **统一导出**：`src/utils/tauriCompat/index.ts`
- **环境检测**：`src/utils/tauriCompat/env.ts`
- **Shell 兼容**：`src/utils/tauriCompat/shell.ts`
- **OS 兼容**：`src/utils/tauriCompat/os.ts`
- **HTTP 兼容**：`src/utils/tauriCompat/http.ts`
- **Store 兼容**：`src/utils/tauriCompat/store.ts`
- **Keyring 兼容**：`src/utils/tauriCompat/keyring.ts`

## 降级策略

### Shell 插件

```typescript
// Tauri 环境：使用原生 Shell
// Web 环境：降级到 window.open() 或 Null Object
```

### OS 插件

```typescript
// Tauri 环境：使用系统 API
// Web 环境：降级到 navigator API
```

### HTTP 插件

```typescript
// Tauri 环境：使用 Tauri fetch（支持代理）
// Web 环境：降级到原生 fetch
```

### Store 插件

```typescript
// Tauri 环境：使用文件系统
// Web 环境：降级到 IndexedDB
```

### Keyring 插件

```typescript
// Tauri 环境：使用系统钥匙串
// Web 环境：降级到 IndexedDB (加密)
```

## 注意事项

1. **环境检测**：兼容层自动检测环境，开发者无需手动判断
2. **功能检查**：使用 `isSupported()` 检查功能是否可用
3. **错误处理**：兼容层已处理平台差异，无需额外的 try-catch
4. **性能考虑**：Web 环境下某些功能可能较慢（如 IndexedDB）
5. **安全性**：Web 环境下的 Keyring 加密方案提供基本保护

## 测试建议

1. **双环境测试**：在 Tauri 和 Web 环境下都进行测试
2. **降级测试**：验证 Web 环境下的降级行为
3. **错误处理**：测试兼容层的错误处理
4. **性能测试**：对比 Tauri 和 Web 环境的性能差异

## 未来扩展

如需支持其他平台（如 Electron、Capacitor），只需：
1. 在 `tauriCompat/` 下添加新的兼容模块
2. 扩展环境检测逻辑
3. 提供相应的降级方案
