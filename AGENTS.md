# AGENTS.md

本文件为 coding agent 在本仓库中工作时提供指导。

## 文档维护原则

### 内容分类规则

| 类别           | 处理方式           | 示例                          |
| -------------- | ------------------ | ----------------------------- |
| **必要信息**   | 保留               | 项目架构、开发规范、关键约定  |
| **可查询信息** | 删除，提供文件引用 | Tauri 插件列表 → package.json |
| **详细示例**   | 删除，保留简要说明 | API 使用示例 → 指向源文件     |
| **重复内容**   | 合并为一段         | HTTP 插件说明（3 段 → 1 段）  |
| **过时数据**   | 删除               | 测试覆盖率统计                |

### 添加新内容检查清单

在 AGENTS.md 中添加新内容前，先确认：

- [ ] 该信息是否无法从代码中查询？
- [ ] 是否符合文档结构（是否有更合适的章节）？
- [ ] 是否包含冗余的代码示例？
- [ ] 是否与已有内容重复？
- [ ] 是否提供了文件引用（如有必要）？
- [ ] 是否使用正面描述（"要干xxx"而非"不要干xxx"）？

### 优先级原则

对于实现细节：

- **优先**：在代码中添加详细注释
- **其次**：在 README.md 中添加使用说明
- **最后**：在 AGENTS.md 中添加架构说明

### 维护规范

- **保持精简**：目标 350 行以内
- **及时更新**：架构变更时同步更新文档
- **定期审查**：每季度检查一次
- **版本控制**：重大变更前备份当前版本
- **正面描述**：使用"始终使用 `@/` 别名"，而非"不要使用相对路径"

### 文档同步要求

每次修改文件时，检查相关改动是否在 AGENTS.md 和 README.md 中被提及：

- **如果有提及**：更新相关文档
- **如果没有提及**：判断是否需要新增内容
- **README.md 简洁原则**：只增加绝对必要的内容

### 当前文档状态

- **总行数**：350 行（精简前 1316 行，减少 73%）
- **文档参考章节**：提供关键文件路径索引

## 项目概述

Tauri + React + TypeScript 桌面应用程序，结合 Rust 后端和 React 前端。

**技术栈**：

- 前端：React 19 + TypeScript + Vite
- 后端：Rust + Tauri 2.0
- 通信：前端通过 `invoke()` 调用 Rust 函数

## 架构

**前端架构**：

- 入口文件: `src/main.tsx`
- 使用 React Compiler 优化
- 国际化: i18next + react-i18next

**后端架构**：

- 入口: `src-tauri/src/lib.rs`
- 命令定义: 使用 `#[tauri::command]`
- 配置: `src-tauri/tauri.conf.json`

## 开发命令

```bash
# 安装依赖
pnpm install

# 运行开发服务器
pnpm tauri dev

# 构建生产版本
pnpm tauri build

# 代码检查
pnpm lint

# 类型检查
pnpm tsc

# 运行测试
pnpm test
```

更多命令：见 `package.json` 的 `scripts` 字段。

## 关键设计说明

### 应用启动初始化流程

使用 `InitializationManager` 管理初始化，支持依赖关系、并行执行和三级错误处理。

**初始化步骤**（配置位于 `src/config/initSteps.ts`）：

1. **i18n** - 初始化国际化
2. **masterKey** - 初始化主密钥（系统钥匙串或 IndexedDB）
3. **models** - 加载模型数据（依赖 masterKey）
4. **chatList** - 加载聊天列表
5. **appLanguage** - 加载应用语言配置（依赖 i18n）
6. **includeReasoningContent** - 加载推理内容配置
7. **modelProvider** - 从远程 API 获取模型供应商定义

**执行顺序**：拓扑排序优化并行执行
**错误处理**：致命错误（全屏提示）、警告错误（Toast）、可忽略错误（控制台）

详细实现：`src/config/initSteps.ts`

### 远程模型数据获取

从 `https://models.dev/api.json` 动态获取模型供应商数据。

**架构**：

```
models.dev API → 远程数据获取层 → 供应商过滤层 → Redux store
```

**关键模块**：

- 远程数据获取：`src/services/modelRemoteService.ts`
- Redux 状态管理：`src/store/slices/modelProviderSlice.ts`
- 网络配置：`src/utils/constants.ts`

**缓存策略**：

- 首选：远程 API
- 备选：本地缓存 (`remote-cache.json`)
- 终极：显示错误提示

### 聊天服务层

