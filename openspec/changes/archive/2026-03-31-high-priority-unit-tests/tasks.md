## 1. AnimatedLogo 组件测试

- [x] 1.1 为 canvas-logo.ts 纯函数编写测试（createInitialState、updateState、calculateScale）
- [x] 1.2 为 AnimatedLogo 组件编写测试（Canvas 渲染、reduced-motion、卸载清理）

## 2. FilterInput 组件测试

- [x] 2.1 为 FilterInput 组件编写测试（渲染、placeholder、onChange、autoFocus）

## 3. OpenExternalBrowserButton 组件测试

- [x] 3.1 为 OpenExternalBrowserButton 组件编写测试（无 URL 返回空、有 URL 点击导航）

## 4. ProviderLogo 组件测试

- [x] 4.1 为 ProviderLogo 组件编写测试（加载成功 fade-in、加载失败首字母回退、超时回退、providerKey 变化重置）

## 5. Skeleton 系列组件测试

- [x] 5.1 为 SkeletonList 组件编写测试（数量控制、高度、间距）
- [x] 5.2 为 SkeletonMessage 组件编写测试（isSelf 布局方向、行数、首字母对齐）
- [x] 5.3 为 PageSkeleton 组件编写测试（移动端/桌面端布局）

## 6. Panel 未覆盖子组件测试

> 注：Panel 容器、Header、Sender 已有完善测试（ChatPanel.test.tsx、ChatPanelHeader.test.tsx、ChatPanelSender.test.tsx），仅补充空白区域。

- [x] 6.1 为 Grid 组件编写测试（行列渲染、边框样式）
- [x] 6.2 为 Splitter 组件编写测试（面板数量、defaultSize 计算）
- [x] 6.3 为 PanelSkeleton 组件编写测试（Header 骨架、多列渲染、消息气泡交替）

## 7. Detail 子组件测试

> 注：Detail 基础渲染已有 ChatPanelContentDetail.test.tsx 覆盖，仅补充滚动行为和未覆盖子组件。

- [x] 7.1 为 Detail 组件补充滚动行为测试（滚动到底部按钮、按钮隐藏、ResizeObserver 触发）
- [x] 7.2 为 RunningBubble 组件编写测试（非发送返回空、等待首字 spinner、有内容渲染 ChatBubble）
- [x] 7.3 为 Title 组件编写测试（模型查找、昵称显示 nickname (modelName) 格式、不存在/禁用状态 Badge）

## 8. 验证

- [x] 8.1 运行全部测试确认通过
