## 1. highlightLanguageIndex 单元测试

- [x] 1.1 创建 `src/__test__/utils/highlightLanguageIndex.test.ts`，对代表性语言逐个使用 `vi.mock('highlight.js/lib/languages/<lang>', ...)` 拦截具体模块路径
- [x] 1.2 测试已知语言路由：选取代表性语言（javascript、python、elixir、plaintext）验证 `import()` 参数正确
- [x] 1.3 测试未知语言抛错：传入 `'brainfuck'` 和空字符串，验证抛出包含语言标识符的 `Error`

## 2. initIndexedDB 单元测试

- [x] 2.1 创建 `src/__test__/utils/tauriCompat/indexedDB.test.ts`，实现 `createFakeIDBRequest` helper 用于手动触发事件
- [x] 2.2 测试 `success` 事件分支：验证 Promise resolve 为 `request.result`
- [x] 2.3 测试 `error` 事件分支：验证 Promise reject 为包含 `request.error` 的 Error
- [x] 2.4 测试 `upgradeneeded` 事件分支：验证 `createObjectStore` 调用及参数
- [x] 2.5 测试对象存储已存在时不重复创建
- [x] 2.6 测试复合键 keyPath（字符串数组）

## 3. ModelSelect 组件测试

- [x] 3.1 创建 `src/__test__/pages/Model/components/ModelSelect.test.tsx`，mock `@/components/ui/form` 的 `useFormField`
- [x] 3.2 测试渲染所有选项：验证 `data-testid="model-option-<modelKey>"` 存在
- [x] 3.3 测试表单验证错误边框：`error` 有值时验证 `border-red-500`，无值时验证不存在
- [x] 3.4 测试选中值变化回调：点击选项验证 `onChange` 调用参数

## 4. ProviderHeader 组件测试

- [x] 4.1 创建 `src/__test__/pages/Setting/components/GeneralSetting/components/ModelProviderSetting/components/ProviderHeader.test.tsx`
- [x] 4.2 测试中文 locale 日期格式化：设置 `i18n.language` 为 `'zh'`，断言包含年月日时分秒
- [x] 4.3 测试英文 locale 日期格式化：设置 `i18n.language` 为 `'en'`，断言格式与中文不同
- [x] 4.4 测试 loading 状态：验证加载文本、`animate-spin` 类和按钮 disabled
- [x] 4.5 测试非 loading 状态：验证刷新文本和按钮可点击
- [x] 4.6 测试 `onRefresh` 回调和 `lastUpdate` 为 null 时不显示更新时间

## 5. 验证

- [x] 5.1 运行 `pnpm test:run` 确认所有新测试通过
- [x] 5.2 运行 `pnpm tsc` 确认无类型错误
