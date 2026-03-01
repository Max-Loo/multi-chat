# 设计文档：Playwright E2E 测试架构

## Context

### 当前状态
项目是一个 Tauri + React + TypeScript 的桌面聊天应用，具有完善的单元测试体系（68个测试文件，65%覆盖率），但完全缺少端到端测试。

### 技术栈
- **前端框架**：React 19 + TypeScript + Vite
- **后端**：Rust + Tauri 2.0
- **状态管理**：Redux Toolkit
- **现有测试**：Vitest + React Testing Library

### 约束条件
- E2E 测试执行时间需要可控（5-30秒/测试）
- 测试应该易于维护，不增加过多开发负担
- 需要为未来 CI/CD 集成预留接口
- 不能影响现有的开发工作流

### 利益相关者
- **开发团队**：需要快速编写和维护测试
- **产品质量**：需要保障核心用户流程的稳定性
- **最终用户**：需要应用功能可靠、无回归问题

---

## Goals / Non-Goals

### Goals（目标）
1. **建立 E2E 测试能力**：覆盖核心用户流程的自动化测试
2. **提高测试编写效率**：利用 AI 辅助和 CLI 工具减少手动编写工作量
3. **保障核心流程稳定性**：为聊天发送、模型管理、应用初始化建立回归测试
4. **易于维护**：通过页面对象模型和测试数据工厂降低维护成本
5. **本地开发友好**：提供快速的测试反馈，支持选择性运行

### Non-Goals（非目标）
1. ❌ **100% 测试覆盖**：只覆盖核心用户流程，不追求全面覆盖
2. ❌ **CI/CD 集成**：本次不包含自动化流水线配置（为未来预留接口）
3. ❌ **性能测试**：不包含负载测试和性能基准测试
4. ❌ **跨平台测试**：仅在 Chromium 浏览器上测试，不覆盖多浏览器
5. ❌ **Tauri 原生功能测试**：专注 Web 界面测试，不测试系统托盘等原生功能

---

## Decisions

### 决策 1：测试模式选择 - Web 模式而非 Tauri 模式

**选择**：使用 `pnpm web:dev` 启动纯 Web 版本进行 E2E 测试

**理由**：
- ✅ **简单稳定**：避免 Tauri WebView 的复杂性和不稳定性
- ✅ **快速启动**：Web 模式启动更快（~1秒 vs Tauri 的 ~5秒）
- ✅ **调试友好**：可以直接使用 Chrome DevTools
- ✅ **足够覆盖**：核心用户流程都在 Web 层，Tauri 特定功能较少

**权衡**：
- ❌ 无法测试 Tauri 原生功能（系统托盘、文件系统访问）
- **缓解**：这些功能不是核心用户流程，可通过集成测试覆盖

**替代方案（已拒绝）**：
- **Tauri 模式测试**：配置复杂、启动慢、不稳定

---

### 决策 2：测试生成策略 - AI 辅助生成

**选择**：使用 AI Coding Agents 直接生成测试代码，辅以可选的页面探索工具

**核心工具定位**：
- **AI Agent（opencode）**：核心代码生成工具（主要）
- **playwright-cli**：可选的页面探索工具（辅助）
- **@playwright/test**：测试运行框架（必需）

---

## 工作流程

