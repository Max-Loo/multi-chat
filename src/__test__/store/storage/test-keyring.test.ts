import { describe, it, expect, beforeEach } from 'vitest';
import { WebKeyringCompat } from '@/utils/tauriCompat/keyring';

// fake-indexeddb/auto 已在 setup.ts 中全局导入

describe('WebKeyringCompat simple test', () => {
  let keyring: WebKeyringCompat;

  beforeEach(async () => {
    console.log('[TEST] Creating keyring');
    keyring = new WebKeyringCompat();
    
    console.log('[TEST] Initializing keyring');
    await keyring.init();
    
    console.log('[TEST] Keyring ready');
  });

  it('should set and get password', async () => {
    console.log('[TEST] Setting password');
    await keyring.setPassword('test-service', 'test-user', 'test-password');
    
    console.log('[TEST] Getting password');
    const password = await keyring.getPassword('test-service', 'test-user');
    
    expect(password).toBe('test-password');
    console.log('[TEST] Test passed');
  });
});
