# AGENTS.md

本文件为 coding agent 在本仓库中工作时提供指导。

## 项目概述

这是一个 Tauri + React + TypeScript 桌面应用程序。它结合了 Rust 后端 (Tauri) 和 React 前端，使用 Vite 作为构建工具。

## 架构

**前端**: React 19 + TypeScript + Vite

- 入口文件: `src/main.tsx`
- 使用 React Compiler 进行优化
- 国际化: i18next + react-i18next
- 端口: 1420 (Tauri 固定端口)

**后端**: Rust + Tauri 2.0

- 入口文件: `src-tauri/src/main.rs` → `src-tauri/src/lib.rs`
- 命令定义: 在 `lib.rs` 中使用 `#[tauri::command]` 定义
- Tauri 配置: `src-tauri/tauri.conf.json`

**通信方式**: 前端通过 `@tauri-apps/api/core` 的 invoke() 方法调用 Rust 函数

## 开发命令

```bash
# 安装依赖
pnpm install

# 运行开发服务器（同时启动前端和后端）
pnpm tauri dev

# 构建生产版本
pnpm tauri build

# 运行代码检查
pnpm lint

# 类型检查
pnpm tsc

# 运行测试（监听模式）
pnpm test

# 运行单次测试
pnpm test:run

# 启动测试 UI 界面
pnpm test:ui

# 生成测试覆盖率报告
pnpm test:coverage
```

## 关键技术细节

- **包管理器**: pnpm
- **TypeScript**: 严格模式已启用，ES2020 目标
- **ESLint**: 配置了 TypeScript、React Hooks 和 React Refresh 规则
- **React Compiler**: 通过 babel-plugin-react-compiler 启用以进行优化
- **Tauri 插件**:
  - `tauri-plugin-opener`: 文件打开功能
  - `tauri-plugin-keyring`: 主密钥安全存储（系统钥匙串）
  - `tauri-plugin-store`: 键值存储（用于模型和聊天数据持久化）
  - `tauri-plugin-shell`: Shell 命令执行
  - `tauri-plugin-http`: HTTP 请求
  - `tauri-plugin-os`: 操作系统信息
- **UI 组件**: shadcn/ui 预构建 UI 组件库
- **加密存储**:
  - 主密钥：Web Crypto API 生成 + tauri-plugin-keyring 存储
  - 数据加密：AES-256-GCM 字段级加密

### 应用启动初始化流程

应用启动时按以下顺序执行初始化：

1. **阻断式初始化**（必须完成后才能渲染）：
   - 国际化初始化（`initI18n()`）
   - **主密钥初始化（`initializeMasterKey()`）**
     - 检查系统钥匙串（Tauri）或 IndexedDB（Web）中是否存在主密钥
     - 不存在则使用 Web Crypto API 生成新的 256-bit 随机密钥
     - Tauri 环境：将密钥存储到系统钥匙串（macOS Keychain / Windows Credential Manager）
     - Web 环境：将密钥加密后存储到 IndexedDB

2. **渲染应用**：应用界面开始显示，Toaster 组件已挂载

3. **异步初始化**（并行执行，不阻塞渲染）：
   - 模型数据加载（依赖主密钥进行解密）
   - 聊天列表加载
   - 应用语言配置加载

4. **安全性警告 Toast**（Web 环境首次使用，应用渲染后执行）：
   - 检查是否需要显示安全性警告（`handleSecurityWarning()`）
   - Web 环境首次使用时显示 shadcn/ui Toast，提示用户 Web 版本安全级别低于桌面版
   - Toast 设置为永久显示（`duration: Infinity`），用户必须点击"I Understand"确认
   - 用户确认后，将"不再提示"保存到 localStorage

**重要**:
- 主密钥初始化必须在模型数据加载之前完成，否则无法解密 API 密钥
- 安全性警告 Toast 在应用渲染后显示，使用友好的 Toast UI 而非阻断式弹窗
- Toast 永久显示直到用户确认，兼顾用户体验和安全提示效果

### 跨平台兼容性