```
┌─────────────────────────────────────────────────────────────┐
│           AI 辅助的 E2E 测试生成工作流                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  方案 A：快速模式（简单场景）                                  │
│  ─────────────────────────────────────                       │
│  1. 描述测试场景（自然语言）                                  │
│  2. AI Agent 直接生成测试代码                                │
│  3. 运行并验证测试                                           │
│                                                              │
│  方案 B：探索模式（复杂场景）                                  │
│  ─────────────────────────────────────                       │
│  1. 描述测试场景                                             │
│  2. 使用 playwright-cli 探索页面元素（可选）                  │
│     - playwright-cli open http://localhost:1420             │
│     - 执行操作，了解页面结构                                 │
│     - 获取元素选择器信息                                     │
│  3. 将探索结果提供给 AI Agent                               │
│  4. AI Agent 生成测试代码                                    │
│  5. 运行并验证测试                                           │
│                                                              │
│  方案 C：调试模式（测试失败时）                                │
│  ─────────────────────────────────────                       │
│  1. 测试失败                                                 │
│  2. 使用 npx playwright show-trace 查看执行轨迹              │
│  3. 使用 playwright-cli 重新探索失败的步骤                    │
│  4. 修正测试代码                                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## AI Agent Prompt 模板

### 基础 Prompt

```markdown
你是一个专业的 E2E 测试工程师。请帮我生成一个 Playwright 测试。

## 测试场景
[描述测试场景，例如：用户可以创建新聊天并发送消息]

## 技术要求
- 使用 TypeScript
- 使用 @playwright/test 框架
- 使用页面对象模型（Page Object Model）
- 使用 data-testid 定位器
- 包含必要的断言
- 不使用硬编码的等待时间

## 项目信息
- 测试目录：e2e/
- 页面对象目录：e2e/pages/
- 辅助工具目录：e2e/helpers/
- 应用 URL：http://localhost:1420

## 页面结构
[如果有 playwright-cli 探索结果，提供这里]

请生成完整的测试代码，包括：
1. 测试文件
2. 需要的页面对象
3. 需要的辅助函数
```

### 带 playwright-cli 探索的 Prompt

```markdown
## 页面探索结果

我使用 playwright-cli 探索了页面，发现以下元素：

### 快照信息
```yaml
# playwright-cli snapshot 输出
- 创建聊天按钮: ref=e15, text="新建聊天"
- 消息输入框: ref=e5, placeholder="输入消息"
- 发送按钮: ref=e8, text="发送"
```

### 实际操作步骤
1. playwright-cli open http://localhost:1420
2. playwright-cli click e15  # 点击创建聊天
3. playwright-cli fill e5 "Hello"  # 输入消息
4. playwright-cli click e8  # 点击发送
5. playwright-cli snapshot --filename=chat-sent.yml

请基于这些信息生成测试代码。
```

---

## playwright-cli 使用场景

### ✅ 应该使用的场景

1. **探索未知页面**
   ```bash
   # 快速了解页面结构
   playwright-cli open http://localhost:1420/model
   playwright-cli snapshot
   ```

2. **验证选择器**
   ```bash
   # 测试选择器是否正确
   playwright-cli open http://localhost:1420
   playwright-cli click [data-testid="submit-button"]
   ```

3. **调试测试失败**
   ```bash
   # 重新执行失败的步骤
   playwright-cli open http://localhost:1420
   playwright-cli goto /model
   # 手动执行操作，观察页面行为
   ```

### ❌ 不应该使用的场景

1. ❌ 代码生成（没有 test-gen 命令）
2. ❌ 批量测试（使用 @playwright/test）
3. ❌ CI/CD 集成（使用 npx playwright test）

---

## AI Agent 优势

相比录制工具，AI Agent 的优势：

| 维度 | 录制工具 | AI Agent |
|------|----------|----------|
| 页面对象模型 | ❌ 需要手动重构 | ✅ 自动生成 |
| 定位器优化 | ❌ 常用 CSS 类名 | ✅ 优先 data-testid |
| 测试数据 | ❌ 硬编码数据 | ✅ 使用工厂函数 |
| 断言质量 | ⚠️ 基础断言 | ✅ 业务逻辑断言 |
| 代码可读性 | ❌ 面向实现 | ✅ 面向业务 |
| 维护成本 | ❌ 高 | ✅ 低 |

---

## 修正后的工作示例

### 示例 1：简单测试（无需探索）

```bash
# 直接使用 AI Agent 生成
opencode> "帮我生成一个测试：用户可以创建新聊天"

