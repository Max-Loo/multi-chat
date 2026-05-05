## 1. 操作栏组件改造（ActionToolbar）

- [x] 1.1 ActionToolbar 中所有 `<button>` 替换为 UI Button 组件（`variant="ghost" size="icon" className="size-7"`）
- [x] 1.2 确认操作栏按钮 hover 时正确显示 pointer 光标

## 2. 翻页控件改造（HistoryPager）

- [x] 2.1 HistoryPager 中所有 `<button>` 替换为 UI Button 组件（`variant="ghost" size="icon" className="size-7"`）
- [x] 2.2 HistoryPager 增加 `disabled?: boolean` prop，禁用时按钮半透明且不可点击
- [x] 2.3 用户消息渲染处传入 `disabled={isChatSending}` 到 HistoryPager

## 3. 编辑态布局改造

- [x] 3.1 编辑态去掉 Card 组件包裹，直接渲染 Textarea（带边框，无背景色块）
- [x] 3.2 原生 `<textarea>` 替换为 UI Textarea 组件
- [x] 3.3 引入 `useAutoResizeTextarea` hook（minHeight: 60, maxHeight: 240），替代固定 `min-h-15`
- [x] 3.4 编辑态确认/取消按钮改用 UI Button 组件，移到 Textarea 外部下方，右对齐
- [x] 3.5 编辑态宽度通过外层 `div` 的 `max-w-[80%]` 约束，与展示态一致

## 4. 验证

- [x] 4.1 验证编辑态：点击编辑 → 无灰底背景，Textarea 带边框，自动伸缩，按钮在外部
- [x] 4.2 验证展示态：操作栏按钮 hover 显示 pointer，使用 ghost 样式
- [x] 4.3 验证禁用态：AI 生成期间，用户消息的编辑按钮和翻页控件均禁用
- [x] 4.4 验证取消编辑：Escape 或点击取消 → 恢复 Card 背景色块的展示态
