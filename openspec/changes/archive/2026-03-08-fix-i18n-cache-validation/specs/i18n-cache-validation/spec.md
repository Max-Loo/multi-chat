# Capability: i18n-cache-validation

## Purpose

本能力规范定义了国际化缓存语言的验证、迁移和降级机制，确保应用在升级过程中能够优雅地处理语言代码变更，维护用户体验的一致性。

## Requirements

### Requirement: 验证缓存语言的有效性
系统在从 localStorage 读取缓存语言代码后，SHALL 验证该语言代码是否在当前版本的 `SUPPORTED_LANGUAGE_LIST` 中。

#### Scenario: 缓存语言有效
- **WHEN** 从 localStorage 读取缓存语言代码（如 `'zh'`）
- **AND** 该语言代码在 `SUPPORTED_LANGUAGE_LIST` 中
- **THEN** 系统直接使用该缓存语言
- **AND** `getDefaultAppLanguage()` 返回 `{ lang: 'zh', migrated: false }`
- **AND** 不显示任何提示信息
- **AND** 行为与当前版本完全一致

#### Scenario: 缓存语言无效且无迁移规则
- **WHEN** 从 localStorage 读取缓存语言代码（如 `'de'`）
- **AND** 该语言代码不在 `SUPPORTED_LANGUAGE_LIST` 中
- **AND** 不存在从 `'de'` 到其他语言代码的迁移规则
- **THEN** 系统标记该缓存为无效
- **AND** 系统删除 localStorage 中的缓存项
- **AND** 系统继续检测系统语言或降级到英文（详见 Requirement: 多级降级策略）

#### Scenario: 缓存语言无效但存在迁移规则
- **WHEN** 从 localStorage 读取缓存语言代码（如 `'zh-CN'`）
- **AND** 该语言代码不在 `SUPPORTED_LANGUAGE_LIST` 中
- **AND** 存在从 `'zh-CN'` 到 `'zh'` 的迁移规则
- **THEN** 系统执行迁移（详见 Requirement: 自动迁移已知的语言代码变更）

#### Scenario: 缓存语言为带地区代码的格式且基础语言支持
- **WHEN** 从 localStorage 读取缓存语言代码 `'zh-CN'`
- **AND** 该语言代码不在 `SUPPORTED_LANGUAGE_LIST` 中
- **AND** 不存在从 `'zh-CN'` 到其他语言代码的迁移规则
- **AND** 拆分后的基础语言 `'zh'` 在 `SUPPORTED_LANGUAGE_LIST` 中
- **THEN** 系统不自动使用基础语言
- **AND** 系统将该缓存视为无效（与精确匹配原则一致）
- **AND** 系统删除 localStorage 中的缓存项
- **AND** 系统继续检测系统语言或降级到英文
- **REASON**: 保持验证逻辑的一致性，避免隐式规则

---

### Requirement: 自动迁移已知的语言代码变更
系统 SHOULD 支持已知的语言代码变更映射，当检测到旧的语言代码时，自动迁移到新的语言代码。

#### Scenario: 迁移 zh-CN 到 zh
- **WHEN** 从 localStorage 读取缓存语言代码 `'zh-CN'`
- **AND** 该语言代码不在 `SUPPORTED_LANGUAGE_LIST` 中
- **AND** 存在迁移规则 `{ 'zh-CN': 'zh' }`
- **THEN** 系统使用新的语言代码 `'zh'`
- **AND** 系统更新 localStorage 中的缓存项为 `'zh'`
- **AND** 系统显示信息 Toast："检测到语言代码已更新为中文（zh）"
- **AND** 系统继续使用迁移后的语言代码

#### Scenario: 迁移目标语言也不支持
- **WHEN** 从 localStorage 读取缓存语言代码 `'zh-CN'`
- **AND** 存在迁移规则 `{ 'zh-CN': 'zh' }`
- **BUT** `'zh'` 也不在 `SUPPORTED_LANGUAGE_LIST` 中
- **THEN** 系统放弃迁移
- **AND** 系统删除 localStorage 中的缓存项
- **AND** 系统继续检测系统语言或降级到英文

#### Scenario: 多次迁移不执行
- **WHEN** 系统执行迁移后（如 `'zh-CN'` → `'zh'`）
- **THEN** 系统不会对迁移后的语言代码再次执行迁移规则
- **AND** 避免循环迁移的风险

