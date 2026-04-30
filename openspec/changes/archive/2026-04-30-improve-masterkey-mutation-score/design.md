## Context

`store/keyring/masterKey.ts`（275 行）是主密钥全生命周期管理模块，包含 10 个函数、14 个条件分支、7 条错误处理路径。模块通过 `isTauri()` 区分桌面/Web 环境，在 keyring 和 localStorage 之间切换存储策略。已有 33 个测试用例（masterKey.test.ts），**已覆盖所有导出函数的正常路径和错误路径**。现有断言已使用 `toBe`/`toEqual`/`toThrow` 等精确匹配器，不存在 `toMatchObject` 或 `toBeDefined` 等宽泛断言。

当前变异测试仅覆盖 4 个文件（chatSlices.ts 77.70%、providerLoader.ts 75.86%、chat/index.ts 81.82%、crypto.ts 88.89%），masterKey.ts 不在其中。

## Goals / Non-Goals

**Goals:**
- 将 masterKey.ts 加入变异测试覆盖，得分目标 ≥ 80%
- 精确化 `getMasterKey` / `storeMasterKey` Tauri 环境的错误消息断言（当前仅 `toThrow()`，需改为精确消息）
- 补充 `importMasterKey` 中 `InvalidKeyFormatError` 的 `instanceof` 和 `name` 属性断言
- 补充 `getMasterKey` / `storeMasterKey` 错误路径中 `cause` 属性的断言（防止 ObjectLiteral 变异存活）

**Non-Goals:**
- 不修改 masterKey.ts 源码
- 不重写现有测试，仅补充和精确化
- 不涉及 keyVerification.ts（独立模块，可后续迭代）

## Decisions

**1. 直接复用现有测试文件**
- 理由：masterKey.test.ts 已有 33 个用例，结构清晰，覆盖已较为全面，仅需精确化少数断言
- 替代方案：创建独立的 mutation 专用测试文件 → 会增加维护负担

**2. 精确化 Tauri 环境错误消息断言**
- 理由：getMasterKey 和 storeMasterKey 的 Tauri 环境错误路径测试仅使用 `toThrow()`，未验证具体消息内容。Web 环境已有精确断言。变异器可能修改 Tauri 分支的错误消息字符串而不被检测到
- 策略：将 `toThrow()` 改为 `toThrow('无法访问系统安全存储，请检查钥匙串权限设置')`

**3. 补充错误 `cause` 属性断言**
- 理由：getMasterKey 和 storeMasterKey 的 catch 块通过 `{ cause: error }` 传递原始错误。ObjectLiteral 变异器可能移除 `cause` 属性赋值，当前测试无法杀死此变异
- 策略：验证抛出错误的 `cause` 属性存在且为原始错误对象

**4. 补充 importMasterKey 错误类型断言**
- 理由：现有测试验证了 `InvalidKeyFormatError` 的 `message`，但未验证 `instanceof` 和 `name` 属性
- 策略：使用 `try/catch` 模式同时断言 `instanceof InvalidKeyFormatError` 和 `err.name`

**5. 预估变异体数量约 100-150 个**
- 基于代码行数和条件密度，与 crypto.ts（109 行 → 81 变异体）类比

**6. 变异测试结果**
- 变异体总数：103（95 killed / 7 survived / 1 no coverage）
- 得分：92.23%（目标 ≥ 80%）
- 运行时间：约 5 分钟

## Risks / Trade-offs

- **[isTauri mock 耦合]** 测试通过 mock `tauriCompat/env` 控制环境 → 确保 mock 边界清晰，不遗漏分支
- **[async 函数超时]** initializeMasterKey 有 3 层 async 调用 → Stryker 单变异体超时设为 15s 应足够
- **[InvalidKeyFormatError 断言]** 自定义错误类的 `instanceof` 和 `name` 属性需要同时验证 → 补充 `expect(err).toBeInstanceOf(InvalidKeyFormatError)` 断言