使用独立的聊天服务层 (`src/services/chatService.ts`) 统一处理供应商请求。

**架构**：

```
Redux Thunk → ChatService → Vercel AI SDK → 供应商 API
```

**核心功能**：

1. **供应商特定 Provider**：使用 Vercel AI SDK 官方包（DeepSeek、Kimi、Zhipu）
2. **流式请求**：`streamChatCompletion()` 使用 `streamText()`
3. **响应转换**：转换为 `StandardMessage` 格式

**消息格式**：Vercel AI SDK 标准 Part 数组格式

- `system`: `{ content: '...' }`
- `user`: `{ content: [{ type: 'text', text: '...' }] }`
- `assistant`: `{ content: [{ type: 'text', text: '...' }, { type: 'reasoning', text: '...' }] }`

详细实现：`src/services/chatService.ts`

### 跨平台兼容性

**设计原则**：

- **Null Object 模式**：Web 环境返回空实现，避免运行时错误
- **环境检测**：通过 `window.__TAURI__` 判断运行环境
- **统一 API**：提供一致的接口

**兼容层目录**：`src/utils/tauriCompat/`

| 模块    | Tauri 实现  | Web 降级                      |
| ------- | ----------- | ----------------------------- |
| Shell   | 原生实现    | `window.open()` / Null Object |
| OS      | 系统语言    | `navigator.language`          |
| HTTP    | Tauri fetch | 原生 Web fetch                |
| Store   | 文件系统    | IndexedDB                     |
| Keyring | 系统钥匙串  | IndexedDB (加密)              |

详细实现：`src/utils/tauriCompat/index.ts`

## 开发规范

### 导入路径规范

**始终使用 `@/` 别名导入**，不使用相对路径。

```typescript
// 正确
import { Model } from "@/types/model";
import { loadModels } from "@/store/storage/modelStorage";

// 错误
import { Model } from "../../types/model";
```

`@/` 别名指向 `src/` 目录。

### 代码文档要求

**始终在函数、类型、变量上方添加中文注释**。

#### JSDoc 函数注释格式

```typescript
/**
 * 函数的简要描述
 * @param paramName 参数的详细描述
 * @param paramName2 参数2的详细描述
 */
```

**关键要点**：

1. 使用 `/** */` 块注释格式
2. 每个参数使用 `@param` 标签
3. 参数名后跟空格，然后是描述
4. 描述详细说明参数的作用、类型和使用方式

### 代码实现原则

你是一名经验丰富的软件开发工程师，专注于构建高内聚、低耦合、高性能、可维护、健壮的解决方案。

**核心编程原则**：

- **KISS (简单至上)**：追求极致简洁，避免不必要复杂性
- **YAGNI (精益求精)**：仅实现当前明确所需的功能
- **SOLID 原则**：
  - **S (单一职责)**：各组件只承担一项明确职责
  - **O (开放/封闭)**：功能扩展无需修改现有代码
  - **L (里氏替换)**：子类型可无缝替换其基类型
  - **I (接口隔离)**：接口应专一，避免"胖接口"
  - **D (依赖倒置)**：依赖抽象而非具体实现
- **DRY (杜绝重复)**：识别并消除重复模式，提升复用性

### 回复开场白

每次回答之前，都说一句"向着星辰和深渊！"。

### 注释和回复语言

- **代码注释**：使用中文
- **AI 助手回复**：使用中文

### Skill 使用说明

每次回答时，如果使用到 skill，都要列举出使用到的 skill 名称：

```
本次使用了以下 skill：
- skill-name-1
- skill-name-2
```

### 安装 shadcn/ui 组件

使用 CLI 命令安装组件：

```bash
pnpm dlx shadcn@latest add xxx
```

`xxx` 为组件名称（如 `button`、`input`、`dialog`）。

## 项目约定

### 时间戳工具函数

**时间戳单位约定**：

- **秒级时间戳**：用于聊天消息、数据库记录（`StandardMessage.timestamp`）
- **毫秒级时间戳**：用于性能测试、调试日志

**使用规范**：

- 生产代码生成时间戳时，**必须**使用工具函数
- 聊天消息使用 `getCurrentTimestamp()`（秒级）
- 性能测试可使用 `getCurrentTimestampMs()`（毫秒级）
- 测试代码可保留直接使用 `Date.now()`，以便灵活控制

**函数列表**：

```typescript
import { getCurrentTimestamp, getCurrentTimestampMs } from "@/utils/utils";

const timestamp = getCurrentTimestamp(); // 秒级
const timestampMs = getCurrentTimestampMs(); // 毫秒级
```

