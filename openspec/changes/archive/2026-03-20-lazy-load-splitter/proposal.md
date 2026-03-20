## Why

Splitter 组件（可拖拽布局）默认不会开启，仅被极少数用户偶尔使用。但目前 Splitter 及其依赖 `react-resizable-panels` 被同步打包进主 bundle，导致所有用户都加载了这段用不到的代码。

## What Changes

- 将 Splitter 组件改为 React.lazy 异步导入
- 添加 Suspense 包裹，切换时显示 Skeleton 加载状态
- `react-resizable-panels` 和 `lucide-react/GripVertical` 将被分离到独立 chunk

## Capabilities

### New Capabilities

无。这是纯实现层面的性能优化。

### Modified Capabilities

无。Splitter 功能行为不变，只是加载方式改变。

## Impact

**受影响文件**:
- `src/pages/Chat/components/Panel/index.tsx` - 添加 lazy 导入和 Suspense

**依赖变化**:
- `react-resizable-panels` 将从主 bundle 中移除，仅在使用 Splitter 时加载

**预期收益**:
- 主 bundle 减少约 10-15KB (gzipped)
- 不使用 Splitter 的用户不会加载额外代码
