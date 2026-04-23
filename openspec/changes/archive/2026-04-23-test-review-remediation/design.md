## Context

测试体系包含 1845 个用例，整体覆盖率 73.3%。深度审查二次校验发现：
- 2 个安全关键路径（密钥导出 UI、数据重置确认）完全无测试
- 21 个文件共 70 处 CSS 类 `querySelector` 断言脆弱（前一轮变更已迁移部分）
- 8 个文件共 34 处条件守卫 `if (element)` 静默跳过断言
- 8 个 skip/todo 用例覆盖重要路径
- XSS 安全测试依赖 mock 而非真实库

现有测试基础设施成熟：18 个 mock 工厂文件、共享 fixture、测试隔离工具。命名规范统一为中文 BDD 风格。

## Goals / Non-Goals

**Goals:**
- 补充安全关键路径测试，消除 P0 风险
- 消除 CSS 类选择器和条件守卫两类脆弱断言模式
- 修复可行的跳过用例
- XSS 测试使用真实库验证安全效果

**Non-Goals:**
- 不提升分支覆盖率数值指标（渐进改善，非本次目标）
- 不重构测试基础设施（mock 工厂、fixture 等）
- 不补充 tauriCompat/env.ts、os.ts、shell.ts 测试（全局 mock 为设计决策）
- 不修改生产代码逻辑，仅添加 `data-testid` 属性

## Decisions

### D1: 安全关键测试采用组件级集成测试策略

KeyManagementSetting 和 useResetDataDialog 的测试 mock 外部依赖（exportMasterKey、resetAllData、copyToClipboard），但保留组件/hooks 的真实逻辑，验证完整交互流程。

**替代方案**：纯单元测试拆分每个函数。**否决原因**：安全关键路径价值在于端到端流程验证，拆分过细反而不验证关键集成点。

### D2: CSS 选择器迁移分两步走

1. 为组件添加 `data-testid` 属性（约 10-15 个组件）
2. 测试中用 `getByTestId` 替换 `querySelector('.tailwind-class')`

**替代方案**：直接使用 `getByRole`。**否决原因**：部分元素（装饰性 div、布局容器）无语义 role，`data-testid` 更通用。优先使用 `getByRole`，其次 `getByTestId`。

### D3: 条件守卫改为前置断言模式

将 `if (element) { fireEvent... }` 统一改为：
```typescript
const el = screen.getByRole('switch'); // 不存在则直接失败
fireEvent.click(el);
await waitFor(() => { /* 断言 */ });
```

### D4: 跳过用例分类处理

| 用例 | 处理方式 | 理由 |
|------|---------|------|
| chatMiddleware #170 | 修复：构造完整 runningChat state | 可行，需补充 mock 结构 |
| ChatPanelSender #353 | 保留 skip + 注释原因 | 功能被 hidden 禁用，非测试问题 |
| ChatPanelSender #428 | 实现 todo | 高价值，发送失败保持输入 |
| crypto-masterkey #332 | 保留 skip + 注释原因 | fake-indexedDB mock 死锁，环境限制 |
| keyring #761, #765 | 保留 skip + 注释原因 | Web Crypto API mock 不可靠 |
| keyringMigration #438, #443 | 保留 skip + 注释原因 | 模块缓存隔离问题 |

3 个用例可修复/实现，5 个因环境限制保留 skip 但补充详细注释。

### D5: XSS 测试移除 mock 使用真实库

ChatBubble.test.tsx 移除 markdown-it 和 DOMPurify 的 vi.mock，所有测试使用真实渲染流程。`vi.mock` 是文件级提升，无法按测试用例选择性 unmock，因此全量移除 mock 是唯一可行的技术方案。

**断言影响评估**：mock 的 markdown-it 对所有输入返回 `<p>${str}</p>`，保留了原始 Markdown 语法（如 `**Bold**`、`# Heading`）。真实 markdown-it 会将 `**Bold**` 渲染为 `<strong>Bold</strong>`、`# Heading` 渲染为 `<h1>Heading</h1>`，导致 `textContent` 完全不同。影响范围：
- **必定失败需重写（2 个）**：L68「Markdown 用户消息」断言 `toContain('**Bold**')`、L115「Markdown 助手消息」断言 `toContain('# Heading')`——需改为检查渲染后的 HTML 结构
- **需逐一排查（18 个）**：纯文本用例（如 `textContent.toBe('Hello')`）因真实 markdown-it 也会包裹 `<p>` 而可能仍通过，但需实际运行确认

**风险**：运行时间增加、2 个 Markdown 渲染测试需重写断言、其余 18 个非 XSS 用例需逐一排查。

## Risks / Trade-offs

- **[data-testid 污染生产代码]** → 仅在必要时添加，优先使用语义化查询
- **[真实库增加测试时间 + 断言重写]** → 2 个 Markdown 渲染测试断言必定失败需重写（L68、L115），其余 18 个非 XSS 用例需逐一排查
- **[CSS 选择器迁移范围大]** → 按文件批量处理，每批 5-8 个文件
- **[部分 skip 无法修复]** → 已标注环境限制，非代码质量问题