**背景**: 项目支持两种运行模式 - Tauri 桌面模式和 Web 浏览器模式。某些 Tauri 插件 API 在 Web 环境中不可用，需要提供降级方案。

**兼容层设计**:

项目使用 **Null Object 模式** 和 **环境检测** 来实现跨平台兼容：

1. **环境检测**: 通过 `window.__TAURI__` 对象判断运行环境
2. **统一 API**: 提供与 Tauri 原生 API 一致的接口
3. **降级实现**: Web 环境使用 Null Object 模式，避免运行时错误
4. **功能标记**: 通过 `isSupported()` 方法让调用者判断功能可用性

**兼容层目录结构**:

```
src/utils/tauriCompat/
├── index.ts          # 统一导出所有兼容层 API
├── env.ts            # 环境检测工具
├── shell.ts          # Shell 插件兼容层
├── os.ts             # OS 插件兼容层
├── http.ts           # HTTP 插件兼容层
├── store.ts          # Store 插件兼容层
└── keyring.ts        # Keyring 插件兼容层
```

**使用示例**:

```typescript
// 导入兼容层 API（使用 @/ 别名）
import { isTauri, Command, shell, locale, fetch, getFetchFunc, type RequestInfo } from '@/utils/tauriCompat';

// 环境检测
if (isTauri()) {
  console.log('运行在 Tauri 桌面环境');
} else {
  console.log('运行在 Web 浏览器环境');
}

// 使用 OS API
const language = await locale();
console.log(language); // "zh-CN" 或 "en-US" 等

// 使用 Shell API
const cmd = Command.create('ls', ['-la']);
if (cmd.isSupported()) {
  const output = await cmd.execute();
  console.log(output.stdout);
} else {
  console.log('Shell 功能在 Web 环境中不可用');
}

// 使用 shell.open
shell.open('https://example.com');

// 使用 HTTP API（直接调用 fetch）
const response = await fetch('https://api.example.com/data');
const data = await response.json();

// 使用 HTTP API（获取 fetch 函数实例）
const fetchFunc = getFetchFunc();
const response2 = await fetchFunc('https://api.example.com/data');
```

**已实现兼容层**:

- **Shell 插件** (`@/utils/tauriCompat/shell.ts`)
  - `Command.create()`: 创建 Shell 命令
  - `shell.open()`: 打开 URL 或文件
    - Tauri 环境: 使用 `@tauri-apps/plugin-shell` 原生实现（支持 URL 和本地文件）
    - Web 环境: 使用 `window.open()` 作为浏览器替代方案（仅支持 URL）
  - Web 环境 Shell 命令: 返回 Null Object 实现（不执行实际操作）

- **OS 插件** (`@/utils/tauriCompat/os.ts`)
  - `locale()`: 获取系统或浏览器语言设置
    - Tauri 环境: 使用 `@tauri-apps/plugin-os` 原生实现，返回操作系统语言
    - Web 环境: 使用 `navigator.language` API，返回浏览器首选语言
    - 返回格式: BCP 47 语言标签（如 "zh-CN"、"en-US"）
    - 注意: Web 环境使用浏览器语言而非系统语言，用户可通过应用设置手动调整

