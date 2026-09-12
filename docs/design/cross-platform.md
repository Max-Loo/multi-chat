# 纯 Web 平台层

本文档说明应用的平台能力层（`src/utils/platform/`），所有平台能力均由 Web 标准 API 实现，无环境分叉。

## 动机

应用为纯 Web 应用（可部署到任意静态站点），平台能力全部基于浏览器标准 API：

- **实现唯一**：存储、密钥、HTTP、语言检测各只有一条实现路径，不存在按运行环境选择实现的双分支
- **标准优先**：全部使用 Web 标准 API（IndexedDB、Web Crypto、fetch、navigator.language），不依赖桌面容器
- **API 稳定**：对外 API 形态自平台层建立以来保持稳定，调用方代码不受内部重构影响

## 架构

### 目录结构

```
src/utils/platform/
├── index.ts           # 统一导出（barrel export）
├── env.ts             # 测试环境检测与 PBKDF2 迭代参数
├── os.ts              # 语言检测（navigator.language）
├── http.ts            # HTTP 请求（原生 fetch）
├── store.ts           # 键值持久化（IndexedDB）
├── keyring.ts         # 密钥安全存储（IndexedDB + AES-256-GCM）
├── keyringMigration.ts# keyring 数据版本迁移
├── indexedDB.ts       # IndexedDB 初始化共享模块
└── crypto-helpers.ts  # 加密共享模块（encrypt/decrypt/PasswordRecord）
```

### 统一导入

平台能力一律从 `@/utils/platform` 导入：

```typescript
import {
  locale,
  fetch,
  getFetchFunc,
  createLazyStore,
  keyring,
  isTestEnvironment,
  getPBKDF2Iterations,
} from '@/utils/platform';
```

## 平台模块

### 1. 语言检测（os.ts）

| API | 说明 |
|-----|------|
| `locale()` | 返回 `navigator.language`（BCP 47 格式，如 `zh-CN`） |

### 2. HTTP 请求（http.ts）

| API | 说明 |
|-----|------|
| `fetch(input, init)` | 原生 `window.fetch`，签名与标准 Fetch API 一致 |
| `getFetchFunc()` | 返回 fetch 函数实例，用于第三方库注入（如 Axios adapter） |

> 生产环境下对不支持 CORS 的 AI 供应商 API 直连受限（浏览器同源策略）；开发环境经 Vite 代理解决（见 `vite.config.ts` proxy 配置）。

### 3. 键值持久化（store.ts）

`createLazyStore(name)` 返回受约束的 store 实例：

| API | 说明 |
|-----|------|
| `init()` | 打开 IndexedDB 连接（数据库 `multi-chat-store`，对象存储 `store`，主键 `key`） |
| `get<T>(key)` | 读取键值，不存在返回 `null`，支持 JSON 可序列化类型 |
| `set(key, value)` | 写入键值，写入后立即可读 |
| `delete(key)` | 删除键值 |
| `keys()` | 列出所有键（`string[]`） |
| `save()` | 确保 IndexedDB 写入完成（始终返回成功 Promise） |
| `isSupported()` | 判定浏览器是否支持 IndexedDB |

### 4. 密钥安全存储（keyring.ts）

以受约束的 `keyring` 实例形式提供（`KeyringPublicAPI` 类型）：

| API | 说明 |
|-----|------|
| `keyring.setPassword(service, account, password)` | 加密存储密钥 |
| `keyring.getPassword(service, account)` | 读取并解密密钥 |
| `keyring.deletePassword(service, account)` | 删除密钥 |
| `keyring.isSupported()` | 判定浏览器是否支持 IndexedDB + Web Crypto |

**加密方案**：

1. 首次启动生成 256-bit 随机种子，存入 `localStorage`（键 `multi-chat-keyring-seed`）
2. 以种子为盐值，经 PBKDF2（SHA-256，10 万+迭代，256 位密钥）派生加密密钥
3. 主密钥（256-bit，`crypto.getRandomValues` 生成）使用派生密钥 AES-256-GCM 加密（12 字节随机 IV）后存入 IndexedDB（数据库 `multi-chat-keyring`，对象存储 `keys`）

**安全性权衡**：种子明文存于 `localStorage`、密文存于 IndexedDB，攻击者需同时获取两者才能解密；PBKDF2 高迭代次数增加暴力破解成本；派生不依赖 `navigator.userAgent` 等易变属性，保证跨浏览器版本可读。Web 端首次使用时向用户展示安全边界提示。

### 5. 环境参数（env.ts）

| API | 说明 |
|-----|------|
| `isTestEnvironment()` | 测试环境判定（结果缓存） |
| `getPBKDF2Iterations()` | 按环境返回 PBKDF2 迭代次数（测试环境降迭代以加速） |

## 共享模块

- **`indexedDB.ts`**：`initIndexedDB(name, version, upgrade)` 统一 IndexedDB 打开逻辑，store 与 keyring 共用但数据库互相隔离
- **`crypto-helpers.ts`**：`encrypt` / `decrypt`（AES-256-GCM 封装）与 `PasswordRecord` 存储结构，keyring 直接复用

## 注意事项

1. **功能检查**：外部不可达能力（IndexedDB、Web Crypto）使用 `isSupported()` 判断可用性
2. **错误处理**：平台层已处理 IndexedDB 不可用、配额超限等场景，调用方按需捕获 Promise rejection
3. **性能考虑**：IndexedDB 写入为异步操作，高频写入场景注意合并事务
4. **安全性**：Web 环境密钥存储的安全边界见上文"加密方案"，首次使用时向用户展示提示

## 测试建议

1. **单测**：平台层模块使用 fake-indexeddb 与内存 mock 隔离测试（见 `src/__test__/utils/platform/`）
2. **集成**：加密 → 存储 → 解密全链路集成测试验证数据格式兼容
3. **错误处理**：覆盖 IndexedDB 不可用与配额超限分支

## 扩展指引

需要新增平台能力时：

1. 在 `src/utils/platform/` 下创建独立模块，仅使用浏览器标准 API
2. 在 `index.ts` barrel export 中导出公开 API 与类型
3. 为外部不可达能力补充 `isSupported()` 检测
4. 遵循既有模块的中文注释与错误处理约定
