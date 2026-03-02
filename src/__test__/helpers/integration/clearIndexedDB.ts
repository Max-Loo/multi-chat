/**
 * IndexedDB 清理工具
 * 用于集成测试后清理 IndexedDB 数据
 */
export async function clearIndexedDB(): Promise<void> {
  // 检查 indexedDB 是否可用
  if (typeof indexedDB === 'undefined') {
    console.warn('indexedDB 不可用，跳过清理');
    return;
  }

  try {
    // fake-indexeddb 可能不支持 databases() 方法
    // 直接删除已知的数据库名称
    const dbNames = ['multichat', 'multichat-keyval'];
    
    await Promise.all(
      dbNames.map(name => {
        return new Promise<void>((resolve, reject) => {
          const request = indexedDB.deleteDatabase(name);
          request.addEventListener('success', () => resolve());
          request.addEventListener('error', () => reject(request.error));
          request.addEventListener('blocked', () => resolve());
        });
      })
    );
  } catch (error) {
    console.warn('清理 IndexedDB 失败:', error);
  }
}
