## 1. 配置 Stryker

- [x] 1.1 将 `src/store/keyring/masterKey.ts` 加入 `stryker.config.json` 的 `mutate` 列表
- [x] 1.2 运行 `pnpm test:mutation` 获取基线得分，记录到设计文档

## 2. 精确化 Tauri 环境错误消息断言

- [x] 2.1 精确化 `getMasterKey` Tauri 环境错误消息断言：将 `toThrow()` 改为 `toThrow('无法访问系统安全存储，请检查钥匙串权限设置')`
- [x] 2.2 精确化 `storeMasterKey` Tauri 环境错误消息断言：将 `toThrow()` 改为 `toThrow('无法访问系统安全存储，请检查钥匙串权限设置')`

## 3. 补充 importMasterKey 错误类型断言

- [x] 3.1 补充 `importMasterKey` 格式校验失败时的 `instanceof InvalidKeyFormatError` 断言
- [x] 3.2 补充 `importMasterKey` 格式校验失败时的 `err.name === 'InvalidKeyFormatError'` 断言

## 4. 补充错误 cause 属性断言

- [x] 4.1 补充 `getMasterKey` Web 环境错误路径的 `cause` 属性验证
- [x] 4.2 补充 `getMasterKey` Tauri 环境错误路径的 `cause` 属性验证
- [x] 4.3 补充 `storeMasterKey` Web 环境错误路径的 `cause` 属性验证
- [x] 4.4 补充 `storeMasterKey` Tauri 环境错误路径的 `cause` 属性验证

## 5. 运行变异测试验证

- [x] 5.1 运行 `pnpm test:mutation`
- [x] 5.2 验证 masterKey.ts 变异得分 ≥ 80%（实际：92.23%）
- [x] 5.3 如未达标，根据报告分析剩余存活变异并补充测试（已达标，无需补充）