- **HTTP 插件** (`@/utils/tauriCompat/http.ts`)
  - `fetch()`: 统一的 fetch 函数，根据环境自动选择实现
    - 开发环境：使用原生 Web `fetch` API（便于调试）
    - 生产环境 + Tauri 平台：使用 `@tauri-apps/plugin-http` 的 `fetch`（系统代理、证书管理）
    - 生产环境 + Web 平台：使用原生 Web `fetch` API
  - `getFetchFunc()`: 获取 fetch 函数实例，用于第三方库注入或自定义封装
    - 适用于为第三方库（如 Axios）注入 fetch 函数
    - 适用于封装自定义的请求方法
  - 类型定义：
    - `RequestInfo`: 自定义类型 `type RequestInfo = string | URL | Request`
    - `FetchFunc`: fetch 函数类型
    - 其他类型（RequestInit、Response、Headers、Request）：直接使用原生类型定义

   **使用场景示例**：

   ```typescript
   // 场景 1：直接使用 fetch（适用于常规 HTTP 请求）
   import { fetch } from '@/utils/tauriCompat';

   const response = await fetch('https://api.example.com/data');
   const data = await response.json();

   // 场景 2：使用 getFetchFunc 封装自定义请求方法或注入第三方库
   import { getFetchFunc } from '@/utils/tauriCompat';
   import axios from 'axios';

   // 自定义封装
   class ApiClient {
     private fetch = getFetchFunc();

     async request(url: string, options?: RequestInit) {
       const response = await this.fetch(url, options);
       if (!response.ok) {
         throw new Error(`HTTP ${response.status}: ${response.statusText}`);
       }
       return response.json();
     }
   }

   // 注入第三方库（如 Axios）
   const api = axios.create({ adapter: getFetchFunc() });
   const response = await api.get('https://api.example.com/data');
   ```

  **环境判断逻辑**：

  ```
  IF (开发模式: import.meta.env.DEV === true) THEN
    使用原生 Web fetch
  ELSE IF (生产 Tauri 平台: window.__TAURI__ 存在) THEN
    使用 @tauri-apps/plugin-http 的 fetch
  ELSE (生产 Web 平台)
    使用原生 Web fetch
  ```

  **类型说明**：

   - `RequestInfo`: 自定义类型定义，兼容 Web 和 Tauri fetch 的输入参数类型
   - `FetchFunc`: fetch 函数类型
   - 其他类型（RequestInit、Response、Headers、Request）：直接使用原生类型定义

   **使用场景示例**：

   ```typescript
   // 场景 1：直接使用 fetch（适用于常规 HTTP 请求）
   import { fetch } from '@/utils/tauriCompat';

   const response = await fetch('https://api.example.com/data');
   const data = await response.json();

   // 场景 2：使用 getFetchFunc 封装自定义请求方法或注入第三方库
   import { getFetchFunc } from '@/utils/tauriCompat';
   import axios from 'axios';

   // 自定义封装
   class ApiClient {
     private fetch = getFetchFunc();

     async request(url: string, options?: RequestInit) {
       const response = await this.fetch(url, options);
       if (!response.ok) {
         throw new Error(`HTTP ${response.status}: ${response.statusText}`);
       }
       return response.json();
     }
   }

   // 注入第三方库（如 Axios）
   const api = axios.create({ adapter: getFetchFunc() });
   const response = await api.get('https://api.example.com/data');
   ```

   **环境判断逻辑**：

   ```
   IF (开发模式: import.meta.env.DEV === true) THEN
     使用原生 Web fetch
   ELSE IF (生产 Tauri 平台: window.__TAURI__ 存在) THEN
     使用 @tauri-apps/plugin-http 的 fetch
   ELSE (生产 Web 平台)
     使用原生 Web fetch
   ```

   **类型说明**：

   - `RequestInfo`: 自定义类型定义，兼容 Web 和 Tauri fetch 的输入参数类型
   - 其他类型（RequestInit、Response、Headers、Request）：直接使用全局原生类型定义，避免重复
   - TypeScript 类型系统会自动推导，确保类型安全

**HTTP 插件兼容层迁移指南**:

如果你的项目当前直接使用 `@tauri-apps/plugin-http`，需要将其替换为兼容层 API：

**迁移前**：

```typescript
import { fetch as tauriFetch } from '@tauri-apps/plugin-http';

const response = await tauriFetch('https://api.example.com/data');
const data = await response.json();
```

**迁移后**：

```typescript
import { fetch } from '@/utils/tauriCompat';

const response = await fetch('https://api.example.com/data');
const data = await response.json();
```

**自定义 fetch 函数获取的场景**：

