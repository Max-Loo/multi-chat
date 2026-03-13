## 1. 新增 useOrientation Hook

- [ ] 1.1 创建 `src/hooks/useOrientation.ts` 文件
- [ ] 1.2 实现 `useOrientation` hook，基于 `useMediaQuery` 检测屏幕方向
- [ ] 1.3 导出 `Orientation` 类型和 `useOrientation` 函数
- [ ] 1.4 添加单元测试验证 hook 功能

## 2. 修改 ChatPanelContent 组件
- [ ] 2.1 在组件中引入 `useResponsive` 和 `useOrientation` hooks
- [ ] 2.2 添加 `primaryModelId` 状态管理（默认为第一个聊天）
- [ ] 2.3 实现移动端判断逻辑（`isMobile && chatModelList.length > 1`）
- [ ] 2.4 实现移动端主副分屏布局 JSX 结构（在 ChatPanelContent 内部，不创建新组件）
- [ ] 2.5 实现竖屏布局（副聊天在上方，水平排列）
- [ ] 2.6 实现横屏布局（副聊天在左侧，垂直排列）
- [ ] 2.7 实现点击副聊天切换主聊天功能
- [ ] 2.8 复用 `ChatPanelContentDetail` 组件渲染副聊天内容
- [ ] 2.9 处理单聊天场景（正常全屏显示）
- [ ] 2.10 处理 `chatModelList` 变化时重置 `primaryModelId`
- [ ] 2.11 移动端模式下忽略 `columnCount` 和 `isSplitter` props（由本组件内部处理，不影响父组件）
- [ ] 2.12 实现副聊天滚动位置临时保存（使用 useRef<Map<string, number>>）

## 3. 测试与验证
- [ ] 3.1 添加组件单元测试
- [ ] 3.2 验证竖屏布局显示正确
- [ ] 3.3 验证横屏布局显示正确
- [ ] 3.4 验证点击切换功能
- [ ] 3.5 验证单聊天正常显示
