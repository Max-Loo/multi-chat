## 1. tauriCompat/http.ts 测试

- [x] 1.1 创建 `src/__test__/utils/tauriCompat/http.test.ts` 测试文件
- [x] 1.2 实现 DEV 环境分支测试（返回原生 fetch，不导入插件）
- [x] 1.3 实现生产 + Tauri 分支测试（动态导入插件 fetch）
- [x] 1.4 实现生产 + Tauri 插件导入失败降级测试（console.warn + 回退原生 fetch）
- [x] 1.5 实现生产 + Web 分支测试（返回原生 fetch）
- [x] 1.6 实现 fetch 和 getFetchFunc 实例一致性测试
- [x] 1.7 实现 fetch 请求委托验证测试

## 2. store/slices 分支覆盖率提升

- [x] 2.1 评估 chatSlice 现有测试的错误分支缺口
- [x] 2.2 补充 chatSlice 异步 thunk 错误分支用例
- [x] 2.3 评估 modelSlice 现有测试的错误分支缺口
- [x] 2.4 补充 modelSlice 加载失败状态回滚用例

## 3. 验证

- [x] 3.1 运行全部测试确保无回归
- [x] 3.2 确认 http.ts 分支覆盖率达标（目标 80%+）
- [x] 3.3 确认 store/slices 分支覆盖率提升（目标 68% → 75%+）