```typescript
// 迁移前
import { fetch as tauriFetch } from '@tauri-apps/plugin-http';

// 迁移后
import { fetch, getFetchFunc } from '@/utils/tauriCompat';

// 直接使用 fetch
const response = await fetch('https://api.example.com/data');

// 或使用 getFetchFunc 进行封装
class ApiClient {
  private fetch = getFetchFunc();
  // ...
}

// 或注入第三方库
import axios from 'axios';
const api = axios.create({ adapter: getFetchFunc() });
```

**环境差异说明**：

- **开发环境**：迁移后使用原生 Web fetch，可在浏览器 DevTools 中查看网络请求（调试更方便）
- **生产环境 Tauri**：使用 Tauri fetch，获得系统代理和证书管理能力
- **生产环境 Web**：使用原生 Web fetch，确保在浏览器中正常运行

**重要**：开发环境无法测试 Tauri fetch 的特定行为（如系统代理），需要在生产环境中验证。

**Store 和 Keyring 插件兼容层** (`src/utils/tauriCompat/store.ts`, `src/utils/tauriCompat/keyring.ts`):

项目已实现 `store` 和 `keyring` 插件的 Web 兼容层，使用 IndexedDB 作为降级方案。

**Store 插件兼容层** (`src/utils/tauriCompat/store.ts`):

提供键值存储功能，用于存储模型配置、聊天数据等。

- **Tauri 环境**: 使用 `@tauri-apps/plugin-store` 的原生实现，存储到文件系统
- **Web 环境**: 使用 IndexedDB 实现，数据库名称：`multi-chat-store`，对象存储：`store`
- **API 行为**:
  - `createLazyStore(filename)`: 创建 Store 实例
  - `Store.init()`: 初始化 Store
  - `Store.get<T>(key)`: 获取键值（支持泛型）
  - `Store.set(key, value)`: 设置键值
  - `Store.delete(key)`: 删除键值
  - `Store.keys()`: 获取所有键
  - `Store.save()`: 保存更改（Web 环境为空操作，IndexedDB 自动持久化）
  - `Store.isSupported()`: 检查功能是否可用

**使用示例**:

```typescript
// 导入 Store 兼容层
import { createLazyStore } from '@/utils/tauriCompat';
import type { StoreCompat } from '@/utils/tauriCompat';

// 创建 Store 实例
const store = createLazyStore('models.json');

// 初始化 Store
await store.init();

// 存储数据
await store.set('models', modelList);

// 保存更改
await store.save();

// 读取数据
const models = await store.get<Model[]>('models');

// 删除数据
await store.delete('models');

// 获取所有键
const keys = await store.keys();

// 检查功能是否可用
if (store.isSupported()) {
  // 使用 Store 功能
   }
   ```

**Web 端功能差异**:

以下功能在 Web 环境中的行为与 Tauri 环境不同：

- **Shell 插件**:
  - `shell.open()`:
    - Tauri 环境: 支持打开 URL 和本地文件路径
    - Web 环境: 仅支持打开 URL（使用 `window.open()`），不支持本地文件路径
    - `isSupported()`: 在两种环境中均返回 `true`
  - `Command.execute()`:
    - Tauri 环境: 执行真实的 Shell 命令
    - Web 环境: 返回模拟的成功结果（Null Object 模式），不实际执行命令
    - `isSupported()`: Tauri 环境返回 `true`，Web 环境返回 `false`

- **OS 插件**:
  - `locale()`:
    - Tauri 环境: 返回操作系统语言设置
    - Web 环境: 返回浏览器首选语言设置
    - 无 `isSupported()` 方法: 功能在两种环境始终可用

- **HTTP 插件**:
  - `fetch()`:
    - 开发环境：在 Tauri 和 Web 环境中均使用原生 Web `fetch`
    - 生产环境 Tauri：使用 `@tauri-apps/plugin-http` 的 `fetch`（支持系统代理、证书管理）
    - 生产环境 Web：使用原生 Web `fetch`
    - 无 `isSupported()` 方法: 功能在两种环境始终可用
    - API 行为一致：与标准 Fetch API 完全兼容

- **Store 插件**:
  - `Store.save()`:
    - Tauri 环境: 将更改保存到文件
    - Web 环境: 空操作（IndexedDB 自动提交事务）
    - 无 `isSupported()` 方法: 功能在两种环境始终可用

