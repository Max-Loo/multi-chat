## Context

密钥导出功能当前使用「确认对话框 → 自动复制剪贴板」模式。在 Safari 中，`exportMasterKey()` 需要异步读取 IndexedDB/keyring，产生 async gap，导致后续剪贴板操作丢失用户手势上下文。现有的 `clipboard.ts` fallback（`execCommand('copy')`）也无法解决问题，因为 Safari 对 `execCommand('copy')` 同样有用户手势要求。

**现有流程（失败）**：
```
点击 "导出密钥" → 弹出警告对话框 → 点击确认
  → await exportMasterKey()     ← async gap，手势丢失
  → await copyToClipboard(key)  ← ❌ Safari NotAllowedError
```

**目标流程**：
```
点击 "导出密钥" → 弹出警告对话框 → 点击确认
  → await exportMasterKey()     ← async gap，但不需要剪贴板
  → 展示密钥 + 复制按钮

用户点击 "复制到剪贴板"
  → copyToClipboard(cachedKey)  ← 🖱️ 新手势，key 已缓存，无 async gap ✅
```

## Goals / Non-Goals

**Goals:**
- 在所有主流浏览器（Chrome、Firefox、Safari、Edge）及 Tauri webview 中可靠地导出并复制密钥
- 提供密钥可视化展示，用户可确认导出内容
- 保留安全警告机制

**Non-Goals:**
- 不修改 `clipboard.ts` 工具函数
- 不修改 `masterKey.ts` 密钥获取逻辑
- 不修改密钥导入和数据重置功能
- 不引入新的外部依赖

## Decisions

### 1. 将二次确认对话框改为密钥展示对话框

**决策**：用户确认安全警告后，不再自动复制到剪贴板，而是展示密钥内容并提供"复制到剪贴板"按钮。

**替代方案**：
- *预获取密钥 + 确认后复制*：点击导出时先获取密钥缓存到 state，确认时同步复制。**放弃原因**：在用户确认前就读取密钥，且确认后的复制操作仍经过 AlertDialog 的 onClick，存在隐式 async 链路风险。
- *去掉对话框直接复制*：一步到位。**放弃原因**：丢失安全警告，用户可能误操作。

**理由**：展示+复制模式将"获取密钥"和"写入剪贴板"拆为两个独立用户手势。复制按钮点击时 key 已在 state 中，`copyToClipboard` 在同步上下文内调用，彻底消除 async gap。

### 2. 密钥展示使用只读 Input 组件

**决策**：使用项目已有的 `Input` 组件，设置 `readOnly`，配合 `font-mono` 等宽字体展示密钥。

**理由**：复用现有 UI 组件，保持视觉一致性。等宽字体便于用户识别 hex 编码密钥。只读 Input 同时支持用户手动选中 + Cmd+C 作为终极 fallback。

### 3. 使用 AlertDialog 承载密钥展示

**决策**：复用现有 AlertDialog 组件，在对话框内展示安全警告文本 + 密钥 Input + 复制按钮。

**理由**：AlertDialog 已在项目中广泛使用，无需引入新组件。对话框天然提供模态聚焦，适合展示敏感信息。

### 4. 使用三态管理导出对话框

**决策**：用 `exportState: null | "warning" | string` 替代 `showExportWarning` 和 `isExporting` 两个状态。三态分别对应：`null` 对话框关闭，`"warning"` 显示安全警告确认，`string`（密钥值）显示密钥展示+复制按钮。

**替代方案**：
- *双状态（exportedKey: string | null）*：无法表达"警告已弹出但密钥未获取"的中间态。**放弃原因**：用户点击"导出密钥"时 exportedKey 仍为 null，对话框不会弹出，核心流程断裂。

**理由**：三态用一个变量精确表达对话框的三个阶段，避免多状态同步问题。密钥获取期间可基于 `"warning"` 态禁用确认按钮，同时承担加载反馈职责。

## Risks / Trade-offs

- **[密钥在 React state 中短暂存在]** → 密钥仅在对话框打开期间存在于 state。用户复制或关闭对话框后立即清除。风险等同于密钥导出到剪贴板后在系统剪贴板中的存在，可控。
- **[对话框关闭时需清除 state]** → 需确保关闭对话框（包括 ESC 键和点击遮罩）时将 exportedKey 重置为 null。
- **[翻译文案变更]** → 需要更新 en/zh/fr 三语的翻译文件，新增密钥展示对话框相关文案。
