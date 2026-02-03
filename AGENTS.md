# AGENTS.md

本文件为 coding agent 在本仓库中工作时提供指导。

## 项目概述

这是一个 Tauri + React + TypeScript 桌面应用程序。它结合了 Rust 后端 (Tauri) 和 React 前端，使用 Vite 作为构建工具。

## 架构

**前端**: React 19 + TypeScript + Vite

- 入口文件: `src/main.tsx`
- 主组件: `src/App.tsx`
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
     - 检查系统钥匙串中是否存在主密钥
     - 不存在则使用 Web Crypto API 生成新的 256-bit 随机密钥
     - 将密钥存储到系统钥匙串（macOS Keychain / Windows Credential Manager）

2. **异步初始化**（并行执行）：
   - 模型数据加载（依赖主密钥进行解密）
   - 聊天列表加载
   - 应用语言配置加载

**重要**: 主密钥初始化必须在模型数据加载之前完成，否则无法解密 API 密钥。

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
└── shell.ts          # Shell 插件兼容层
```

**使用示例**:

```typescript
// 导入兼容层 API（使用 @/ 别名）
import { isTauri, Command, shell } from '@/utils/tauriCompat';

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
  console.log('Shell 功能在 Web 环境中不可用');
}

// 使用 shell.open
shell.open('https://example.com');
```

**已实现兼容层**:

- **Shell 插件** (`@/utils/tauriCompat/shell.ts`)
  - `Command.create()`: 创建 Shell 命令
  - `shell.open()`: 打开 URL 或文件
    - Tauri 环境: 使用 `@tauri-apps/plugin-shell` 原生实现（支持 URL 和本地文件）
    - Web 环境: 使用 `window.open()` 作为浏览器替代方案（仅支持 URL）
  - Web 环境 Shell 命令: 返回 Null Object 实现（不执行实际操作）

**Web 端功能差异**:

以下功能在 Web 环境中的行为与 Tauri 环境不同：

- `shell.open()`:
  - Tauri 环境: 支持打开 URL 和本地文件路径
  - Web 环境: 仅支持打开 URL（使用 `window.open()`），不支持本地文件路径
  - `isSupported()`: 在两种环境中均返回 `true`

- `Command.execute()`:
  - Tauri 环境: 执行真实的 Shell 命令
  - Web 环境: 返回模拟的成功结果（Null Object 模式），不实际执行命令
  - `isSupported()`: Tauri 环境返回 `true`，Web 环境返回 `false`

**为其他插件添加兼容层**:

如果需要为其他 Tauri 插件（如 `keyring`、`store`）添加 Web 兼容层，遵循以下步骤：

1. 在 `src/utils/tauriCompat/` 下创建新模块（如 `keyring.ts`）
2. 导入 Tauri 原生 API 和环境检测函数
3. 创建兼容接口（包含 `isSupported()` 方法）
4. 实现两个类：
   - Tauri 环境：封装原生 API
   - Web 环境：Null Object 实现
5. 在 `index.ts` 中导出新模块的 API
6. 更新使用该插件的代码，替换导入路径为 `@/utils/tauriCompat`

**重要规范**:

- **始终使用 `@/` 别名导入兼容层**，不使用相对路径
- 所有兼容层 API 必须提供 `isSupported()` 方法
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
