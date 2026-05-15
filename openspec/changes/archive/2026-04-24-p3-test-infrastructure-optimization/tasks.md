## 1. 新增 mockI18n 封装函数

- [x] 1.1 从 46 个测试文件中提取高频翻译键，定义默认翻译常量
- [x] 1.2 在现有 `helpers/mocks/i18n.ts` 中新增 `mockI18n(keys?)` 封装函数（内部调用 `createI18nMockReturn`）
- [x] 1.3 创建 `helpers/mocks/matchMedia.ts`，实现 `createMockMatchMedia(matches?)` 函数

## 2. 迁移 3 个文件使用 createTypeSafeTestStore

- [x] 2.1 迁移 `ModelProviderSetting.test.tsx` 和 `AutoNamingSetting.test.tsx` 使用 `createTypeSafeTestStore`
- [x] 2.2 迁移 `chat-button-render-count.test.tsx` 从 `createTestStore` 改为 `createTypeSafeTestStore`

## 3. 分批迁移 i18n mock

- [x] 3.1 迁移第一批 5-10 个测试文件使用 `mockI18n` 替代内联 `const R = {...}` 模式
- [x] 3.2 运行测试验证无回归后继续迁移
- [x] 3.3 迁移剩余测试文件

## 4. fakeTimers 评估

- [x] 4.1 在 `resourceLoader.test.ts` retry 测试中评估 `vi.useFakeTimers()` 可行性
- [x] 4.2 在 `ProviderCardDetails.test.tsx` UI 等待中评估 fakeTimers 可行性
- [x] 4.3 验证 fakeTimers 与 happy-dom 兼容性
- [x] 4.4 根据评估结果决定是否迁移

## 5. 验证

- [x] 5.1 运行全部测试确保无回归（151 文件、1789 测试全部通过）
- [x] 5.2 确认重复代码行数减少（基线 46 个文件 → 0 个文件含内联 `const R = {...}` 模式）
- [x] 5.3 确认测试耗时未增加（8.96s）
