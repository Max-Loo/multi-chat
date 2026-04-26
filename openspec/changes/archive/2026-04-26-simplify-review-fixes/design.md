## Context

Simplify 审查报告发现 9 个低优先级问题，分为三类：
1. **测试质量**：重复测试、冗余断言、覆盖度退化、非语义化查询（6 个文件）
2. **可访问性 i18n**：3 处 aria-label 硬编码中文（3 个源文件 + i18n 资源）
3. **键盘测试缺失**：2 个组件有 onKeyDown 处理器但无对应测试

当前状态：
- 测试已从 `querySelector` 迁移到语义化查询（已完成），但迁移过程中引入了上述质量退化
- 组件已添加 `tabIndex={0}` + `onKeyDown`，但缺少键盘交互测试
- `aria-label` 已添加但部分硬编码，与同文件中其他使用 i18n 的 `aria-label` 不一致

## Goals / Non-Goals

**Goals:**
- 消除测试文件中的重复和冗余断言，提高可维护性
- 恢复骨架屏测试的覆盖度
- 补全缺失的断言意图
- 将硬编码 aria-label 迁移为 i18n
- 为已有 onKeyDown 的组件补充键盘交互测试

**Non-Goals:**
- 提取 onKeyDown 重复模式（仅 2 处，YAGNI）
- 重构测试目录结构
- 新增组件功能或修改组件行为

## Decisions

### D1: 骨架屏 count 验证方式

**决策**: 使用子元素数量验证，不引入新 data-testid

**替代方案**: 为每个骨架项添加 `role="listitem"` → 需修改组件且与 `aria-hidden` 设计冲突

**理由**: 骨架屏容器已有 `aria-hidden="true"`，子元素数量查询是低风险且无需修改源码的方式。使用 `container.children.length` 或 `getAllByTestId` 结合子项 testId。

### D2: GeneralSetting 滚动容器查询替换

**决策**: 为滚动容器添加 `data-testid="scroll-container"`

**替代方案**: 使用 `container.querySelector('[class*="overflow"]')` → 仍依赖实现细节

**理由**: 滚动容器是纯布局元素，无语义化角色。`data-testid` 是 Testing Library 推荐的无语义元素查询方式。

### D3: aria-label i18n key 放置位置

**决策**:
- "更多操作" → `chat.moreActions`（与 ChatButton 相关）
- "增加列数" / "减少列数" → `chat.increaseColumns` / `chat.decreaseColumns`
- "错误" → `common.errorIcon`（通用错误图标）

**替代方案**: 统一放在 `common.accessibility.*` 命名空间 → 过度设计，增加 key 查找复杂度

**理由**: 遵循现有 i18n 文件的命名空间划分（chat、common），保持一致性。

### D4: 键盘测试实现方式

**决策**: 使用 `fireEvent.keyDown` 而非 `userEvent.keyboard`

**替代方案**: `userEvent.keyboard('{Enter}')` → 更贴近用户行为但需要额外 setup

**理由**: 现有测试文件已使用 `fireEvent.click` 和 `fireEvent.keyDown`，保持一致性。且 `fireEvent.keyDown` 可直接验证 `preventDefault` 调用。

## Risks / Trade-offs

- **[i18n key 添加]** → 需同步更新 zh、en、fr 三种语言的 JSON 文件，遗漏任一语言会导致 fallback 到英文
- **[测试修改]** → 修改现有测试可能引入新断言失败，需本地运行 `pnpm test` 验证
- **[低优先级]** → 这些修复不影响运行时功能，可分批完成
