/**
 * 在 markdown 内容中查找最后一个安全的分割点
 *
 * 逐行扫描内容，跟踪 fenced code block 状态（``` 和 ~~~），
 * 返回代码块外最后一个空行的字符位置作为安全分割点。
 * 返回 0 表示无安全分割点。
 *
 * @param content - markdown 内容字符串
 * @returns 安全分割点的字符位置
 */
export function findSafeSplitPoint(content: string): number {
  if (!content) return 0;

  let inCodeBlock = false;
  let codeBlockMarker = "";
  let lastSafePoint = 0;
  let pos = 0;

  while (pos <= content.length) {
    const lineEnd = content.indexOf("\n", pos);
    const line =
      lineEnd === -1 ? content.slice(pos) : content.slice(pos, lineEnd);
    const trimmed = line.trimStart();

    // 检测 fenced code block 标记
    if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
      const match = trimmed.match(/^(`{3,}|~{3,})/);
      if (match) {
        const marker = match[1];
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockMarker = marker;
        } else if (
          marker[0] === codeBlockMarker[0] &&
          marker.length >= codeBlockMarker.length
        ) {
          inCodeBlock = false;
          codeBlockMarker = "";
        }
      }
    }

    // 代码块外的空行是安全分割点（忽略末尾隐含的空行）
    if (!inCodeBlock && line.trim() === "" && lineEnd !== -1) {
      lastSafePoint = pos;
    }

    if (lineEnd === -1) break;
    pos = lineEnd + 1;
  }

  return lastSafePoint;
}
