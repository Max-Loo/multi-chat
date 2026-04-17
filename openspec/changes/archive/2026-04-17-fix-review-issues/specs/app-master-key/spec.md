## MODIFIED Requirements

### Requirement: 密钥重新生成时通知用户
当初始化过程中检测到主密钥为新生成，且存储中存在因密钥变更而无法解密的加密数据时，系统 SHALL 在初始化完成后向用户显示通知。如果密钥为新生成但存储中不存在加密数据（首次使用），系统 SHALL 不显示通知。通知 MUST 仅在组件挂载时触发一次，不响应语言切换等后续变化。

#### Scenario: 密钥重新生成且存在加密数据时显示通知
- **GIVEN** 应用初始化完成
- **AND** `initializeMasterKey()` 返回 `isNewlyGenerated: true`
- **AND** 存储中存在 `enc:` 前缀的加密模型数据（说明是密钥丢失而非首次使用）
- **WHEN** 主界面加载完成
- **THEN** 系统 SHALL 显示通知："检测到加密密钥已重新生成，之前保存的 API 密钥无法解密。如有备份密钥请先导入恢复，在此之前请勿修改模型配置，否则加密数据将无法恢复。"
- **AND** 通知 SHALL 提供"导入密钥"操作跳转到密钥导入流程（作为主要操作，视觉优先级高于关闭按钮）
- **AND** 通知 SHALL 提供"我知道了"操作关闭通知
- **AND** 通知 SHALL 持续显示直到用户主动操作（不自动消失）

#### Scenario: 首次使用（密钥新生成但无加密数据）时不显示通知
- **GIVEN** 应用初始化完成
- **AND** `initializeMasterKey()` 返回 `isNewlyGenerated: true`
- **AND** 存储中不存在 `enc:` 前缀的加密数据（首次使用）
- **WHEN** 主界面加载完成
- **THEN** 系统 SHALL 不显示密钥变更通知

#### Scenario: 密钥未重新生成时不显示通知
- **GIVEN** 应用初始化完成
- **AND** `initializeMasterKey()` 返回 `isNewlyGenerated: false`
- **WHEN** 主界面加载完成
- **THEN** 系统 SHALL 不显示密钥变更通知

#### Scenario: React Strict Mode 双重 effect 调用
- **GIVEN** 应用运行在 React 18/19 Strict Mode 下
- **AND** 密钥为新生成且存在加密数据
- **WHEN** 组件挂载时 React 严格模式双重调用 useEffect
- **THEN** 系统 SHALL 仅显示一次通知
- **AND** 系统 SHALL 通过同步守卫防止第二次异步调用通过检查

#### Scenario: 语言切换不触发通知
- **GIVEN** 通知已显示或已被用户关闭
- **WHEN** 用户切换界面语言
- **THEN** 系统 SHALL 不重新检查加密数据或显示通知

## ADDED Requirements

### Requirement: 检查加密数据存在的函数归属模型存储模块
系统 SHALL 在模型存储模块（而非密钥管理模块）中提供检查存储中是否存在加密数据的函数，复用已有的模型存储单例。

#### Scenario: 调用加密数据检查函数
- **GIVEN** 模型存储中存在加密数据
- **WHEN** 调用模型存储模块提供的加密数据检查函数
- **THEN** 系统 SHALL 复用已有的模型存储单例读取数据
- **AND** 系统 SHALL 返回 `true`

#### Scenario: 存储中不存在加密数据
- **GIVEN** 模型存储中不存在数据或不存在加密字段
- **WHEN** 调用加密数据检查函数
- **THEN** 系统 SHALL 返回 `false`

#### Scenario: 存储读取失败
- **GIVEN** 模型存储不可访问
- **WHEN** 调用加密数据检查函数
- **THEN** 系统 SHALL 返回 `false` 而非抛出错误
