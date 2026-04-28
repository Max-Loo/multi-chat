## 1. useScrollContainer hook 测试

- [x] 1.1 创建 `src/__test__/hooks/useScrollContainer.test.ts`，编写 hook 返回值测试（scrollContainerRef 类型、scrollbarClassname 初始值）
- [x] 1.2 编写 scroll 事件自动绑定测试（挂载后 addEventListener 被调用，passive: true）
- [x] 1.3 编写 scroll 事件自动解绑测试（卸载后 removeEventListener 被调用，同一引用）
- [x] 1.4 编写滚动触发样式切换测试（scrollbarClassname 从 `scrollbar-none` 变为 `scrollbar-thin`）

## 2. ProviderCardHeader 组件测试

- [x] 2.1 创建 `src/__test__/pages/Setting/components/GeneralSetting/components/ModelProviderSetting/components/ProviderCardHeader.test.tsx`
- [x] 2.2 编写供应商名称和 Logo 渲染测试
- [x] 2.3 编写 available 状态徽章测试（CheckCircle 图标 + 翻译文本）
- [x] 2.4 编写 unavailable 状态徽章测试（XCircle 图标 + 翻译文本）
- [x] 2.5 编写展开/折叠图标方向测试（isExpanded: false → ChevronDown，isExpanded: true → ChevronUp）

## 3. ProviderCardSummary 组件测试

- [x] 3.1 创建 `src/__test__/pages/Setting/components/GeneralSetting/components/ModelProviderSetting/components/ProviderCardSummary.test.tsx`
- [x] 3.2 编写模型数量文本渲染测试（正常数量 + 零数量）
- [x] 3.3 编写收起时提示信息显示测试（isExpanded: false → 显示"点击查看详情"）
- [x] 3.4 编写展开时提示信息隐藏测试（isExpanded: true → 不渲染"点击查看详情"）

## 4. 验证

- [x] 4.1 运行 `pnpm test:run` 确认所有新测试通过
- [x] 4.2 运行 `pnpm test:coverage` 确认覆盖率未下降
