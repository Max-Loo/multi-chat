/**
 * Toast 模块统一导出
 * 
 * 提供统一的 Toast API，支持移动端响应式位置和手势关闭
 */

/**
 * Toast 队列单例（推荐使用）
 * 
 * 使用场景：
 * - 所有常规的成功/失败/警告/信息提示
 * - 移动端和桌面端的所有 Toast（系统自动适配位置）
 * - 需要队列管理的场景（初始化阶段的消息缓存）
 * 
 * 特性：
 * - Promise-based API：所有方法返回 Promise<T>
 * - 自动设置响应式 position：
 *   - 移动端：强制使用 'top-center'（即使用户传入 position 也忽略）
 *   - 桌面端：保留用户传入的 position，未传入时使用 'bottom-right'
 * - 自动队列管理：外部无需判断时机，系统自动处理
 * - 支持队列机制，解决初始化时 Toaster 未挂载的问题
 * 
 * API 方法：
 * - success(message, options?): Promise<string | number>
 * - error(message, options?): Promise<string | number>
 * - warning(message, options?): Promise<string | number>
 * - info(message, options?): Promise<string | number>
 * - loading(message, options?): Promise<string | number>
 * - dismiss(id?): void（不加入队列，立即执行）
 * - promise(promise, options): void（不加入队列，立即执行）
 * 
 * 使用示例：
 * ```typescript
 * // 不使用 await（大多数场景）
 * toastQueue.success('操作成功');
 * 
 * // 使用 await（需要 toast ID）
 * const loadingId = await toastQueue.loading('加载中...');
 * toastQueue.dismiss(loadingId);
 * 
 * // 桌面端自定义位置
 * toastQueue.error('发生错误', { position: 'top-left' });
 * 
 * // 移动端：即使传入 position 也会被强制为 'top-center'
 * toastQueue.success('消息', { position: 'bottom-right' }); // 仍然显示在 top-center
 * ```
 */
export { toastQueue } from './toastQueue';

/**
 * 原始 sonner API（特殊场景使用）
 * 
 * 使用场景：
 * - 需要在特定位置显示 Toast（如底部通知、中心弹窗）
 * - 需要动态位置（根据业务逻辑决定位置）
 * - 需要在移动端也自定义位置（完全自由控制）
 * - 需要测试 Toast 的不同位置效果
 * 
 * 禁止使用场景：
 * - 普通的成功/失败提示（应使用 toastQueue）
 * - 需要响应式位置的 Toast（应使用 toastQueue，系统自动适配移动端/桌面端）
 * - 移动端的标准业务提示（应使用 toastQueue，位置由系统自动管理为 top-center）
 * 
 * 注意：使用 rawToast 可以完全控制 position，包括在移动端也自定义位置
 */
export { rawToast } from './toastQueue';
