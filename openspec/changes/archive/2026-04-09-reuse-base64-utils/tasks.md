## 1. 更新 crypto.ts 工具函数注释

- [x] 1.1 更新 `src/utils/crypto.ts` 中 `bytesToBase64` 和 `base64ToBytes` 的 `@internal` 注释，反映其跨模块共享用途

## 2. 替换 crypto-helpers.ts 中的手写 base64 编解码

- [x] 2.1 在 `src/utils/tauriCompat/crypto-helpers.ts` 中导入 `bytesToBase64` 和 `base64ToBytes`（来自 `@/utils/crypto`）
- [x] 2.2 替换 `encrypt` 函数中的 `btoa(String.fromCharCode(...))` 为 `bytesToBase64`
- [x] 2.3 替换 `decrypt` 函数中的 `Uint8Array.from(atob(...))` 为 `base64ToBytes`

## 3. 替换 keyring.ts 和 keyringMigration.ts 中残留的手写 base64

- [x] 3.1 检查并替换 `src/utils/tauriCompat/keyring.ts` 中种子编码处（如有）的手写 base64
- [x] 3.2 检查并替换 `src/utils/tauriCompat/keyringMigration.ts` 中种子编码处（如有）的手写 base64

## 4. 验证

- [x] 4.1 运行 `pnpm tsc` 确认类型检查通过
- [x] 4.2 运行 `pnpm test:all` 确认所有现有测试通过
- [x] 4.3 运行 `pnpm lint` 确认无 lint 错误
