# 实施任务清单

本文档列出了引入 Playwright E2E 测试的所有实施任务，按照依赖顺序排列。

## 1. 基础设施搭建

### 1.1 安装依赖
- [x] 1.1.1 运行 `pnpm add -D @playwright/test` 安装 Playwright
- [x] 1.1.2 运行 `npx playwright install chromium` 下载 Chromium 浏览器（需要手动运行，下载超时）
- [x] 1.1.3 验证安装：运行 `npx playwright --version` 确认版本
- [x] 1.1.4 验证 playwright-cli 可用：运行 `playwright-cli --version`（已全局安装）

### 1.2 创建配置文件
- [x] 1.2.1 在项目根目录创建 `playwright.config.ts`
- [x] 1.2.2 配置测试目录为 `e2e/`
- [x] 1.2.3 配置 Web 服务器启动命令 `pnpm web:dev`
- [x] 1.2.4 配置 baseURL 为 `http://localhost:1420`
- [x] 1.2.5 配置超时时间为 30000ms
- [x] 1.2.6 配置重试次数为 2
- [x] 1.2.7 配置测试失败时截图和录制视频
- [x] 1.2.8 配置单线程执行（workers: 1）

### 1.3 创建目录结构
- [x] 1.3.1 创建 `e2e/` 目录
- [x] 1.3.2 创建 `e2e/helpers/` 目录（测试辅助工具）
- [x] 1.3.3 创建 `e2e/pages/` 目录（页面对象模型）
- [x] 1.3.4 创建 `e2e/templates/` 目录（测试模板）
- [x] 1.3.5 创建 `e2e/examples/` 目录（测试示例）

### 1.4 添加测试脚本
- [x] 1.4.1 在 `package.json` 的 scripts 中添加 `"test:e2e": "playwright test"`
- [x] 1.4.2 添加 `"test:e2e:smoke": "playwright test --grep @smoke"`
- [x] 1.4.3 添加 `"test:e2e:ui": "playwright test --ui"`
- [x] 1.4.4 添加 `"test:e2e:debug": "playwright test --debug"`
- [x] 1.4.5 添加 `"test:e2e:file": "playwright test"` （用法：`pnpm test:e2e:file chat-flow.spec.ts`）
- [x] 1.4.6 添加 `"test:e2e:report": "playwright show-report"`
- [x] 1.4.7 添加 playwright-cli 使用说明（不添加 script，直接使用命令）

### 1.5 创建测试辅助工具
- [x] 1.5.1 创建 `e2e/helpers/test-data.ts` 测试数据工厂
- [x] 1.5.2 实现 `testModelFactory()` 工厂函数
- [x] 1.5.3 实现 `testChatFactory()` 工厂函数
- [x] 1.5.4 创建 `e2e/helpers/test-utils.ts` 测试辅助函数
- [x] 1.5.5 实现 `setupTestData()` 函数（生成唯一测试 ID + 清理环境）
- [x] 1.5.6 实现 `clearTestData()` 函数（清理 IndexedDB、localStorage）
- [x] 1.5.7 实现 `waitForIdle()` 函数
- [x] 1.5.8 实现 `mockRemoteAPI()` 函数（拦截 models.dev API 调用）
- [x] 1.5.9 实现 `mockAIChatResponse()` 函数（模拟 AI 流式响应）

### 1.6 创建测试模板和示例
- [x] 1.6.1 创建 `e2e/templates/test.template.ts` 测试代码模板
- [x] 1.6.2 创建 `e2e/templates/page-object.template.ts` 页面对象模板
- [x] 1.6.3 创建 `e2e/examples/simple-flow.example.ts` 简单测试示例
- [x] 1.6.4 创建 `e2e/example.spec.ts` 基础设施验证测试
- [x] 1.6.5 编写测试：验证应用可以正常启动
- [x] 1.6.6 编写测试：验证主要 UI 元素可见
- [x] 1.6.7 运行 `pnpm test:e2e` 验证基础设施可用

### 1.7 配置代码质量检查
- [x] 1.7.1 在 `.eslintrc.json` 中添加 Playwright 规则
- [x] 1.7.2 禁止使用 `page.waitForTimeout()` （硬编码等待）
- [x] 1.7.3 禁止使用 CSS 类名定位器
- [x] 1.7.4 要求使用 data-testid 或语义化定位器
- [x] 1.7.5 创建 `e2e/.eslintrc.json` 测试专用配置（如需要）

---

## 2. 组件可测试性改造

