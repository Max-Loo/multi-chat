## 1. 外层 catch 异常处理测试

- [x] 1.1 在 `global.test.ts` 的 `getDefaultAppLanguage` describe 块中新增 `外层异常处理` 子 describe
- [x] 1.2 编写测试：locale() 首次抛异常，catch 内 locale 返回支持的语言（如 zh-CN），验证返回 `{ lang: 'zh', fallbackReason: 'system-lang' }`
- [x] 1.3 编写测试：locale() 首次抛异常，catch 内 locale 返回不支持的语言（如 de-DE），验证返回 `{ lang: 'en', fallbackReason: 'default' }`
- [x] 1.4 编写测试：locale() 首次抛异常，catch 内 locale 也抛异常，验证返回 `{ lang: 'en', fallbackReason: 'default' }`
- [x] 1.5 编写测试：locale() 首次抛异常，catch 内 locale 返回空字符串，验证返回 `{ lang: 'en', fallbackReason: 'default' }`

## 2. getLanguageLabel 函数测试

- [x] 2.1 在 `global.test.ts` 中新增 `getLanguageLabel` describe 块
- [x] 2.2 编写测试：传入支持的语言代码（如 'zh'），验证返回对应的显示标签
- [x] 2.3 编写测试：传入不支持的语言代码（如 'unknown'），验证返回原代码字符串

## 3. 验证

- [x] 3.1 运行 `pnpm test:run` 确认所有测试通过
- [x] 3.2 运行 `pnpm test:coverage` 确认 global.ts 行覆盖率 ≥ 90%、分支覆盖率 ≥ 85%
