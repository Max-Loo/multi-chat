## 1. 精简 initSteps.test.ts 冗余测试

- [x] 1.1 合并"步骤名称唯一性"describe 中的两个用例为单个用例：保留 `应该所有步骤名称唯一`（包含 Set 比较和 `names.length === 9` 断言），删除 `应该检测重复的步骤名称`（reduce 计数方式等价但无额外断言）
- [x] 1.2 合并"依赖存在性验证"describe 中的两个用例为单个用例：保留 `应该检测依赖不存在的步骤`（有自定义错误消息便于定位问题），删除 `应该所有依赖的步骤存在`（逻辑相同但无错误消息）
- [x] 1.3 合并"必要字段完整性"describe 中的两个用例为单个用例：保留 `应该每个步骤包含 name、critical、execute、onError 字段`（断言更完整：defined + typeof + length），删除 `应该验证字段类型正确`（仅 typeof，是用例 1 的子集）
- [x] 1.4 合并"错误严重程度有效性"describe 中的两个用例为单个用例：保留 `应该调用每个步骤的 onError 并验证 severity 有效`（同时验证 severity + message），删除 `应该验证 severity 为 fatal、warning 或 ignorable`（仅验证 severity）
- [x] 1.5 合并"导出测试"describe中的冗余用例：删除 `应该 initSteps 为数组类型`（完全被 `应该 initSteps 可以正常导入` 的 `Array.isArray` 断言包含），保留其余 3 个用例
- [x] 1.6 运行 `pnpm test:run` 确认所有 initSteps 测试通过

## 2. 清理集成测试矛盾代码

- [x] 2.1 移除 `bottom-nav.integration.test.tsx` 中 `beforeEach` 里的 `global.innerWidth = 600` 和 `global.dispatchEvent(new Event('resize'))`（第 68-69 行，Mock 已控制布局）
- [x] 2.2 移除 `drawer-state.integration.test.tsx` 中 `beforeEach` 里的 `global.innerWidth = 600` 和 `global.dispatchEvent(new Event('resize'))`（第 69-70 行，Mock 已控制布局）
- [x] 2.3 运行 `pnpm test:integration:run` 确认 2 个集成测试全部通过

## 3. 改进 ChatButton 重命名测试断言

- [x] 3.1 重写"在编辑模式输入新名称并点击确认应 dispatch editChatName + toastQueue.success"用例（行 441-476）：将 `dispatchSpy.mock.calls.filter` 替换为 `waitFor(() => expect(store.getState().chat.chatMetaList.find(m => m.id === chat.id)?.name).toBe('新名称'))`
- [x] 3.2 重写"在编辑模式点击取消应退出编辑模式且无 dispatch"用例（行 478-508）：将 `dispatchSpy.mock.calls.filter` 替换为验证 `store.getState().chat.chatMetaList.find(m => m.id === chat.id)?.name` 保持不变
- [x] 3.3 移除上述两个用例中不再需要的 `dispatchSpy` 声明和 `vi.spyOn(store, 'dispatch')` 调用
- [x] 3.4 运行 `pnpm test:run` 确认 ChatButton 测试全部通过