# AI 生成的代码
# e2e/chat-creation.spec.ts
# e2e/pages/chat-page.ts
```

### 示例 2：复杂测试（需要探索）

```bash
# 第一步：探索页面
playwright-cli open http://localhost:1420/model
playwright-cli snapshot --filename=model-page.yml

# 第二步：提供给 AI Agent
opencode> """
基于以下探索结果生成模型管理测试：
[粘贴 model-page.yml 内容]

测试场景：添加新模型
要求：使用页面对象模型，data-testid 定位器
"""

# AI 生成的代码
# e2e/model-management.spec.ts
# e2e/pages/model-page.ts
```

### 示例 3：调试失败测试

```bash
# 测试失败
pnpm test:e2e model-management.spec.ts

# 查看轨迹
npx playwright show-trace test-results/trace.zip

# 使用 playwright-cli 重新探索
playwright-cli open http://localhost:1420
playwright-cli goto /model
# 手动执行失败的步骤

# 让 AI Agent 修正
opencode> "测试失败了，错误信息是[...]，请帮我修正"
```

---

## 代码质量控制机制

### 1. 强制质量 Checklist

所有生成的代码必须满足以下条件：

```markdown
代码质量 Checklist：
- [ ] 使用页面对象模型（直接操作 page 则不合格）
- [ ] 使用 data-testid 或语义化定位器（CSS 类名则不合格）
- [ ] 包含必要的断言（无断言则不合格）
- [ ] 没有硬编码的等待时间（固定 delay 则不合格）
- [ ] 测试数据使用工厂函数
- [ ] 包含错误处理和重试逻辑
```

### 2. AI Agent 优势

- ✅ **代码质量高**：自动使用页面对象模型、语义化定位器
- ✅ **维护成本低**：业务语言描述，易于理解和修改
- ✅ **学习曲线平缓**：自然语言交互，无需学习录制工具
- ✅ **适合复杂场景**：能够理解业务逻辑，生成完整测试
- ✅ **持续改进**：随着项目进行，AI 越来越了解代码结构

### 3. playwright-cli 辅助优势（仅在需要时使用）

- ✅ **快速探索**：了解未知页面的元素结构
- ✅ **验证选择器**：测试定位器是否正确
- ✅ **调试辅助**：重现失败的测试步骤

### 4. 自动化验证

- ESLint 规则禁止使用 `page.waitForTimeout()` 和 `page.waitFor()`
- 自定义 Playwright fixture 强制使用页面对象
- Pre-commit hook 运行 `pnpm lint` 和 `pnpm test:e2e --dry-run`

### 5. 渐进式信任策略

- **阶段 1**（Week 1-2）：100% 人工审查，所有生成代码必须经过详细 code review
- **阶段 2**（Week 3-4）：50% 人工审查，随机抽查生成代码
- **阶段 3**（Week 4+）：20% 人工审查，重点审查新增功能的测试

### 6. 代码审查要点

人工审查时重点关注：
- 页面对象模型使用是否正确
- 定位器是否稳定（优先使用 data-testid）
- 测试数据是否隔离（使用工厂函数）
- 断言是否充分（覆盖关键业务逻辑）
- 是否有硬编码的等待时间

---

## 权衡

**优点**：
- ✅ **代码质量高**：AI 自动应用最佳实践
- ✅ **开发效率高**：自然语言描述，快速生成
- ✅ **维护成本低**：业务语言，易于理解
- ✅ **灵活性高**：支持简单和复杂场景

**缺点**：
- ❌ 需要审查 AI 生成代码
  - **缓解**：建立质量 checklist 和渐进式信任策略
- ❌ AI 可能误解业务逻辑
  - **缓解**：提供充分的上下文和清晰的场景描述

---

## 替代方案（已评估）

- **Playwright codegen**：适合快速原型，但不适合生产代码（需要大量重构）
- **纯手动编写**：适合复杂场景，但开发效率低
- **playwright-cli 探索**：适合页面探索和快照，但不适合代码生成（无 test-gen 命令）
- **本方案**：AI Agent 直接生成 + 可选工具辅助探索，平衡速度和质量

---

### 决策 3：页面对象模型（POM）设计

**选择**：采用页面对象模型封装页面交互逻辑

**结构**：
```
e2e/pages/
├── chat-page.ts          # 聊天页面对象
│   ├── goto()            # 导航到页面
│   ├── createNewChat()   # 创建新聊天
│   ├── selectModel()     # 选择模型
│   └── sendMessage()     # 发送消息
├── model-page.ts         # 模型管理页面对象
│   ├── goto()
│   ├── clickAddModel()
│   ├── fillModelForm()
│   └── submit()
└── app-page.ts           # 应用级页面对象
    ├── goto()
    ├── waitForInitialization()
    └── getData()
