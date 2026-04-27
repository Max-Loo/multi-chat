/**
 * initIndexedDB 单元测试
 *
 * 测试策略：Mock indexedDB.open() 返回可控的 fake request 对象，手动触发事件分支
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock indexedDB because 需要精确控制事件触发顺序和参数
const mockCreateObjectStore = vi.fn();
const mockObjectStoreNames = { contains: vi.fn() };

const createFakeIDBRequest = () => {
  const handlers: Record<string, EventListener> = {};
  const fakeRequest = {
    addEventListener: vi.fn((type: string, handler: EventListener) => {
      handlers[type] = handler;
    }),
    removeEventListener: vi.fn(),
    result: { /* IDBDatabase 实例 */ } as IDBDatabase,
    error: null as DOMException | null,
    _handlers: handlers,
  };
  return fakeRequest;
};

// 保存原始 indexedDB 引用
const originalIndexedDB = globalThis.indexedDB;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('initIndexedDB', () => {
  let fakeRequest: ReturnType<typeof createFakeIDBRequest>;

  beforeEach(() => {
    fakeRequest = createFakeIDBRequest();
    mockCreateObjectStore.mockClear();
    mockObjectStoreNames.contains.mockClear();

    // Mock indexedDB.open 返回 fake request
    globalThis.indexedDB = {
      ...originalIndexedDB,
      open: vi.fn().mockReturnValue(fakeRequest),
    } as IDBFactory;
  });

  afterEach(() => {
    globalThis.indexedDB = originalIndexedDB;
  });

  it('应该 resolve 为 request.result 当 success 事件触发', async () => {
    const fakeDB = { name: 'test-db' } as unknown as IDBDatabase;
    fakeRequest.result = fakeDB;

    const { initIndexedDB } = await import('@/utils/tauriCompat/indexedDB');
    const promise = initIndexedDB('test-db', 'test-store', 'id');

    // 触发 success 事件
    fakeRequest._handlers['success']?.(new Event('success'));

    await expect(promise).resolves.toBe(fakeDB);
  });

  it('应该 reject 为包含 request.error 的 Error 当 error 事件触发', async () => {
    fakeRequest.error = 'VersionError' as unknown as DOMException;

    const { initIndexedDB } = await import('@/utils/tauriCompat/indexedDB');
    const promise = initIndexedDB('test-db', 'test-store', 'id');

    // 触发 error 事件
    fakeRequest._handlers['error']?.(new Event('error'));

    await expect(promise).rejects.toThrow('VersionError');
  });

  it('应该调用 createObjectStore 当 upgradeneeded 事件触发且存储不存在', async () => {
    mockObjectStoreNames.contains.mockReturnValue(false);
    const fakeDB = {
      objectStoreNames: mockObjectStoreNames,
      createObjectStore: mockCreateObjectStore,
    } as unknown as IDBDatabase;

    const { initIndexedDB } = await import('@/utils/tauriCompat/indexedDB');
    const promise = initIndexedDB('test-db', 'test-store', 'id');

    // 触发 upgradeneeded 事件，event.target.result 为 fakeDB
    const event = new Event('upgradeneeded');
    Object.defineProperty(event, 'target', {
      value: { result: fakeDB },
      writable: false,
    });
    fakeRequest._handlers['upgradeneeded']?.(event);

    // 触发 success 完成 Promise
    fakeRequest._handlers['success']?.(new Event('success'));
    await promise;

    expect(mockCreateObjectStore).toHaveBeenCalledWith('test-store', { keyPath: 'id' });
  });

  it('应该不调用 createObjectStore 当对象存储已存在', async () => {
    mockObjectStoreNames.contains.mockReturnValue(true);
    const fakeDB = {
      objectStoreNames: mockObjectStoreNames,
      createObjectStore: mockCreateObjectStore,
    } as unknown as IDBDatabase;

    const { initIndexedDB } = await import('@/utils/tauriCompat/indexedDB');
    const promise = initIndexedDB('test-db', 'existing-store', 'id');

    // 触发 upgradeneeded 事件
    const event = new Event('upgradeneeded');
    Object.defineProperty(event, 'target', {
      value: { result: fakeDB },
      writable: false,
    });
    fakeRequest._handlers['upgradeneeded']?.(event);

    // 触发 success 完成 Promise
    fakeRequest._handlers['success']?.(new Event('success'));
    await promise;

    expect(mockCreateObjectStore).not.toHaveBeenCalled();
  });

  it('应该支持复合键 keyPath（字符串数组）', async () => {
    mockObjectStoreNames.contains.mockReturnValue(false);
    const fakeDB = {
      objectStoreNames: mockObjectStoreNames,
      createObjectStore: mockCreateObjectStore,
    } as unknown as IDBDatabase;

    const { initIndexedDB } = await import('@/utils/tauriCompat/indexedDB');
    const promise = initIndexedDB('test-db', 'test-store', ['chatId', 'modelId']);

    // 触发 upgradeneeded 事件
    const event = new Event('upgradeneeded');
    Object.defineProperty(event, 'target', {
      value: { result: fakeDB },
      writable: false,
    });
    fakeRequest._handlers['upgradeneeded']?.(event);

    // 触发 success 完成 Promise
    fakeRequest._handlers['success']?.(new Event('success'));
    await promise;

    expect(mockCreateObjectStore).toHaveBeenCalledWith('test-store', {
      keyPath: ['chatId', 'modelId'],
    });
  });
});
