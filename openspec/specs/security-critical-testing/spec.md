# Spec: Security Critical Testing

本规格定义了安全关键路径的测试要求，确保涉及 XSS 防护和内容清理的测试使用真实的库进行验证。

## Purpose

确保安全相关测试（如 XSS 清理、内容过滤）使用真实的依赖库而非 mock，从而验证实际的安全防护效果。

## Requirements

### Requirement: XSS 安全测试使用真实库
`ChatBubble.test.tsx` 中的 XSS 安全测试 SHALL 使用真实的 markdown-it 和 DOMPurify 库，MUST NOT 使用 mock 绕过安全验证。

#### Scenario: XSS 测试不使用 mock 库
- **WHEN** 测试名称涉及 XSS 清理或安全性验证
- **THEN** 测试 SHALL 使用真实的 markdown-it 实例渲染内容
- **AND** 测试 SHALL 使用真实的 DOMPurify 实例清理 HTML
- **AND** MUST NOT 使用 `vi.mock('markdown-it')` 或 `vi.mock('dompurify')` 覆盖这些库

#### Scenario: XSS 测试验证真实清理效果
- **WHEN** 输入包含 `<script>alert("XSS")</script>` 等恶意内容
- **THEN** 真实 DOMPurify SHALL 清理 script 标签
- **AND** 渲染结果 SHALL NOT 包含可执行的 script 元素
