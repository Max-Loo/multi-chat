# Tasks: Chat Content Skeleton Loading

## 1. 创建 ModelSelectSkeleton 组件

- [x] 1.1 创建文件 `src/pages/Chat/components/ChatContent/components/ModelSelectSkeleton.tsx`
- [x] 1.2 实现顶部操作栏骨架屏（高度 h-12）
  - [x] 1.2.1 左侧区域：模拟 2-3 个 Badge（已选模型标签）
  - [x] 1.2.2 右侧区域：模拟 1 个 Button（确认按钮）+ 1 个 Input（搜索框）
- [x] 1.3 实现数据表格区域骨架屏
  - [x] 1.3.1 模拟 3-5 行表格行
  - [x] 1.3.2 每行包含多个模拟单元格（使用 Skeleton 组件）
- [x] 1.4 导出 ModelSelectSkeleton 组件

## 2. 创建 ChatPanelSkeleton 组件

- [x] 2.1 创建文件 `src/pages/Chat/components/ChatContent/components/ChatPanel/components/ChatPanelSkeleton.tsx`
- [x] 2.2 定义组件 Props 接口（接收可选的 columnCount 参数，默认为 1）
- [x] 2.3 实现头部骨架屏（高度 h-12）
  - [x] 2.3.1 左侧区域：模拟聊天名称文本
  - [x] 2.3.2 右侧区域：模拟 Switch + Input + 2 个 Button（列数控制）
- [x] 2.4 实现聊天内容区域骨架屏（flex-grow）
  - [x] 2.4.1 根据 columnCount 动态渲染相应数量的列
  - [x] 2.4.2 每列显示 2-3 个模拟消息气泡（不同宽度的矩形）
  - [x] 2.4.3 使用 CSS Grid 或 Flexbox 实现多列布局
- [x] 2.5 实现发送框区域骨架屏
  - [x] 2.5.1 模拟 Textarea 输入框
  - [x] 2.5.2 模拟圆形发送按钮
- [x] 2.6 导出 ChatPanelSkeleton 组件

## 3. 修改 ChatContent 组件集成骨架屏

- [x] 3.1 在 `src/pages/Chat/components/ChatContent/index.tsx` 中导入新的骨架屏组件
  - [x] 3.1.1 导入 ModelSelectSkeleton
  - [x] 3.1.2 导入 ChatPanelSkeleton
- [x] 3.2 替换 ModelSelect 的 Suspense fallback
  - [x] 3.2.1 将 `<Suspense fallback={<FullscreenLoading />}>` 改为 `<Suspense fallback={<ModelSelectSkeleton />}>`
- [x] 3.3 替换 ChatPanel 的 Suspense fallback
  - [x] 3.3.1 将 `<Suspense fallback={<FullscreenLoading />}>` 改为 `<Suspense fallback={<ChatPanelSkeleton columnCount={...} />}>`
  - [x] 3.3.2 传递 columnCount 参数（从 selectedChat.chatModelList.length 获取）
- [x] 3.4 移除或保留 FullscreenLoading 的导入（如其他地方未使用可移除）

## 4. 测试和验证

- [x] 4.1 启动开发服务器（`pnpm tauri dev`）
- [x] 4.2 验证 ModelSelect 骨架屏
  - [x] 4.2.1 创建新聊天，验证骨架屏在 ModelSelect 加载时正确显示
  - [x] 4.2.2 验证骨架屏结构（操作栏、表格）与实际组件布局匹配
  - [x] 4.2.3 验证组件加载完成后骨架屏消失，切换过程无闪烁
- [x] 4.3 验证 ChatPanel 骨架屏
  - [x] 4.3.1 选择已配置模型的聊天，验证骨架屏在 ChatPanel 加载时正确显示
  - [x] 4.3.2 验证骨架屏结构（头部、内容区、发送框）与实际组件布局匹配
  - [x] 4.3.3 验证单列布局的骨架屏显示
  - [x] 4.3.4 验证多列布局的骨架屏显示（配置多个模型）
  - [x] 4.3.5 验证组件加载完成后骨架屏消失，切换过程无闪烁
- [x] 4.4 验证 FullscreenLoading 未受影响
  - [x] 4.4.1 检查其他使用 FullscreenLoading 的场景（如果有）是否正常工作
- [x] 4.5 运行类型检查（`pnpm tsc`）确保无类型错误
- [x] 4.6 运行代码检查（`pnpm lint`）确保符合代码规范

## 5. 文档更新

- [x] 5.1 检查 AGENTS.md 是否需要更新（骨架屏相关的新开发规范或说明）
- [x] 5.2 检查 README.md 是否需要更新（通常不需要，保持简洁）
