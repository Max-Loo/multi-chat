/**
 * Mock 工厂单元测试
 */

import { describe, it, expect } from 'vitest';
import { createMemoryStorageMock } from './storage';

describe('createMemoryStorageMock', () => {
  it('应该创建支持 CRUD 操作的内存存储', async () => {
    const store = createMemoryStorageMock();

    // get 应返回 null（空存储）
    const result = await store.get('key1');
    expect(result).toBeNull();

    // set 后 get 应返回设置的值
    await store.set('key1', 'value1');
    const value = await store.get('key1');
    expect(value).toBe('value1');
  });

  it('应该支持使用外部 Map', async () => {
    const externalMap = new Map<string, unknown>();
    const store = createMemoryStorageMock(externalMap);

    await store.set('key1', 'value1');
    expect(externalMap.get('key1')).toBe('value1');
  });

  it('delete 应该移除存储的值', async () => {
    const store = createMemoryStorageMock();

    await store.set('key1', 'value1');
    await store.delete('key1');
    const result = await store.get('key1');
    expect(result).toBeNull();
  });

  it('keys 应该返回所有键', async () => {
    const store = createMemoryStorageMock();

    await store.set('key1', 'value1');
    await store.set('key2', 'value2');
    const keys = await store.keys();
    expect(keys).toEqual(['key1', 'key2']);
  });

  it('isSupported 应该返回 true', () => {
    const store = createMemoryStorageMock();
    expect(store.isSupported()).toBe(true);
  });
});
