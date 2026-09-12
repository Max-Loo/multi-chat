/**
 * 创建键盘激活事件处理器（框架中立）
 * @param callback 按下 Enter 或 Space 时调用的回调函数
 * @returns 键盘事件处理器
 */
export const handleActivationKeyDown = (callback: () => void) => {
  return (e: KeyboardEvent): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      callback();
    }
  };
};
