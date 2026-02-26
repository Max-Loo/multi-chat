## 1. 组件结构搭建

- [x] 1.1 创建 `ProviderCard` 组件（单个供应商卡片）
- [x] 1.2 创建 `ProviderHeader` 组件（标题 + 刷新按钮）
- [x] 1.3 创建 `ProviderGrid` 组件（供应商卡片网格）
- [x] 1.4 创建 `ProviderCardHeader` 子组件（图标 + 名称 + 状态徽章）
- [x] 1.5 创建 `ProviderCardSummary` 子组件（模型数量 + 最后更新）
- [x] 1.6 创建 `ProviderCardDetails` 子组件（可展开的详细信息）
- [x] 1.7 创建 `ProviderMetadata` 子组件（API 端点、文档链接）
- [x] 1.8 创建 `ModelList` 子组件（模型列表展示）
- [x] 1.9 创建 `ModelSearch` 子组件（模型搜索框）
- [x] 1.10 创建 `ErrorAlert` 子组件（错误提示）

## 2. 状态管理实现

- [x] 2.1 在 `ModelProviderSetting` 中添加 `expandedProviders` 本地状态（Set<string>）
- [x] 2.2 添加 `toggleProvider` 函数处理展开/折叠逻辑
- [x] 2.3 在 `ProviderCardDetails` 中添加 `searchQuery` 本地状态（string）
- [x] 2.4 实现模型搜索过滤逻辑
- [x] 2.5 连接 Redux store，读取 `providers`、`loading`、`error`、`lastUpdate` 状态

## 3. UI 布局和样式实现

- [x] 3.1 实现 `ProviderGrid` 的响应式网格布局（grid-cols-1/2/3）
- [x] 3.2 实现 `ProviderCard` 的卡片样式（shadcn/ui Card）
- [x] 3.3 实现状态徽章的样式（shadcn/ui Badge，绿色/红色）
- [x] 3.4 实现展开/折叠的 CSS transition 动画（300ms/200ms）
- [x] 3.5 实现 `ModelSearch` 的搜索框样式和防抖（300ms）
- [x] 3.6 实现 `ErrorAlert` 的错误提示样式（shadcn/ui Alert）
- [x] 3.7 实现刷新按钮的加载动画（`animate-spin`）

## 4. 国际化支持

- [x] 4.1 在 `src/locales/zh/setting.json` 添加中文翻译键
- [x] 4.2 在 `src/locales/en/setting.json` 添加英文翻译键
- [x] 4.3 在所有组件中使用 `useTranslation` hook 替换硬编码文本
- [ ] 4.4 测试中英文切换功能

## 5. 交互逻辑实现

- [x] 5.1 实现刷新按钮点击逻辑（`handleRefresh` 函数）
- [x] 5.2 实现展开/折叠交互（`toggleProvider` 函数）
- [x] 5.3 实现模型搜索过滤逻辑（过滤模型列表）
- [x] 5.4 实现文档链接点击（新标签页打开）
- [x] 5.5 实现 AbortController 取消请求逻辑（组件卸载时）

## 6. 图标集成

- [x] 6.1 导入 Lucide React 图标（RefreshCw、CheckCircle、XCircle、ExternalLink、ChevronDown、ChevronUp）
- [x] 6.2 在 `ProviderHeader` 中添加 `RefreshCw` 图标
- [x] 6.3 在 `ProviderCardHeader` 中添加状态图标（`CheckCircle` / `XCircle`）
- [x] 6.4 在 `ProviderMetadata` 中添加文档链接图标（`ExternalLink`）
- [x] 6.5 在 `ProviderCardDetails` 中添加展开/折叠图标（`ChevronDown` / `ChevronUp`）

## 7. 数据展示实现

- [x] 7.1 实现供应商列表渲染（遍历 `providers` 数组）
- [x] 7.2 实现模型列表渲染（遍历 `models` 数组）
- [x] 7.3 实现模型数量统计显示（"共 X 个模型"）
- [x] 7.4 实现最后更新时间格式化（本地化日期时间）
- [x] 7.5 实现供应商图标显示（使用首字母占位或 `icon` 字段）

## 8. 错误处理和用户反馈

- [x] 8.1 实现刷新成功的 Toast 提示（`toast.success`）
- [x] 8.2 实现刷新失败的 Toast 提示（`toast.error`）
- [x] 8.3 实现 `ErrorAlert` 的持久错误显示
- [x] 8.4 实现刷新按钮的禁用状态（loading 期间）
- [x] 8.5 实现空状态提示（无供应商数据时）

## 9. 性能优化

- [x] 9.1 使用 `React.memo` 优化 `ProviderCard` 组件
- [x] 9.2 实现模型搜索防抖（debounce 300ms）
- [x] 9.3 优化展开/折叠动画（仅使用 opacity 和 transform）
- [x] 9.4 添加 `will-change` CSS 属性提升动画性能

## 10. 测试

- [ ] 10.1 编写 `ModelProviderSetting` 组件的单元测试
- [x] 10.2 编写 `ProviderCard` 组件的单元测试
- [ ] 10.3 测试刷新功能的成功和失败场景
- [ ] 10.4 测试展开/折叠交互
- [ ] 10.5 测试模型搜索功能
- [ ] 10.6 手动测试响应式布局（桌面端、移动端）
- [ ] 10.7 使用 axe DevTools 进行无障碍测试
- [x] 10.8 运行 `pnpm lint` 和 `pnpm tsc` 检查代码质量

## 11. 文档和清理

- [ ] 11.1 更新 AGENTS.md 中的组件说明（如有必要）
- [x] 11.2 删除旧代码和注释
- [x] 11.3 代码格式化（项目中未配置 Prettier，已通过 lint 检查）
- [x] 11.4 最终代码审查和修复