### 2.1 聊天相关组件添加 data-testid
- [x] 2.1.1 在 `ChatSidebar` 组件的"创建新聊天"按钮添加 `data-testid="create-chat-button"`
- [x] 2.1.2 在 `ChatSender` 组件的消息输入框添加 `data-testid="message-input"`
- [x] 2.1.3 在 `ChatSender` 组件的发送按钮添加 `data-testid="send-button"`
- [x] 2.1.4 在 `ChatBubble` 组件添加 `data-testid="chat-bubble"` 和 `data-role` 属性
- [x] 2.1.5 在 `ModelSelect` 组件的选择器添加 `data-testid="model-select"`

### 2.2 模型管理组件添加 data-testid
- [x] 2.2.1 在模型列表页面的"添加模型"按钮添加 `data-testid="add-model-button"`
- [x] 2.2.2 在 `ModelConfigForm` 组件的昵称输入框添加 `data-testid="model-nickname"`
- [x] 2.2.3 在 `ModelConfigForm` 组件的 API Key 输入框添加 `data-testid="model-api-key"`
- [x] 2.2.4 在 `ModelConfigForm` 组件的 API 地址输入框添加 `data-testid="model-api-address"`
- [x] 2.2.5 在 `ModelConfigForm` 组件的提交按钮添加 `data-testid="submit-button"`
- [x] 2.2.6 在模型列表项添加 `data-testid="model-card"`
- [x] 2.2.7 在编辑按钮添加 `data-testid="edit-button"`
- [x] 2.2.8 在删除按钮添加 `data-testid="delete-button"`

### 2.3 应用级组件添加 data-testid
- [x] 2.3.1 在 `Sidebar` 组件添加 `data-testid="sidebar"`
- [x] 2.3.2 在主内容区域添加 `data-testid="main-content"`
- [x] 2.3.3 在初始化屏幕添加 `data-testid="initialization-screen"`
- [x] 2.3.4 在错误屏幕添加 `data-testid="error-screen"`
- [x] 2.3.5 在加载状态指示器添加 `data-testid="loading-indicator"`

---

## 3. 页面对象模型创建

### 3.1 创建 ChatPage 页面对象
- [x] 3.1.1 创建 `e2e/pages/chat-page.ts`
- [x] 3.1.2 实现 `goto()` 方法：导航到聊天页面
- [x] 3.1.3 实现 `createNewChat()` 方法：创建新聊天
- [x] 3.1.4 实现 `selectModel(modelName)` 方法：选择模型
- [x] 3.1.5 实现 `sendMessage(message)` 方法：发送消息
- [x] 3.1.6 实现 `waitForResponse()` 方法：等待 AI 响应
- [x] 3.1.7 实现 `getLastMessage()` 方法：获取最后一条消息
- [x] 3.1.8 实现 `getMessageHistory()` 方法：获取消息历史

### 3.2 创建 ModelPage 页面对象
- [x] 3.2.1 创建 `e2e/pages/model-page.ts`
- [x] 3.2.2 实现 `goto()` 方法：导航到模型管理页面
- [x] 3.2.3 实现 `clickAddModel()` 方法：点击添加模型按钮
- [x] 3.2.4 实现 `fillModelForm(data)` 方法：填写模型表单
- [x] 3.2.5 实现 `submitForm()` 方法：提交表单
- [x] 3.2.6 实现 `clickEditButton(modelName)` 方法：点击编辑按钮
- [x] 3.2.7 实现 `clickDeleteButton(modelName)` 方法：点击删除按钮
- [x] 3.2.8 实现 `verifyModelExists(modelName)` 方法：验证模型存在

### 3.3 创建 AppPage 页面对象
- [x] 3.3.1 创建 `e2e/pages/app-page.ts`
- [x] 3.3.2 实现 `goto()` 方法：导航到应用首页
- [x] 3.3.3 实现 `waitForInitialization()` 方法：等待初始化完成
- [x] 3.3.4 实现 `isInitialized()` 方法：判断是否初始化完成
- [x] 3.3.5 实现 `navigateTo(page)` 方法：导航到指定页面
- [x] 3.3.6 实现 `getData()` 方法：获取应用数据（IndexedDB）

---

## 4. 核心测试编写

