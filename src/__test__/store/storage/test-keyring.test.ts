import { describe, it, expect, beforeEach } from 'vitest';
import { WebKeyringCompat } from '@/utils/tauriCompat/keyring';

// fake-indexeddb/auto 已在 setup.ts 中全局导入

describe('WebKeyringCompat simple test', () => {
  let keyring: WebKeyringCompat;

  beforeEach(async () => {
    keyring = new WebKeyringCompat();
    await keyring.init();
  });

  it('应该正确设置和获取密码', async () => {
    await keyring.setPassword('test-service', 'test-user', 'test-password');
    const password = await keyring.getPassword('test-service', 'test-user');

    expect(password).toBe('test-password');
  });
});