- **Keyring 插件**:
  - **安全级别**: Web 环境低于 Tauri 环境（种子以明文存储在 `localStorage`）
  - **安全性缓解措施**:
    - PBKDF2 100,000 次迭代增加暴力破解难度
    - AES-256-GCM 强加密算法
    - 首次使用时显示安全性警告
  - **密钥丢失处理**: 如果 `localStorage` 中的种子被清除，将生成新种子，旧加密数据无法解密
  - `isKeyringSupported()`: 检测 IndexedDB 和 Web Crypto API 可用性

**降级策略选择规则**:

为 Tauri 插件添加兼容层时，根据插件特性选择降级策略：

1. **数据持久化插件**（store、keyring）:
   - **策略**: IndexedDB 替代方案
   - **原因**: 核心功能，必须提供可用实现
   - **示例**: Store 和 Keyring 兼容层

2. **系统操作插件**（shell 命令）:
   - **策略**: Null Object 模式
   - **原因**: Web 环境无法执行 Shell 命令，安全风险高
   - **示例**: Shell 兼容层的 Command 类

3. **环境信息插件**（OS、HTTP）:
   - **策略**: 浏览器原生 API 替代
   - **原因**: 浏览器提供类似功能
   - **示例**: OS 兼容层的 `locale()`、HTTP 兼容层的 `fetch()`

**为其他插件添加兼容层**:

如果需要为其他 Tauri 插件（如 `keyring`、`store`）添加 Web 兼容层，遵循以下步骤：

1. 在 `src/utils/tauriCompat/` 下创建新模块（如 `keyring.ts`）
2. 导入 Tauri 原生 API 和环境检测函数
3. 创建兼容接口（对于功能降级的 API，包含 `isSupported()` 方法）
4. 实现两个类（或函数）：
   - Tauri 环境：封装原生 API
   - Web 环境：Null Object 实现（对于有降级方案的 API，使用浏览器原生 API）
5. 在 `index.ts` 中导出新模块的 API
6. 更新使用该插件的代码，替换导入路径为 `@/utils/tauriCompat`
7. 在 AGENTS.md 中添加相应的文档说明

**参考示例**:
- OS 插件兼容层 (`src/utils/tauriCompat/os.ts`) - 实现了基于函数的兼容层，Web 环境使用浏览器 API 降级
- Shell 插件兼容层 (`src/utils/tauriCompat/shell.ts`) - 实现了基于类的兼容层，包含 `isSupported()` 方法

**平台检测替换说明**:

在某些情况下，可能不需要为 Tauri 插件 API 创建完整的兼容层，而是直接使用浏览器原生 API 替换：

- **示例**: 项目中使用 `@tauri-apps/plugin-os` 的 `platform()` API 检测 macOS 平台（用于 Safari 中文输入法 bug 处理）
- **替换方案**: 直接使用 `navigator.userAgent` 进行浏览器平台检测
- **实现**:
  ```typescript
  // 检测是否为 macOS 平台的 Safari 浏览器
  const isMacSafari = (): boolean => {
    const ua = navigator.userAgent;
    return /Mac|macOS/.test(ua) && /Safari/.test(ua) && !/Chrome|Edge|Firefox/.test(ua);
  };
  ```
- **优势**: 减少对 Tauri API 的依赖，提升 Web 环境的独立性

**重要规范**:

- **始终使用 `@/` 别名导入兼容层**，不使用相对路径
- 对于功能降级的 API，必须提供 `isSupported()` 方法
- 对于有浏览器替代方案的 API（如 `locale()`），可以不提供 `isSupported()` 方法（功能始终可用）
- Web 环境的实现永不抛出异常，始终返回 resolved Promise
- 保持与 Tauri 原生 API 的类型一致性

## 添加新的 Tauri 命令

1. 在 `src-tauri/src/lib.rs` 中使用 `#[tauri::command]` 属性添加命令函数
2. 在 `run()` 函数的 `invoke_handler` 中注册该命令
3. 在前端使用 `invoke("command_name", { args })` 调用

