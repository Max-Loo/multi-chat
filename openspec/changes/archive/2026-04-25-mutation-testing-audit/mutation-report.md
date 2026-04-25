# 变异测试审计报告

**日期**：2026-04-25
**基线**：150 单元测试文件（1788 通过）+ 9 集成测试文件（95 通过）
**变异总数**：12
**执行时间**：约 20 分钟

---

## 1. 概览统计

| 指标 | 数值 |
|------|------|
| 总变异数 | 12 |
| 被杀死 | 7 |
| 存活 | 5 |
| **杀死率** | **58.3%** |

### 按信心等级分组

| 信心等级 | 变异 | 杀死 | 存活 | 杀死率 |
|----------|------|------|------|--------|
| 高信心（预期被捕获） | 4 | 3 | 1 | 75.0% |
| 中信心（可能被捕获） | 3 | 1 | 2 | 33.3% |
| 低信心（疑似盲区） | 5 | 3 | 2 | 60.0% |

### 按变异类型分组

| 变异类型 | 数量 | 杀死 | 存活 |
|----------|------|------|------|
| 边界条件变异 | 3 | 2 | 1 |
| 条件逻辑变异 | 2 | 2 | 0 |
| 缺失守卫变异 | 3 | 1 | 2 |
| React 模式变异 | 1 | 0 | 1 |
| 枚举值变异 | 1 | 0 | 1 |
| 比较/匹配变异 | 2 | 2 | 0 |

---

## 2. 逐变异详情

### 高信心变异（4 个）

#### M01 — KILLED ✓

| 项目 | 内容 |
|------|------|
| 目标模块 | `src/utils/crypto.ts:162` |
| 变异内容 | `ciphertextLength <= 0` → `ciphertextLength < 0` |
| 变异类型 | 边界条件变异 |
| 预期信心 | 高 |
| 结果 | **KILLED** — 1 个测试失败 |
| 失败测试 | `src/__test__/utils/crypto.test.ts` → `数据长度不足应该抛出错误` |
| 相关性 | **直接相关** — 测试明确验证了 `<=` 边界（ciphertextLength === 0 的场景） |

#### M02 — KILLED ✓

| 项目 | 内容 |
|------|------|
| 目标模块 | `src/store/slices/chatSlices.ts:370` |
| 变异内容 | `!name \|\| name.trim() === ''` → `!name`（移除空白字符串检查） |
| 变异类型 | 条件逻辑变异 |
| 预期信心 | 高 |
| 结果 | **KILLED** — 1 个测试失败 |
| 失败测试 | `src/__test__/store/slices/chatSlices.test.ts:384` → 名称应为 'Old Name' 但收到 '   ' |
| 相关性 | **直接相关** — 测试验证了纯空白名称应被拒绝 |

#### M03 — SURVIVED ✗

| 项目 | 内容 |
|------|------|
| 目标模块 | `src/hooks/useDebounce.ts:22` |
| 变异内容 | `useEffect` 依赖项 `[value, delay]` → `[value]`（移除 delay） |
| 变异类型 | React 模式变异 |
| 预期信心 | 高 |
| 结果 | **SURVIVED** — 所有 1883 测试通过 |
| 失败测试 | 无 |
| 盲区分析 | 测试未验证 delay 变化时 debounce 定时器是否正确重置。当前测试仅检查固定 delay 下的输出值，未覆盖 delay 动态变化的场景 |

#### M04 — KILLED ✓

| 项目 | 内容 |
|------|------|
| 目标模块 | `src/services/chat/messageTransformer.ts:49` |
| 变异内容 | `transmitHistoryReasoning &&` → `!transmitHistoryReasoning &&`（条件反转） |
| 变异类型 | 条件逻辑变异 |
| 预期信心 | 高 |
| 结果 | **KILLED** — 2 个测试失败 |
| 失败测试 | `src/__test__/services/chat/messageTransformer.test.ts` → `应该转换 assistant 消息（包含 reasoning，开关开启）`、`应该转换 assistant 消息（不包含 reasoning，开关关闭）` |
| 相关性 | **直接相关** — 测试明确验证了开关的两种状态 |

### 中信心变异（3 个）

#### M05 — KILLED ✓

| 项目 | 内容 |
|------|------|
| 目标模块 | `src/utils/utils.ts:16` |
| 变异内容 | `Math.floor(Date.now() / 1000)` → `Math.ceil(Date.now() / 1000)` |
| 变异类型 | 边界条件变异 |
| 预期信心 | 中 |
| 结果 | **KILLED** — 1 个测试失败 |
| 失败测试 | `src/__test__/services/chat/index.integration.test.ts` → `应该生成正确的时间戳（秒级）` |
| 相关性 | **间接相关** — 集成测试验证了时间戳的秒级精度，意外捕获了 Math 精度变异。utils.ts 本身无直接单元测试对此断言 |

