# Tasks: 国际化错误消息

## 1. 创建 error.json 翻译文件

- [x] 1.1 创建 `src/locales/en/error.json`，包含所有初始化和应用配置相关的英文错误消息
- [x] 1.2 创建 `src/locales/zh/error.json`，包含所有初始化和应用配置相关的中文错误消息
- [x] 1.3 创建 `src/locales/fr/error.json`，包含所有初始化和应用配置相关的法文错误消息
- [x] 1.4 验证三个 error.json 文件的键值结构完全一致

## 2. 增强 i18n.ts

- [x] 2.1 在 `src/lib/i18n.ts` 顶部导入英文 error 命名空间（enError），中文和法文通过动态加载
- [x] 2.2 将英文 error 命名空间添加到 EN_RESOURCES 聚合对象中
- [x] 2.3 实现 `tSafely()` 函数，包含完整的参数验证和类型安全逻辑
- [x] 2.4 为 `tSafely()` 添加详细的 JSDoc 注释（包括参数说明、特性描述、返回值说明）
- [x] 2.5 导出 `tSafely` 函数供其他模块使用
- [x] 2.6 导出 `SafeTranslator` 类型别名（`export type SafeTranslator = typeof tSafely`）
- [x] 2.7 在 initialResources 中包含 error 命名空间
- [x] 2.8 依赖 `npm run lint:i18n` 验证中文和法文 error.json 的翻译完整性

## 3. 重构 appConfigSlices.ts

- [x] 3.1 在 `src/store/slices/appConfigSlices.ts` 顶部导入 `tSafely`
- [x] 3.2 替换 `initializeAppLanguage` thunk 中的硬编码错误消息（Line 30）
- [x] 3.3 替换 `initializeTransmitHistoryReasoning` thunk 中的硬编码错误消息（Line 46）
- [x] 3.4 替换 `initializeAutoNamingEnabled` thunk 中的硬编码错误消息（Line 63）

## 4. 重构 initSteps.ts

- [x] 4.1 在 `src/config/initSteps.ts` 顶部导入 `tSafely`
- [x] 4.2 为 i18n 初始化错误定义英文常量 `I18N_INIT_FAILED`
- [x] 4.3 替换 i18n 步骤的 onError 回调，使用常量而非 `tSafely()`
- [x] 4.4 替换 masterKey 步骤的 onError 回调，使用 `tSafely()`
- [x] 4.5 替换 models 步骤的 onError 回调，使用 `tSafely()`
- [x] 4.6 替换 chatList 步骤的 onError 回调，使用 `tSafely()`
- [x] 4.7 替换 appLanguage 步骤的 onError 回调，使用 `tSafely()`
- [x] 4.8 替换 transmitHistoryReasoning 步骤的 onError 回调，使用 `tSafely()`
- [x] 4.9 替换 autoNamingEnabled 步骤的 onError 回调，使用 `tSafely()`
- [x] 4.10 替换 modelProvider 步骤的 onError 回调，使用 `tSafely()`

## 5. 验证和测试

- [x] 5.1 运行 `npm run lint:i18n` 检查翻译完整性
- [x] 5.2 运行 `npx tsc --noEmit` 进行类型检查
- [x] 5.3 运行 `pnpm lint` 进行代码风格检查
- [x] 5.4 手动测试：启动应用，验证正常初始化场景
- [x] 5.5 手动测试：模拟 i18n 初始化失败，验证英文降级消息
- [x] 5.6 手动测试：切换语言，验证错误消息随语言切换
- [x] 5.7 手动测试：模拟其他初始化步骤失败，验证翻译和降级
- [x] 5.8 确认初始 bundle 大小（实际 826 字节，符合性能要求）
- [x] 5.9 运行现有的 i18n 相关测试，确保无回归
- [x] 5.10 验证应用切换语言后，error 命名空间正确切换

## 6. 单元测试

- [x] 6.1 创建 `src/__test__/lib/i18n/tSafely.test.ts`
- [x] 6.2 测试 i18n 未初始化时的降级行为
- [x] 6.3 测试翻译存在时的正常行为
- [x] 6.4 测试翻译不存在时的降级行为
- [x] 6.5 测试异常处理（key 为 null/undefined）
- [x] 6.6 测试异常处理（fallback 为 null/undefined）
- [x] 6.7 测试异常处理（两个参数都为 null）
- [x] 6.8 测试嵌套键值访问（两级、三级）
- [x] 6.9 测试无效的嵌套路径返回降级文本
- [x] 6.10 测试 i18n.t() 返回非字符串类型的处理
- [x] 6.11 测试性能：确保执行时间 < 1ms（i18n 已初始化）
- [x] 6.12 测试多次调用相同参数返回一致结果

## 7. 文档和清理

- [x] 7.1 更新 `docs/design/i18n-system.md`，添加 error 命名空间文档
- [x] 7.2 在 i18n-system.md 的"使用示例"部分添加 tSafely() 的使用示例
- [x] 7.3 在 i18n-system.md 的"实现位置"部分添加 tSafely() 的文件路径
- [x] 7.4 清理临时文件和注释