```

**理由**：
- ✅ **代码复用**：同一页面的操作可在多个测试中复用
- ✅ **易于维护**：UI 变更只需修改页面对象，不影响测试代码
- ✅ **提高可读性**：测试代码更接近业务语言
- ✅ **降低耦合**：测试代码与 DOM 结构解耦

**示例**：
```typescript
// 测试代码
test('用户可以发送聊天消息', async ({ page }) => {
  const chatPage = new ChatPage(page);

  await chatPage.goto();
  await chatPage.createNewChat();
  await chatPage.selectModel('DeepSeek');
  await chatPage.sendMessage('Hello');

  await expect(chatPage.lastMessage).toContainText('Hello');
});
```

---

### 决策 4：测试数据管理策略

**选择**：使用工厂函数模式管理测试数据

**结构**：
```
e2e/helpers/
├── test-data.ts          # 测试数据工厂
│   ├── createTestModel() # 创建测试模型
│   ├── createTestChat()  # 创建测试聊天
│   └── testMessages      # 测试消息集合
└── test-utils.ts         # 测试辅助函数
    ├── setupTestData()   # 设置测试数据
    ├── cleanupTestData() # 清理测试数据
    └── waitForIdle()     # 等待应用空闲
```

**理由**：
- ✅ **数据隔离**：每个测试使用独立数据，避免相互影响
- ✅ **易于维护**：集中管理测试数据，修改方便
- ✅ **可读性强**：测试代码清晰表达意图

**示例**：
```typescript
// test-data.ts
export const testModelFactory = (overrides?: Partial<Model>) => ({
  nickname: 'E2E Test Model',
  apiKey: 'test-api-key',
  apiAddress: 'https://api.deepseek.com/v1',
  modelKey: 'deepseek-chat',
  providerKey: 'deepseek',
  ...overrides,
});

