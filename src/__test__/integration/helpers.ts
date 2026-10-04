/**
 * 集成测试辅助工具
 */

/**
 * 清理浏览器本地存储（localStorage 与 IndexedDB 两个库）
 */
export async function clearBrowserStorage(): Promise<void> {
  localStorage.clear();

  await Promise.all(
    ['multi-chat-store', 'multi-chat-keyring'].map(
      (name) =>
        new Promise<void>((resolve) => {
          const req = indexedDB.deleteDatabase(name);
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
          req.onblocked = () => resolve();
        }),
    ),
  );
}