---

### Requirement: 清理无效缓存
当检测到缓存语言代码无效（不在支持列表且无迁移规则）时，系统 SHALL 从 localStorage 中删除该缓存项。

#### Scenario: 删除无效缓存
- **WHEN** 系统检测到缓存语言代码无效（如 `'de'`）
- **THEN** 系统调用 `localStorage.removeItem(LOCAL_STORAGE_LANGUAGE_KEY)`
- **AND** 该缓存项被永久删除
- **AND** 用户下次启动时不会再次读取该无效缓存

#### Scenario: 清理缓存后继续降级流程
- **WHEN** 系统删除无效缓存后
- **THEN** 系统继续执行降级流程（详见 Requirement: 多级降级策略）
- **AND** 根据降级结果显示相应的 Toast 提示（详见 Requirement: 用户提示机制）

---

### Requirement: 多级降级策略
系统 SHOULD 遵循多级降级策略，确保始终能够选择一个有效的语言。

#### Scenario: 第一级：使用有效缓存
- **WHEN** 缓存语言存在且有效
- **THEN** 系统使用缓存语言
- **AND** 不继续后续降级步骤

#### Scenario: 第二级：迁移后使用
- **WHEN** 缓存语言无效但存在有效迁移规则
- **THEN** 系统执行迁移
- **AND** 使用迁移后的语言代码
- **AND** 不继续后续降级步骤

#### Scenario: 第三级：使用系统语言
- **WHEN** 缓存语言无效且无迁移规则
- **AND** 用户系统语言在支持列表中
- **THEN** 系统使用系统语言
- **AND** 不继续后续降级步骤

#### Scenario: 第四级：降级到英文
- **WHEN** 缓存语言无效且无迁移规则
- **AND** 用户系统语言不在支持列表中
- **THEN** 系统降级到英文 `'en'`
- **AND** 确保应用始终能够以有效语言启动

---

### Requirement: 用户提示机制
系统在执行缓存验证、迁移和降级操作时，SHALL 提供清晰的用户反馈，确保用户了解语言变化的原因。

#### Scenario: 迁移成功提示
- **WHEN** 系统成功迁移语言代码（如 `'zh-CN'` → `'zh'`）
- **THEN** 系统显示信息 Toast："检测到语言代码已更新为中文（zh）"
- **AND** Toast 自动消失（3 秒后）
- **AND** Toast 不阻塞应用启动

#### Scenario: 清理无效缓存并降级到系统语言提示
- **WHEN** 系统清理无效缓存并降级到系统语言（如 `'fr'`）
- **THEN** 系统显示信息 Toast："已切换到系统语言：Français"
- **AND** Toast 自动消失（3 秒后）
- **AND** Toast 不阻塞应用启动

#### Scenario: 清理无效缓存并降级到英文提示
- **WHEN** 系统清理无效缓存并降级到英文
- **THEN** 系统显示警告 Toast："语言代码已失效，已切换到英文"
- **AND** Toast 自动消失（5 秒后）
- **AND** Toast 不阻塞应用启动

#### Scenario: 无提示场景
- **WHEN** 缓存语言有效，未执行任何迁移或降级操作
- **THEN** 系统不显示任何提示信息
- **AND** 保持当前版本的静默行为

#### Scenario: localStorage 写入失败后的重复启动
- **WHEN** 用户第一次启动，迁移 `zh-CN` → `zh`，但 localStorage 写入失败
- **AND** 用户第二次启动应用
- **THEN** 系统再次尝试迁移
- **AND** 系统再次显示 Toast（这是重复提示）
- **RECOMMENDATION**: 如果反馈显示重复提示造成困扰，考虑使用会话标记避免重复

#### Scenario: 迁移成功后重复启动
- **WHEN** 用户第一次启动，迁移 `zh-CN` → `zh` 成功，localStorage 更新为 `zh`
- **AND** 用户第二次启动应用
- **THEN** 系统读取缓存 `zh`，发现有效
- **AND** 系统不显示任何 Toast
- **AND** 应用正常启动，使用语言 `zh`

---

### Requirement: 向后兼容性
系统 SHALL 保持向后兼容，确保用户缓存的有效语言代码不受影响。

