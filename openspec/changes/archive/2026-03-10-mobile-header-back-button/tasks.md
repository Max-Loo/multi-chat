# 实现任务清单

## 1. 修改 ModelHeader 组件

- [x] 1.1 在 `ModelHeader.tsx` 中导入 `useNavigate` hook
- [x] 1.2 从 `lucide-react` 导入 `ArrowLeft` 图标
- [x] 1.3 在组件中添加 `navigate` 实例：`const navigate = useNavigate()`
- [x] 1.4 创建返回处理函数：`const handleBack = () => navigate("/model/table")`
- [x] 1.5 在 JSX 中添加返回按钮（位于菜单按钮左边，仅 `isMobile` 时显示）
- [x] 1.6 为返回按钮添加适当的 className 和 aria-label

## 2. 修改 ModelSidebar 组件

- [x] 2.1 在 `ModelSidebar.tsx` 中定位返回按钮（第 72-78 行）
- [x] 2.2 使用条件渲染包裹返回按钮：`{!isMobile && <Button>...}`
- [x] 2.3 确保条件逻辑与 ModelHeader 中的逻辑互斥（`isMobile` vs `!isMobile`）

## 3. 添加国际化支持

- [x] 3.1 检查现有翻译文件中是否有"返回"或"back"相关的翻译 key
- [x] 3.2 如存在，使用现有的翻译 key（如 `t(($) => $.navigation.back)`）
- [x] 3.3 如不存在，在所有语言的翻译文件中添加新的 key
- [x] 3.4 更新返回按钮的 aria-label 使用国际化文本

## 4. 测试验证

- [x] 4.1 在移动端（< 768px）测试：验证头部显示返回按钮
- [x] 4.2 在移动端测试：验证抽屉内的返回按钮被隐藏
- [x] 4.3 在桌面端（≥ 1280px）测试：验证头部不显示返回按钮
- [x] 4.4 在桌面端测试：验证侧边栏的返回按钮正常显示
- [x] 4.5 在中间断点（768px - 1279px）测试：验证行为符合预期
- [x] 4.6 测试返回按钮的点击功能：验证正确导航到 `/model/table`
- [x] 4.7 验证 ARIA 标签正确（使用浏览器开发者工具）
- [x] 4.8 测试键盘导航：Tab 键聚焦和 Enter 键激活

## 5. 代码质量检查

- [x] 5.1 运行 `pnpm lint` 确保代码符合 ESLint 规范
- [x] 5.2 运行 `pnpm tsc` 确保类型检查通过
- [x] 5.3 代码审查：检查条件渲染逻辑是否正确
- [x] 5.4 确认所有导入语句都在文件顶部
- [x] 5.5 验证组件注释和 JSDoc（如有需要）

## 6. 文档和最终测试

- [x] 6.1 如有需要，更新 AGENTS.md 中的相关约定
- [x] 6.2 运行完整的测试套件：`pnpm test:all`
- [x] 6.4 手动测试：在真实设备或浏览器开发者工具的移动模式下测试
