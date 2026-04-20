/**
 * Fetch mock 工具函数
 * 用于创建模拟的 Response 对象
 */

/**
 * 创建模拟的 Response 对象
 * @param data - 响应体数据（将被 JSON.stringify）
 * @param status - HTTP 状态码
 * @param url - 响应 URL
 */
export function createMockResponse<T>(
  data: T,
  status: number = 200,
  _url: string = 'https://example.com'
): Response {
  const body = data !== undefined ? JSON.stringify(data) : null;

  return new Response(body, {
    status,
    statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
    headers: { 'Content-Type': 'application/json' },
  }) as Response & { url: string };
}
