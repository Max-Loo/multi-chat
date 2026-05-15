## 1. 删除零行为价值的重复测试

- [x] 1.1 删除 `useDebounce.test.ts` 的"泛型类型测试" describe 块（string/number/object/array 四个测试，89-155 行）
- [x] 1.2 删除 `Layout.test.tsx` 的"子组件位置测试" describe 块（91-109 行，2 个与已有测试重复的用例）
- [x] 1.3 删除 `Layout.test.tsx` 的"应该应用正确的布局结构"测试（55-59 行，仅验证 children.length > 0）
- [x] 1.4 删除 `ChatPanel.test.tsx` 的"组件结构和布局" describe 块（263-281 行，3 个重复测试）
- [x] 1.5 删除 `useBasicModelTable.test.tsx` 的"使用 createMockModel 创建测试模型数据" describe 块（121-138 行）

## 2. 重写 Layout 测试

- [x] 2.1 合并"渲染测试" describe 中的"正确渲染组件"和"渲染主内容区域"为一个测试，断言 layout-root 存在且包含 role="main" 的子元素
- [x] 2.2 重写"应该处理空 className"测试（142-146 行），断言空 className 不添加额外 class
- [x] 2.3 验证桌面端/移动端布局测试已覆盖 Sidebar/BottomNav 的条件渲染（现有 112-130 行测试）

## 3. 重写 Splitter 测试

- [x] 3.1 重写"应该应用正确的容器样式"测试（56-59 行），验证 splitter-container 的实际行为属性（方向、子面板数量）而非仅检查存在性

## 4. 修复 ChatPanel 守卫空转和边界测试

- [x] 4.1 重写"应该能够增加列数"测试（151-162 行），去掉 `if (initialValue < 3)` 守卫，构造必定触发断言的场景（如先减到 2 再增回 3）
- [x] 4.2 重写"应该能够减少列数"测试（163-175 行），去掉 `if (initialValue > 1)` 守卫，用 `renderChatPanel(3)` 直接减少
- [x] 4.3 重写"应该处理空的 chatModelList"测试（284-288 行），验证面板在无模型时的具体渲染状态
- [x] 4.4 重写"应该处理未命名的聊天"测试（290-294 行），验证空名称在标题区域的具体显示行为

## 5. 加强 useBasicModelTable 弱断言

- [x] 5.1 重写筛选测试（80-102 行），将 `toBeLessThanOrEqual` 替换为精确断言（验证筛选后只剩 1 个模型且 nickname 匹配 'GPT-4'）

## 6. 验证

- [x] 6.1 运行 `pnpm test:run` 确认所有修改后的测试通过
- [x] 6.2 运行 `pnpm test:coverage` 确认覆盖率下降在预期范围内（≤ 2%）
