/**
 * 跨浏览器兼容的剪贴板写入工具函数
 * 优先使用 Clipboard API，失败时回退到 execCommand 方案
 */

/**
 * 使用临时 textarea 执行 execCommand('copy') 回退方案
 * @param text 需要复制的文本
 */
function fallbackCopyToClipboard(text: string): void {
  const textarea = document.createElement("textarea");
  textarea.value = text;

  // 设置不可见，避免视觉闪烁和布局偏移
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.left = "-9999px";
  textarea.style.top = "-9999px";

  document.body.appendChild(textarea);
  textarea.select();

  try {
    const success = document.execCommand("copy");
    if (!success) {
      throw new Error("execCommand('copy') returned false");
    }
  } finally {
    document.body.removeChild(textarea);
  }
}

/**
 * 将文本复制到剪贴板，兼容所有主流浏览器及 Tauri webview
 * @param text 需要复制的文本
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    fallbackCopyToClipboard(text);
  }
}
