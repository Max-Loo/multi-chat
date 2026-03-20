## 1. 异步加载实现

- [x] 1.1 修改 Panel/index.tsx，将 Splitter 改为 React.lazy 异步导入
- [x] 1.2 添加 Suspense 包裹 Splitter，使用 Skeleton 作为 fallback

## 2. 验证

- [x] 2.1 验证默认 Grid 模式正常工作
- [x] 2.2 验证切换到 Splitter 模式时正常加载
- [x] 2.3 使用构建工具确认 react-resizable-panels 被分离到独立 chunk
