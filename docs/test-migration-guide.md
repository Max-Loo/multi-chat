# 测试辅助工具迁移指南

本文档介绍如何从旧的 Mock 策略迁移到新的统一 Mock 系统。

## 概述

新的测试辅助工具系统提供：

- **统一的 Mock 工厂**: `createTauriMocks()`, `createCryptoMocks()`, `createStorageMocks()`
- **测试数据工厂**: `createMockModel()`, `createMockModels()`, `createCryptoTestData()`
- **自定义断言**: `toBeEncrypted()`, `toBeValidMasterKey()`
- **环境隔离**: `resetTestState()`, `useIsolatedTest()`, `clearIndexedDB()`

## 快速开始

### 导入测试辅助工具

```typescript
// 方式 1: 从统一入口导入
import { 
  createTauriMocks, 
  createMockModel, 
  resetTestState 
} from '@/test-helpers';

// 方式 2: 按模块导入
import { createTauriMocks } from '@/test-helpers/mocks';
import { createMockModel } from '@/test-helpers/fixtures';
import { resetTestState } from '@/test-helpers/isolation';
```

## 迁移示例

### 1. Tauri API Mock

**迁移前**（旧方式）:

```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';

// 在测试文件中手动 Mock
vi.mock('@/utils/tauriCompat/shell', () => ({
  shell: { open: vi.fn() },
  Command: { create: vi.fn() },
}));

describe('MyComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should work', async () => {
    // ...
  });
});
```

**迁移后**（新方式）:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createTauriMocks, resetTestState } from '@/test-helpers';

describe('MyComponent', () => {
  const mocks = createTauriMocks();

  beforeEach(() => {
    mocks.resetAll();
  });

  it('should work', async () => {
    // 可以自定义 Mock 行为
    mocks.shell.open.mockResolvedValue(undefined);
    // ...
  });
});
```

### 2. 测试数据创建

**迁移前**:

```typescript
const mockModel = {
  id: 'test-1',
  providerName: 'OpenAI',
  modelName: 'gpt-4',
  apiKey: 'sk-test',
  // ... 手动填写所有字段
};
```

**迁移后**:

```typescript
import { createMockModel, createMockModels } from '@/test-helpers';

// 创建单个 Model（所有字段有默认值）
const model = createMockModel();

// 覆盖特定字段
const customModel = createMockModel({ 
  apiKey: 'my-key',
  modelName: 'gpt-3.5-turbo' 
});

// 批量创建
const models = createMockModels(5);
```

### 3. 自定义断言

**迁移前**:

```typescript
expect(value.startsWith('enc:')).toBe(true);
expect(/^[0-9a-f]{64}$/.test(key)).toBe(true);
```

**迁移后**:

```typescript
import { toBeEncrypted, toBeValidMasterKey } from '@/test-helpers/assertions';

expect(value).toBeEncrypted();
expect(key).toBeValidMasterKey();
```

### 4. 环境隔离

**迁移前**:

```typescript
afterEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});
```

**迁移后**:

```typescript
import { useIsolatedTest, resetTestState } from '@/test-helpers';

// 方式 1: 自动隔离钩子
useIsolatedTest();

// 方式 2: 手动调用
afterEach(() => {
  resetTestState();
});

// 方式 3: 包含 IndexedDB 清理
resetTestState({ resetIndexedDB: true });
```

## API 参考

### Mock 工厂

#### `createTauriMocks(options?)`

创建 Tauri API Mock 实例。

```typescript
const mocks = createTauriMocks({ isTauri: true });

// 可用 Mock
mocks.shell.open
mocks.os.locale
mocks.http.fetch
mocks.store.createLazyStore
mocks.keyring.getPassword
mocks.env.isTauri

// 工具方法
mocks.resetAll()
mocks.configure({ isTauri: false })
```

#### `createCryptoMocks()`

创建加密 API Mock 实例。

```typescript
const mocks = createCryptoMocks();

mocks.encryptField.mockResolvedValue('enc:data');
mocks.decryptField.mockResolvedValue('plaintext');
mocks.isEncrypted.mockReturnValue(true);
```

#### `createStorageMocks()`

创建存储 API Mock 实例。

```typescript
const mocks = createStorageMocks();

mocks.loadFromStore.mockResolvedValue([{ id: '1' }]);
mocks.saveToStore.mockResolvedValue(undefined);
```

### 测试数据工厂

#### `createMockModel(overrides?)`

创建测试用 Model 对象。

```typescript
const model = createMockModel({ apiKey: 'custom' });
```

#### `createMockModels(count, overrides?)`

批量创建 Model 对象。

```typescript
const models = createMockModels(5);
const models = createMockModels(3, (i) => ({ nickname: `Model ${i}` }));
```

### 环境隔离

#### `resetTestState(options?)`

重置测试环境状态。

```typescript
resetTestState({
  resetLocalStorage: true,
  resetMocks: true,
  resetModules: false,
  resetIndexedDB: false,
});
```

#### `useIsolatedTest(options?)`

自动配置隔离钩子。

```typescript
useIsolatedTest({
  onBeforeEach: () => { /* 自定义初始化 */ },
  onAfterEach: () => { /* 自定义清理 */ },
  resetOptions: { resetIndexedDB: true },
});
```

### 自定义断言

```typescript
// 加密格式断言
expect(value).toBeEncrypted();

// 主密钥格式断言
expect(key).toBeValidMasterKey();
```

## 最佳实践

1. **优先使用工厂函数**: 使用 `createTauriMocks()` 等工厂创建 Mock，而不是手动配置
2. **使用测试数据工厂**: 使用 `createMockModel()` 创建测试数据，确保字段完整
3. **显式隔离**: 在需要隔离的测试中使用 `resetTestState()` 或 `useIsolatedTest()`
4. **自定义断言**: 使用 `toBeEncrypted()` 等自定义断言提高可读性

## 向后兼容

新的测试辅助工具系统与现有测试完全兼容：

- 现有的 `vi.mock()` 调用仍然有效
- 可以逐步迁移测试文件
- 新旧系统可以共存
