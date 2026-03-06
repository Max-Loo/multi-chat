# Implementation Tasks

## 1. 创建工具函数

- [x] 1.1 创建 `src/utils/providerUtils.ts` 文件
- [x] 1.2 实现 `getProviderLogoUrl(providerKey: string): string` 函数
- [x] 1.3 添加完整的 JSDoc 注释（包含 `@param`、`@returns`、`@example`）
- [x] 1.4 使用命名导出（`export const`）导出函数
- [x] 1.5 验证函数返回正确的 URL 格式

## 2. 创建 ProviderLogo 组件

- [x] 2.1 创建 `src/components/ProviderLogo/` 目录
- [x] 2.2 创建 `src/components/ProviderLogo/index.tsx` 文件
- [x] 2.3 定义 `ProviderLogoProps` 接口（`providerKey`、`providerName`、`size?`、`className?`）
- [x] 2.4 导入 `getProviderLogoUrl` 工具函数
- [x] 2.5 定义超时常量 `const LOGO_LOAD_TIMEOUT = 5000;`
- [x] 2.6 添加状态管理：`imgError`（useState）、`imgLoaded`（useState）、`imgLoadedRef`（useRef）
- [x] 2.7 实现超时机制（useEffect + setTimeout + imgLoadedRef，避免闭包陷阱）
- [x] 2.8 实现渐进显示：首字母占位符（绝对定位 + opacity 控制）
- [x] 2.9 实现 logo 图片渲染（设置 `key={providerKey}`）
- [x] 2.10 添加 `onLoad` 事件处理（同步更新 imgLoadedRef 和 imgLoaded state）
- [x] 2.11 添加 `onError` 事件处理（设置 imgError）
- [x] 2.12 实现 300ms 淡入淡出过渡效果（transition-opacity）
- [x] 2.13 添加可访问性属性（alt、role、aria-label）
- [x] 2.14 添加图片样式（`object-contain` 和阴影效果）
- [x] 2.15 使用 `React.memo` 包装组件
- [x] 2.16 添加自定义比较函数（比较 `providerKey`、`providerName`、`size`）
- [x] 2.17 导出组件
- [x] 2.18 添加组件使用示例到注释中

## 3. 修改 ProviderCardHeader 组件

- [x] 3.1 在 `ProviderCardHeader.tsx` 中导入 `ProviderLogo` 组件
- [x] 3.2 删除原有的头像渲染逻辑（首字母显示代码）
- [x] 3.3 使用 `<ProviderLogo>` 组件替代
- [x] 3.4 传递 `providerKey={provider.providerKey}` prop
- [x] 3.5 传递 `providerName={provider.providerName}` prop
- [x] 3.6 验证组件正常显示
- [x] 3.7 测试供应商切换时的状态更新

## 4. 样式优化

- [x] 4.1 确保 ProviderLogo 组件的默认尺寸为 40x40 像素
- [x] 4.2 验证 `size` prop 可以自定义尺寸
- [x] 4.3 确保 logo 使用 `object-contain` 保持 SVG 宽高比
- [x] 4.4 验证阴影效果在不同背景下清晰可见
- [x] 4.5 确保降级到首字母时样式与原有实现一致

## 5. 测试验证

### 5.1 功能测试
- [x] 5.1.1 在开发环境验证常见供应商 logo 显示（openai、anthropic 等）
- [x] 5.1.2 测试 logo 加载失败场景（使用错误的 providerKey）
- [x] 5.1.3 验证降级逻辑正常工作（显示首字母）
- [x] 5.1.4 测试 `providerKey` 变化时的状态重置
- [x] 5.1.5 测试 5 秒超时机制（模拟慢网络）
- [x] 5.1.6 验证渐进显示的过渡动画（300ms）
- [x] 5.1.7 检查响应式布局下的显示效果

### 5.2 性能测试
- [x] 5.2.1 测试 React.memo 缓存效果（props 不变时跳过渲染）
- [x] 5.2.2 测试浏览器缓存命中效果（重复访问同一 logo）
- [x] 5.2.3 测量 React.memo 缓存命中的渲染时间（应 < 16ms）
- [x] 5.2.4 使用 React DevTools Profiler 验证性能优化

### 5.3 边界条件测试
- [x] 5.3.1 测试并发加载相同 provider key 的多个组件
- [x] 5.3.2 测试 provider key 包含特殊字符（URL 转义验证）
- [x] 5.3.3 测试 SVG 返回非图片内容（MIME 类型验证）
- [x] 5.3.4 测试网络在加载过程中切换（在线→离线→在线）
- [x] 5.3.5 测试空字符串或 null provider key 的处理

### 5.4 待验证项（来自 design.md）
- [x] 5.4.1 验证 models.dev 的 logo 文件命名与 `providerKey` 一致性
- [x] 5.4.2 检查常见供应商（openai、anthropic、google 等）的 logo 资源是否存在
- [x] 5.4.3 验证 logo 图片的实际尺寸和视觉效果
- [x] 5.4.4 测试超时阈值（LOGO_LOAD_TIMEOUT，5000ms）是否合适，根据实际加载时间调整

### 5.5 代码质量
- [x] 5.5.1 验证 TypeScript 类型检查无错误
- [x] 5.5.2 运行 `pnpm tsc` 确保类型安全
- [x] 5.5.3 运行 `pnpm lint` 确保代码规范

### 5.6 兼容性测试
- [x] 5.6.1 手动测试浏览器兼容性（Chrome、Safari、Firefox）
- [x] 5.6.2 测试不同网络环境下的表现（快速网络、慢速网络、离线）

## 6. 代码审查准备

- [x] 6.1 确保所有新代码添加了中文注释
- [x] 6.2 验证遵循项目导入路径规范（使用 `@/` 别名）
- [x] 6.3 检查可访问性（alt 文本、语义化标签、ARIA 属性）
- [x] 6.4 验证没有引入控制台错误或警告
- [x] 6.5 确认代码符合项目的代码风格指南
- [x] 6.6 确保 ProviderLogo 组件有完整的 TypeScript 类型定义

## 7. 自动化测试（可选）

### 7.1 单元测试
- [ ] 7.1.1 编写 `getProviderLogoUrl` 函数的单元测试
- [ ] 7.1.2 测试不同 `providerKey` 输入的 URL 生成
- [ ] 7.1.3 测试边界情况（空字符串、特殊字符等）

### 7.2 组件测试
- [ ] 7.2.1 编写 `ProviderLogo` 组件测试
- [ ] 7.2.2 测试 logo 加载成功场景
- [ ] 7.2.3 测试 logo 加载失败降级场景
- [ ] 7.2.4 测试 `providerKey` 变化时的重新渲染
- [ ] 7.2.5 测试 React.memo 缓存效果
- [ ] 7.2.6 测试超时机制（使用 jest.useFakeTimers）
- [ ] 7.2.7 使用 MSW mock 网络请求
- [ ] 7.2.8 测试可访问性（ARIA 属性）
