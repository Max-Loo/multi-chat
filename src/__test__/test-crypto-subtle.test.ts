import { test, expect } from 'vitest';

test('crypto.subtle is available', async () => {
  // 检查 crypto.subtle 是否可用
  expect(typeof crypto.subtle).toBe('object');
  
  // 测试简单的加密操作
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  
  expect(key).toBeDefined();
});
