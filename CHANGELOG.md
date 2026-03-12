# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [0.3.1] - 2026-03-12

### ✨ 新功能

- **错误消息国际化支持**：新增 error.json 命名空间，支持英文、中文、法文三种语言的错误消息翻译
  - 新增 tSafely() 函数，用于非 React 环境的安全翻译获取（支持降级策略）
  - 创建 en/zh/fr/error.json 翻译文件（包含初始化和应用配置相关的 11 个错误消息）
  - 替换 appConfigSlices.ts 中 3 个 thunk 的硬编码错误消息
  - 替换 initSteps.ts 中 8 个初始化步骤的硬编码错误消息
- **自动调整输入框高度**：新增 useAutoResizeTextarea Hook，根据内容自动调整输入框高度，提升输入体验
- **Toast API 优化**：重构 Toast 系统，优化不同布局下的展示逻辑
  - 新增统一的 Toast API（`toast/index.ts`）
  - 优化移动端和桌面端的 Toast 展示策略
  - 新增 Toast 测试页面（`ToastTest`）
- **侧边栏抽屉最小宽度限制**：为侧边栏抽屉添加最小宽度限制，提升移动端布局稳定性

### 🐛 Bug 修复

- **修复兜底语言持久化问题**：修复触发国际化语言兜底策略时，兜底语言没有持久化储存的问题
- **i18n 初始化文案优化**：将 i18n 初始化时的提示文案改成英文，提升国际化体验

### 🧪 测试增强

- **新增 Hook 测试**：useAutoResizeTextarea Hook 测试（474 行新增，覆盖所有边界情况）
- **新增组件测试**：ChatPanelSender 组件测试增强（314 行新增）
- **新增 i18n 测试**：tSafely() 函数单元测试（12 个测试场景）
- **新增中间件测试**：appConfigMiddleware 测试增强（语言持久化相关测试）

### 🔧 重构

- **ChatPanelSender 组件重构**：优化输入框布局和交互逻辑，集成自动调整高度功能
- **Toast 系统重构**：重构 toastQueue.ts，提升代码可维护性和可测试性

### 📝 文档变更

- **更新国际化系统文档**：更新 `i18n-system.md`，补充错误消息国际化和语言检测相关说明
- **新增 OpenSpec 变更记录**：新增 6 个 OpenSpec 变更目录
  - `i18n-error-messages` - 错误消息国际化
  - `i18n-init-language-english` - i18n 初始化文案英文化
  - `language-detection` - 语言检测和兜底策略
  - `mobile-toast-optimization` - Toast 优化
  - `refactor-chat-input-layout` - 输入框布局重构
  - `auto-resize-textarea` - 自动调整输入框高度

---

## [0.3.0] - 2026-03-10

### ✨ 新功能

- **响应式布局系统**：实现完整的响应式布局系统，支持桌面端和移动端无缝切换
  - 新增底部导航栏组件（`BottomNav`）
  - 新增移动端抽屉组件（`MobileDrawer`）
  - 新增 `useResponsive` Hook（响应式状态管理）
  - 新增 `useMediaQuery` Hook（媒体查询，150ms 节流）
  - 响应式聊天按钮（移动端浮动按钮，桌面端侧边栏按钮）
  - 响应式顶部栏（移动端简化显示，桌面端完整显示）
  - 自适应侧边栏（根据屏幕尺寸自动调整布局）
- **导航配置统一**：统一导航配置管理，集中管理所有页面导航项
- **UI 文本国际化扩展**：扩展导航和通用组件的国际化支持，更新 3 种语言翻译资源
- **新增模型页面返回按钮**：在移动端新增模型页面添加返回按钮，提升导航体验

### 🧪 测试增强

- **新增组件测试**：
  - 底部导航栏测试（`BottomNav.test.tsx`）
  - 移动端抽屉测试（`MobileDrawer.test.tsx`）
  - 聊天侧边栏测试（`ChatSidebar.test.tsx`）
  - 聊天按钮测试（`ChatButton.test.tsx`）
- **新增 Hook 测试**：
  - `useMediaQuery` Hook 测试
  - `useResponsive` Hook 测试
- **新增集成测试**：
  - 底部导航栏集成测试
  - 抽屉状态集成测试
  - 响应式布局切换集成测试
- **测试工具增强**：新增 Redux State 测试工具（`fixtures/reduxState.ts`）
- **测试覆盖率提升**：大幅提升响应式布局相关组件和 Hook 的测试覆盖率

### 📝 文档变更

- **AGENTS.md 精简重构**：将 AGENTS.md 从 447 行精简到 150 行（减少 66%），详细内容迁移到子文档
- **文档结构优化**：建立清晰的文档层级结构
  - `docs/design/` - 设计文档（架构、流程、决策）
  - `docs/conventions/` - 项目约定（最佳实践、规范）
  - `docs/reference/` - 参考文档（外部教程、指南）
