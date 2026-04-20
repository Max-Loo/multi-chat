## 能力：scroll-status-manager

统一的滚动状态管理，负责底部检测和滚动条状态。

### REQUIREMENTS

- **REQ-1**：底部检测必须使用单一数据源（`isAtBottom` state + `isAtBottomRef` 镜像），禁止存在语义重复的独立 ref
- **REQ-2**：所有 state setter 必须通过 functional updater 比较新旧值，值不变时不得触发渲染
- **REQ-3**：ResizeObserver 必须在组件挂载时创建一次（空依赖），不得随内容数据变化而重建
- **REQ-4**：`checkScrollStatus` 禁止使用 `requestAnimationFrame` 嵌套和防递归标志，改用 functional updater 天然防重
- **REQ-5**：`scrollToBottom` 的 `useCallback` 依赖必须为空数组，通过 ref 读取当前消息长度
