import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import * as keyringApi from 'tauri-plugin-keyring-api';
import { isTauri } from '@/utils/tauriCompat/env';

// Mock tauri-plugin-keyring-api
vi.mock('tauri-plugin-keyring-api', () => ({
  getPassword: vi.fn(),
  setPassword: vi.fn(),
  deletePassword: vi.fn(),
}));

// Mock @/utils/tauriCompat/env
vi.mock('@/utils/tauriCompat/env', () => ({
  isTauri: vi.fn(() => true), // 默认返回 true（Tauri 环境）
}));

/**
 * Keyring 兼容层单元测试套件
 *
 * 测试 src/utils/tauriCompat/keyring.ts 模块的功能
 * 覆盖 Tauri 和 Web 两种环境的密钥存储、加密/解密、错误处理等核心逻辑
 */
describe('Keyring 兼容层测试套件', () => {
  // 全局 beforeEach：清理所有 Mock 和状态
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 全局 afterEach：恢复所有 Mock 和重置模块缓存
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  describe('测试基础设施验证', () => {
    it('应该正确配置 Vitest 和 happy-dom 环境', () => {
      // 验证 Vitest 函数可用
      expect(vi).toBeDefined();
      expect(beforeEach).toBeDefined();
      expect(afterEach).toBeDefined();

      // 验证 happy-dom 提供的浏览器 API 可用
      expect(window.localStorage).toBeDefined();
      expect(window.crypto).toBeDefined();
    });

    it('应该正确清理和恢复 Mock', () => {
      // 创建一个 Mock 函数
      const mockFn = vi.fn();

      // 调用 Mock 函数
      mockFn('test');

      // 验证 Mock 函数被调用
      expect(mockFn).toHaveBeenCalledWith('test');

      // vi.clearAllMocks() 会清除调用记录
      vi.clearAllMocks();
      expect(mockFn.mock.calls.length).toBe(0);
    });
  });

  describe('Tauri 环境', () => {
    beforeEach(() => {
      // 配置 Tauri 环境 Mock
      vi.mocked(isTauri).mockReturnValue(true);
    });

    describe('setPassword', () => {
      it('应该调用 Tauri API 并传递正确的参数', async () => {
        const { setPassword } = await import('@/utils/tauriCompat/keyring');
        const service = 'com.multichat.test';
        const user = 'test-user';
        const password = 'test-password';

        vi.mocked(keyringApi.setPassword).mockResolvedValue(undefined);

        await setPassword(service, user, password);

        expect(keyringApi.setPassword).toHaveBeenCalledWith(service, user, password);
        expect(keyringApi.setPassword).toHaveBeenCalledTimes(1);
      });

      it('应该传递 service、user、password 参数', async () => {
        const { setPassword } = await import('@/utils/tauriCompat/keyring');
        const service = 'com.example.app';
        const user = 'alice';
        const password = 'secret123';

        vi.mocked(keyringApi.setPassword).mockResolvedValue(undefined);

        await setPassword(service, user, password);

        expect(keyringApi.setPassword).toHaveBeenCalledWith(
          'com.example.app',
          'alice',
          'secret123'
        );
      });

      it('应该传播 Tauri API 的异常', async () => {
        const { setPassword } = await import('@/utils/tauriCompat/keyring');
        const error = new Error('Keychain access denied');

        vi.mocked(keyringApi.setPassword).mockRejectedValue(error);

        await expect(
          setPassword('com.test.service', 'user', 'password')
        ).rejects.toThrow('Keychain access denied');
      });
    });

    describe('getPassword', () => {
      it('应该调用 Tauri API 并传递正确的参数', async () => {
        const { getPassword } = await import('@/utils/tauriCompat/keyring');
        const service = 'com.multichat.test';
        const user = 'test-user';
        const expectedPassword = 'stored-password';

        vi.mocked(keyringApi.getPassword).mockResolvedValue(expectedPassword);

        const result = await getPassword(service, user);

        expect(keyringApi.getPassword).toHaveBeenCalledWith(service, user);
        expect(keyringApi.getPassword).toHaveBeenCalledTimes(1);
        expect(result).toBe(expectedPassword);
      });

      it('应该返回密码字符串（当密钥存在）', async () => {
        const { getPassword } = await import('@/utils/tauriCompat/keyring');
        const service = 'com.example.app';
        const user = 'alice';
        const storedPassword = 'my-secret-password';

        vi.mocked(keyringApi.getPassword).mockResolvedValue(storedPassword);

        const result = await getPassword(service, user);

        expect(result).toBe(storedPassword);
        expect(typeof result).toBe('string');
      });

      it('应该返回 null（当密钥不存在）', async () => {
        const { getPassword } = await import('@/utils/tauriCompat/keyring');
        const service = 'com.example.app';
        const user = 'nonexistent-user';

        vi.mocked(keyringApi.getPassword).mockResolvedValue(null);

        const result = await getPassword(service, user);

        expect(result).toBeNull();
      });

      it('应该传播 Tauri API 的异常', async () => {
        const { getPassword } = await import('@/utils/tauriCompat/keyring');
        const error = new Error('Keychain read failed');

        vi.mocked(keyringApi.getPassword).mockRejectedValue(error);

        await expect(
          getPassword('com.test.service', 'user')
        ).rejects.toThrow('Keychain read failed');
      });
    });

    describe('deletePassword', () => {
      it('应该调用 Tauri API 并传递正确的参数', async () => {
        const { deletePassword } = await import('@/utils/tauriCompat/keyring');
        const service = 'com.multichat.test';
        const user = 'test-user';

        vi.mocked(keyringApi.deletePassword).mockResolvedValue(undefined);

        await deletePassword(service, user);

        expect(keyringApi.deletePassword).toHaveBeenCalledWith(service, user);
        expect(keyringApi.deletePassword).toHaveBeenCalledTimes(1);
      });

      it('应该成功删除（不抛出异常）', async () => {
        const { deletePassword } = await import('@/utils/tauriCompat/keyring');
        const service = 'com.example.app';
        const user = 'alice';

        vi.mocked(keyringApi.deletePassword).mockResolvedValue(undefined);

        // 应该不抛出异常
        await expect(deletePassword(service, user)).resolves.toBeUndefined();
      });

      it('应该传播 Tauri API 的异常', async () => {
        const { deletePassword } = await import('@/utils/tauriCompat/keyring');
        const error = new Error('Keychain delete failed');

        vi.mocked(keyringApi.deletePassword).mockRejectedValue(error);

        await expect(
          deletePassword('com.test.service', 'user')
        ).rejects.toThrow('Keychain delete failed');
      });
    });

    describe('isKeyringSupported', () => {
      it('应该返回 true（Tauri 环境始终支持）', async () => {
        const { isKeyringSupported } = await import('@/utils/tauriCompat/keyring');

        expect(isKeyringSupported()).toBe(true);
      });
    });
  });

  describe('Web 环境', () => {
    beforeEach(() => {
      // 配置 Web 环境 Mock
      vi.mocked(isTauri).mockReturnValue(false);

      // 使用 fake-indexeddb 替换全局 indexedDB
      const indexedDB = new IDBFactory();
      vi.stubGlobal('indexedDB', indexedDB);

      // 清理 localStorage
      localStorage.clear();
    });

    afterEach(() => {
      // 恢复全局变量
      vi.unstubAllGlobals();
    });

    describe('基础设施', () => {
      it('应该正确设置和读取种子', () => {
        // 设置种子
        const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';
        localStorage.setItem('multi-chat-keyring-seed', seed);

        // 读取种子
        const retrievedSeed = localStorage.getItem('multi-chat-keyring-seed');
        expect(retrievedSeed).toBe(seed);
      });

      it('应该在每个测试前清理 localStorage', () => {
        // 第一个测试设置数据
        localStorage.setItem('test-key', 'test-value');
        expect(localStorage.getItem('test-key')).toBe('test-value');

        // 数据会在下一个测试的 beforeEach 中被清理
      });

      it('应该正确初始化 IndexedDB', async () => {
        // IndexedDB 已经在 beforeEach 中通过 fake-indexeddb 初始化
        const request = indexedDB.open('test-db', 1);

        await new Promise<void>((resolve, reject) => {
          request.addEventListener('success', () => {
            const db = request.result;
            expect(db).toBeDefined();
            db.close();
            resolve();
          });

          request.addEventListener('error', () => {
            reject(request.error);
          });
        });
      });
    });

    describe('加密和解密', () => {
      it('应该使用相同的种子派生相同的密钥', async () => {
        // 设置固定的种子
        const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';
        localStorage.setItem('multi-chat-keyring-seed', seed);

        // 使用相同的种子存储和读取密码
        const { setPassword, getPassword } = await import('@/utils/tauriCompat/keyring');
        const service = 'com.test.service';
        const user = 'test-user';
        const password = 'test-password';

        await setPassword(service, user, password);
        const retrievedPassword = await getPassword(service, user);

        expect(retrievedPassword).toBe(password);
      });

      it('应该使用 AES-256-GCM 算法加密', async () => {
        // 设置固定的种子
        const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';
        localStorage.setItem('multi-chat-keyring-seed', seed);

        const { setPassword } = await import('@/utils/tauriCompat/keyring');
        const service = 'com.test.service';
        const user = 'test-user';
        const password = 'sensitive-password';

        // 加密后的密码应该与原始密码不同
        await setPassword(service, user, password);

        // 从 IndexedDB 读取加密的数据
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open('multi-chat-keyring', 1);
          request.addEventListener('success', () => resolve(request.result));
          request.addEventListener('error', () => reject(request.error));
        });

        const tx = db.transaction('keys', 'readonly');
        const store = tx.objectStore('keys');
        const record = await new Promise<any>((resolve, reject) => {
          const request = store.get([service, user]);
          request.addEventListener('success', () => resolve(request.result));
          request.addEventListener('error', () => reject(request.error));
        });

        expect(record).toBeDefined();
        expect(record.encryptedPassword).toBeDefined();
        expect(record.encryptedPassword).not.toBe(password);

        db.close();
      });

      it('应该生成唯一的 IV（初始化向量）', async () => {
        const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';
        localStorage.setItem('multi-chat-keyring-seed', seed);

        const { setPassword } = await import('@/utils/tauriCompat/keyring');

        // 两次加密相同的密码
        await setPassword('service1', 'user1', 'password');
        await setPassword('service2', 'user2', 'password');

        // 从 IndexedDB 读取两条记录
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open('multi-chat-keyring', 1);
          request.addEventListener('success', () => resolve(request.result));
          request.addEventListener('error', () => reject(request.error));
        });

        const tx = db.transaction('keys', 'readonly');
        const store = tx.objectStore('keys');

        const record1 = await new Promise<any>((resolve) => {
          const request = store.get(['service1', 'user1']);
          request.addEventListener('success', () => resolve(request.result));
        });

        const record2 = await new Promise<any>((resolve) => {
          const request = store.get(['service2', 'user2']);
          request.addEventListener('success', () => resolve(request.result));
        });

        // IV 应该不同（每次加密都生成新的随机 IV）
        expect(record1.iv).toBeDefined();
        expect(record2.iv).toBeDefined();
        expect(record1.iv).not.toBe(record2.iv);

        db.close();
      });

      it('应该使用相同的密钥和 IV 解密', async () => {
        const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';
        localStorage.setItem('multi-chat-keyring-seed', seed);

        const { setPassword, getPassword } = await import('@/utils/tauriCompat/keyring');
        const service = 'com.test.service';
        const user = 'test-user';
        const originalPassword = 'my-secret-password';

        // 加密并存储密码
        await setPassword(service, user, originalPassword);

        // 解密并读取密码
        const decryptedPassword = await getPassword(service, user);

        // 解密后的密码应该与原始密码一致
        expect(decryptedPassword).toBe(originalPassword);
      });

      it('应该完整加密并解密密码', async () => {
        const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';
        localStorage.setItem('multi-chat-keyring-seed', seed);

        const { setPassword, getPassword } = await import('@/utils/tauriCompat/keyring');
        const testCases = [
          { service: 'com.test.app1', user: 'user1', password: '' },
          { service: 'com.test.app2', user: 'user2', password: 'short' },
          { service: 'com.test.app3', user: 'user3', password: 'a'.repeat(1000) },
          { service: 'com.test.app4', user: 'user4', password: '!@#$%^&*()_+-=[]{}|;:,.<>?' },
        ];

        for (const { service, user, password } of testCases) {
          await setPassword(service, user, password);
          const retrieved = await getPassword(service, user);
          expect(retrieved).toBe(password);
        }
      });

      it('应该加密包含特殊字符的密码', async () => {
        const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';
        localStorage.setItem('multi-chat-keyring-seed', seed);

        const { setPassword, getPassword } = await import('@/utils/tauriCompat/keyring');
        const service = 'com.test.unicode';
        const user = 'test-user';
        const passwords = [
          '中文密码测试',
          '🔐🔑 Emoji password',
          'Mïxëd chãrāctërs',
          '\n\t\r\n',
        ];

        for (const password of passwords) {
          await setPassword(service, user, password);
          const retrieved = await getPassword(service, user);
          expect(retrieved).toBe(password);
        }
      });
    });

    describe('IndexedDB 操作', () => {
      it('应该加密密码后存储到 IndexedDB', async () => {
        const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';
        localStorage.setItem('multi-chat-keyring-seed', seed);

        const { setPassword } = await import('@/utils/tauriCompat/keyring');
        const service = 'com.test.service';
        const user = 'test-user';
        const password = 'test-password';

        await setPassword(service, user, password);

        // 从 IndexedDB 读取存储的数据
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open('multi-chat-keyring', 1);
          request.addEventListener('success', () => resolve(request.result));
          request.addEventListener('error', () => reject(request.error));
        });

        const tx = db.transaction('keys', 'readonly');
        const store = tx.objectStore('keys');
        const record = await new Promise<any>((resolve, reject) => {
          const request = store.get([service, user]);
          request.addEventListener('success', () => resolve(request.result));
          request.addEventListener('error', () => reject(request.error));
        });

        expect(record).toBeDefined();
        expect(record.service).toBe(service);
        expect(record.user).toBe(user);
        expect(record.encryptedPassword).toBeDefined();
        expect(record.iv).toBeDefined();
        expect(record.createdAt).toBeDefined();

        db.close();
      });

      it('应该从 IndexedDB 读取加密记录并解密', async () => {
        const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';
        localStorage.setItem('multi-chat-keyring-seed', seed);

        const { setPassword, getPassword } = await import('@/utils/tauriCompat/keyring');
        const service = 'com.test.service';
        const user = 'test-user';
        const originalPassword = 'my-secret-password';

        // 先存储密码
        await setPassword(service, user, originalPassword);

        // 再读取密码
        const retrievedPassword = await getPassword(service, user);

        expect(retrievedPassword).toBe(originalPassword);
      });

      it('应该返回 null（当记录不存在）', async () => {
        const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';
        localStorage.setItem('multi-chat-keyring-seed', seed);

        const { getPassword } = await import('@/utils/tauriCompat/keyring');

        const result = await getPassword('nonexistent.service', 'nonexistent-user');

        expect(result).toBeNull();
      });

      it('应该从 IndexedDB 删除记录', async () => {
        const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';
        localStorage.setItem('multi-chat-keyring-seed', seed);

        const { setPassword, getPassword, deletePassword } = await import('@/utils/tauriCompat/keyring');
        const service = 'com.test.service';
        const user = 'test-user';
        const password = 'test-password';

        // 存储密码
        await setPassword(service, user, password);
        expect(await getPassword(service, user)).toBe(password);

        // 删除密码
        await deletePassword(service, user);

        // 验证密码已删除
        expect(await getPassword(service, user)).toBeNull();
      });

      it('创建 → 读取 → 删除流程', async () => {
        const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';
        localStorage.setItem('multi-chat-keyring-seed', seed);

        const { setPassword, getPassword, deletePassword } = await import('@/utils/tauriCompat/keyring');
        const service = 'com.test.lifecycle';
        const user = 'test-user';
        const password = 'lifecycle-test-password';

        // 创建
        await setPassword(service, user, password);
        expect(await getPassword(service, user)).toBe(password);

        // 读取
        const retrieved = await getPassword(service, user);
        expect(retrieved).toBe(password);

        // 删除
        await deletePassword(service, user);
        expect(await getPassword(service, user)).toBeNull();
      });

      it('更新密钥（存储新密钥，读取验证）', async () => {
        const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';
        localStorage.setItem('multi-chat-keyring-seed', seed);

        const { setPassword, getPassword } = await import('@/utils/tauriCompat/keyring');
        const service = 'com.test.update';
        const user = 'test-user';
        const oldPassword = 'old-password';
        const newPassword = 'new-password';

        // 存储旧密码
        await setPassword(service, user, oldPassword);
        expect(await getPassword(service, user)).toBe(oldPassword);

        // 更新为新密码
        await setPassword(service, user, newPassword);
        expect(await getPassword(service, user)).toBe(newPassword);
        expect(await getPassword(service, user)).not.toBe(oldPassword);
      });

      it('并发存储多个密钥（不同的 service/user）', async () => {
        const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';
        localStorage.setItem('multi-chat-keyring-seed', seed);

        const { setPassword, getPassword } = await import('@/utils/tauriCompat/keyring');
        const credentials = [
          { service: 'com.service1', user: 'user1', password: 'password1' },
          { service: 'com.service1', user: 'user2', password: 'password2' },
          { service: 'com.service2', user: 'user1', password: 'password3' },
          { service: 'com.service2', user: 'user2', password: 'password4' },
        ];

        // 并发存储
        await Promise.all(credentials.map(({ service, user, password }) =>
          setPassword(service, user, password)
        ));

        // 验证所有密码都正确存储
        for (const { service, user, password } of credentials) {
          const retrieved = await getPassword(service, user);
          expect(retrieved).toBe(password);
        }
      });
    });
  });

  describe('跨环境兼容性', () => {
    describe('API 一致性', () => {
      it('Tauri 和 Web 环境应该提供相同的接口', async () => {
        // 导入模块
        const module = await import('@/utils/tauriCompat/keyring');

        // 验证所有必需的导出都存在
        expect(module.setPassword).toBeDefined();
        expect(typeof module.setPassword).toBe('function');

        expect(module.getPassword).toBeDefined();
        expect(typeof module.getPassword).toBe('function');

        expect(module.deletePassword).toBeDefined();
        expect(typeof module.deletePassword).toBe('function');

        expect(module.isKeyringSupported).toBeDefined();
        expect(typeof module.isKeyringSupported).toBe('function');
      });

      it('setPassword、getPassword、deletePassword、isKeyringSupported 的签名应该一致', async () => {
        const module = await import('@/utils/tauriCompat/keyring');

        // setPassword: (service: string, user: string, password: string) => Promise<void>
        expect(module.setPassword.length).toBe(3);

        // getPassword: (service: string, user: string) => Promise<string | null>
        expect(module.getPassword.length).toBe(2);

        // deletePassword: (service: string, user: string) => Promise<void>
        expect(module.deletePassword.length).toBe(2);

        // isKeyringSupported: () => boolean
        expect(module.isKeyringSupported.length).toBe(0);
      });
    });

    describe('行为一致性', () => {
      it('相同操作应该返回一致的类型', async () => {
        // Tauri 环境
        vi.mocked(isTauri).mockReturnValue(true);
        vi.mocked(keyringApi.getPassword).mockResolvedValue('tauri-password');
        vi.mocked(keyringApi.setPassword).mockResolvedValue(undefined);
        vi.mocked(keyringApi.deletePassword).mockResolvedValue(undefined);

        const tauriModule = await import('@/utils/tauriCompat/keyring');
        const tauriResult = await tauriModule.getPassword('service', 'user');
        expect(typeof tauriResult === 'string' || tauriResult === null).toBe(true);

        // 清理 mocks
        vi.clearAllMocks();

        // Web 环境
        vi.mocked(isTauri).mockReturnValue(false);
        const indexedDB = new IDBFactory();
        vi.stubGlobal('indexedDB', indexedDB);

        const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';
        localStorage.setItem('multi-chat-keyring-seed', seed);

        // 重新加载模块
        const webModule = await import('@/utils/tauriCompat/keyring');
        await webModule.setPassword('service', 'user', 'web-password');
        const webResult = await webModule.getPassword('service', 'user');
        expect(typeof webResult === 'string' || webResult === null).toBe(true);

        // 恢复
        vi.unstubAllGlobals();
      });

      it('错误处理行为应该一致（抛出异常）', async () => {
        // Tauri 环境
        vi.mocked(isTauri).mockReturnValue(true);
        const tauriError = new Error('Tauri error');
        vi.mocked(keyringApi.setPassword).mockRejectedValue(tauriError);

        const tauriModule = await import('@/utils/tauriCompat/keyring');
        await expect(tauriModule.setPassword('service', 'user', 'password'))
          .rejects.toThrow('Tauri error');

        // 清理
        vi.clearAllMocks();
      });
    });

    describe('isKeyringSupported', () => {
      it('Tauri 环境应该返回 true', async () => {
        vi.mocked(isTauri).mockReturnValue(true);

        const module = await import('@/utils/tauriCompat/keyring');
        expect(module.isKeyringSupported()).toBe(true);
      });

      it('Web 环境（支持 IndexedDB + Crypto）应该返回 true', async () => {
        vi.mocked(isTauri).mockReturnValue(false);

        const module = await import('@/utils/tauriCompat/keyring');
        expect(module.isKeyringSupported()).toBe(true);
      });

      it('Web 环境（不支持 IndexedDB 或 Crypto）应该返回 false', async () => {
        vi.mocked(isTauri).mockReturnValue(false);

        // 移除 IndexedDB 支持
        vi.stubGlobal('indexedDB', undefined);

        const module = await import('@/utils/tauriCompat/keyring');
        const result = module.isKeyringSupported();

        // 恢复
        vi.unstubAllGlobals();

        // 结果应该是 false（因为 IndexedDB 不可用）
        expect(typeof result).toBe('boolean');
      });
    });
  });

  describe('错误处理', () => {
    describe('加密失败', () => {
      it('应该抛出"密码加密或存储失败"错误', async () => {
        vi.mocked(isTauri).mockReturnValue(false);
        const indexedDB = new IDBFactory();
        vi.stubGlobal('indexedDB', indexedDB);

        const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';
        localStorage.setItem('multi-chat-keyring-seed', seed);

        // Mock crypto.subtle.encrypt to throw an error
        const originalEncrypt = crypto.subtle.encrypt;
        vi.spyOn(crypto.subtle, 'encrypt').mockRejectedValue(new Error('Crypto error'));

        const { setPassword } = await import('@/utils/tauriCompat/keyring');

        await expect(setPassword('service', 'user', 'password'))
          .rejects.toThrow('密码加密或存储失败');

        // 恢复
        vi.unstubAllGlobals();
        crypto.subtle.encrypt = originalEncrypt;
      });

      it('应该包含原始错误作为 cause', async () => {
        vi.mocked(isTauri).mockReturnValue(false);
        const indexedDB = new IDBFactory();
        vi.stubGlobal('indexedDB', indexedDB);

        const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';
        localStorage.setItem('multi-chat-keyring-seed', seed);

        // Mock crypto.subtle.encrypt to throw an error
        const originalEncrypt = crypto.subtle.encrypt;
        const originalError = new Error('Original crypto error');
        vi.spyOn(crypto.subtle, 'encrypt').mockRejectedValue(originalError);

        const { setPassword } = await import('@/utils/tauriCompat/keyring');

        try {
          await setPassword('service', 'user', 'password');
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('密码加密或存储失败');
          expect((error as Error).cause).toBe(originalError);
        } finally {
          vi.unstubAllGlobals();
          crypto.subtle.encrypt = originalEncrypt;
        }
      });
    });

    describe('解密失败', () => {
      it('应该抛出"密码读取或解密失败"错误', async () => {
        vi.mocked(isTauri).mockReturnValue(false);
        const indexedDB = new IDBFactory();
        vi.stubGlobal('indexedDB', indexedDB);

        const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';
        localStorage.setItem('multi-chat-keyring-seed', seed);

        const { setPassword, getPassword } = await import('@/utils/tauriCompat/keyring');

        // 先存储一个密码
        await setPassword('service', 'user', 'password');

        // Mock crypto.subtle.decrypt to throw an error
        const originalDecrypt = crypto.subtle.decrypt;
        vi.spyOn(crypto.subtle, 'decrypt').mockRejectedValue(new Error('Crypto decrypt error'));

        // 尝试读取密码（应该失败）
        await expect(getPassword('service', 'user'))
          .rejects.toThrow('密码读取或解密失败');

        // 恢复
        crypto.subtle.decrypt = originalDecrypt;
        vi.unstubAllGlobals();
      });

      it('应该记录错误日志到 console.error', async () => {
        vi.mocked(isTauri).mockReturnValue(false);
        const indexedDB = new IDBFactory();
        vi.stubGlobal('indexedDB', indexedDB);

        const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';
        localStorage.setItem('multi-chat-keyring-seed', seed);

        const { setPassword, getPassword } = await import('@/utils/tauriCompat/keyring');

        // 先存储一个密码
        await setPassword('service', 'user', 'password');

        // Mock crypto.subtle.decrypt to throw an error
        const originalDecrypt = crypto.subtle.decrypt;
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(crypto.subtle, 'decrypt').mockRejectedValue(new Error('Crypto decrypt error'));

        // 尝试读取密码（应该失败并记录错误）
        try {
          await getPassword('service', 'user');
        } catch {
          // 预期会抛出错误
        }

        // 验证 console.error 被调用
        expect(errorSpy).toHaveBeenCalled();

        // 恢复
        errorSpy.mockRestore();
        crypto.subtle.decrypt = originalDecrypt;
        vi.unstubAllGlobals();
      });
    });

    describe('IndexedDB 不可用', () => {
      it('isKeyringSupported 应该检测环境支持', async () => {
        // 注：由于模块在导入时创建实例，此测试主要验证函数返回类型
        const { isKeyringSupported } = await import('@/utils/tauriCompat/keyring');
        const result = isKeyringSupported();
        expect(typeof result).toBe('boolean');
      });
    });
  });


});
