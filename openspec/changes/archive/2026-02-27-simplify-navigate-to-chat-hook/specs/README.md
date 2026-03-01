# 规范文档说明

本次变更 `simplify-navigate-to-chat-hook` 是一个**内部代码重构**，不涉及业务功能需求变更。

## 为什么不需要规范文件？

根据 proposal.md 的 Capabilities 部分：

- **New Capabilities**: 无新业务功能引入
- **Modified Capabilities**: 无业务需求变更，仅优化实现方式

OpenSpec 的规范文档（specs）用于定义**系统应该做什么**（WHAT），即业务功能需求。而本次变更：

- 不引入新的用户功能
- 不修改现有功能的行为
- 仅优化代码实现方式（合并两个方法为一个）
- 保持 API 功能不变

因此，本次变更不需要创建规范文档。设计文档（design.md）已充分说明技术实现方案。