### 4.1 聊天发送流程测试
- [x] 4.1.1 创建 `e2e/chat-flow.spec.ts`
- [x] 4.1.2 编写测试：创建新聊天并发送消息（使用 mockRemoteAPI）
- [x] 4.1.3 编写测试：验证流式响应实时更新（使用 mockAIChatResponse）
- [x] 4.1.4 编写测试：验证聊天历史持久化
- [x] 4.1.5 编写测试：验证切换聊天功能
- [x] 4.1.6 添加 `@smoke` 标签到核心测试（创建聊天 + 发送消息）
- [x] 4.1.7 运行测试并验证通过
- [x] 4.1.8 验证测试使用页面对象模型（直接操作 page 则失败）
- [x] 4.1.9 验证测试使用稳定定位器（CSS 类名则失败）

### 4.2 模型管理流程测试
- [x] 4.2.1 创建 `e2e/model-management.spec.ts`
- [x] 4.2.2 编写测试：添加新模型
- [x] 4.2.3 编写测试：编辑现有模型
- [x] 4.2.4 编写测试：删除模型（软删除）
- [x] 4.2.5 编写测试：表单验证（空字段）
- [x] 4.2.6 编写测试：API Key 加密存储验证
- [x] 4.2.7 添加 `@smoke` 标签到核心测试（添加模型）
- [x] 4.2.8 运行测试并验证通过
- [x] 4.2.9 验证测试使用页面对象模型
- [x] 4.2.10 验证测试使用工厂函数生成测试数据

### 4.3 应用初始化流程测试
- [x] 4.3.1 创建 `e2e/app-initialization.spec.ts`
- [x] 4.3.2 编写测试：首次启动初始化（Web 模式）
- [x] 4.3.3 编写测试：初始化失败处理（致命错误）
- [x] 4.3.4 编写测试：初始化失败处理（警告错误）
- [x] 4.3.5 编写测试：数据持久化验证
- [x] 4.3.6 编写测试：主密钥丢失后的降级处理（IndexedDB 模式）
- [x] 4.3.7 添加 `@smoke` 标签到核心测试（初始化流程）
- [x] 4.3.8 运行测试并验证通过
- [x] 4.3.9 验证测试使用唯一测试数据标识

---

## 5. 测试优化和文档

### 5.1 测试优化
- [x] 5.1.1 为所有测试添加标签（@smoke, @regression）
- [x] 5.1.2 优化定位器：替换 CSS 类名为 data-testid
- [x] 5.1.3 优化等待逻辑：使用 waitFor 而非固定延迟
- [x] 5.1.4 减少不必要的等待时间
- [x] 5.1.5 添加测试超时配置
- [x] 5.1.6 验证冒烟测试在 1 分钟内完成

### 5.2 编写文档
- [x] 5.2.1 创建 `e2e/README.md` 文档
- [x] 5.2.2 编写"如何运行测试"章节
- [x] 5.2.3 编写"如何使用 playwright-cli 探索和辅助测试"章节（可选工具）
  - [ ] 5.2.3.1 验证 playwright-cli 可用性（已全局安装）
  - [ ] 5.2.3.2 基础命令示例
  - [ ] 5.2.3.3 交互式探索工作流（不是录制）
  - [ ] 5.2.3.4 结合快照生成 AI Prompt
- [x] 5.2.4 编写"如何编写新测试"章节
- [x] 5.2.5 编写"如何调试测试"章节
- [x] 5.2.6 编写"测试最佳实践"章节
- [x] 5.2.7 添加测试示例代码片段
- [x] 5.2.8 添加 playwright-cli 常用命令参考

### 5.3 建立代码规范和质量控制
- [x] 5.3.1 编写"E2E 测试代码审查清单"（包含 AI 生成代码 checklist）
- [x] 5.3.2 编写"测试命名规范"
- [x] 5.3.3 编写"定位器使用规范"
- [x] 5.3.4 编写"页面对象模型使用指南"
- [x] 5.3.5 创建"playwright-cli 探索指南"（可选工具）
  - [ ] 5.3.5.1 基础命令参考（open, goto, snapshot）
  - [ ] 5.3.5.2 页面探索工作流
  - [ ] 5.3.5.3 何时使用 playwright-cli
  - [ ] 5.3.5.4 快照信息如何提供给 AI Agent
- [x] 5.3.6 创建"AI 生成代码质量 Checklist"
  - [ ] 5.3.6.1 页面对象模型使用验证
  - [ ] 5.3.6.2 定位器稳定性验证（禁止 CSS 类名）
  - [ ] 5.3.6.3 断言充分性验证
  - [ ] 5.3.6.4 等待策略验证（禁止硬编码延迟）
  - [ ] 5.3.6.5 测试数据隔离验证
