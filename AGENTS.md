# AGENTS.md

本文件为 coding agent 在本仓库中工作时提供指导。

## 文档维护原则

### 内容分类规则

| 类别               | 处理方式                      | 示例                              |
| ------------------ | ----------------------------- | --------------------------------- |
| **必要信息**       | 保留                          | 项目架构、开发规范、关键约定      |
| **可查询信息**     | 删除，提供文件引用            | Tauri 插件列表 → package.json     |
| **详细示例**       | 删除，保留简要说明            | API 使用示例 → 指向源文件         |
| **重复内容**       | 合并为一段                    | HTTP 插件说明（3 段 → 1 段）     |
| **过时数据**       | 删除                          | 测试覆盖率统计                    |
| **详细设计说明**   | 移到 docs/design/             | 架构设计、流程说明                |
| **项目约定**       | 移到 docs/conventions/        | 最佳实践、使用规范                |

### 文档拆分决策树

```
是否为 AGENTS.md 的核心信息？
├─ 是 → 保留在 AGENTS.md
└─ 否 → 继续判断
    ├─ 设计决策或架构说明？ → docs/design/
    ├─ 项目约定或最佳实践？ → docs/conventions/
    ├─ 可从代码中直接查询？ → 删除，提供文件路径引用
    └─ 否 → 考虑在代码中添加注释
```

### 添加新内容检查清单

在 AGENTS.md 中添加新内容前，先确认：无法从代码查询、符合文档结构、无冗余示例、无重复内容、提供文件引用、使用正面描述、考虑移到子文档。

### 优先级原则

对于实现细节：

- **优先**：在代码中添加详细注释
- **其次**：在 README.md 中添加使用说明
- **然后**：在 docs/design/ 或 docs/conventions/ 中添加详细文档
- **最后**：在 AGENTS.md 中添加架构说明（仅核心信息）

### docs/ 目录结构规范

`docs/design/` - 设计文档（架构、流程、决策）
`docs/conventions/` - 项目约定（最佳实践、规范）
`docs/reference/` - 参考文档（外部教程、指南）
`docs/README.md` - 完整文档索引

命名规范：小写 + 连字符（如 `lazy-loading.md`）

### 维护规范

- **保持精简**：AGENTS.md 目标 **150 行以内**（从 447 行减少 66%）
- **及时更新**：架构变更时同步更新 AGENTS.md 和相关子文档
- **定期审查**：每季度检查一次文档行数和内容质量
- **版本控制**：重大变更前备份当前版本
- **正面描述**：使用"始终使用 `@/` 别名"，而非"不要使用相对路径"
- **行数监控**：每次更新 AGENTS.md 后检查总行数，超过 150 行时考虑拆分

### 文档同步要求

每次修改文件时，检查相关改动是否需要同步到文档：

- **修改了代码**：
  - 如果改动影响架构 → 更新 AGENTS.md 或 docs/design/
  - 如果改动影响约定 → 更新 docs/conventions/
  - 如果改动可从代码查询 → 无需更新文档
  
- **修改了 AGENTS.md**：
  - 如果增加了详细说明 → 考虑移到 docs/design/
  - 如果增加了约定内容 → 考虑移到 docs/conventions/
  
- **修改了子文档**：
  - 检查是否需要在 AGENTS.md 中更新索引或概述

- **README.md 简洁原则**：只增加绝对必要的内容

### 当前文档状态

**总行数**：195 行（精简前 447 行，减少 56%）

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

`pnpm install` | `pnpm tauri dev` | `pnpm tauri build` | `pnpm lint` | `pnpm tsc` | `pnpm test`

更多命令见 `package.json`，测试规范见 `src/__test__/README.md`

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

```typescript
/**
 * 函数的简要描述
 * @param paramName 参数的详细描述
 */
```

### 代码实现原则

**核心编程原则**：KISS、YAGNI、SOLID、DRY。追求高内聚、低耦合、高性能、可维护、健壮的解决方案。

### Skill 使用规范

**执行任务前先检索可用 Skill**：在开始执行任务前，先检查已配置的 Skill 列表，判断是否有适用的 Skill 可用。如果有匹配的 Skill，优先使用 Skill 工具调用。

**响应中列举使用的 Skill**：执行任务后，在响应中明确说明使用了哪些 Skill。

### 回复规范

- **思考/回复/代码注释使用的语言**：简体中文
- **开场白**：每次回答之前，都说一句“✨ 向着星辰与深渊 ”
- **结束语**：每次完成所有回答后，都要说一句“⌨️ 欢迎来到开发者协会”



## 设计文档索引

详细的设计文档已迁移到 `docs/design/` 目录，包含架构和系统设计说明。

- **[应用启动初始化流程](docs/design/initialization.md)** - InitializationManager 工作原理、依赖关系和三级错误处理
- **[远程模型数据获取](docs/design/model-remote.md)** - models.dev API 架构、缓存策略和重试机制
- **[聊天服务层架构](docs/design/chat-service.md)** - 模块化聊天服务层，支持流式响应和元数据收集
- **[按需加载机制](docs/design/lazy-loading.md)** - ResourceLoader<T> 类设计，减少初始 bundle 大小约 125KB
- **[国际化系统](docs/design/i18n-system.md)** - 按需加载、缓存验证、Toast 队列、自动持久化、翻译完整性检查
- **[跨平台兼容层](docs/design/cross-platform.md)** - Null Object 模式、环境检测、统一 API 设计

## 项目约定索引

项目约定的详细文档已迁移到 `docs/conventions/` 目录，包含开发规范和最佳实践。

- **[时间戳工具函数约定](docs/conventions/timestamps.md)** - 秒级 vs 毫秒级时间戳使用场景和工具函数使用规范
- **[Tauri 命令添加指南](docs/conventions/tauri-commands.md)** - 在 Rust 后端定义命令并在前端调用的完整流程

## 快速查找表

### 核心文件路径

| 功能需求         | 文件路径                               |
| ---------------- | -------------------------------------- |
| 应用初始化配置   | `src/config/initSteps.ts`              |
| 聊天服务       | `src/services/chat/`                   |
| 远程模型数据获取 | `src/services/modelRemote/`            |
| 跨平台兼容层     | `src/utils/tauriCompat/index.ts`       |
| 主密钥管理       | `src/store/keyring/masterKey.ts`       |
| 加密工具         | `src/utils/crypto.ts`                  |
| 时间戳工具       | `src/utils/utils.ts`                   |
| 国际化配置       | `src/lib/i18n.ts`                      |
| 测试规范         | `src/__test__/README.md`              |

完整文档索引：见 `docs/README.md`

## 文件结构

- `/src/` - React 前端代码
- `/src-tauri/` - Rust 后端代码
- `/public/` - 静态资源
- `/docs/` - 详细文档（design、conventions、reference）