## 导入路径规范

**重要**: 在项目内导入模块时，始终使用 `@/` 别名而不是相对路径如 `../..`。`@/` 别名指向 `src/` 目录。

示例:

```typescript
// 正确
import { Model } from "@/types/model";
import { loadModelsFromJson } from "@/store/storage/jsonStorage";
import { initializeMasterKey } from "@/store/keyring/masterKey";
import { encryptField, decryptField } from "@/utils/crypto";

// 错误
import { Model } from "../../types/model";
import { loadModels } from "../storage/modelStorage";
```

## 代码文档要求

**重要**: 始终在函数、类型、变量和其他代码元素上方添加中文注释。修改代码时，必要时更新相应注释。

### JSDoc 函数注释格式

**重要**: 对于函数参数注释，必须使用 JSDoc 标准格式：

```typescript
/**
 * 函数的简要描述
 * @param paramName 参数的详细描述
 * @param paramName2 参数2的详细描述，可以更详细地说明参数的作用和用法
 */
```

**关键要点：**

1. 使用 `/** */` 块注释格式（双星号开头）
2. 每个参数使用 `@param` 标签
3. 参数名后面跟空格，然后是参数描述
4. 描述应该详细说明参数的作用、类型和使用方式
5. 遵循项目的中文注释要求

示例:

```typescript
// 用户模型接口定义
interface User {
  id: string;
  name: string;
}

// 从本地存储加载模型数据
const loadModels = async (): Promise<Model[]> => {
  // 实现逻辑
};

// 当前过滤文本状态
const [filterText, setFilterText] = useState<string>("");
```

## 代码实现要求

**重要**:
你是一名经验丰富的软件开发工程师，专注于构建高内聚、低耦合、高性能、可维护、健壮的解决方案。

你的任务是：**审查、理解并迭代式地实现/改进用户提交给你的需求。**

在整个工作流程中，你必须内化并严格遵循以下核心编程原则，确保你的每次输出和建议都体现这些理念：

- **简单至上 (KISS):** 追求代码和设计的极致简洁与直观，避免不必要的复杂性。
- **精益求精 (YAGNI):** 仅实现当前明确所需的功能，抵制过度设计和不必要的未来特性预留。
- **坚实基础 (SOLID):**
  - **S (单一职责):** 各组件、类、函数只承担一项明确职责。
  - **O (开放/封闭):** 功能扩展无需修改现有代码。
  - **L (里氏替换):** 子类型可无缝替换其基类型。
  - **I (接口隔离):** 接口应专一，避免"胖接口"。
  - **D (依赖倒置):** 依赖抽象而非具体实现。
- **杜绝重复 (DRY):** 识别并消除代码或逻辑中的重复模式，提升复用性。

**请严格遵循以下工作流程和输出要求：**

1.  **深入理解与初步分析（理解阶段）：**
    - 详细审阅提供的[资料/代码/项目描述]，全面掌握其当前架构、核心组件、业务逻辑及痛点。
    - 在理解的基础上，初步识别项目中潜在的**KISS, YAGNI, DRY, SOLID**原则应用点或违背现象。

2.  **明确目标与迭代规划（规划阶段）：**
    - 基于用户需求和对现有项目的理解，清晰定义本次迭代的具体任务范围和可衡量的预期成果。
    - 在规划解决方案时，优先考虑如何通过应用上述原则，实现更简洁、高效和可扩展的改进，而非盲目增加功能。

3.  **分步实施与具体改进（执行阶段）：**
    - 详细说明你的改进方案，并将其拆解为逻辑清晰、可操作的步骤。
    - 针对每个步骤，具体阐述你将如何操作，以及这些操作如何体现**KISS, YAGNI, DRY, SOLID**原则。例如：
      - "将此模块拆分为更小的服务，以遵循SRP和OCP。"
      - "为避免DRY，将重复的XXX逻辑抽象为通用函数。"
      - "简化了Y功能的用户流，体现KISS原则。"
      - "移除了Z冗余设计，遵循YAGNI原则。"
    - 重点关注[项目类型，例如：代码质量优化 / 架构重构 / 功能增强 / 用户体验提升 / 性能调优 / 可维护性改善 / Bug修复]的具体实现细节。