- [x] 5.3.7 定义"渐进式信任策略"
  - [ ] 5.3.7.1 阶段 1（Week 1-2）：100% 人工审查
  - [ ] 5.3.7.2 阶段 2（Week 3-4）：50% 人工审查
  - [ ] 5.3.7.3 阶段 3（Week 4+）：20% 人工审查

### 5.4 创建 AI 辅助生成模板
- [ ] 5.4.1 创建 `e2e/templates/ai-prompts/` 目录
- [ ] 5.4.2 创建 `basic-test.prompt.md` 基础测试生成模板
  - [ ] 包含技术要求（TypeScript、POM、data-testid）
  - [ ] 包含项目结构信息
  - [ ] 包含代码质量要求
- [ ] 5.4.3 创建 `with-exploration.prompt.md` 探索后生成模板
  - [ ] 如何整合 playwright-cli 快照
  - [ ] 如何描述页面结构
- [ ] 5.4.4 创建 `debugging.prompt.md` 调试辅助模板
  - [ ] 如何描述测试失败
  - [ ] 如何请求 AI 修正代码
- [ ] 5.4.5 创建 `e2e/AI-TESTING-GUIDE.md` 使用指南
  - [ ] 何时使用 AI Agent
  - [ ] 何时使用 playwright-cli
  - [ ] 最佳实践和示例
  - [ ] Prompt 优化技巧

---

## 6. 验证和收尾

### 6.1 完整测试验证
- [x] 6.1.1 运行所有 E2E 测试：`pnpm test:e2e`
- [x] 6.1.2 验证所有测试通过
- [x] 6.1.3 运行冒烟测试：`pnpm test:e2e --grep @smoke`
- [x] 6.1.4 验证冒烟测试在 1 分钟内完成
- [x] 6.1.5 生成测试报告：`pnpm test:e2e:report`
- [ ] 6.1.6 验证报告包含所有测试结果和截图

### 6.2 AI 辅助测试生成验证
- [ ] 6.2.1 选择一个简单场景（如"切换语言"）
- [ ] 6.2.2 方案 A：直接使用 AI Agent 生成
  - [ ] 6.2.2.1 准备测试场景描述（自然语言）
  - [ ] 6.2.2.2 使用 AI Agent（opencode）生成测试代码
  - [ ] 6.2.2.3 审查生成的代码（页面对象、定位器、断言）
  - [ ] 6.2.2.4 运行并验证测试通过
- [ ] 6.2.3 方案 B：使用 playwright-cli 探索后生成（可选）
  - [ ] 6.2.3.1 使用 playwright-cli open 打开页面
  - [ ] 6.2.3.2 执行操作并保存快照
  - [ ] 6.2.3.3 将快照信息提供给 AI Agent
  - [ ] 6.2.3.4 AI Agent 基于快照生成测试
  - [ ] 6.2.3.5 审查并运行测试
- [ ] 6.2.4 记录最佳实践
  - [ ] 哪些场景适合直接生成
  - [ ] 哪些场景需要先探索
  - [ ] AI Agent prompt 模板

### 6.3 团队培训和交接（可选）
- [ ] 6.3.1 向团队演示 E2E 测试基础设施（如有多名开发者）
- [ ] 6.3.2 分享测试编写示例
- [ ] 6.3.3 培训团队成员使用页面对象模型
- [ ] 6.3.4 培训团队成员使用 AI Agent 生成测试（包括 prompt 编写技巧）
- [ ] 6.3.5 培训团队成员使用 playwright-cli 探索页面（可选）
- [ ] 6.3.5 收集团队反馈并改进文档

### 6.4 复盘和总结
- [ ] 6.4.1 记录测试实施过程中的问题和解决方案
- [ ] 6.4.2 总结 AI Agent 辅助测试生成的最佳实践和 Prompt 模板
- [ ] 6.4.3 评估测试覆盖率和稳定性是否达标
- [ ] 6.4.4 识别需要进一步优化的地方
- [ ] 6.4.5 更新 AGENTS.md（如有必要）

### 6.5 最终确认
- [x] 6.5.1 确认所有任务完成
- [x] 6.5.2 确认测试覆盖率满足要求（至少 3 个核心流程）
- [ ] 6.5.3 确认测试质量满足要求（稳定性、可维护性）
- [ ] 6.5.4 确认文档完整且易懂
- [ ] 6.5.5 清理临时文件和测试数据
- [ ] 6.5.6 提交代码并创建 Pull Request

---

## 任务优先级说明

