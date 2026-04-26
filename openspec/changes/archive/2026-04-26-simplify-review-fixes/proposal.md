## Why

Simplify 审查发现 9 个低优先级问题，涵盖测试质量退化（重复测试、冗余断言、覆盖度退化）和可访问性半成品（硬编码 aria-label、缺少键盘交互测试）。这些问题不影响运行时功能，但会降低测试可维护性和可访问性完整性，应在后续迭代中清理。

## What Changes

### 测试质量修复
- 删除 NoProvidersAvailable.test.tsx 中重复的 alert 角色测试（第 87-91 行与第 117-121 行）
- 删除 ChatButton.test.tsx 中重复的 aria-selected 测试（第 96-102 行与第 186-192 行）
- 移除 ChatButton.test.tsx 4 个布局模式测试中冗余的菜单按钮断言（已有独立测试覆盖）
- 恢复 SkeletonList.test.tsx 对 `count` 的验证（当前传入 `count={3}` 但未验证渲染数量）
- 恢复 SkeletonMessage.test.tsx 对 `isSelf` 变体的验证（当前传入 `isSelf` 但未验证差异）
- 修复 Layout.test.tsx 桌面端测试缺失的"无底部导航"断言
- 替换 GeneralSetting.test.tsx 中的 `container.firstElementChild` 为语义化查询

### 可访问性修复
- 将 3 处硬编码中文 `aria-label` 迁移为 i18n 调用：
  - NoProvidersAvailable.tsx：`aria-label="错误"`
  - Panel/Header.tsx：`aria-label="增加列数"` / `"减少列数"`
  - ChatButton.tsx：`aria-label="更多操作"`
- 为 ChatButton 和 ProviderCard 的 `onKeyDown` 键盘交互添加测试覆盖

### 不在范围内
- `onKeyDown` 模式重复（ChatButton.tsx + ProviderCard.tsx）：仅 2 处，提取为时过早（YAGNI）

## Capabilities

### New Capabilities
- `test-quality-review-fixes`: 修复审查中发现的测试重复、冗余断言、覆盖度退化和非语义化查询问题
- `keyboard-test-coverage`: 为已有 onKeyDown 处理器的组件补充键盘交互测试

### Modified Capabilities
- `component-accessibility`: 补充 aria-label 须使用 i18n 的要求（当前仅要求"须有 aria-label"，未指定国际化）

## Impact

- **测试文件**（6 个）：NoProvidersAvailable.test.tsx、ChatButton.test.tsx、SkeletonList.test.tsx、SkeletonMessage.test.tsx、Layout.test.tsx、GeneralSetting.test.tsx
- **源码文件**（3 个）：NoProvidersAvailable.tsx、Panel/Header.tsx、ChatButton.tsx
- **i18n 资源文件**：需为硬编码的 aria-label 添加翻译 key（zh-CN、en 等）
- **无 API/依赖变更**，无破坏性改动
