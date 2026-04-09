## Context

项目测试体系成熟（1575 个通过测试），但审查发现三类问题：永真断言掩盖缺陷、组件测试深度不足、安全模块缺失测试。本次改动仅涉及测试文件，无生产代码变更。

现有测试基础设施：Vitest + React Testing Library + jsdom，遵循行为驱动测试原则（`src/__test__/README.md`）。

## Goals / Non-Goals

**Goals**:
- 消除永真断言，使每个测试用例都有真实的验证价值
- 将组件测试从"能渲染"提升到"能交互"
- 为安全相关模块建立测试覆盖（crypto-helpers、htmlEscape）
- 为复杂逻辑模块建立测试覆盖（codeBlockUpdater）
- 改进中间件测试，从验证实现细节转向验证数据状态

**Non-Goals**:
- 不补充 components/ui/（shadcn/ui 第三方组件）的测试
- 不补充低优先级缺失测试（urlUtils、env.ts、providerUtils）
- 不改变测试框架或测试基础设施
- 不修改生产代码

## Decisions

### 1. providerFactory 错误测试策略：Mock providerLoader 模块

**选择**：Mock `providerLoader` 模块使 `loadProvider` 返回 rejected Promise，验证 `getProvider` 抛出包含原始错误信息的增强错误（含 `providerKey` 和 cause）。

**替代方案**：修改 providerFactory 源码暴露错误处理 → 拒绝，因为不应为测试修改生产代码。

**理由**：`getProvider` 内部通过 `loader.loadProvider(providerKey)` 调用动态加载（已被 `providerLoader` 模块抽象），Mock 该模块是合理的系统边界隔离。

### 2. Splitter 面板结构测试：ResizeObserver Mock + 渲染验证

**选择**：Mock ResizeObserver 防止 jsdom 报错，验证多行/多列面板的渲染结构和嵌套关系。

**理由**：Splitter 当前为纯渲染组件，使用 `ResizablePanelGroup`/`ResizablePanel` 但未传入 `onLayout` 回调，因此测试聚焦于面板结构正确性而非交互回调。

### 3. ModelSelect 交互测试：验证 Redux 数据渲染

**选择**：提供 mock Redux store 包含模型数据，验证模型列表渲染和选择交互。

**理由**：ModelSelect 依赖 Redux store，需要通过 wrapper 注入 mock store。

### 4. crypto-helpers 测试：使用 Web Crypto API polyfill

**选择**：在 jsdom 环境中使用 `globalThis.crypto.subtle` polyfill（项目已在 `crypto.test.ts` 中使用此模式）。

**理由**：保持与现有加密测试一致的模式，项目已有成熟的 polyfill 方案。

### 5. codeBlockUpdater 测试：Mock DOM API

**选择**：Mock `document.querySelector` 和 `document.getElementById`，验证 DOM 操作行为而非真实 DOM。

**理由**：codeBlockUpdater 直接操作 DOM，jsdom 不支持完整的 DOM 渲染流程，Mock DOM API 是合理的系统边界隔离。

### 6. htmlEscape 测试：分别验证两种实现，测试核心字符一致性

**选择**：分别测试两种实现的转义行为，再对核心 XSS 字符（`& < > " '`）验证一致性。`escapeHtml`（DOM API）不转义 `/`，`escapeHtmlManual` 转义 `/` 为 `&#x2F;`，这是已知差异。

**替代方案**：强制两种实现完全一致 → 拒绝，因为 DOM API 的行为由浏览器决定，无法修改。

**理由**：两种实现在核心 XSS 防护字符上行为一致，`/` 字符的差异不影响安全性（`/` 不是 XSS 攻击的关键字符）。

## Risks / Trade-offs

- **[Web Crypto API 兼容性]** jsdom 不完全支持 Web Crypto API → 使用项目已有的 polyfill 模式
- **[Splitter 组件耦合]** Splitter 依赖 ResizablePanelGroup 内部实现 → 测试 onLayout 回调而非内部状态
- **[codeBlockUpdater WeakRef]** WeakRef 在测试中行为可能不同 → Mock WeakRef 相关逻辑
- **[ModelSelect Redux 依赖]** 需要 mock 完整的 Redux store → 复用项目已有的 renderWithProviders 工具

## Migration Plan

无需迁移。所有改动在测试文件中，直接提交即可。

## Open Questions

无。
