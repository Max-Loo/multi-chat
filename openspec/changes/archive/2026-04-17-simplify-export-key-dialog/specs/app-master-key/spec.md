## MODIFIED Requirements

### Requirement: 主密钥迁移支持
系统 SHALL 支持主密钥在不同环境或存储位置之间的迁移。

#### Scenario: 从 Tauri 迁移到 Web
- **WHEN** 用户需要从桌面版迁移数据到 Web 版
- **THEN** 系统 SHALL 提供主密钥导出功能（导出为加密文件）
- **AND** 系统 SHALL 提供主密钥导入功能（从加密文件导入到 IndexedDB）
- **AND** 导入导出功能在两种环境中均可使用

#### Scenario: 主密钥重新生成
- **WHEN** 用户主动选择重新生成主密钥（或因密钥丢失而需要重新生成）
- **THEN** 系统 SHALL 警告用户"旧加密数据将无法解密"
- **AND** 用户确认后，系统 SHALL 生成新的主密钥
- **AND** 系统 SHALL 将新密钥存储到对应环境的存储位置

#### Scenario: 导出密钥单阶段交互
- **WHEN** 用户点击导出密钥按钮
- **THEN** 系统 SHALL 立即打开对话框并开始获取主密钥
- **AND** 获取期间对话框 SHALL 展示加载状态
- **AND** 获取成功后对话框 SHALL 展示密钥值和复制按钮
- **AND** 获取失败后对话框 SHALL 展示错误提示并自动关闭

## REMOVED Requirements

（无移除的需求）
