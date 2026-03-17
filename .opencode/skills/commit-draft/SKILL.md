---
name: commit-draft
description: 为当前未提交的代码或文档变更编写简要的 commit message。默认使用简体中文。
license: MIT
compatibility: Universal
metadata:
  author: workspace
  version: "1.0.0"
---

# Commit Message 生成 Skill

分析未提交的变更，生成符合规范的 commit message。

## 触发场景

- 用户说 "写个 commit message"
- 用户说 "帮我生成提交信息"
- 用户说 "draft commit"
- 用户想要为当前变更生成 commit message

## 工作流程

### 1. 收集变更信息

运行以下 git 命令获取变更详情：

```bash
git status
git diff --staged
git diff
```

### 2. 分析变更内容

识别变更类型：

| 变更类型      | 前缀           | 示例                                    |
| ------------- | -------------- | --------------------------------------- |
| 新功能        | `feat`         | feat(chat): 添加消息撤回功能            |
| Bug 修复      | `fix`          | fix(auth): 修复登录状态丢失问题         |
| 文档更新      | `docs`         | docs: 更新 API 使用说明                 |
| 代码重构      | `refactor`     | refactor(utils): 简化时间戳处理逻辑     |
| 性能优化      | `perf`         | perf(list): 优化大列表渲染性能          |
| 测试相关      | `test`         | test(chat): 添加消息发送单元测试        |
| 构建/工具     | `build`        | build: 升级 vite 版本                   |
| 样式修改      | `style`        | style: 统一代码缩进格式                 |
| 其他/杂项     | `chore`        | chore: 更新依赖包                       |

### 3. 确定影响范围

从变更文件路径推断影响范围：

- `src/components/chat/` → `(chat)`
- `src/services/model/` → `(model)`
- `src-tauri/` → `(tauri)`
- `docs/` → 无 scope 或 `(docs)`
- 多个相关模块 → 使用主要模块

### 4. 生成 Commit Message

**格式规范**：

```
<type>(<scope>): <简短描述>
```

**语言规则**：

- 默认使用简体中文
- 用户指定其他语言时使用指定语言
- 描述使用祈使句（如 "添加" 而非 "添加了"）

**输出格式**：

```markdown
## 建议的 Commit Message

\`\`\`
feat(chat): 添加消息已读状态显示
\`\`\`

### 变更摘要

- 修改了 3 个文件
- 主要变更：ChatMessage 组件新增已读状态图标
```

## Guardrails

- **不执行提交**：只生成 message，不运行 git commit
- **不修改代码**：仅分析变更，不做任何代码修改
- **保持简洁**：描述控制在 50 字符以内
- **一次一条**：如果变更涉及多个不相关功能，提示用户分拆提交