#### M06 — SURVIVED ✗

| 项目 | 内容 |
|------|------|
| 目标模块 | `src/store/slices/chatSlices.ts:482` |
| 变异内容 | 移除 `appendHistoryToModel` 失败时的 `if (!...) return` 守卫 |
| 变异类型 | 缺失守卫变异 |
| 预期信心 | 中 |
| 结果 | **SURVIVED** — 所有 1883 测试通过 |
| 失败测试 | 无 |
| 盲区分析 | 测试未覆盖 `sendMessage.fulfilled` 时 `appendHistoryToModel` 返回 false 的场景。缺少对临时数据清理逻辑的验证——当追加失败时，临时 runningChat 数据未被正确保留/清理 |

#### M07 — SURVIVED ✗

| 项目 | 内容 |
|------|------|
| 目标模块 | `src/config/initSteps.ts:184` |
| 变异内容 | `!modelProviderLoading && !!modelProviderError` → `!!modelProviderError`（移除 loading 守卫） |
| 变异类型 | 缺失守卫变异 |
| 预期信心 | 中 |
| 结果 | **SURVIVED** — 所有 1883 测试通过 |
| 失败测试 | 无 |
| 盲区分析 | 测试未验证 modelProvider 初始化失败且 loading 仍为 true 时的状态判定。`hasError` 的计算依赖 loading 状态，但现有测试只覆盖了简单的成功/失败路径 |

### 低信心变异（5 个）

#### M08 — SURVIVED ✗

| 项目 | 内容 |
|------|------|
| 目标模块 | `src/services/chat/messageTransformer.ts:53` |
| 变异内容 | `reasoningContent.trim().length > 0` → `reasoningContent.length > 0`（移除 trim） |
| 变异类型 | 边界条件变异 |
| 预期信心 | 低 |
| 结果 | **SURVIVED** — 所有 1883 测试通过 |
| 失败测试 | 无 |
| 盲区分析 | 测试未使用纯空白（`"   "`）的 reasoningContent 进行验证。缺少对空白字符串推理内容的边界测试 |

#### M09 — KILLED ✓

| 项目 | 内容 |
|------|------|
| 目标模块 | `src/store/storage/storeUtils.ts:58` |
| 变异内容 | `!data` → `data === null`（falsy 检查缩窄为严格 null） |
| 变异类型 | 比较/匹配变异 |
| 预期信心 | 低 |
| 结果 | **KILLED** — 2 个测试文件失败（ChatBubble.test.tsx, SettingPage.test.tsx），约 26 个测试受影响 |
| 失败测试 | 多个组件测试 |
| 相关性 | **间接相关** — 下游组件依赖 `loadFromStore` 对 undefined/空字符串的处理。变异导致 `data === ""` 或 `data === 0` 时不再返回默认值，破坏了组件渲染 |

#### M10 — KILLED ✓

| 项目 | 内容 |
|------|------|
| 目标模块 | `src/store/storage/storeUtils.ts:33` |
| 变异内容 | 移除 `await store.save()` 调用 |
| 变异类型 | 缺失守卫变异 |
| 预期信心 | 低 |
| 结果 | **KILLED** — 2 个测试失败 |
| 失败测试 | `src/__test__/store/storage/storeUtils.test.ts` → `应该成功保存数据并输出成功消息`、`应该成功保存数据但不输出日志`；`src/__test__/pages/Setting/components/KeyManagementSetting/index.test.tsx` |
| 相关性 | **直接相关** — storeUtils 单元测试验证了 save() 调用；KeyManagementSetting 间接依赖持久化行为 |

#### M11 — SURVIVED ✗

| 项目 | 内容 |
|------|------|
| 目标模块 | `src/config/initSteps.ts:79` |
| 变异内容 | masterKey 步骤 onError severity `'fatal'` → `'warning'` |
| 变异类型 | 枚举值变异 |
| 预期信心 | 低 |
| 结果 | **SURVIVED** — 所有 1883 测试通过 |
| 失败测试 | 无 |
| 盲区分析 | 测试未验证初始化步骤的 onError severity 值。masterKey 步骤的 critical: true 与 onError severity 是两个独立配置点，severity 降级会导致 UI 层不展示致命错误提示，但测试未覆盖此行为 |

#### M12 — KILLED ✓

