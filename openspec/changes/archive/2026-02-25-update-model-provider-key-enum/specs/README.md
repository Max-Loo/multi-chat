# Specs Directory

本 change 不需要创建规格文档。

## 原因

根据 proposal.md 的 Capabilities 部分：
- **New Capabilities**: 无（这是类型定义的修正，不引入新功能）
- **Modified Capabilities**: 无（`remote-model-fetch` spec 没有规定 `ModelProviderKeyEnum` 的具体值，这只是实现细节的修正）

这个 change 是一个纯类型层面的重构，修正类型定义以与实际数据源（models.dev API）保持一致。它不改变任何运行时行为或用户可见的功能，因此不需要创建新的规格文档或修改现有规格。

## 变更范围

- 修改 `ModelProviderKeyEnum` 的枚举值
- 更新所有使用该枚举的代码引用
- 通过类型检查验证修改的正确性

这些实现细节将在 `design.md` 中详细说明。
