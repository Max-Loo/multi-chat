## 1. Hook 创建

- [x] 1.1 创建 `src/hooks/useScrollContainer.ts`，封装 `useAdaptiveScrollbar` + `useRef` + scroll 事件监听逻辑
- [x] 1.2 导出 `useScrollContainer` hook，返回 `{ scrollContainerRef, scrollbarClassname }`

## 2. 消费方迁移

- [x] 2.1 在 `KeyManagementSetting/index.tsx` 中用 `useScrollContainer()` 替换手动的滚动容器代码
- [x] 2.2 在 `GeneralSetting/index.tsx` 中用 `useScrollContainer()` 替换手动的滚动容器代码

## 3. 验证

- [x] 3.1 运行 `pnpm tsc` 确认无类型错误
- [x] 3.2 运行 `pnpm lint` 确认无 lint 警告
- [x] 3.3 在开发环境中验证两个设置页面的滚动行为正常
