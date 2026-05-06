## 1. 覆盖率配置调整

- [x] 1.1 在 `vite.config.ts` 的 `coverage.exclude` 中添加 `src/@types/**` 和 `src/pages/Model/index.tsx`
- [x] 1.2 将全局 `thresholds` 替换为分模块阈值配置（hooks 85/85、services 80/75、store 80/75、utils 80/70、components 65/50、config 50/50、pages 50/40、router 50/40、全局底线 65/55）
- [x] 1.3 更新 `src/__test__/README.md` 中的覆盖率目标描述为分模块分级制

## 2. storeUtils 测试补充

- [x] 2.1 在 `src/__test__/store/storage/storeUtils.test.ts` 中添加 `saveToStore` 成功路径测试（含 successMessage 和不含两种场景）
- [x] 2.2 添加 `saveToStore` 错误路径测试（验证 console.error 和错误重抛）
- [x] 2.3 添加 `loadFromStore` 成功返回数据测试
- [x] 2.4 添加 `loadFromStore` 数据不存在返回默认值测试
- [x] 2.5 添加 `loadFromStore` 错误时返回默认值测试

## 3. initSteps execute 函数测试补充

- [x] 3.1 在 `src/__test__/config/initSteps.test.ts` 中添加 keyringMigration execute 测试
- [x] 3.2 添加 i18n execute 测试
- [x] 3.3 添加 masterKey execute 测试（含 isNewlyGenerated 结果传递）
- [x] 3.4 添加 models execute 测试（含 decryptionFailureCount 结果传递）
- [x] 3.5 添加 chatList、appLanguage、transmitHistoryReasoning、autoNamingEnabled execute 测试
- [x] 3.6 添加 modelProvider execute 成功路径测试
- [x] 3.7 添加 modelProvider execute 错误路径测试（普通错误 + 无供应商错误两条分支）

## 4. ChatPage 测试补充

- [x] 4.1 新建 `src/__test__/pages/Chat/ChatPage.test.tsx` 测试文件
- [x] 4.2 添加 chatId URL 重定向测试（5 条分支：加载中、初始化错误、聊天存在、聊天已删除、聊天不存在）
- [x] 4.3 添加 mobile/desktop 条件渲染测试

## 5. 验证

- [x] 5.1 运行 `pnpm test` 确认所有测试通过
- [x] 5.2 运行覆盖率检查确认各模块达到新阈值
- [x] 5.3 确认 README 描述与配置一致
