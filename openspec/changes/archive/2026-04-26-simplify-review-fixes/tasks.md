## 1. 测试去重与冗余清理

- [x] 1.1 删除 NoProvidersAvailable.test.tsx "样式和布局" describe 中重复的 alert 角色测试（第 117-121 行）
- [x] 1.2 删除 ChatButton.test.tsx "组件结构和样式" describe 中重复的 aria-selected 测试（第 186-192 行）
- [x] 1.3 移除 ChatButton.test.tsx 4 个布局模式测试（desktop/compact/compressed/mobile）中冗余的菜单按钮断言

## 2. 骨架屏测试覆盖度修复

- [x] 2.1 修改 SkeletonList.test.tsx 的 count 测试：传入 `count={3}` 后验证实际渲染的子元素数量
- [x] 2.2 修改 SkeletonMessage.test.tsx 的 isSelf 测试：传入 `isSelf` 后验证布局方向或 data-variant 差异

## 3. 测试断言意图补全

- [x] 3.1 在 Layout.test.tsx 桌面端测试中添加 `expect(screen.queryByRole('navigation', { name: '底部导航' })).toBeNull()` 断言
- [x] 3.2 替换 GeneralSetting.test.tsx 中的 `container.firstElementChild`：为源码滚动容器添加 `data-testid="scroll-container"`，测试改用 `screen.getByTestId`

## 4. aria-label 国际化迁移

- [x] 4.1 在 i18n 资源文件中添加翻译 key：`chat.moreActions`、`chat.increaseColumns`、`chat.decreaseColumns`、`common.errorIcon`（zh/en/fr 三语言）
- [x] 4.2 修改 NoProvidersAvailable.tsx：`aria-label="错误"` → `aria-label={t(($) => $.common.errorIcon)}`
- [x] 4.3 修改 Panel/Header.tsx：`aria-label="增加列数"` / `"减少列数"` → `t()` 调用
- [x] 4.4 修改 ChatButton.tsx：`aria-label="更多操作"` → `aria-label={t(($) => $.chat.moreActions)}`
- [x] 4.5 更新受影响测试中的 mock i18n 数据以匹配新 key

## 5. 键盘交互测试补充

- [x] 5.1 在 ChatButton.test.tsx 中添加键盘交互测试：Enter/Space 触发导航 + Space preventDefault 验证
- [x] 5.2 在 ProviderCard.test.tsx（如不存在则创建）中添加键盘交互测试：Enter/Space 触发 onToggle + preventDefault 验证

## 6. 验证

- [x] 6.1 运行 `pnpm test` 确保所有测试通过
- [x] 6.2 运行 `pnpm tsc` 确保类型检查通过