// 测试代码
const testModel = testModelFactory({ nickname: 'Custom Model' });
```

---

### 决策 5：测试环境隔离策略

**选择**：使用唯一测试数据标识 + 测试前后清理

**实现方案**：

**1. 测试数据隔离**
- 每个测试使用唯一的测试数据标识（如 `test-chat-${Date.now()}-${Math.random()}`）
- 测试数据工厂生成带唯一标识的数据
- 避免使用固定的测试数据名称

**2. 测试前后清理**
```typescript
// test-utils.ts
export async function setupTestData() {
  const testId = `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await clearTestData(testId);
  return testId;
}

export async function clearTestData(prefix?: string) {
  // 清理所有测试创建的聊天（以 test- 开头）
  // 清理所有测试创建的模型（以 E2E Test 开头）
  // 清理 IndexedDB 和 localStorage
}
```

**3. IndexedDB 隔离**
- 使用测试专用的 IndexedDB 数据库名称（如 `multi-chat-test`）
- 在 `setupTestData()` 中切换到测试数据库
- 测试后删除测试数据库

**4. Web 模式限制**
- **注意**：Web 模式无法隔离文件系统（Tauri Store）
- **缓解**：Web 模式使用 IndexedDB，已与 Tauri 数据隔离
- **验证**：确保 Web 模式不影响开发环境的数据

**配置示例**：
```typescript
// playwright.config.ts
use: {
  launchOptions: {
    args: ['--user-data-dir=/tmp/playwright-test-profile'],
  },
  // 每个 test 文件使用独立的 context
  contextOptions: {
    storageState: undefined, // 不使用存储状态
  },
},
```

**理由**：
- ✅ **完全隔离**：测试数据不影响开发数据
- ✅ **可重复性**：每次测试运行结果一致
- ✅ **并行安全**：支持未来并行测试扩展
- ✅ **实现简单**：无需修改 Tauri 配置

---

### 决策 6：定位器策略

**选择**：优先使用 `data-testid`，其次使用语义化定位器

**定位器优先级**：
1. **data-testid**（最稳定）- 测试专用属性
2. **getByRole**（可访问性）- 按角色定位（button, link）
3. **getByText**（语义化）- 按文本内容
4. **getByLabelText**（表单）- 按标签关联
5. **CSS selector**（最后手段）- 仅当无其他选择时

**规范**：
```typescript
// ✅ 推荐
await page.click('[data-testid="send-button"]');
await page.click('button', { name: '发送' });

// ❌ 避免
await page.click('.ant-btn-primary.ant-btn-icon-only');
```

**理由**：
- ✅ **稳定性高**：data-testid 不受 CSS 类名变更影响
- ✅ **可访问性**：getByRole 促进无障碍访问
- ✅ **易于维护**：语义化定位器自解释

---

### 决策 7：测试组织结构

**选择**：扁平化结构（初期），按功能模块组织（扩展后）

**目录结构**：
```
e2e/
├── chat-flow.spec.ts              # 聊天发送流程测试
├── model-management.spec.ts       # 模型管理流程测试
├── app-initialization.spec.ts     # 应用初始化测试
├── helpers/
│   ├── test-data.ts               # 测试数据工厂
│   ├── test-utils.ts              # 测试辅助函数
│   └── assertions.ts              # 自定义断言
├── pages/
│   ├── chat-page.ts               # 聊天页面对象
│   ├── model-page.ts              # 模型管理页面对象
│   └── app-page.ts                # 应用页面对象
├── templates/
│   ├── test.template.ts           # 测试代码模板
│   └── page-object.template.ts    # 页面对象模板
│   └── ai-prompts/                # AI 辅助生成 Prompt 模板
│       ├── basic-test.prompt.md   # 基础测试生成
│       ├── with-exploration.prompt.md  # 探索后生成
│       └── debugging.prompt.md    # 调试辅助
├── examples/
│   └── simple-flow.example.ts     # 简单测试示例
├── AI-TESTING-GUIDE.md            # AI 辅助测试指南
└── README.md                      # E2E 测试文档
```

**扩展后的结构**（当测试文件 > 10 个时）：
```
e2e/
├── chat/
│   ├── chat-flow.spec.ts
│   ├── message-streaming.spec.ts
│   └── chat-history.spec.ts
├── model/
│   ├── model-management.spec.ts
│   └── model-form.spec.ts
├── app/
│   ├── initialization.spec.ts
│   └── data-persistence.spec.ts
├── helpers/                       # 保持不变
├── pages/                         # 保持不变
├── templates/                     # 保持不变
└── examples/                      # 保持不变
```

**理由**：
- ✅ **简单明了**：初期测试文件少，扁平化结构更清晰
- ✅ **易于扩展**：测试增长后可按功能分组
- ✅ **符合惯例**：遵循 Playwright 最佳实践
- ✅ **降低复杂度**：避免过度设计

**迁移时机**：
- 当某个功能模块的测试文件 > 3 个时，创建子目录
- 当总测试文件数 > 10 个时，全面迁移到分组结构

---

### 决策 8：测试运行策略

**选择**：支持标签分组 + 选择性运行

**标签系统**：
- `@smoke`：冒烟测试（核心流程，快速验证）
- `@regression`：回归测试（完整流程，较慢）
- `@slow`：慢速测试（需要等待或网络请求）

**运行方式**：
```bash
# 运行所有测试
pnpm test:e2e

# 仅运行冒烟测试
pnpm test:e2e --grep @smoke

# 运行特定文件
pnpm test:e2e chat-flow.spec.ts

# 调试模式
pnpm test:e2e:debug
```

**理由**：
- ✅ **快速反馈**：开发时只运行相关测试
- ✅ **分层测试**：CI 可按标签分阶段运行
- ✅ **降低成本**：避免等待不必要的测试

---

## Risks / Trade-offs

### 风险 1：E2E 测试执行时间长

**描述**：每个 E2E 测试需要 5-30 秒，完整测试套件可能需要数分钟

**影响**：
- 开发反馈周期变长
- 提交前可能跳过测试

**缓解措施**：
- ✅ **标签分组**：开发时只运行 `@smoke` 测试（~30秒）
- ✅ **选择性运行**：使用 `--file` 参数只运行相关测试
- ✅ **并行执行**：未来配置 workers 并行运行
- ✅ **快速失败**：遇到失败立即停止（`--fail-fast`）

---

### 风险 2：测试不稳定性（Flaky Tests）

**描述**：测试可能间歇性失败，导致信任度下降

**影响**：
- 开发人员忽视测试失败
- 调试测试消耗时间

**缓解措施**：
- ✅ **自动重试**：配置 retries: 2（失败后自动重试）
- ✅ **合理超时**：timeout: 30000ms（足够但不至于过长）
- ✅ **稳定定位器**：优先使用 data-testid
- ✅ **等待策略**：使用 `waitFor` 而非固定延迟
- ✅ **环境隔离**：每个测试使用独立数据

---

### 风险 3：AI 生成代码质量不稳定

**描述**：AI 生成的测试代码可能包含错误或低效模式

**影响**：
- 需要人工审查和修正
- 可能引入低质量代码

**缓解措施**：
- ✅ **代码审查**：所有 AI 生成的代码必须人工审查
- ✅ **最佳实践**：建立代码规范（POM、定位器策略）
- ✅ **逐步信任**：初期多审查，后期可放宽
- ✅ **测试验证**：生成后立即运行验证

---

### 风险 4：测试维护成本

**描述**：随着 UI 变更，测试需要频繁更新

**影响**：
- 维护测试占用开发时间
- 测试可能被废弃

**缓解措施**：
- ✅ **页面对象模型**：UI 变更集中在页面对象层修改
- ✅ **语义化定位器**：减少因样式变更导致的失败
- ✅ **定期审查**：删除过时或低价值的测试
- ✅ **价值导向**：只维护核心流程测试

---

### 风险 5：Web 模式无法覆盖 Tauri 特定功能

**描述**：选择 Web 模式测试无法验证系统托盘、文件系统等原生功能

**影响**：
- 部分 Tauri 功能缺少 E2E 验证

**缓解措施**：
- ✅ **集成测试覆盖**：Tauri 功能已有集成测试
- ✅ **手动测试**：原生功能可通过手动测试验证
- ✅ **未来扩展**：可选择性引入 Tauri 模式 E2E 测试

---

### 权衡 1：测试覆盖 vs 开发速度

**选择**：牺牲覆盖率，换取开发速度

**策略**：
- 只覆盖核心用户流程（3个主要场景）
- 不追求 100% 路径覆盖
- 优先保障稳定性和可维护性

**原因**：
- 过多 E2E 测试会降低开发效率
- 单元测试已覆盖大部分逻辑
- E2E 测试价值在于验证集成

---

### 权衡 2：测试独立性 vs 执行时间

**选择**：优先保证测试独立性，接受较长执行时间

**策略**：
- 每个测试独立设置数据
- 不共享状态，避免依赖顺序
- 单线程执行（workers: 1）

**原因**：
- 独立测试更可靠
- 调试更容易
- 未来可优化为并行

---

## Migration Plan

### 阶段 1：基础设施搭建（Week 1）

**步骤**：
1. 安装 Playwright
   ```bash
   pnpm add -D @playwright/test
   npx playwright install chromium
   ```

2. 创建配置文件
   - `playwright.config.ts`：基础配置
   - `e2e/helpers/`：测试辅助工具
   - `e2e/pages/`：页面对象模型

3. 添加测试脚本
   ```json
   {
     "test:e2e": "playwright test",
     "test:e2e:ui": "playwright test --ui",
     "test:e2e:debug": "playwright test --debug"
   }
   ```

4. 创建第一个示例测试
   - 验证基础设施可用

**成功标准**：
- ✅ 能够运行 `pnpm test:e2e`
- ✅ 示例测试通过
- ✅ 测试报告正常生成

---

### 阶段 2：核心流程测试（Week 2-3）

**步骤**：
1. 添加 data-testid 属性
   - 聊天相关组件
   - 模型管理组件
   - 应用初始化组件

2. 创建页面对象
   - ChatPage
   - ModelPage
   - AppPage

3. 编写核心测试
   - `chat-flow.spec.ts`：聊天发送流程
   - `model-management.spec.ts`：模型管理流程
   - `app-initialization.spec.ts`：应用初始化流程

4. 使用 Playwright CLI + AI 辅助生成代码

**成功标准**：
- ✅ 3 个核心流程测试通过
- ✅ 覆盖主要用户路径
- ✅ 测试执行时间 < 5 分钟

---

### 阶段 3：优化和文档（Week 4）

**步骤**：
1. 测试优化
   - 添加标签（@smoke, @regression）
   - 优化定位器
   - 减少等待时间

2. 编写文档
   - 如何运行测试
   - 如何编写新测试
   - 如何调试测试

3. 建立规范
   - 代码审查清单
   - 测试命名规范
   - 定位器使用规范

**成功标准**：
- ✅ 冒烟测试 < 1 分钟
- ✅ 文档完整
- ✅ 团队成员可独立编写测试

---

### 回滚策略

如果 E2E 测试引入导致问题：
1. **禁用测试**：在 `package.json` 中移除测试脚本（不影响现有代码）
2. **删除依赖**：`pnpm remove @playwright/test`（完全回滚）
3. **保留数据**：data-testid 属性不影响功能，可保留

**影响范围**：
- 仅影响测试相关文件
- 不影响应用功能
- 不影响现有单元测试

---

## Open Questions

### Q1: 是否需要真实 API Key？

**当前状态**：已决定

**决策**：使用 Playwright route 拦截 Mock API

**实现方案**：
```typescript
// test-utils.ts
export async function mockRemoteAPI(page: Page) {
  await page.route('https://models.dev/api.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        providers: [
          {
            key: 'deepseek',
            name: 'DeepSeek',
            models: [
              { key: 'deepseek-chat', name: 'DeepSeek Chat' }
            ]
          }
        ]
      })
    });
  });
}

// 测试中使用
test('使用 Mock API', async ({ page }) => {
  await mockRemoteAPI(page);
  // ... 测试逻辑
});
```

**理由**：
- ✅ **快速稳定**：无需网络请求，测试运行快且稳定
- ✅ **无费用**：不消耗真实 API 配额
- ✅ **可控**：可以模拟各种 API 响应场景
- ✅ **简单**：无需引入额外依赖（如 MSW）

**真实 API 验证**（可选）：
- 仅在发布前手动运行，使用真实 API Key 验证兼容性
- 不包含在自动化测试套件中
- 测试命令：`pnpm test:e2e:real-api`

**决策时间**：阶段 2 实施时实现 mockRemoteAPI 函数

---

### Q2: 测试数据清理策略

**当前状态**：已决定

**决策**：每个测试后自动清理 + 唯一数据标识

**实现方案**：
```typescript
// test-utils.ts
export async function setupTestData() {
  const testId = `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await clearTestData(); // 清理之前的测试数据
  return testId;
}

