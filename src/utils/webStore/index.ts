/**
 * Web 键值存储模块统一导出
 * 提供基于 IndexedDB 的键值持久化 API
 *
 * @example
 * ```typescript
 * import { createLazyStore } from '@/utils/webStore';
 * import type { StoreCompat } from '@/utils/webStore';
 *
 * const store = createLazyStore('models.json');
 * await store.init();
 * await store.set('models', modelList);
 * ```
 */

// Store API（统一入口）
export { createLazyStore } from './store';
export type { StoreCompat } from './store';