4.  **总结、反思与展望（汇报阶段）：**
    - 提供一个清晰、结构化且包含**实际代码/设计变动建议（如果适用）**的总结报告。
    - 报告中必须包含：
      - **本次迭代已完成的核心任务**及其具体成果。
      - **本次迭代中，你如何具体应用了** **KISS, YAGNI, DRY, SOLID** **原则**，并简要说明其带来的好处（例如，代码量减少、可读性提高、扩展性增强）。
      - **遇到的挑战**以及如何克服。
      - **下一步的明确计划和建议。**

## 开发规范

**重要**: 以下规范必须严格遵循，以确保项目的一致性和可维护性。

### 回复开场白

每次回答之前，都说一句"向着星辰和深渊！"。

### 注释语言

代码中的注释全部使用中文编写。这包括但不限于：

- 函数和类的注释
- 行内注释
- JSDoc 注释
- 配置文件中的注释

### 回复语言

AI 助手的回复和说明全部使用中文编写。这确保了交流的一致性和可理解性。

### Skill 使用说明

每次回答时，如果使用到 skill，都要列举出使用到的 skill 名称。格式如下：

```
本次使用了以下 skill：
- skill-name-1
- skill-name-2
```

### 安装 shadcn/ui 组件

安装 shadcn/ui 组件时，必须使用 CLI 命令:

```bash
pnpm dlx shadcn@latest add xxx
```

其中 `xxx` 为组件名称（例如: `button`、`input`、`dialog`）。

这能确保根据项目的 shadcn/ui 配置正确放置文件。

### 文档同步

每次修改项目内的文件时，都需要检查相关改动是否在 AGENTS.md 和 README.md 中被提及。

- **如果有提及**：需要根据文件改动相应地更新 AGENTS.md 和 README.md
- **如果没有提及**：则判断是否需要在 AGENTS.md 和 README.md 中新增相关内容；如果需要，则在适当的位置新增内容
- **README.md 简洁原则**：当在 README.md 中新增内容的时候，只增加绝对必要的内容，以保证 README.md 的内容的简洁度

**文档同步检查流程：**

1. 确认修改的文件类型和内容范围
2. 检查 AGENTS.md 中是否有相关说明
3. 检查 README.md 中是否有相关说明
4. 根据上述原则更新文档

## 国际化 (i18n)

### 配置

- 主配置文件: `src/lib/i18n.ts`
- 语言文件位置: `src/locales/`
- 支持的语言: 中文 (zh)、英文 (en)
- 默认语言: 英文 (回退语言)
- 语言检测优先级:
  1. 本地存储 (`multi-chat-language`)
  2. 系统语言（如果支持）
  3. 默认回退 (en)

### 语言文件结构

```
src/locales/
├── en/
│   ├── common.json    # 通用 UI 文本
│   ├── model.json     # 模型相关文本
│   ├── setting.json   # 设置相关文本
│   └── table.json     # 表格相关文本
└── zh/
```

### 关键函数

- `initI18n()`: 初始化 i18n 配置
- `getLocalesResources()`: 动态加载所有语言资源
- `changeAppLanguage()`: 更改应用语言
- `getDefaultAppLanguage()`: 基于系统/本地存储获取默认语言

### 添加新语言支持

1. 在 `src/locales/` 中创建新的语言目录
2. 将语言代码添加到 `src/utils/constants.ts` 的 `SUPPORTED_LANGUAGE_LIST` 中
3. 复制并翻译现有语言的所有 JSON 文件
4. 重启应用程序

## 文件结构

- `/src/` - React 前端代码
- `/src-tauri/` - Rust 后端代码
- `/public/` - 静态资源
- `/dist/` - 构建输出 (已忽略)
