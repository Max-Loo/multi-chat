## 1. ProviderGrid 测试

- [x] 1.1 创建 ProviderGrid.test.tsx 文件，配置 react-masonry-css mock 和 i18n mock
- [x] 1.2 编写空供应商列表测试：providers 为空数组时渲染"暂无模型供应商数据"提示
- [x] 1.3 编写非空供应商列表测试：providers 非空时渲染正确数量的 ProviderCard 组件
- [x] 1.4 编写供应商状态测试：验证有模型返回 'available'，无模型返回 'unavailable'
- [x] 1.5 编写展开/折叠交互测试：验证 expandedProviders 和 onToggleProvider 回调正确传递
- [x] 1.6 运行测试确认 ProviderGrid 分支覆盖率达到 80%+

## 2. ProviderMetadata 测试

- [x] 2.1 创建 ProviderMetadata.test.tsx 文件，配置 i18n mock
- [x] 2.2 编写文档 URL 测试：覆盖 deepseek、moonshotai、zhipu、fallback 四个分支
- [x] 2.3 编写元数据展示测试：验证 API 端点和供应商 ID 正确渲染
- [x] 2.4 编写文档链接测试：验证 href 指向正确 URL 且在新标签页打开
- [x] 2.5 编写事件冒泡测试：验证点击链接时调用 stopPropagation
- [x] 2.6 运行测试确认 ProviderMetadata 分支覆盖率达到 80%+

## 3. 验收

- [x] 3.1 运行全量测试确认无回归
- [x] 3.2 运行覆盖率报告确认 ProviderGrid 和 ProviderMetadata 分支覆盖率均达到 80%+
