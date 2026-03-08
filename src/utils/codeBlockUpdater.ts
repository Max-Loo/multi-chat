/**
 * 代码块 DOM 更新工具
 *
 * 功能：
 * - 异步加载完成后更新 DOM 中的代码块
 * - 元素生命周期管理（防止内存泄漏）
 * - 元素定位和匹配验证
 */

/**
 * 待更新记录
 */
interface PendingUpdate {
  /** 代码块元素的弱引用 */
  codeElement: WeakRef<HTMLElement>;
  /** 纯文本代码（用于匹配） */
  plainText: string;
  /** 语言名称 */
  language: string;
  /** 时间戳 */
  timestamp: number;
}

/** 待更新记录集合 */
const pendingUpdates = new Map<string, PendingUpdate>();

/**
 * 简单的哈希函数
 * @param str - 输入字符串
 * @returns 哈希值
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * 更新代码块 DOM（带重试机制）
 *
 * @param code - 代码字符串（用于匹配）
 * @param lang - 语言名称
 * @param highlightedHtml - 高亮后的 HTML
 * @param retryCount - 当前重试次数（内部使用）
 * @param maxRetries - 最大重试次数（默认 5 次）
 */
export function updateCodeBlockDOM(
  code: string,
  lang: string,
  highlightedHtml: string,
  retryCount: number = 0,
  maxRetries: number = 5
): void {
  // 🔑 关键修复：延迟 DOM 更新，等待 React 完成渲染
  // 延迟策略：
  // - 第 1 次: 0ms (setTimeout 0，立即尝试)
  // - 第 2 次: 16ms (~1 frame)
  // - 第 3 次: 50ms (~3 frames)
  // - 第 4 次: 100ms (~6 frames)
  // - 第 5 次: 200ms (~12 frames)
  // - 第 6 次: 300ms (~18 frames)
  const delays = [0, 16, 50, 100, 200, 300];
  const delay = delays[retryCount] || 300;

  setTimeout(() => {
    try {
      // 生成唯一标识
      const updateId = `${lang}:${hashString(code)}`;

      // 查找所有匹配的 code 元素
      const codeElements = document.querySelectorAll(`code[class*="language-${lang}"]`);

      let updated = false;
      codeElements.forEach((el) => {
        const codeEl = el as HTMLElement;

        // 检查元素是否仍在 DOM 中（防止更新已卸载的元素）
        if (!document.contains(codeEl)) {
          return;
        }

        // 检查内容是否匹配（避免更新错误的代码块）
        if (codeEl.textContent === code) {
          // 更新 DOM
          codeEl.innerHTML = highlightedHtml;

          // 记录待更新的元素（用于生命周期管理）
          const weakRef = new WeakRef(codeEl);
          pendingUpdates.set(updateId, {
            codeElement: weakRef,
            plainText: code,
            language: lang,
            timestamp: Date.now(),
          });

          // 5 秒后清理记录
          setTimeout(() => {
            pendingUpdates.delete(updateId);
          }, 5000);

          updated = true;
        }
      });

      // 如果未找到匹配元素，并且还有重试次数，则重试
      if (!updated && retryCount < maxRetries) {
        updateCodeBlockDOM(code, lang, highlightedHtml, retryCount + 1, maxRetries);
      }
    } catch {
      // 静默失败，避免影响用户体验
    }
  }, delay);
}

/**
 * 清理所有待更新的记录
 *
 * 在组件卸载时调用，防止内存泄漏
 */
export function cleanupPendingUpdates(): void {
  pendingUpdates.clear();
}

/**
 * 获取待更新记录数量（用于调试）
 * @returns 记录数量
 */
export function getPendingUpdatesCount(): number {
  return pendingUpdates.size;
}
