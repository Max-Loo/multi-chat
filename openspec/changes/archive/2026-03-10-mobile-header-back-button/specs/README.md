# 规范说明

## 为什么没有 Spec 文件？

根据 `proposal.md` 中的 **Capabilities** 部分：

- **New Capabilities（新能力）:** 无 - 这是特定页面的 UI 优化，不涉及新的系统级能力
- **Modified Capabilities（修改的能力）:** 无 - 不修改现有规范的需求，仅调整实现细节

## 变更性质

此变更是一个**实现细节优化**，而非需求变更：

- 不改变系统的功能需求
- 不引入新的行为或能力
- 仅调整 UI 布局以改善移动端用户体验
- 实现方式：在现有组件内添加条件渲染

## 相关规范

虽然没有为此变更创建新的 spec，但实现时会遵循以下现有规范：

1. **top-bar spec** (`openspec/specs/top-bar/spec.md`)
   - 定义了顶部栏在移动端的显示规则
   - 本变更遵循相同的响应式模式

2. **responsive-layout spec** (`openspec/specs/responsive-layout/spec.md`)
   - 定义了项目的响应式断点（mobile, compact, compressed, desktop）
   - 本变更使用 `isMobile` 状态控制显示逻辑

## 实现验证

虽然没有正式的 spec 文件，但实现时可以通过以下方式验证正确性：

- **视觉测试：** 在各个断点下验证返回按钮的显示/隐藏
- **功能测试：** 验证返回按钮的导航功能
- **无障碍测试：** 验证 ARIA 标签和键盘导航
- **回归测试：** 确保桌面端体验不受影响