export async function clearTestData() {
  // 1. 清理 IndexedDB
  await indexedDB.deleteDatabase('multi-chat-test');

  // 2. 清理 localStorage
  localStorage.clear();

  // 3. 清理 sessionStorage
  sessionStorage.clear();
}

// playwright.config.ts
use: {
  // 每个 test 后自动清理
  setupTimeout: 60000,
}
```

**测试文件中的使用**：
```typescript
test.beforeEach(async ({ page }) => {
  const testId = await setupTestData();
  await page.goto(`/?test=${testId}`);
});

test.afterEach(async ({ page }) => {
  await clearTestData();
});
```

**理由**：
- ✅ **完全隔离**：每个测试独立运行，无状态泄漏
- ✅ **可靠**：最安全的策略，避免测试相互影响
- ✅ **可维护**：清理逻辑集中在 test-utils.ts

**性能影响**：
- 每个 test 增加约 100-500ms 清理时间
- 对于 E2E 测试（5-30 秒）来说，影响可接受

---

### Q3: 是否需要测试快照（Visual Regression）？

**当前状态**：不在本次范围

**未来考虑**：
- 如果 UI 频繁变更，可能需要
- 可使用 Playwright 截图 + Percy/Applitools

**建议**：暂不引入，按需评估

---

### Q4: 是否需要 Tauri 模式 E2E 测试？

**当前状态**：不在本次范围

**决策**：本次仅实施 Web 模式测试，Tauri 特定功能通过其他方式覆盖

**Web 模式无法测试的功能**：
- ❌ Tauri 命令调用（invoke）
- ❌ 系统钥匙串集成（masterKey 系统钥匙串模式）
- ❌ Tauri Store 文件系统存储
- ❌ 系统托盘和原生窗口
- ❌ 文件系统访问

**替代测试策略**：
1. **集成测试**：现有 `src-tauri/tests/` 覆盖 Tauri 后端逻辑
2. **手动测试**：Tauri 特定功能通过手动测试验证
3. **未来扩展**：可选择性引入 Tauri 模式 E2E 测试（作为独立项目）

**Web 模式测试边界**：
- ✅ React 组件和 UI 交互
- ✅ Redux 状态管理
- ✅ IndexedDB 数据持久化
- ✅ 应用初始化流程（Web 版本）
- ✅ 聊天发送和模型管理（Web 版本）

**建议**：在实施文档中明确标注测试边界，避免期望过高

---

### Q5: 是否需要并行测试支持？

**当前状态**：初期不支持

**决策**：初期单线程执行（workers: 1），测试套件增长后再优化

**当前配置**：
```typescript
// playwright.config.ts
workers: 1, // 单线程执行
```

**未来优化时机**：
- 当测试套件执行时间 > 10 分钟时
- 当测试文件数 > 20 个时

**并行化前提条件**：
1. ✅ 测试数据完全隔离（已实现）
2. ✅ 无共享状态依赖
3. ✅ 每个测试独立运行

**未来配置**：
```typescript
// 并行执行（未来）
workers: process.env.CI ? 2 : 4, // CI 环境 2，本地 4
fullyParallel: true,
```

---

## Appendix

### 参考资料

- [Playwright 官方文档](https://playwright.dev/)
- [Playwright 最佳实践](https://playwright.dev/docs/best-practices)
- [页面对象模型模式](https://www.selenium.dev/documentation/test-practices/bem/page-object-model/)
- [测试选择器策略](https://playwright.dev/docs/selectors)

### 相关文档

- 提案：`proposal.md`
- 规格：`specs/e2e-testing/spec.md`
- 任务：`tasks.md`
