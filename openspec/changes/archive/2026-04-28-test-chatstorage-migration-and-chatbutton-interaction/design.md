## Context

本次变更补充两个独立模块的测试覆盖，不涉及生产代码修改。

**chatStorage.ts（74% 行 / 58% 分支）**：迁移函数 `migrateOldChatStorage` 有 3 条未测路径——完整迁移三步流程（lines 131-150）、索引已存在时的跳过（line 119-120）、旧聊天缺少 `updatedAt` 的补充（line 136-138）。`deleteChatFromStorage` 缺少聊天不存在时的边界测试（lines 93-94）。现有测试使用 `Map` 模拟 store，所有依赖已 mock，可直接在此基础上扩展。

**ChatButton.tsx（52% 行 / 50% 分支）**：组件有重命名、删除确认、Shift 快捷删除三大交互，但测试只验证了渲染和导航。现有测试 mock 了 `useConfirm`、`toastQueue`、`useNavigateToChat`，可直接触发交互并验证 dispatch 和 toast 调用。组件使用 shadcn/ui 的 `DropdownMenu`，需要通过 `userEvent` 或 `fireEvent` 触发菜单打开后再点击菜单项。

## Goals / Non-Goals

**Goals:**
- chatStorage `migrateOldChatStorage` 行覆盖率达到 95%+，覆盖完整迁移流程和所有边界条件
- chatStorage `deleteChatFromStorage` 覆盖聊天不存在的边界路径
- ChatButton 重命名完整流程测试：打开菜单→点击重命名→输入→确认/取消
- ChatButton 删除确认测试：打开菜单→点击删除→验证 modal.warning 调用和 onOk 回调
- ChatButton 快捷删除测试：Shift+Hover 条件渲染和 directDelete 执行
- ChatButton 发送中状态禁用删除按钮测试

**Non-Goals:**
- 不修改生产代码
- 不修改测试基础设施或 mock 策略
- 不调整覆盖率门限
- 不处理其他模块的测试缺口（如 chatSlices 分支覆盖、skipped tests）

## Decisions

### 1. chatStorage 测试沿用 Map mock 模式

现有测试使用 `Map<key, value>` 模拟 `createLazyStore` 返回的 store 实例，避免了 IndexedDB 初始化时序问题。新增测试沿用同一模式，在 `storeMap` 中预置旧格式数据来触发迁移路径。

**替代方案**：使用真实 IndexedDB（`fake-indexeddb`）→ 拒绝，因为现有 mock 模式已被团队验证，且迁移测试关注的是逻辑正确性而非存储引擎。

### 2. ChatButton 交互测试使用 fireEvent 而非 userEvent

`DropdownMenu` 是 Radix UI 组件，其内部依赖 Pointer Events 和复杂的焦点管理。`userEvent.click` 在 happy-dom 环境中可能无法正确触发 Radix 的 Popover 打开逻辑。使用 `fireEvent.click` 更可控。

**替代方案**：使用 `@testing-library/user-event` 的 `setup()` → 如果能稳定触发 Radix 菜单则优先使用，否则回退到 fireEvent。

### 3. ChatButton 删除测试验证 mock 调用而非 Redux 状态

由于 `useConfirm` 已被 mock（`mockModalWarning` 捕获 `onOk` 回调），测试策略是：触发删除菜单项→验证 `mockModalWarning` 被调用→手动调用捕获的 `onOk`→验证 `dispatch` 和 `toastQueue` 调用。

### 4. 快捷删除测试通过模拟 Shift 键状态实现

ChatButton 内部通过 `document.addEventListener('keydown/keyup')` 追踪 Shift 状态。测试中需要 `fireEvent.keyDown(document, { key: 'Shift' })` 触发全局键盘事件，再通过 `fireEvent.mouseEnter` 触发悬停，使 `isQuickDelete` 为 true。

## Risks / Trade-offs

- **Radix DropdownMenu 在测试环境中的行为不稳定** → 如果 fireEvent 无法打开菜单，改用直接调用 `handleRename()` / `handleDelete()` 的方式（通过 ref 或提取为独立函数）来测试逻辑。但这是最后手段。
- **全局 keyboard event 监听器的副作用** → ChatButton 在 `useEffect` 中注册 document 级别的 keydown/keyup 监听器，多个 ChatButton 实例会注册多个监听器。测试需要在 `beforeEach` 中确保 cleanup，避免跨测试影响。
- **迁移测试的 storeMap 状态隔离** → 现有 `beforeEach` 已有 `storeMap.clear()`，新增测试无需额外处理。
