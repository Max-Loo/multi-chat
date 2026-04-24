## Why

`drawer-state.integration.test.tsx` 产生 React `act()` 警告，根因是 Radix UI 内部组件（FocusScope、DismissableLayer）使用 `setTimeout(fn, 0)` 进行焦点恢复和事件监听注册，而当前测试使用 `store.dispatch()` + `rerender()` 模式导致这些定时器回调在 `act()` 作用域外执行。此外，6 个 skip 用例中有中优先级路径（IndexedDB 降级、密钥读取错误处理）长期未解决。

## What Changes

- 修复 `drawer-state.integration.test.tsx` 中的 `act()` 警告，使用 `vi.useFakeTimers()` 控制 Radix UI 内部 `setTimeout(fn, 0)` 回调
- 推进中优先级 skip 用例：IndexedDB 不可用时静默失败、无 IndexedDB 记录时跳过迁移、密码读取或解密失败错误处理

## Capabilities

### New Capabilities

### Modified Capabilities

- `drawer-state-unit-tests`: 使用 fake timers 控制 Radix UI 异步回调，消除 act() 警告
- `keyring-unit-tests`: 推进 skip 用例覆盖密码读取/解密失败错误处理

## Impact

- 修改 2-3 个现有测试文件，新增 0 个文件
- 需要引入 `vi.useFakeTimers()` 和 `vi.runAllTimers()` 控制定时器
- 目标：消除集成测试中的 act() 警告，推进 3 个中优先级 skip 用例
