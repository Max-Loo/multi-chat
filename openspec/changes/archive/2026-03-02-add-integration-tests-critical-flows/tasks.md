# 集成测试补充任务清单

## 1. 基础设施准备

- [x] 1.1 安装 MSW (Mock Service Worker) 依赖
  - 运行 `pnpm add -D msw`
  - 验证 package.json 中包含 `msw` 依赖

- [x] 1.2 创建集成测试配置文件
  - 创建 `vitest.integration.config.ts`
  - 配置 `maxConcurrency: 1`（串行执行）
  - 配置 `testTimeout: 30000`（30 秒超时）
  - 配置 `isolate: true`（独立运行）

- [x] 1.3 创建集成测试设置文件
  - 创建 `src/__test__/integration/setup.ts`
  - 配置 MSW server 生命周期
  - 配置全局测试钩子（beforeAll, afterEach, afterAll）

- [x] 1.4 创建测试辅助工具目录
  - 创建 `src/__test__/helpers/integration/` 目录
  - 创建 `clearIndexedDB.ts`（IndexedDB 清理工具）
  - 创建 `resetStore.ts`（Redux store 重置工具）
  - 创建 `fixtures.ts`（集成测试 fixtures）
  - 创建 `testServer.ts`（MSW server 配置）

- [x] 1.5 配置 package.json scripts
  - 添加 `"test:integration": "vitest -c vitest.integration.config.ts"`
  - 添加 `"test:all": "pnpm test && pnpm test:integration"`

## 2. 聊天流程集成测试

- [x] 2.1 创建聊天流程集成测试文件
  - 创建 `src/__test__/integration/chat-flow.integration.test.ts`
  - 配置 MSW handlers（模拟 DeepSeek API）
  - 设置测试套件结构（describe 块）

- [x] 2.2 实现完整聊天流程测试（正常场景）
  - 测试：用户输入 → API 调用 → 流式响应 → Redux 更新 → 持久化存储
  - 验证：Redux store 中的消息列表
  - 验证：chatStorage 中的持久化数据
  - 验证：UI 中的消息渲染

- [x] 2.3 实现聊天历史加载测试
  - 测试：从存储加载历史聊天
  - 验证：Redux store 更新
  - 验证：UI 渲染历史聊天列表

- [x] 2.4 实现流式响应处理测试
  - 测试：流式响应的逐块处理
  - 验证：Redux middleware 的 `addMessageChunk` action
  - 验证：UI 的实时渲染

- [x] 2.5 实现 API 错误处理测试
  - 测试：API 返回 4xx/5xx 错误
  - 测试：网络超时
  - 验证：错误提示显示
  - 验证：重试功能

- [x] 2.6 实现流式响应中断测试
  - 测试：流式响应在中途断开
  - 验证：已接收内容的保存
  - 验证：不完整状态标记

- [x] 2.7 实现推理内容处理测试
  - 测试：请求推理内容（`include_reasoning: true`）
  - 测试：不请求推理内容（`include_reasoning: false`）
  - 验证：推理内容的渲染
  - 验证：推理内容的持久化存储

- [x] 2.8 实现多轮对话上下文管理测试
  - 测试：第一条消息（不包含历史）
  - 测试：后续消息（包含完整历史）
  - 验证：API 请求的消息格式
  - 验证：消息顺序

- [x] 2.9 实现聊天会话管理测试
  - 测试：创建新会话
  - 测试：切换会话
  - 测试：删除会话
  - 验证：Redux 状态更新
  - 验证：持久化存储操作

## 3. 模型配置集成测试

- [x] 3.1 创建模型配置集成测试文件
  - 创建 `src/__test__/integration/model-config.integration.test.ts`
  - 配置 MSW handlers（模拟模型 API）
  - 设置测试套件结构

- [x] 3.2 实现添加模型配置测试
  - 测试：用户填写表单 → API Key 加密 → 存储到 Redux → 持久化
  - 验证：API Key 加密逻辑
  - 验证：modelStorage 保存操作
  - 验证：Redux store 更新
  - 验证：UI 显示新模型

- [x] 3.3 实现使用模型配置进行聊天测试
  - 测试：选择模型 → 解密 API Key → 调用 API
  - 验证：API Key 解密逻辑
  - 验证：chatService 使用解密后的 API Key
  - 验证：API 响应处理

- [x] 3.4 实现编辑模型配置测试
  - 测试：加载配置 → 修改信息 → 保存
  - 测试：修改 API Key（重新加密）
  - 验证：modelStorage 更新操作
  - 验证：加密数据的一致性