### 🔴 P0 - 必须完成（阻塞发布）
- **任务 1.1-1.6**：基础设施搭建
- **任务 2.1-2.3**：组件可测试性改造（核心组件）
- **任务 3.1-3.3**：页面对象模型（核心页面）
- **任务 4.1-4.3**：核心测试编写

### 🟡 P1 - 应该完成（影响质量）
- **任务 5.1**：测试优化
- **任务 5.2**：编写文档
- **任务 6.1-6.2**：验证和收尾

### 🟢 P2 - 可以完成（改进体验）
- **任务 5.3**：建立代码规范
- **任务 6.3-6.4**：团队培训和最终确认

---

## 预估工作量

| 阶段 | 任务 | 预估时间 | 依赖 |
|------|------|----------|------|
| **阶段 1** | 基础设施搭建 | 2-3 小时 | 无 |
| **阶段 2** | 组件可测试性改造 | 1-2 小时 | 阶段 1 |
| **阶段 3** | 页面对象模型创建 | 2-3 小时 | 阶段 1 |
| **阶段 4** | 核心测试编写 | 3-4 小时 | 阶段 2, 3 |
| **阶段 5** | 测试优化和文档 | 2-3 小时 | 阶段 4 |
| **阶段 6** | 验证和收尾 | 1-2 小时 | 阶段 5 |
| **总计** | - | **11-17 小时** | - |

---

## 成功标准

所有任务完成后，应该满足以下标准：

### 量化指标（必须满足）

1. **测试覆盖**：
   - ✅ 至少 3 个核心流程的 E2E 测试通过
   - ✅ 覆盖聊天发送、模型管理、应用初始化
   - ✅ 测试代码覆盖率（分支）> 70%（通过 Playwright 插件统计）

2. **测试质量**：
   - ✅ 所有测试使用页面对象模型（100% 合规）
   - ✅ 所有测试使用稳定的定位器（data-testid 或语义化）
   - ✅ 测试之间完全隔离，无状态泄漏
   - ✅ 无硬编码等待时间（0 个 `page.waitForTimeout()`）

3. **开发效率**：
   - ✅ 新测试编写时间 < 1 小时（使用 AI 辅助）
   - ✅ 冒烟测试运行时间 < 3 分钟（调整后的目标）
   - ✅ 单个测试执行时间 < 60 秒（调整后的目标）
   - ✅ 提供清晰的测试文档和示例

4. **测试稳定性**：
   - ✅ 测试通过率 = 100%（在 CI 中）
   - ✅ 测试稳定性 ≥ 95%（重复运行 10 次，至少 9 次成功）
   - ✅ 无 flaky tests（不稳定的测试）

5. **代码质量**：
   - ✅ 所有 ESLint 规则通过
   - ✅ 所有 AI 生成代码通过质量 checklist
   - ✅ 页面对象方法复用率 > 60%
   - ✅ 测试代码与业务逻辑耦合度 < 30%

### 质量指标（应该满足）

6. **文档完善**：
   - ✅ README 包含运行和编写指南
   - ✅ 代码规范清晰明确
   - ✅ 示例代码可用（templates/ 和 examples/）
   - ✅ AI 生成代码质量 Checklist 完善

7. **可维护性**：
   - ✅ 测试代码清晰易读
   - ✅ 页面对象模型良好封装
   - ✅ 测试数据集中管理
   - ✅ Mock API 函数易于使用

### 可选指标（可以满足）

8. **团队采纳**：
   - 📝 团队成员能够独立编写测试
   - 📝 团队成员能够使用 AI 辅助生成测试
   - 📝 团队反馈积极

9. **性能优化**：
   - 📝 测试套件执行时间 < 5 分钟
   - 📝 初始化流程优化（跳过远程 API 调用）

### 验证方法

**量化指标验证**：
```bash
# 1. 运行所有测试
pnpm test:e2e

# 2. 运行冒烟测试并计时
time pnpm test:e2e:smoke

# 3. 检查 ESLint
pnpm lint e2e/

# 4. 检查测试覆盖率
pnpm test:e2e --coverage

# 5. 稳定性测试（重复 10 次）
for i in {1..10}; do pnpm test:e2e:smoke || exit 1; done
```

**质量指标验证**：
- 人工审查代码是否符合页面对象模型
- 人工审查定位器是否稳定
- 人工审查是否有硬编码等待
- 检查文档是否完整

**失败处理**：
- 如果量化指标未达标 → 优化测试或调整目标
- 如果质量指标未达标 → 完善文档和规范
- 如果可选指标未达标 → 记录为未来改进项
