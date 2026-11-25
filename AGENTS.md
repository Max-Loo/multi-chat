# AGENTS.md

本文件为 coding agent 在本仓库中工作时提供指导。

## 项目概述

**Multi-Chat**：多模型聊天桌面应用，可在同一会话中同时向多个 AI 模型提问并对比回答。Tauri + React + TypeScript，Rust 后端 + React 前端。

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

**始终在导出的函数、类型和非显而易见的逻辑上方添加中文注释**；自解释的局部变量不强制。

```typescript
/**
 * 函数的简要描述
 * @param paramName 参数的详细描述
 */
```

### 代码实现原则

**核心编程原则**：KISS、YAGNI、SOLID、DRY。追求高内聚、低耦合、高性能、可维护、健壮的解决方案。

**十一条工作规范**（适用于所有非平凡任务）：

1. **先思考再编码**：明确假设，不确定时先提问而非猜测；存在歧义时给出多种解读；有更简方案时提出；困惑时停下来指出不清楚的地方
2. **简洁优先**：用最少代码解决问题，不做推测性开发；不为单次使用创建抽象；复杂度需经得起资深工程师的审视
3. **精准修改**：只改动必要部分，只清理自己引入的杂乱；不"优化"相邻代码、注释或格式；不重构正常运行的部分，保持现有风格
4. **目标驱动**：定义成功标准，循环迭代直到验证通过；跟随目标而非步骤；清晰的成功标准允许独立循环
5. **仅用 AI 做判断**：分类、草拟、摘要、提取等判断类任务使用 AI；路由、重试、确定性转换等交给代码；代码能回答的问题让代码回答
6. **暴露冲突，不做折中**：两个模式矛盾时选择其一（更新的或经过更多测试的），说明原因并标记另一个待清理；不混合冲突的模式
7. **先读后写**：添加代码前先阅读导出、直接调用方、共享工具
8. **测试验证意图**：测试必须编码"为什么行为重要"，而非仅验证"做了什么"；业务逻辑变更时不会失败的测试是错误的
9. **每步检查点**：每完成重要步骤后总结已完成、已验证和待办事项；不从无法描述的状态继续；失去追踪时停下来重新陈述
10. **遵循项目规范**：项目内一致性优先于个人偏好；认为规范有害时明确提出，不静默分叉
11. **失败要大声**：任何被静默跳过的内容都不算"完成"；任何被跳过的测试都不算"通过"；默认暴露不确定性而非隐藏

### 分叉前先对齐（Discuss Before Diverging）

- **思维链与前置侦察硬熔断**：当需求在产品意图、改动边界或架构方案上存在 ≥ 2 种合理解释时：
  1. **禁止在 `<thought>` 中推演未确认分支**：每个候选方向仅用 1 句话概括分叉点与核心取舍，严禁在思维链里提前设计各分支的实现细节、极端边界或顺手重构方案。
  2. **对齐前只读侦察最多 1 轮**：提问前最多执行 ≤ 3 次直接读文件，或 1 批并发只读子代理（`research` / `Explore`）核对代码现状。（注：需求明确时的并发全量侦察不受此限。）
  3. **零顺手扩写**：严禁脑补未提及的未来扩展需求，严禁捆绑"顺便清理周边代码"的改动。
- **单轮合并确认（优先级高于 `superpowers:brainstorming` 的多轮单问/禁菜单规则）**：除非用户明确要求开放式头脑风暴或交互式设计访谈（如 `/grill-me`），否则先用 2～3 句话同步已知代码事实，并在**同一轮**完成对齐（如需建议模型档位或执行模式，一并合并）：
  - **有限方案选择（架构取舍、范围边界、执行模式）**：主动调用结构化提问工具（`ask_user_question` / `ask_question` / `AskUserQuestion` / `AskQuestion`）提供 2～4 个具体选项，并将推荐项标为 `(Recommended)` 置顶。
  - **开放式目标澄清（尚不清楚用户核心诉求）**：仅用 1 句简明纯文本提问，不预设引导性选项。

### Skill / 子智能体 / MCP / 工具使用规范

**执行任务前先检索可用 Skill**：先检查已配置的 Skill 列表，有匹配的 Skill 时优先使用 Skill 工具调用。

**响应中列举使用项**：执行任务后，在响应中明确说明本次使用的 Skill、子智能体、MCP 和调用的工具。

### 回复规范

- **思考/回复/代码注释使用的语言**：简体中文
- **开场白**：每次回答之前，都说一句“✨ 向着星辰与深渊 ”
- **结束语**：每次完成所有回答后，都要说一句“⌨️ 欢迎来到开发者协会”

## 文档维护原则

完整规则见 [文档维护约定](docs/conventions/doc-maintenance.md)，核心要点：

- **只留核心信息**：可从代码查询且易定位的信息删除并给文件引用；设计说明放 `docs/design/`，约定放 `docs/conventions/`，AGENTS.md 只留一行指针
- **保持 250 行以内**：超过时必须拆分到子文档；行数用 `wc -l AGENTS.md` 查询，不写进文档
- **README 双语同步**：修改 `README.md` 或 `README.zh-CN.md` 任一文件时，**必须**同步翻译另一版本，且章节结构必须一致

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

- **[文档维护约定](docs/conventions/doc-maintenance.md)** - AGENTS.md 与 docs/ 的分工、内容取舍标准和同步规则
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
| 国际化配置       | `src/services/i18n.ts`                 |
| 测试规范         | `src/__test__/README.md`              |

完整文档索引：见 `docs/README.md`

## 文件结构

- `/src/` - React 前端代码
- `/src-tauri/` - Rust 后端代码
- `/public/` - 静态资源
- `/docs/` - 详细文档（design、conventions、reference）
