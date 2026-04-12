# 文档索引

本目录包含项目的详细文档，按主题分类组织。

## 目录结构

```
docs/
├── design/                    # 设计文档（架构和系统设计）
│   ├── initialization.md      # 应用启动初始化流程
│   ├── model-remote.md        # 远程模型数据获取
│   ├── chat-service.md        # 聊天服务层架构
│   ├── lazy-loading.md        # 按需加载机制
│   ├── i18n-system.md         # 国际化系统
│   └── cross-platform.md      # 跨平台兼容层
│
├── conventions/               # 项目约定（最佳实践和使用规范）
│   ├── timestamps.md          # 时间戳工具函数约定
│   └── tauri-commands.md      # Tauri 命令添加指南
│
├── reference/                 # 参考文档（外部教程和指南）
│   └── (外部参考文档)
│
└── README.md                  # 本文件
```

## 设计文档 (docs/design/)

设计文档包含架构和系统设计的详细说明，每个文档专注于一个设计主题。

### [initialization.md](design/initialization.md)
应用启动初始化流程，包括 InitializationManager 工作原理、依赖关系和三级错误处理机制。

**关键内容**：
- 初始化步骤配置
- 拓扑排序和并行执行
- 错误处理策略（致命/警告/可忽略）
- Context 对象和依赖注入

### [model-remote.md](design/model-remote.md)
从 models.dev API 动态获取模型供应商数据的架构，包括缓存策略和重试机制。

**关键内容**：
- 数据流：API → 过滤层 → Redux store
- 三层缓存策略（远程/本地/错误）
- 指数退避重试算法
- 错误处理和降级

### [chat-service.md](design/chat-service.md)
聊天服务层的模块化架构，统一处理不同 AI 供应商的请求。

**关键内容**：
- 8 个核心模块的职责
- 流式响应处理
- 元数据收集和降级
- 供应商 SDK 按需加载

### [lazy-loading.md](design/lazy-loading.md)
按需加载机制，使用 ResourceLoader<T> 类减少初始 bundle 大小。

**关键内容**：
- ResourceLoader 类设计
- 缓存策略和 LRU 淘汰
- 性能优化成果（减少 125KB）
- 供应商 SDK 按需加载

### [i18n-system.md](design/i18n-system.md)
国际化系统，包括按需加载、缓存验证、Toast 队列、自动持久化和翻译完整性检查。

**关键内容**：
- 按需加载策略（英文静态，其他异步）
- 四级语言降级策略
- Toast 队列管理
- Redux 自动持久化
- 翻译完整性检查工具

### [cross-platform.md](design/cross-platform.md)
跨平台兼容层，支持 Tauri 桌面环境和 Web 浏览器环境。

**关键内容**：
- Null Object 模式应用
- 5 个兼容模块（Shell/OS/HTTP/Store/Keyring）
- 环境检测和统一 API
- Web 环境降级策略

## 项目约定 (docs/conventions/)

项目约定包含开发规范和最佳实践，指导开发者如何正确使用特定工具或模式。

### [timestamps.md](conventions/timestamps.md)
时间戳工具函数的使用约定，区分秒级和毫秒级时间戳的使用场景。

**关键内容**：
- 秒级时间戳：聊天消息、数据库记录
- 毫秒级时间戳：性能测试、调试日志
- 工具函数使用规范
- 常见错误和注意事项

### [tauri-commands.md](conventions/tauri-commands.md)
Tauri 命令添加指南，说明如何在 Rust 后端定义命令并在前端调用。

**关键内容**：
- 3 步添加流程
- 参数传递和错误处理
- 异步命令和状态管理
- 类型映射和测试建议

## 参考文档 (docs/reference/)

参考文档包含外部教程和指南，帮助理解 AI Agent 设计概念和架构思路。

详见：[docs/reference/README.md](reference/README.md)

## 与 AGENTS.md 的关系

- **AGENTS.md**：核心指导文档，面向 AI coding agent
  - 项目概述、架构、开发命令
  - 开发规范、文档维护原则
  - 快速查找表（核心文件路径）
  
- **docs/**：详细文档目录，面向深度探索
  - **design/**：架构设计和系统流程
  - **conventions/**：项目约定和最佳实践
  - **reference/**：外部参考和教程

**使用建议**：
1. 先阅读 AGENTS.md 了解项目概览
2. 需要深入某个设计主题时，查看 docs/design/ 对应文档
3. 需要了解特定工具使用规范时，查看 docs/conventions/ 对应文档
4. docs/README.md 提供完整的文档导航

## 文档维护

### 添加新的设计文档

当需要记录新的架构设计或系统流程时：
1. 在 `docs/design/` 创建新文档，使用 kebab-case 命名
2. 包含：一句话概述、动机、架构说明、关键模块、实现位置
3. 在 AGENTS.md 中添加一句话概述和文档链接

### 添加新的约定文档

当需要记录新的项目约定或使用规范时：
1. 在 `docs/conventions/` 创建新文档，使用 kebab-case 命名
2. 包含：一句话概述、使用场景、工具函数、代码示例
3. 在 AGENTS.md 中添加一句话概述和文档链接

### 更新索引

每次添加新文档时，必须更新本文件（docs/README.md）：
1. 在对应的目录索引中添加文档条目
2. 包含：文档名称、一句话概述、关键内容

## 文档规范

### 命名规范

- 使用小写字母 + 连字符（kebab-case）
- 文件名应清晰表达主题
- 示例：`initialization.md`, `lazy-loading.md`

### 内容要求

- **一句话概述**：在文档开头提供简短描述
- **动机或背景**：说明为什么需要这个设计/约定
- **详细说明**：提供足够的信息让读者理解
- **代码示例**：包含实际的代码示例
- **实现位置**：指明相关代码的文件路径

### 格式规范

- 使用 Markdown 格式
- 使用中文撰写
- 代码块指定语言类型
- 使用表格组织对比信息

## 快速查找

### 按主题查找

| 主题 | 文档 |
|-----|------|
| 应用启动 | [initialization.md](design/initialization.md) |
| 远程数据获取 | [model-remote.md](design/model-remote.md) |
| 聊天服务 | [chat-service.md](design/chat-service.md) |
| 按需加载 | [lazy-loading.md](design/lazy-loading.md) |
| 国际化 | [i18n-system.md](design/i18n-system.md) |
| 跨平台兼容 | [cross-platform.md](design/cross-platform.md) |
| 时间戳约定 | [timestamps.md](conventions/timestamps.md) |
| Tauri 命令 | [tauri-commands.md](conventions/tauri-commands.md) |

### 按模块查找

| 模块 | 相关文档 |
|-----|---------|
| `src/config/initSteps.ts` | [initialization.md](design/initialization.md) |
| `src/services/modelRemote/` | [model-remote.md](design/model-remote.md) |
| `src/services/chat/` | [chat-service.md](design/chat-service.md), [lazy-loading.md](design/lazy-loading.md) |
| `src/services/i18n.ts` | [i18n-system.md](design/i18n-system.md) |
| `src/utils/tauriCompat/` | [cross-platform.md](design/cross-platform.md) |
| `src/utils/utils.ts` | [timestamps.md](conventions/timestamps.md) |
| `src-tauri/src/lib.rs` | [tauri-commands.md](conventions/tauri-commands.md) |

## 相关资源

- **AGENTS.md**：项目开发指南（../AGENTS.md）
- **README.md**：项目说明（../README.md）
- **OpenSpec 变更**：架构设计和决策记录（../openspec/changes/）
