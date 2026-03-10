# 提案：重构 AGENTS.md 文档结构

## Why

AGENTS.md 当前包含 447 行内容，混合了核心指导信息、详细设计说明和项目约定，导致：
- **AI 读取效率低**：大量详细信息干扰核心概念的快速定位
- **可维护性差**：设计说明和开发规范混在一起，难以独立更新
- **信息层级混乱**：从快速查找到深度探索的内容都挤在一个文件中

通过拆分文档，可以将 AGENTS.md 精简到约 150 行（减少 66%），同时建立清晰的文档层次结构。

## What Changes

- **精简 AGENTS.md**：从 447 行减少到 ~150 行，仅保留核心指导信息
- **新增 docs/design/ 目录**：迁移 6 个设计文档
  - `initialization.md` - 应用启动初始化流程
  - `model-remote.md` - 远程模型数据获取
  - `chat-service.md` - 聊天服务层架构
  - `lazy-loading.md` - 按需加载机制
  - `i18n-system.md` - 国际化系统
  - `cross-platform.md` - 跨平台兼容层
- **新增 docs/conventions/ 目录**：迁移 2 个项目约定文档
  - `timestamps.md` - 时间戳工具函数约定
  - `tauri-commands.md` - Tauri 命令添加指南
- **更新 AGENTS.md"文档维护原则"章节**：嵌入文档拆分决策树和长期维护规范
- **新增 docs/README.md**：提供完整的子文档索引

## Capabilities

### New Capabilities
- **docs-structure**: 建立模块化的文档结构规范，明确 AGENTS.md、docs/design/、docs/conventions/ 的职责边界和内容分类规则

### Modified Capabilities
无（现有能力的需求无变化，仅文档结构重组）

## Impact

- **受影响文件**：
  - AGENTS.md（大幅精简和重组）
  - 新增 8 个文档文件（docs/design/ 下 6 个，docs/conventions/ 下 2 个）
  - 新增 docs/README.md
- **不受影响**：
  - 代码实现（零代码变更）
  - 构建和运行时行为
  - 现有功能
- **收益**：
  - AI 读取 AGENTS.md 时只获取核心信息，需要时再按需读取详细文档
  - 设计文档可以独立演进，不污染核心指导文档
  - 长期维护有清晰的规范指导，防止文档再次膨胀