- **新增设计文档**：
  - 应用启动初始化流程（`initialization.md`）
  - 远程模型数据获取（`model-remote.md`）
  - 聊天服务层架构（`chat-service.md`）
  - 按需加载机制（`lazy-loading.md`）
  - 国际化系统（`i18n-system.md`）
  - 跨平台兼容层（`cross-platform.md`）
- **新增约定文档**：
  - 时间戳工具函数约定（`timestamps.md`）
  - Tauri 命令添加指南（`tauri-commands.md`）
- **文档索引完善**：更新 `docs/README.md` 作为完整文档索引
- **AGENTS.md 更新**：新增响应式布局系统相关文件路径索引
- **OpenSpec 变更记录**：新增 4 个 OpenSpec 变更目录，包含完整的设计文档、规格说明和任务清单
  - `docs-structure` - 文档结构优化
  - `i18n-ui-text` - UI 文本国际化
  - `mobile-header-back-button` - 移动端头部返回按钮
  - `responsive-layout-system` - 响应式布局系统
  - `unify-navigation-config` - 统一导航配置

### 🔧 重构

- **页面结构优化**：重构聊天页、模型页、设置页的布局结构，统一使用响应式组件
- **样式优化**：重构 `main.css`，优化全局样式和响应式断点
- **状态管理优化**：新增页面级 Redux Slices（`chatPageSlices`、`modelPageSlices`、`settingPageSlices`）

---

## [0.2.4] - 2026-03-10

### ✨ 新功能

- **国际化翻译完整性检查**：新增自动化工具验证所有支持语言的翻译文件具有相同的键值结构，确保不存在遗漏的翻译
- **法语翻译完善**：补充法语翻译内容（`fr/setting.json`）
- **添加 LICENSE**：添加 MIT 许可证
- **README 更新**：完善项目文档和使用说明

### 🐛 Bug 修复

- **修复 reasoning content 缺失的问题**：确保推理内容正确传播和显示
- **修复翻译检查工具的依赖问题**：确保检查脚本正确运行

### ⚡ 性能优化

- **升级 fake-indexeddb**：从 5.x 升级到 6.x，提升测试环境性能
- **升级 lucide-react**：升级图标库到最新版本，获取最新的图标和修复
- **批量更新依赖**：更新生产依赖和开发依赖到最新稳定版本
- **集成翻译检查到 pre-commit hook**：在提交前自动验证翻译完整性

### 🧪 测试增强

- **新增模型存储集成测试**：为模型存储功能添加完整的集成测试（`modelStorage.integration.test.ts`）
- **新增 IndexedDB 测试**：为 IndexedDB 兼容层添加测试（`test-indexeddb.test.ts`）
- **新增 Keyring 测试**：为 Keyring 功能添加测试（`test-keyring.test.ts`）
- **测试文档完善**：更新测试 README，补充测试策略说明

### 🔧 重构

- **优化 fake-indexeddb 升级**：重构 IndexedDB mock 实现，提升测试可靠性
- **分离测试工具文件**：将测试专用工具提取到独立文件（`test-indexeddb.test.ts`、`test-keyring.test.ts`）

---

## [0.2.3] - 2026-03-08

### ✨ 新功能

- **国际化缓存验证与迁移**：应用启动时验证缓存语言有效性，自动迁移旧语言代码并清理无效缓存
- **国际化 Toast 消息队列**：使用消息队列机制管理初始化期间的语言切换提示，解决 `<Toaster />` 组件未挂载时的时序问题
- **国际化自动持久化**：通过 Redux Middleware 自动监听语言变更并同步到 localStorage，消除手动持久化代码

### ⚡ 性能优化

- **模型供应商快速初始化**：优化远程数据获取的初始化逻辑，提升启动性能
- **移动模型远程配置**：将网络和缓存配置提取到独立文件，提升代码可维护性

### 🐛 Bug 修复

- 修复加载不存在的 localStorage 缓存的国际化语言标识时，没有正确还原显示兜底语言的问题
- 更新遗留的版本号
- 修复合并错误

### 🔧 重构

- 重构国际化架构：优化初始化逻辑，分离加载和切换逻辑

---

## [0.2.2] - 2026-03-08

### 📝 文档变更

- 添加 v0.2.2 版本变更日志
- 补充历史版本变更记录（v0.0.1 - v0.2.1）

### ⚡ 性能优化

- **模型供应商 SDK 按需加载**：实现通用资源加载器，减少初始 bundle 大小约 125KB（gzipped）
- **国际化按需加载**：优化语言资源加载策略，减少 33%-67% 初始加载量
- **代码高亮优化**：常用语言固定打包 + 不常用语言按需加载，显著提升加载性能

### ✨ 新功能

- **聊天标题自动生成**：支持 AI 自动生成聊天标题，并提供 UI 开关控制
- **聊天重命名验证**：增强聊天重命名的输入验证机制
- **法语支持**：新增法语国际化支持（`fr`）
- **供应商 Logo**：在模型供应商卡片中显示品牌标识
- **Review 方案命令**：新增 `/review-proposal` 命令用于审查设计方案
- **完善 Skill 配置**：新增 OpenSpec 相关的 11 个 skill 配置

