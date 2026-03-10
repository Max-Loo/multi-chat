# 实施任务清单

## 1. 创建目录结构

- [x] 1.1 创建 `docs/design/` 目录
- [x] 1.2 创建 `docs/conventions/` 目录
- [x] 1.3 验证目录创建成功（`ls -la docs/`）

## 2. 创建 docs/design/ 文档

- [x] 2.1 创建 `docs/design/initialization.md`（应用启动初始化流程）
- [x] 2.2 创建 `docs/design/model-remote.md`（远程模型数据获取）
- [x] 2.3 创建 `docs/design/chat-service.md`（聊天服务层架构）
- [x] 2.4 创建 `docs/design/lazy-loading.md`（按需加载机制）
- [x] 2.5 创建 `docs/design/i18n-system.md`（国际化系统）
- [x] 2.6 创建 `docs/design/cross-platform.md`（跨平台兼容层）

## 3. 创建 docs/conventions/ 文档

- [x] 3.1 创建 `docs/conventions/timestamps.md`（时间戳工具函数约定）
- [x] 3.2 创建 `docs/conventions/tauri-commands.md`（Tauri 命令添加指南）

## 4. 创建 docs/README.md 索引

- [x] 4.1 创建 `docs/README.md` 文件
- [x] 4.2 添加 docs/ 目录结构说明
- [x] 4.3 添加 docs/design/ 文档索引
- [x] 4.4 添加 docs/conventions/ 文档索引
- [x] 4.5 添加 docs/reference/ 文档索引（如有）
- [x] 4.6 添加与 AGENTS.md 的关系说明

## 5. 迁移内容到 docs/design/ 文档

- [x] 5.1 迁移"应用启动初始化流程"到 `initialization.md`
- [x] 5.2 迁移"远程模型数据获取"到 `model-remote.md`
- [x] 5.3 迁移"聊天服务层"到 `chat-service.md`
- [x] 5.4 迁移"按需加载机制"到 `lazy-loading.md`
- [x] 5.5 合并 5 个国际化相关小节到 `i18n-system.md`
- [x] 5.6 迁移"跨平台兼容性"到 `cross-platform.md`
- [x] 6.1 迁移"时间戳工具函数"到 `timestamps.md`
- [x] 6.2 迁移"添加新的 Tauri 命令"到 `tauri-commands.md`

## 7. 精简 AGENTS.md

- [x] 7.1 删除"关键设计说明"章节（已迁移到 docs/design/）
- [x] 7.2 删除"项目约定"章节的详细内容（已迁移到 docs/conventions/）
- [x] 7.3 简化"开发命令"章节（保留核心命令，移除详细说明）
- [x] 7.4 简化"文档参考"章节（只保留核心文件路径）
- [x] 7.5 简化"文件结构"章节（只保留顶层目录）
- [x] 8.1 更新"内容分类规则"表格（新增"详细设计说明"和"项目约定"类别）
- [x] 8.2 添加"文档拆分决策树"（可视化决策流程）
- [x] 8.3 添加"docs/ 目录结构规范"（明确各子目录用途）
- [x] 8.4 更新"维护规范"（目标行数从 350 调整到 150）
- [x] 8.5 细化"文档同步要求"（代码和文档的同步规则）
- [x] 9.1 添加"设计文档索引"章节（一句话概述 + 文档链接）
- [x] 9.2 添加"项目约定索引"章节（一句话概述 + 文档链接）
- [x] 9.3 更新"当前文档状态"（记录精简后的行数）

## 10. 验证文档质量

- [x] 10.1 检查 AGENTS.md 行数是否在 150 行以内（`wc -l AGENTS.md`）
- [x] 10.2 检查所有文档链接是否有效（手动验证或使用 `markdown-link-check`）
- [x] 10.3 确认所有信息都已迁移（对比重构前后的内容）
- [x] 10.4 测试文档导航（从 AGENTS.md 跳转到各个子文档）
- [x] 10.5 验证所有子文档的内容完整性（按 specs 检查）

## 11. 代码审查

- [x] 11.1 运行 `pnpm lint` 检查代码风格（如有相关检查）
- [x] 11.2 运行 `pnpm tsc` 检查类型（如有相关检查）
- [x] 11.5 请求团队审查