| 项目 | 内容 |
|------|------|
| 目标模块 | `src/services/i18n.ts:360` |
| 变异内容 | 移除 `translated === safeKey` 条件检查 |
| 变异类型 | 比较/匹配变异 |
| 预期信心 | 低 |
| 结果 | **KILLED** — 5 个测试失败 |
| 失败测试 | `src/__test__/services/lib/i18n/tSafely.test.ts` → `应该在翻译不存在时返回降级文本`、`应该处理 fallback 为 null/undefined/空字符串`、`应该在无效嵌套路径时返回降级文本` |
| 相关性 | **直接相关** — tSafely 测试明确验证了 key 与翻译值相同时的降级行为 |

---

## 3. 盲区总结与改进建议

### 盲区概览

5 个存活变异暴露了测试套件在以下方面的不足：

| 盲区类型 | 存活变异 | 核心问题 |
|----------|----------|----------|
| React Hook 依赖项 | M03 | 未测试 delay 动态变化时 debounce 行为 |
| Redux 异步流程守卫 | M06 | 未测试 appendHistoryToModel 失败分支 |
| 初始化状态判定 | M07 | 未测试 loading 中状态下的错误判定 |
| 字符串边界值 | M08 | 未测试纯空白 reasoningContent |
| 配置元数据验证 | M11 | 未测试 onError severity 值 |

### 具体改进建议

#### 建议 1：useDebounce Hook 动态 delay 测试（对应 M03）

```typescript
// 在 useDebounce.test.ts 中新增
it('应在 delay 变化时重置定时器', async () => {
  const { result, rerender } = renderHook(
    ({ value, delay }) => useDebounce(value, delay),
    { initialProps: { value: 'hello', delay: 500 } }
  );
  rerender({ value: 'hello', delay: 100 });
  await act(async () => { vi.advanceTimersByTime(100); });
  expect(result.current).toBe('hello'); // delay 变化后应使用新 delay
});
```

#### 建议 2：sendMessage.fulfilled append 失败分支测试（对应 M06）

```typescript
// 在 chatSlices.test.ts 中新增
it('应在 appendHistoryToModel 失败时保留临时数据', () => {
  // 构造不存在的 chatId/modelId 使 appendHistoryToModel 返回 false
  // 验证 runningChat 中的临时数据未被清理
});
```

#### 建议 3：modelProvider loading 中状态测试（对应 M07）

```typescript
// 在 initSteps 测试中新增
it('应在 loading 为 true 时将 hasError 设为 false', () => {
  // 模拟 modelProvider: { loading: true, error: 'some error' }
  // 验证 modelProviderStatus.hasError === false
});
```

#### 建议 4：空白 reasoningContent 边界测试（对应 M08）

```typescript
// 在 messageTransformer.test.ts 中新增
it('应忽略纯空白的 reasoningContent', () => {
  const result = transformHistory({
    role: ChatRoleEnum.ASSISTANT,
    reasoningContent: '   ',  // 纯空白
  }, true);
  expect(result.parts).toHaveLength(1); // 不应包含 reasoning part
});
```

#### 建议 5：initSteps severity 值验证测试（对应 M11）

```typescript
// 在 initSteps 测试中新增
it('masterKey 步骤的 onError severity 应为 fatal', () => {
  const masterKeyStep = initSteps.find(s => s.name === STEP_NAMES.masterKey);
  const errorResult = masterKeyStep!.onError!(new Error('test'));
  expect(errorResult.severity).toBe('fatal');
});
```

### 优先级排序

| 优先级 | 建议 | 理由 |
|--------|------|------|
| P0 | M06 append 失败守卫 | Redux 状态一致性风险 |
| P0 | M07 loading 守卫 | 初始化状态判定错误可导致 UI 异常 |
| P1 | M03 debounce delay | React Hook 正确性，闭包陷阱 |
| P1 | M08 空白 reasoning | 边界值缺失，易修复 |
| P2 | M11 severity 验证 | 配置元数据，低风险但易遗漏 |

---

## 4. 结论

测试套件的整体杀死率为 **58.3%**（7/12），低于理想水平（>80%）。

**亮点**：
- 条件逻辑变异（2/2）和比较/匹配变异（2/2）的杀死率为 100%
- storeUtils 的 falsy 检查和 save 调用被有效保护
- tSafely 的降级逻辑有充分测试覆盖

**主要风险**：
- **缺失守卫变异**杀死率仅 33.3%（1/3），是最大的测试盲区
- **React Hook 测试**不覆盖依赖项变化场景
- **初始化配置**的元数据（severity、loading 状态）缺乏验证

建议优先补充 P0 级别的测试用例，预计可将杀死率提升至 **75%+**。
