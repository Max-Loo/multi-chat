import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';

/**
 * fake-indexeddb v5 测试
 *
 * 验证 fake-indexeddb v5.0.2 在测试环境中的基本功能
 * 确保 IndexedDB mock 行为符合预期
 */
describe('fake-indexeddb v5 test', () => {
  beforeEach(async () => {
    // 清理数据库
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('test-db');
      request.addEventListener('success', () => resolve());
      request.addEventListener('error', () => reject(request.error));
    });
  });

  it('should open database', async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('test-db', 1);
      request.addEventListener('success', () => resolve(request.result));
      request.addEventListener('error', () => reject(request.error));
      request.addEventListener('upgradeneeded', (event) => {
        const upgradeDb = (event.target as IDBOpenDBRequest).result;
        upgradeDb.createObjectStore('test-store');
      });
    });

    expect(db).toBeDefined();
    expect(db.name).toBe('test-db');

    db.close();
  });

  it('should store and retrieve data', async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('test-db', 1);
      request.addEventListener('success', () => resolve(request.result));
      request.addEventListener('error', () => reject(request.error));
      request.addEventListener('upgradeneeded', (event) => {
        const upgradeDb = (event.target as IDBOpenDBRequest).result;
        upgradeDb.createObjectStore('test-store', { keyPath: 'key' });
      });
    });

    // 存储数据
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('test-store', 'readwrite');
      const objectStore = transaction.objectStore('test-store');
      const request = objectStore.add({ key: 'test-key', value: 'test-value' });

      request.addEventListener('success', () => resolve());
      request.addEventListener('error', () => reject(request.error));
    });

    // 读取数据
    const result = await new Promise<any>((resolve, reject) => {
      const transaction = db.transaction('test-store', 'readonly');
      const objectStore = transaction.objectStore('test-store');
      const request = objectStore.get('test-key');

      request.addEventListener('success', () => resolve(request.result));
      request.addEventListener('error', () => reject(request.error));
    });

    expect(result).toBeDefined();
    expect(result.value).toBe('test-value');

    db.close();
  });

  it('should handle transactions correctly', async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('test-db', 1);
      request.addEventListener('success', () => resolve(request.result));
      request.addEventListener('error', () => reject(request.error));
      request.addEventListener('upgradeneeded', (event) => {
        const upgradeDb = (event.target as IDBOpenDBRequest).result;
        upgradeDb.createObjectStore('test-store', { keyPath: 'id', autoIncrement: true });
      });
    });

    // 测试事务的原子性
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('test-store', 'readwrite');
      const objectStore = transaction.objectStore('test-store');

      // 添加多个对象
      objectStore.add({ name: 'item1' });
      objectStore.add({ name: 'item2' });
      objectStore.add({ name: 'item3' });

      transaction.addEventListener('complete', () => resolve());
      transaction.addEventListener('error', () => reject(transaction.error));
    });

    // 验证所有对象都已存储
    const allItems = await new Promise<any[]>((resolve, reject) => {
      const transaction = db.transaction('test-store', 'readonly');
      const objectStore = transaction.objectStore('test-store');
      const request = objectStore.getAll();

      request.addEventListener('success', () => resolve(request.result));
      request.addEventListener('error', () => reject(request.error));
    });

    expect(allItems).toHaveLength(3);
    expect(allItems[0].name).toBe('item1');
    expect(allItems[1].name).toBe('item2');
    expect(allItems[2].name).toBe('item3');

    db.close();
  });
});
