## Purpose

定义分模块覆盖率阈值策略，替代全局一刀切配置，确保各模块的覆盖率目标与其测试难度匹配。同时覆盖 storeUtils、initSteps execute、ChatPage 重定向等关键测试场景，并维护 README 与配置的一致性。

## Requirements

### Requirement: 分模块覆盖率阈值配置
系统 SHALL 在 `vite.config.ts` 中配置按模块目录的覆盖率阈值，替代全局一刀切配置。每个模块的阈值 SHALL 根据其测试难度和实际覆盖率设定合理目标。采用 Istanbul 覆盖率提供者后，阈值 SHALL 基于实际覆盖率数据校准。

#### Scenario: hooks 模块覆盖率达到阈值
- **WHEN** 运行覆盖率检查
- **THEN** `src/hooks/` 目录的行覆盖率 SHALL 不低于 90%，分支覆盖率 SHALL 不低于 85%

#### Scenario: services 模块覆盖率达到阈值
- **WHEN** 运行覆盖率检查
- **THEN** `src/services/` 目录的行覆盖率 SHALL 不低于 80%，分支覆盖率 SHALL 不低于 75%

#### Scenario: store 模块覆盖率达到阈值
- **WHEN** 运行覆盖率检查
- **THEN** `src/store/` 目录的行覆盖率 SHALL 不低于 80%，分支覆盖率 SHALL 不低于 75%

#### Scenario: utils 模块覆盖率达到阈值
- **WHEN** 运行覆盖率检查
- **THEN** `src/utils/` 目录的行覆盖率 SHALL 不低于 80%，分支覆盖率 SHALL 不低于 70%

#### Scenario: components 模块覆盖率达到阈值
- **WHEN** 运行覆盖率检查
- **THEN** `src/components/` 目录的行覆盖率 SHALL 不低于 70%，分支覆盖率 SHALL 不低于 55%

#### Scenario: config 模块覆盖率达到阈值
- **WHEN** 运行覆盖率检查
- **THEN** `src/config/` 目录的行覆盖率 SHALL 不低于 55%，分支覆盖率 SHALL 不低于 55%

#### Scenario: pages 模块覆盖率达到阈值
- **WHEN** 运行覆盖率检查
- **THEN** `src/pages/` 目录的行覆盖率 SHALL 不低于 55%，分支覆盖率 SHALL 不低于 45%

#### Scenario: router 模块覆盖率达到阈值
- **WHEN** 运行覆盖率检查
- **THEN** `src/router/` 目录的行覆盖率 SHALL 不低于 50%，分支覆盖率 SHALL 不低于 40%

### Requirement: 不可测代码排除
系统 SHALL 在覆盖率配置的 `exclude` 列表中排除不可测代码，使覆盖率数字反映真实测试质量。

#### Scenario: 类型声明文件被排除
- **WHEN** 运行覆盖率检查
- **THEN** `src/@types/` 目录 SHALL 不被纳入覆盖率计算

#### Scenario: 纯 re-export 空壳组件被排除
- **WHEN** 运行覆盖率检查
- **THEN** `src/pages/Model/index.tsx` SHALL 不被纳入覆盖率计算

#### Scenario: 第三方库薄包装被排除
- **WHEN** 运行覆盖率检查
- **THEN** `src/utils/utils.ts` 中的 `cn` 函数 SHALL 不被纳入覆盖率计算
- **NOTE** `cn` 是 `clsx` + `twMerge` 的一行组合，不含业务逻辑

#### Scenario: 纯映射文件被排除
- **WHEN** 运行覆盖率检查
- **THEN** `src/utils/highlightLanguageIndex.ts` SHALL 不被纳入覆盖率计算
- **NOTE** 该文件是 46 个动态 import 的 switch 映射，已被上层测试完整 mock

### Requirement: storeUtils saveToStore 测试覆盖
`saveToStore` 函数 SHALL 覆盖成功路径（含/不含 successMessage）和错误重抛路径。

#### Scenario: 成功保存并记录日志
- **WHEN** 调用 `saveToStore` 且 `successMessage` 有值
- **THEN** SHALL 依次调用 `store.init()`、`store.set()`、`store.save()`，并通过 `console.log` 输出成功消息

#### Scenario: 成功保存但无日志
- **WHEN** 调用 `saveToStore` 且 `successMessage` 为 undefined
- **THEN** SHALL 完成保存操作但 SHALL NOT 调用 `console.log`

#### Scenario: 保存失败时重抛错误
- **WHEN** 调用 `saveToStore` 且 `store.set` 抛出异常
- **THEN** SHALL 通过 `console.error` 记录错误并重抛该异常

### Requirement: storeUtils loadFromStore 测试覆盖
`loadFromStore` 函数 SHALL 覆盖有数据返回、无数据返回默认值、错误时返回默认值三条路径。

#### Scenario: 成功加载已有数据
- **WHEN** 调用 `loadFromStore` 且 `store.get` 返回有效数据
- **THEN** SHALL 返回该数据