### 🔧 重构

- **聊天服务层模块化**：将 `chatService` 重构为多文件架构
  - `messageTransformer.ts` - 消息转换
  - `metadataCollector.ts` - 元数据收集
  - `providerFactory.ts` - 供应商工厂
  - `streamProcessor.ts` - 流式处理

### 🐛 Bug 修复

- 修复聊天页面「滚动到底部按钮」定位错误
- 修复密钥输入框同时展示两个「显示/隐藏」按钮
- 修复删除聊天后 `selectedChatId` 未正确清除的问题

### 🎨 其他变更

- 调整默认窗口大小（1200×800 → 1280×780）

---

## [0.2.1] - 2026-03-04

### ✨ 新功能

- **GitHub Pages 自动部署**：添加自动部署到 GitHub Pages 的 CI/CD 工作流
- **自定义聊天组件**：重构聊天气泡组件，移除第三方依赖，自主实现 UI 组件

### 🧪 测试优化

- **启用被跳过的单元测试**：修复并启用之前跳过的 chatService 和 masterKey 测试
- **测试质量优化**：从测试实现转向测试行为，移除过度 Mock，聚焦测试用户可见行为
- **集成测试增强**：为聊天流程、模型配置、设置变更添加集成测试
- **测试文档完善**：添加详细的测试指南、Mock 策略配置文档

### 🐛 Bug 修复

- 修复测试文件报错问题

---

## [0.2.0] - 2026-03-02

### ⚡ 性能优化

- **聊天页面性能优化**：添加骨架屏动效，优化组件加载卡顿问题
- **打包优化**：优化打包后单个 chunk 的体积

### ✨ 新功能

- **项目初始化重构**：抽象统一的初始化框架（`InitializationManager`），支持依赖关系、并行执行和三级错误处理
- **模型供应商动态获取**：从 `https://models.dev/api.json` 动态获取模型供应商数据，支持远程数据 + 本地缓存双重策略
- **AI SDK v6 升级**：使用 `ai-sdk` 替换 `openai` 包，统一 Token Usage 字段命名
- **UI 优化**：
  - 模型供应商卡片改为瀑布流样式
  - 调整模型供应商卡片的响应式列数
  - 添加聊天记录原始数据保存功能
- **OpenSpec 升级**：更新到 1.2.0 版本

### 🧪 测试增强

- 为关键模块添加测试（跨平台兼容层、数据持久化层、国际化模块）
- 为自定义 hooks 添加单元测试
- 为部分核心组件添加测试
- 优化 `chatService` 模块的测试

### 🐛 Bug 修复

- 修复 `streamChatCompletion` 没有正确使用 `conversationId` 参数的问题
- 修复删除聊天时没有正确清理路由参数的问题
- 修复部分测试文件报错的问题
- 修复 AI SDK v6 Token Usage 字段名称问题

### 🔧 重构

- 移除硬编码的供应商类，简化供应商数据架构
- 移除写死的 `logoUrl`，改为动态拼接
- 重构 `useNavigateToChat` hook

### 📝 文档变更

- 更新和优化 AGENTS.md 文档
- 添加 AI SDK 的文档使用描述

---

## [0.1.1] - 2026-02-27

### ✨ 新功能

- **跨平台兼容层**：
  - 添加 Store 和 Keyring 插件的 Web 兼容层支持
  - 实现 HTTP Fetch 跨平台兼容层
  - 添加 Shell 和 OS 插件的 Web 兼容层支持
- **UI 组件升级**：
  - 添加密码输入组件
  - 修改前端组件为 shadcn/ui
  - 优化滚动按钮样式
- **开发工具**：
  - 添加基础 openspec 配置
  - 添加 opencode 的配置以及 skills
- **存储优化**：去除 Stronghold 相关逻辑，改为简单的 JSON 存储

### 🐛 Bug 修复

- 为编辑模型弹窗添加标题和描述

### 📝 文档变更

- 更新文档

---

## [0.0.4] - 2026-02-26

### 🔧 重构

- 将 ESLint 替换成 Oxlint，提升代码检查性能

---

## [0.0.3] - 2026-02-25

### ✨ 新功能

- **国际化支持**：添加完整的国际化配置
- **路由优化**：将模型页面改成使用路由来跳转
- **404 页面**：添加 404 兜底页面

### 🐛 Bug 修复

- 补充遗留的未国际化硬编码文案

### 🎨 其他变更

- 调整侧边栏按钮的样式

---

## [0.0.2] - 2026-02-24

### ✨ 新功能

- 添加聊天页面滚动到底部的按钮
- 添加开发环境代理服务器，方便开发时进行调试

### 🐛 Bug 修复

- 修复编辑聊天名称时误编辑其他项的问题

### 🔧 重构

- 优化模型服务商的代码

---

## [0.0.1] - 2026-02-20

### 🎉 首次发布

- 基于 Tauri + React + TypeScript 的桌面应用程序
- 支持多模型供应商（DeepSeek、Kimi、智谱等）
- 基础聊天功能
- 模型配置和管理
