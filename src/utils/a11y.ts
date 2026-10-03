/**
 * 键盘激活事件处理器
 * 为可交互元素提供 Enter/Space 激活行为（无障碍支持）
 */

/**
 * 创建键盘激活事件处理器
 * @param callback 按下 Enter 或 Space 时调用的回调函数
 * @returns 键盘事件处理器
 */
export const handleActivationKeyDown = (callback: () => void) => {
  return (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      callback();
    }
  };
};
