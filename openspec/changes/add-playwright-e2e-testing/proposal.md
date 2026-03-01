# 提案：引入 Playwright 端到端测试

## Why

当前项目具有完善的单元测试和集成测试体系（68个测试文件，65%覆盖率），核心服务层（如 chatService）有详细的单元测试，Redux 状态管理也被充分测试。然而，项目**完全缺少端到端（E2E）测试**，导致无法验证完整的用户使用流程。

这意味着：
- **重构风险高**：代码重构可能破坏关键用户路径，但单元测试无法发现
- **跨页面交互未验证**：涉及多个页面和组件的完整流程没有被测试覆盖
- **真实场景未测试**：所有网络请求都被 Mock，无法验证真实 API 兼容性

现在引入 E2E 测试的时机成熟，因为：
1. 单元测试基础扎实，为 E2E 测试提供了稳定的基础
2. 核心业务流程已稳定，适合建立回归测试
3. 项目需要更高的质量保障，防止引入破坏性变更

## What Changes

引入 Playwright 作为 E2E 测试框架，利用 Playwright CLI 和 AI coding agents 辅助生成测试代码：

### 基础设施搭建
- 安装 Playwright 核心依赖（@playwright/test + 浏览器）
- 配置 Playwright 测试环境（playwright.config.ts）
- 创建测试辅助工具（测试数据工厂、页面对象模型）
- 配置测试环境隔离（独立的数据存储路径）
- 添加测试脚本到 `package.json`（`test:e2e`, `test:e2e:ui`, `test:e2e:debug`）

### 测试生成策略
- **AI 辅助生成（主要）**：使用 AI coding agents（opencode）直接生成测试代码
- **页面探索（可选）**：使用 playwright-cli 探索页面结构，了解元素选择器
- **手动优化**：审查和优化 AI 生成的代码，添加业务逻辑断言
- **页面对象模型**：维护可复用的页面对象类，提高代码可维护性
- **质量保障**：通过代码审查和自动化检查确保测试质量

### 核心流程 E2E 测试覆盖
- **聊天发送完整流程**：创建聊天 → 选择模型 → 发送消息 → 验证流式响应 → 验证历史保存
- **模型管理完整流程**：进入模型页 → 添加模型 → 填写表单 → 验证保存 → 编辑/删除模型
- **应用初始化和数据恢复**：首次启动 → 验证初始化屏幕 → 重启应用 → 验证数据持久化

### 测试边界说明
**本次 E2E 测试覆盖范围**：
- ✅ Web 层核心用户流程（聊天、模型管理、应用初始化）
- ✅ Redux 状态管理和数据持久化（IndexedDB）
- ✅ UI 组件交互和表单验证

**不在本次范围的 Tauri 特定功能**：
- ❌ Tauri 原生功能测试（系统托盘、文件系统、原生窗口）
- ❌ Tauri 命令调用（invoke）
- ❌ 系统钥匙串集成（masterKey 系统钥匙串模式）
- ❌ Tauri Store 文件系统存储

**Tauri 特定功能的测试策略**：
- 现有集成测试覆盖（如 `src-tauri/tests/`）
- 未来可引入 Tauri 专用的 E2E 测试方案（作为独立项目）
- 手动测试补充验证

### 代码调整
- 为关键 UI 元素添加 `data-testid` 属性（供测试定位器使用）
- 创建测试专用的配置文件（可选，用于环境隔离）

## Capabilities

### New Capabilities
- `e2e-testing`: 端到端测试能力，覆盖核心用户流程的自动化测试

### Modified Capabilities
无（这是新增测试能力，不改变现有功能规格）

## Impact

### 新增依赖
- `@playwright/test`: E2E 测试框架
- Playwright 浏览器（Chromium）

### 可选工具
- `playwright-cli`（@playwright/cli）：页面探索工具，用于快速了解页面结构
  - 状态：已全局安装，无需重复安装
  - 使用场景：探索页面、验证选择器、调试测试
  - 注意：不是必需的，AI Agent 可以直接生成测试代码

### 新增文件和目录
```
e2e/
├── chat-flow.spec.ts              # 聊天流程测试
├── model-management.spec.ts       # 模型管理流程测试
├── app-initialization.spec.ts     # 应用初始化测试
├── helpers/
│   ├── test-data.ts               # 测试数据工厂
│   └── test-utils.ts              # 测试辅助函数
├── pages/
│   ├── chat-page.ts               # 聊天页面对象
│   └── model-page.ts              # 模型管理页面对象
 ├── templates/
│   ├── test.template.ts           # 测试代码模板
│   ├── page-object.template.ts    # 页面对象模板
│   └── ai-prompts/                # AI 辅助生成 Prompt 模板
│       ├── basic-test.prompt.md   # 基础测试生成
│       ├── with-exploration.prompt.md  # 探索后生成
│       └── debugging.prompt.md    # 调试辅助
 ├── examples/
 │   └── simple-flow.example.ts     # 简单测试示例
 ├── AI-TESTING-GUIDE.md            # AI 辅助测试指南
 └── README.md                      # E2E 测试文档
playwright.config.ts               # Playwright 配置文件
```

### 修改的文件
- `package.json`: 添加测试脚本和 Playwright 依赖
- 部分组件：添加 `data-testid` 属性（不影响功能，仅用于测试定位）

### 开发流程影响
- 本地开发可以运行 E2E 测试验证功能
- 建议在提交代码前运行相关测试，确保核心流程未被破坏
- 为未来的 CI/CD 集成预留接口和脚本

### 风险和缓解
- **风险**：E2E 测试执行时间较长（5-30秒/测试）
  - **缓解**：按标签分组测试（如 `@smoke`, `@regression`），本地可选择性运行
- **风险**：测试可能不稳定（flaky tests）
  - **缓解**：配置自动重试、合理的超时时间、使用稳定的定位器
- **风险**：需要真实 API 或完善的 Mock
  - **缓解**：混合策略（开发阶段用 Mock，发布前用真实 API）
- **风险**：AI 生成的测试代码质量参差不齐
  - **缓解**：
    - 建立代码质量 checklist（强制验证点）
    - 自动化验证（ESLint 规则禁止硬编码等待）
    - 渐进式信任（初期 100% 人工审查）
    - AI 生成代码必须经过人工审查才能合并
