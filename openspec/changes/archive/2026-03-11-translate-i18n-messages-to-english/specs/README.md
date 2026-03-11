# 规范说明

本变更不涉及新的或修改的功能能力（Capabilities），因此不需要创建规范文件。

## 原因

根据 `proposal.md` 中的 Capabilities 章节：

- **New Capabilities**: 无
- **Modified Capabilities**: 无（此变更仅为实现细节优化，不涉及规范级行为变更）

## 变更性质

此变更属于**内部实现优化**，具体为：
- 将 `src/lib/i18n.ts` 中的硬编码中文字符串翻译成英文
- 不改变外部 API
- 不影响功能行为
- 不改变用户可见的系统行为（除了初始化阶段的提示语言）

## 规范级别

由于此变更不涉及需求级别的变更，因此：
- 无需创建 ADDED Requirements
- 无需创建 MODIFIED Requirements
- 无需创建 REMOVED Requirements

所有变更详情请参见：
- `proposal.md` - 变更动机和影响范围
- `design.md` - 技术实施方案
- `tasks.md` - 具体实施任务
