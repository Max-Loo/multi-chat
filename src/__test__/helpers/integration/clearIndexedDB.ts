/**
 * IndexedDB 清理工具
 * 用于集成测试后清理 IndexedDB 数据
 */
export async function clearIndexedDB(): Promise<void> {
  // 检查 indexedDB 是否可用
  if (typeof indexedDB === 'undefined' || !indexedDB.databases) {
    console.warn('indexedDB 不可用，跳过清理');
    return;
  }

  try {
    const databases = await indexedDB.databases();
    await Promise.all(
      databases.map(db => db.name ? indexedDB.deleteDatabase(db.name) : Promise.resolve())
    );
  } catch (error) {
    console.warn('清理 IndexedDB 失败:', error);
  }
}
