## ADDED Requirements

### Requirement: 导出密钥对话框必须包含描述

导出密钥的 `AlertDialogContent` 中 SHALL 包含一个可见的 `AlertDialogDescription` 组件，为用户提供上下文信息。

#### Scenario: 导出密钥对话框显示描述文字

- **WHEN** 用户打开导出密钥对话框
- **THEN** 对话框中 SHALL 包含一个 `AlertDialogDescription`，提示用户安全保存密钥

#### Scenario: 不再产生控制台警告

- **WHEN** 导出密钥对话框被渲染
- **THEN** 控制台中 SHALL NOT 出现关于缺少 `AlertDialogDescription` 的警告