- [x] 3.5 实现删除模型配置测试
  - 测试：删除模型 → 清理加密数据
  - 验证：modelStorage 删除操作
  - 验证：加密数据彻底清理
  - 验证：UI 更新

- [x] 3.6 实现模型配置跨平台兼容性测试
  - 测试：Tauri 环境（系统钥匙串）
  - 测试：Web 环境（IndexedDB）
  - 验证：加密算法一致性
  - 验证：存储层适配

- [x] 3.7 实现模型配置数据完整性测试
  - 测试：必填字段验证
  - 测试：API 地址格式验证
  - 测试：重复模型检测
  - 验证：加密数据完整性

## 4. 设置变更集成测试

- [x] 4.1 创建设置变更集成测试文件
  - 创建 `src/__test__/integration/settings-change.integration.test.ts`
  - 设置测试套件结构

- [x] 4.2 实现语言切换流程测试
  - 测试：用户切换语言 → Redux 更新 → i18next 更新 → localStorage 持久化 → UI 重新渲染
  - 验证：`setAppLanguage` action 触发
  - 验证：`changeAppLanguage()` 调用
  - 验证：i18next `changeLanguage()` 调用
  - 验证：localStorage 保存
  - 验证：UI 文本更新

- [x] 4.3 实现语言持久化和恢复测试
  - 测试：刷新页面后语言保持
  - 验证：localStorage 加载
  - 验证：i18next 初始化
  - 验证：UI 显示正确的语言

- [x] 4.4 实现推理内容开关流程测试
  - 测试：用户切换开关 → Redux 更新 → localStorage 持久化 → 聊天应用
  - 验证：`setIncludeReasoningContent` action 触发
  - 验证：localStorage 保存
  - 验证：chatService 应用设置

- [x] 4.5 实现推理内容开关持久化测试
  - 测试：刷新页面后开关状态保持
  - 验证：localStorage 加载
  - 验证：Redux store 恢复
  - 验证：UI 显示正确的开关状态

- [x] 4.6 实现跨平台设置持久化一致性测试
  - 测试：Tauri 环境的设置持久化
  - 测试：Web 环境的设置持久化
  - 验证：设置值格式一致
  - 验证：平台切换时设置迁移

- [x] 4.7 实现设置初始化流程测试
  - 测试：应用启动时加载设置
  - 测试：设置缺失时使用默认值
  - 测试：设置格式错误时降级处理
  - 验证：初始化顺序正确

- [x] 4.8 实现设置变更副作用验证测试
  - 测试：语言切换不影响聊天历史
  - 测试：推理内容开关不影响历史聊天
  - 验证：设置变更的独立性

- [x] 4.9 实现设置 UI 响应性验证测试
  - 测试：设置变更的视觉反馈
  - 测试：设置变更失败时的错误提示
  - 验证：用户反馈的及时性

- [x] 4.10 实现多设置同时变更测试
  - 测试：同时修改语言和推理内容开关
  - 验证：所有设置正确保存
  - 验证：设置的原子性（全部成功或全部回滚）

## 5. 文档和优化

- [x] 5.1 更新 AGENTS.md 文档
  - 添加集成测试部分
  - 说明集成测试的运行方式
  - 说明集成测试的编写规范
  - **备注**: 仅更新必要的内容，以保证 AGENTS.md 文件简洁。遵循 AGENTS.md 中的「文档维护原则」，优先使用文件引用而非详细描述

- [x] 5.2 创建集成测试指南
  - 创建 `src/__test__/integration/README.md`
  - 说明如何编写新的集成测试
  - 提供集成测试模板和示例

- [x] 5.3 性能优化
  - 运行集成测试并检查执行时间
  - 优化慢速测试
  - 确保所有测试 < 5 秒/文件

- [x] 5.4 最终验证
  - 运行 `pnpm test:all`（单元测试 + 集成测试）
  - 检查测试覆盖率
  - 确保所有测试通过
  - 验证 CI/CD 集成

## 6. CI/CD 集成（可选）

- [ ] 6.1 配置 CI 并行执行
  - 修改 `.github/workflows/test.yml`
  - 配置单元测试和集成测试并行运行

- [ ] 6.2 配置测试报告
  - 添加测试覆盖率报告上传
  - 配置测试结果通知

- [ ] 6.3 配置性能监控
  - 添加测试执行时间监控
  - 配置慢速测试告警
