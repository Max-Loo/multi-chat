# 最终确认的待移除 key 列表

生成时间: 2026-02-27

## 总计

待移除的 key 总数: 14 个

## 按文件分组

### common.json (1 个 key)
- `warning`

### chat.json (1 个 key)
- `loading`

### provider.json (5 个 key)
- `bigModel`
- `kimi`
- `deepseek`
- `apiAddressCustom`
- `apiAddressKimi`

### setting.json (7 个 key)
- `modelProvider.lastUpdate`
- `modelProvider.errors.network_timeout`
- `modelProvider.errors.server_error`
- `modelProvider.errors.parse_error`
- `modelProvider.errors.no_cache`
- `modelProvider.errors.network_error`
- `modelProvider.errors.aborted`

## 审核说明

所有 key 已经过人工审核，确认：
1. 不在任何 TypeScript/TSX 文件中被使用
2. 不通过字符串拼接动态使用
3. 不被第三方工具或脚本依赖
4. 可以安全移除
