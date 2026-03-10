# 时间戳工具函数约定

本文档说明时间戳工具函数的使用约定，包括秒级和毫秒级时间戳的使用场景和工具函数。

## 时间戳单位约定

### 秒级时间戳

**使用场景**：
- 聊天消息记录（`StandardMessage.timestamp`）
- 数据库记录
- 用户可见的时间展示

**示例**：
```typescript
// 聊天消息时间戳
const message: StandardMessage = {
  id: 'msg_123',
  content: 'Hello',
  timestamp: getCurrentTimestamp(), // 秒级：1709761200
};
```

### 毫秒级时间戳

**使用场景**：
- 性能测试
- 调试日志
- 计时测量

**示例**：
```typescript
// 性能测试
const startTime = getCurrentTimestampMs(); // 毫秒级：1709761200000
// ... 执行操作
const duration = getCurrentTimestampMs() - startTime;
console.log(`操作耗时 ${duration}ms`);
```

## 工具函数

### getCurrentTimestamp()

**功能**：获取当前秒级时间戳

**返回值**：`number`（秒级时间戳）

**使用规范**：
- ✅ **生产代码生成时间戳时，必须使用此工具函数**
- ✅ **聊天消息必须使用此函数**
- ❌ **不要使用 `Date.now()` 或 `Math.floor(Date.now() / 1000)`**

**示例**：
```typescript
import { getCurrentTimestamp } from '@/utils/utils';

// ✅ 正确
const timestamp = getCurrentTimestamp();

// ❌ 错误
const timestamp = Math.floor(Date.now() / 1000);
```

### getCurrentTimestampMs()

**功能**：获取当前毫秒级时间戳

**返回值**：`number`（毫秒级时间戳）

**使用规范**：
- ✅ **性能测试可使用此函数**
- ✅ **调试日志可使用此函数**
- ⚠️ **测试代码可保留直接使用 `Date.now()`，以便灵活控制**

**示例**：
```typescript
import { getCurrentTimestampMs } from '@/utils/utils';

// ✅ 正确
const startMs = getCurrentTimestampMs();

// ❌ 错误（不要在生产代码中用于聊天消息）
const timestamp = getCurrentTimestampMs();
```

## 实现位置

**位置**：`src/utils/utils.ts`

**源码**：
```typescript
/**
 * 获取当前秒级时间戳
 * @returns 秒级时间戳
 */
export const getCurrentTimestamp = (): number => {
  return Math.floor(Date.now() / 1000);
};

/**
 * 获取当前毫秒级时间戳
 * @returns 毫秒级时间戳
 */
export const getCurrentTimestampMs = (): number => {
  return Date.now();
};
```

## 使用示例

### 聊天消息

```typescript
import { getCurrentTimestamp } from '@/utils/utils';

const message: StandardMessage = {
  id: generateId(),
  role: 'user',
  content: 'Hello, AI!',
  timestamp: getCurrentTimestamp(), // 秒级
};
```

### 性能测试

```typescript
import { getCurrentTimestampMs } from '@/utils/utils';

const start = getCurrentTimestampMs();
await performExpensiveOperation();
const duration = getCurrentTimestampMs() - start;

console.log(`操作耗时: ${duration}ms`);
```

### 测试代码

```typescript
// 测试代码可以灵活控制
describe('Message', () => {
  it('should create message with custom timestamp', () => {
    const fixedTime = 1709761200; // 直接使用固定值
    const message = createMessage('test', fixedTime);
    expect(message.timestamp).toBe(fixedTime);
  });
});
```

## 注意事项

1. **统一使用工具函数**：不要在代码中直接计算时间戳
2. **秒级 vs 毫秒级**：明确区分使用场景
3. **类型安全**：工具函数返回 `number` 类型
4. **测试灵活性**：测试代码可直接使用固定值

## 常见错误

### ❌ 错误 1：直接使用 Date.now()

```typescript
// 错误
const message: StandardMessage = {
  timestamp: Date.now(), // 毫秒级，类型不匹配
};
```

### ❌ 错误 2：手动除以 1000

```typescript
// 错误
const timestamp = Math.floor(Date.now() / 1000);
```

### ✅ 正确做法

```typescript
// 正确
import { getCurrentTimestamp } from '@/utils/utils';

const timestamp = getCurrentTimestamp();
```

## 相关类型

### StandardMessage.timestamp

```typescript
interface StandardMessage {
  timestamp: number; // 秒级时间戳
}
```

注意：`StandardMessage.timestamp` 是秒级时间戳，不要传入毫秒级时间戳。

## 工具函数对比

| 函数 | 返回值 | 使用场景 | 示例值 |
|-----|--------|---------|--------|
| `getCurrentTimestamp()` | 秒级 | 聊天消息、数据库记录 | 1709761200 |
| `getCurrentTimestampMs()` | 毫秒级 | 性能测试、调试日志 | 1709761200000 |
| `Date.now()` | 毫秒级 | 测试代码 | 1709761200000 |

## 为什么需要工具函数？

1. **一致性**：统一时间戳格式，避免混淆
2. **可读性**：函数名清晰表达意图
3. **可维护性**：修改时间戳逻辑时只需修改一个地方
4. **类型安全**：避免秒级和毫秒级混用
