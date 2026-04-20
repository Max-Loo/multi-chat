## 能力：virtual-scroll（修改）

虚拟滚动核心能力的增量修改。

### REQUIREMENTS

- **REQ-1**：ResizeObserver effect 必须与内容变化 effect 拆分为两个独立 effect，ResizeObserver 的依赖为 `[]`
- **REQ-2**：流式自动跟随 effect 读取 `isAtBottom` 状态时通过 ref 镜像，避免 effect 依赖中包含 state
- **REQ-3**：`handleVirtualizerScroll` 中更新 `isAtBottom` state 和 `isAtBottomRef` 同步写入
- **REQ-4**：Sidebar 的 `useDebouncedFilter` predicate 必须用 `useCallback` 包裹，依赖 `filterText`
