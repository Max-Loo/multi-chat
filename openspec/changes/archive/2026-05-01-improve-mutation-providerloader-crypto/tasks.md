## 1. providerLoader 存活变异测试补充

- [x] 1.1 补充构造函数 `window` 环境检测测试：用 `vi.stubGlobal('window', undefined)` 模拟无窗口环境，验证不注册 `online` 事件监听器
- [x] 1.2 补充构造函数 `online` 事件注册测试：在正常环境中派发 `online` 事件，验证构造函数中注册的监听器触发 `handleNetworkRecover` 并传入 `allProviderKeys`
- [x] 1.3 补充 `ZHIPUAI_CODING_PLAN` loader 返回值断言：调用 `loadProvider(ZHIPUAI_CODING_PLAN)` 并验证返回值为函数类型
- [x] 1.4 补充 `getLoader()` 方法测试：验证返回值为 `ResourceLoader` 实例且与内部 loader 引用相同

## 2. crypto.ts 存活变异测试补充

- [x] 2.1 补充 `decryptField` 错误 `cause` 属性断言：在使用错误密钥解密时验证 `error.cause` 存在且为 `Error` 实例
- [x] 2.2 补充损坏数据解密时 `cause` 属性断言：验证格式正确但数据损坏的密文解密时 `error.cause` 指向底层错误

## 3. 验证

- [x] 3.1 运行 `pnpm test:run` 确认所有测试通过
- [x] 3.2 运行 `pnpm test:mutation` 确认 providerLoader 变异得分 ≥ 80%，crypto.ts 存活变异减少
