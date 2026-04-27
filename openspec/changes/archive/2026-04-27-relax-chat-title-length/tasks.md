## 1. 标题生成逻辑调整

- [x] 1.1 修改 `titleGenerator.ts` 中 `truncateTitle` 默认参数 `maxLength` 从 10 改为 20
- [x] 1.2 修改 `buildTitlePrompt` 中 prompt 长度约束从 "5-10 个汉字" 改为 "5-20 个字符"

## 2. 手动命名长度限制

- [x] 2.1 在 `chatSlices.ts` 的 `editChatName` reducer 中增加超长标题截断逻辑（超过 20 字符时静默截断）
- [x] 2.2 在 `ChatButton.tsx` 的重命名 Input 上添加 `maxLength={20}` 属性

## 3. 侧边栏标题溢出省略

- [x] 3.1 在 `ChatButton.tsx` 中标题 `<span>` 添加 `truncate` 类
- [x] 3.2 在标题 `<span>` 的 flex 父容器上添加 `min-w-0` 确保 flex 子元素正确截断

## 4. 测试更新

- [x] 4.1 更新 `titleGenerator.test.ts` 中 `truncateTitle` 测试：默认截断上限从 10 改为 20
- [x] 4.2 更新 `titleGenerator.test.ts` 中超长文本截断测试的期望值