实现位置：`src/utils/utils.ts`

### 测试编写规范

**测试文件组织**：

- 核心模块测试（router、Layout、关键工具）放置在 `src/__test__/` 目录
- 组件测试可放置在 `src/__test__/components/` 或组件同目录的 `__tests__` 目录
- 测试数据 fixtures 放置在 `src/__test__/fixtures/` 目录
- 工具函数测试放置在 `src/__test__/utils/` 目录

**测试命名规范**：

- 测试文件命名：`*.test.ts` 或 `*.test.tsx`
- 测试用例命名格式："should [expected behavior] when [condition]"（中文："应该 [预期行为] 当 [条件]"）
- 示例：`should navigate to chat page when chat ID is valid`
- 示例：`应该渲染用户消息当消息角色为 user`

**Mock 使用规范**：

- **单元测试**：Mock 所有外部依赖（API、文件系统、时间）
  - 使用 Vitest 的 `vi.fn()` 和 `vi.mock()`
  - 示例：`const mockFn = vi.fn(); vi.mock('@/utils/api', () => ({ fetchData: mockFn }));`
- **组件测试**：Mock API 请求，避免 Mock 实现细节
  - 使用 Vitest 的 `vi.fn()` Mock 函数
  - 优先测试用户交互行为，而非内部实现
- **集成测试**：仅 Mock 外部服务，保持内部模块真实交互

**测试运行命令**：

```bash
# 运行测试并监听文件变化
pnpm test

# 运行测试并生成覆盖率报告
pnpm test:coverage

# 运行所有测试
pnpm test:run
```

### 添加新的 Tauri 命令

1. 在 `src-tauri/src/lib.rs` 中使用 `#[tauri::command]` 定义命令
2. 在 `invoke_handler` 中注册命令
3. 前端使用 `invoke("command_name", { args })` 调用

## 文档参考

### 按功能查找文件

| 功能需求         | 文件路径                             |
| ---------------- | ------------------------------------ |
| 应用初始化配置   | `src/config/initSteps.ts`            |
| 聊天服务         | `src/services/chatService.ts`        |
| 远程模型数据获取 | `src/services/modelRemoteService.ts` |
| 跨平台兼容层     | `src/utils/tauriCompat/index.ts`     |
| 主密钥管理       | `src/store/keyring/masterKey.ts`     |
| 加密工具         | `src/utils/crypto.ts`                |
| 时间戳工具       | `src/utils/utils.ts`                 |
| 测试辅助工具     | `src/__test__/helpers/`              |
| 测试 Fixtures    | `src/__test__/fixtures/`             |
| 测试配置         | `vite.config.ts` (test 字段)         |
| 国际化配置       | `src/lib/i18n.ts`                    |

### 按架构层次查找

```
配置层
├── src/config/initSteps.ts      # 初始化步骤配置
└── src/utils/constants.ts       # 常量定义

服务层
├── src/services/chatService.ts  # 聊天服务
└── src/services/modelRemoteService.ts  # 远程数据服务

存储层
├── src/store/keyring/           # 主密钥管理
├── src/store/slices/            # Redux 状态管理
└── src/store/storage/           # 数据持久化

兼容层
└── src/utils/tauriCompat/       # 跨平台兼容

工具层
├── src/utils/crypto.ts          # 加密工具
├── src/utils/utils.ts           # 通用工具
└── src/lib/i18n.ts              # 国际化

测试层
├── src/__test__/helpers/        # 测试辅助工具
├── src/__test__/fixtures/       # 测试数据 fixtures
├── src/__test__/router/         # 路由测试
├── src/__test__/components/     # 组件测试
└── src/__test__/utils/          # 工具函数测试
```

### 其他配置文件

| 配置            | 路径                                                     |
| --------------- | -------------------------------------------------------- |
| Tauri 插件列表  | `package.json`                                           |
| Tauri 配置      | `src-tauri/tauri.conf.json`                              |
| 测试配置        | `vite.config.ts` (test 字段，行 37-90)                   |
| ESLint 配置     | `.eslintrc.json`                                         |
| TypeScript 配置 | `tsconfig.json`                                          |
| 覆盖率报告      | `coverage/index.html` (运行 `pnpm test:coverage` 后生成) |

## 文件结构

- `/src/` - React 前端代码
- `/src-tauri/` - Rust 后端代码
- `/public/` - 静态资源
- `/dist/` - 构建输出 (已忽略)