#### Scenario: 数据不存在时返回默认值
- **WHEN** 调用 `loadFromStore` 且 `store.get` 返回 null
- **THEN** SHALL 通过 `console.log` 记录并返回 `defaultValue`

#### Scenario: 加载失败时返回默认值
- **WHEN** 调用 `loadFromStore` 且 `store.get` 抛出异常
- **THEN** SHALL 通过 `console.error` 记录错误并返回 `defaultValue`

### Requirement: initSteps execute 函数测试覆盖
每个初始化步骤的 `execute` 函数体 SHALL 被测试，验证其正确调用依赖模块并传递结果。

#### Scenario: keyringMigration 执行迁移
- **WHEN** 调用 `keyringMigration` 的 `execute`
- **THEN** SHALL 调用 `migrateKeyringV1ToV2()` 并将结果通过 `context.setResult` 设置

#### Scenario: masterKey 执行初始化
- **WHEN** 调用 `masterKey` 的 `execute` 且 `initializeMasterKey` 返回 `{ isNewlyGenerated: true, key: '...' }`
- **THEN** SHALL 通过 `context.setResult('masterKeyRegenerated', true)` 记录状态并返回 key

#### Scenario: modelProvider 成功路径
- **WHEN** 调用 `modelProvider` 的 `execute` 且 dispatch 成功
- **THEN** SHALL 设置 `modelProviderStatus` 为 `{ hasError: false, isNoProvidersError: false }`

#### Scenario: modelProvider 错误路径 - 普通错误
- **WHEN** 调用 `modelProvider` 的 `execute` 且 dispatch 失败，store 状态为 `loading: false, error: "some error"`
- **THEN** SHALL 设置 `modelProviderStatus` 为 `{ hasError: true, isNoProvidersError: false }` 并重抛错误

#### Scenario: modelProvider 错误路径 - 无供应商错误
- **WHEN** 调用 `modelProvider` 的 `execute` 且 dispatch 失败，store 状态为 `error === NO_PROVIDERS_ERROR_MESSAGE`
- **THEN** SHALL 设置 `modelProviderStatus` 为 `{ hasError: true, isNoProvidersError: true }`

### Requirement: ChatPage chatId 重定向测试覆盖
ChatPage 组件的 chatId URL 参数重定向逻辑 SHALL 覆盖 5 条分支路径。

#### Scenario: 加载中不执行重定向
- **WHEN** 聊天列表正在加载且 URL 包含 `chatId` 参数
- **THEN** SHALL 不 dispatch `setSelectedChatIdWithPreload` 也不调用 `clearChatIdParam`

#### Scenario: 初始化错误时不执行重定向
- **WHEN** 存在 `initializationError` 且 URL 包含 `chatId` 参数
- **THEN** SHALL 不执行任何导航操作

#### Scenario: 聊天存在且未删除时选中
- **WHEN** URL 包含 `chatId` 且对应聊天存在且未删除
- **THEN** SHALL dispatch `setSelectedChatIdWithPreload(chatId)`

#### Scenario: 聊天已删除时清除参数
- **WHEN** URL 包含 `chatId` 且对应聊天已被标记删除
- **THEN** SHALL 调用 `clearChatIdParam()`

#### Scenario: 聊天不存在时清除参数
- **WHEN** URL 包含 `chatId` 但列表中无对应聊天
- **THEN** SHALL 调用 `clearChatIdParam()`

### Requirement: README 覆盖率目标同步更新
`src/__test__/README.md` 中的覆盖率阈值表格 SHALL 与 `vite.config.ts` 中的实际配置保持一致。

#### Scenario: README 阈值与配置一致
- **WHEN** 开发者查阅 README 覆盖率章节
- **THEN** 分模块阈值表 SHALL 反映采用 Istanbul provider 后的新阈值

### Requirement: 采用 Istanbul 覆盖率提供者
系统 SHALL 使用 Istanbul 作为 Vitest 覆盖率提供者。Istanbul 在 Statement 覆盖率上比 V8 更准确。

#### Scenario: Istanbul provider 正确安装和配置
- **WHEN** 运行 `pnpm test:coverage`
- **THEN** Vitest SHALL 使用 Istanbul 覆盖率提供者，且所有测试正常通过

#### Scenario: Statement 覆盖率更准确
- **WHEN** 运行 `pnpm test:coverage`
- **THEN** Istanbul SHALL 提供比 V8 更准确的 Statement 覆盖率数据

### Requirement: 覆盖率阈值基于真实数据调整
采用 Istanbul provider 后，系统 SHALL 调整 `vite.config.ts` 中的覆盖率阈值，使阈值反映应用代码的真实覆盖目标。

#### Scenario: 阈值基于切换后的实际覆盖率设定
- **WHEN** 切换 Istanbul provider 后运行覆盖率
- **THEN** 各模块阈值 SHALL 基于实际覆盖率数据设定，确保所有模块的阈值检查通过