#### Scenario: 有效缓存语言保持不变
- **WHEN** 用户缓存的语言代码有效且在支持列表中（如 `'en'`、`'zh'`、`'fr'`）
- **THEN** 系统行为与当前版本完全一致
- **AND** 不显示任何提示信息
- **AND** 不修改缓存内容
- **AND** 不影响用户体验

#### Scenario: 不影响手动语言切换
- **WHEN** 用户在设置中手动切换语言
- **THEN** 语言切换行为不受缓存验证机制影响
- **AND** 切换流程保持不变
- **AND** middleware 逻辑不变

---

### Requirement: 语言切换持久化
系统 SHALL 确保用户手动切换语言后，语言设置能够持久化并在刷新后保持不变。

#### Scenario: 语言切换后持久化到 localStorage
- **WHEN** 用户在设置页面手动切换语言（如从 'en' 切换到 'zh'）
- **THEN** 系统调用 `changeAppLanguage()` 切换 i18n 实例的语言
- **AND** 系统更新 Redux store 中的语言状态
- **AND** 系统将新语言代码保存到 localStorage
- **AND** 刷新页面后，应用使用新选择的语言

#### Scenario: 语言切换失败时的错误处理
- **WHEN** 用户在设置页面手动切换语言
- **AND** 语言切换失败（如资源加载失败）
- **THEN** 系统不更新 Redux store
- **AND** 系统不更新 localStorage
- **AND** 系统显示错误 Toast："语言切换失败"
- **AND** 应用保持当前语言不变

#### Scenario: 防止重复切换
- **WHEN** 用户正在切换语言时（切换操作进行中）
- **AND** 用户再次点击语言选择器
- **THEN** 系统忽略重复的切换请求
- **AND** 语言选择器处于禁用状态
- **AND** 避免竞态条件

---

### Requirement: 前向兼容性
系统机制应具备前向兼容性，支持未来语言的添加和删除。

#### Scenario: 未来添加新语言
- **WHEN** 未来版本添加新语言（如 `'ja'`）
- **AND** 旧版本用户首次升级到新版本
- **THEN** 缓存验证机制自动适应
- **AND** 如果用户系统语言为 `'ja'`，系统自动使用新语言
- **AND** 无需修改验证逻辑

#### Scenario: 未来删除现有语言
- **WHEN** 未来版本删除某个语言（如 `'fr'`）
- **AND** 用户缓存的语言代码为 `'fr'`
- **THEN** 缓存验证机制检测到 `'fr'` 不在支持列表中
- **AND** 系统自动清理缓存并降级到系统语言或英文
- **AND** 显示相应的提示信息
- **AND** 无需修改验证逻辑

---

### Requirement: 性能要求
缓存验证机制 SHOULD 对应用启动性能的影响降到最低。

#### Scenario: 验证操作的性能开销
- **WHEN** 系统执行缓存验证、迁移和降级操作
- **THEN** 总操作耗时低于 5ms
- **AND** 不阻塞应用启动流程
- **AND** 不影响 i18n 初始化的总耗时

#### Scenario: localStorage 操作的性能
- **WHEN** 系统读取、更新或删除 localStorage 中的语言缓存
- **THEN** 每次 localStorage 操作耗时低于 1ms
- **AND** 操作失败时降级到内存操作（不影响应用启动）

---

### Requirement: 错误处理
系统应优雅地处理缓存验证过程中可能出现的错误。

#### Scenario: localStorage 读取失败
- **WHEN** 系统尝试从 localStorage 读取语言缓存时抛出异常（如隐私模式）
- **THEN** 系统捕获该异常
- **AND** 系统降级到检测系统语言或英文
- **AND** 系统记录错误日志
- **AND** 系统不显示错误提示（不影响用户体验）

#### Scenario: localStorage 写入失败
- **WHEN** 系统尝试更新或删除 localStorage 中的语言缓存时抛出异常
- **THEN** 系统捕获该异常
- **AND** 系统继续使用迁移后的语言代码（仅在内存中）
- **AND** 系统记录错误日志
- **AND** 系统显示成功提示（不透露技术细节）

#### Scenario: Toast 显示失败
- **WHEN** 系统尝试显示提示 Toast 时失败（如 toastFunc 为 null）
- **THEN** 系统捕获该异常
- **AND** 系统继续正常启动
- **AND** 系统降级到 console.warn 记录提示信息
- **AND** 不阻塞应用启动流程
