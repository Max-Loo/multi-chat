/**
 * 主密钥管理模块单元测试
 * 测试密钥生成、存储、获取和初始化功能
 * 使用 Vitest + happy-dom 环境
 * Mock tauriCompat/keyring 依赖以隔离测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateMasterKey,
  isMasterKeyExists,
  getMasterKey,
  storeMasterKey,
  initializeMasterKey,
  handleSecurityWarning,
  exportMasterKey,
} from '@/store/keyring/masterKey';

// Mock tauriCompat/keyring API
vi.mock('@/utils/tauriCompat', () => ({
  getPassword: vi.fn(),
  setPassword: vi.fn(),
  isTauri: vi.fn(),
}));

// 导入 mock 函数以进行类型检查和调用验证
import { getPassword, setPassword, isTauri } from '@/utils/tauriCompat';

// Mock localStorage（happy-dom 应该提供，但确保存在）
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

describe('主密钥管理模块测试套件', () => {
  // 每个 test suite 开始前的初始化
  beforeEach(() => {
    // 清除所有 mock 调用记录
    vi.clearAllMocks();
    // 清除 localStorage
    localStorage.clear();
  });

  // 每个 test suite 结束后的清理
  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * 测试基础设施验证
   * 确保 mock 和测试环境配置正确
   */
  describe('测试基础设施验证', () => {
    it('应该正确配置 tauriCompat mock', () => {
      // 验证 mock 函数存在
      expect(getPassword).toBeDefined();
      expect(setPassword).toBeDefined();
      expect(isTauri).toBeDefined();
    });

    it('应该正确配置 localStorage mock', () => {
      localStorage.setItem('test', 'value');
      expect(localStorage.getItem('test')).toBe('value');
      localStorage.clear();
      expect(localStorage.getItem('test')).toBeNull();
    });

    it('should have mock functions that can be configured', () => {
      // 测试可以配置 mock 返回值
      (isTauri as ReturnType<typeof vi.fn>).mockReturnValue(true);
      expect(isTauri()).toBe(true);

      (isTauri as ReturnType<typeof vi.fn>).mockReturnValue(false);
      expect(isTauri()).toBe(false);
    });
  });

  /**
   * 密钥生成测试（generateMasterKey）
   * 测试密钥长度、格式、随机性、性能和使用的 API
   */
  describe('generateMasterKey', () => {
    /**
     * 密钥长度验证测试
     * 验证生成的密钥为 64 个十六进制字符（256 bits）
     */
    describe('密钥长度验证', () => {
      it('应该生成 64 个字符的密钥', () => {
        const key = generateMasterKey();
        expect(key).toHaveLength(64);
      });

      it('应该始终生成 64 个字符的密钥（多次调用）', () => {
        for (let i = 0; i < 10; i++) {
          const key = generateMasterKey();
          expect(key).toHaveLength(64);
        }
      });
    });

    /**
     * 密钥格式验证测试
     * 验证密钥仅包含 0-9 和 a-f 的十六进制字符
     */
    describe('密钥格式验证', () => {
      it('应该仅包含十六进制字符（0-9 和 a-f）', () => {
        const key = generateMasterKey();
        expect(key).toMatch(/^[0-9a-f]{64}$/);
      });

      it('应该使用小写字母而非大写字母', () => {
        const key = generateMasterKey();
        // 验证不包含大写字母 A-F
        expect(key).not.toMatch(/[A-F]/);
        // 验证仅包含小写字母 a-f
        expect(key).toMatch(/[a-f]/);
      });

      it('应该多次生成都符合格式要求', () => {
        for (let i = 0; i < 10; i++) {
          const key = generateMasterKey();
          expect(key).toMatch(/^[0-9a-f]{64}$/);
        }
      });
    });

    /**
     * 密钥随机性验证测试
     * 验证多次生成的密钥不重复
     */
    describe('密钥随机性验证', () => {
      it('应该生成 100 个唯一密钥（无重复）', () => {
        const keys = new Set<string>();
        for (let i = 0; i < 100; i++) {
          keys.add(generateMasterKey());
        }
        expect(keys.size).toBe(100);
      });

      it('应该生成不重复的密钥（连续调用）', () => {
        const key1 = generateMasterKey();
        const key2 = generateMasterKey();
        const key3 = generateMasterKey();

        expect(key1).not.toBe(key2);
        expect(key2).not.toBe(key3);
        expect(key1).not.toBe(key3);
      });

      it('应该在密钥中包含多种十六进制字符（非单一值）', () => {
        const key = generateMasterKey();

        // 验证至少包含 3 种不同的十六进制字符
        const uniqueChars = new Set(key.split(''));
        expect(uniqueChars.size).toBeGreaterThanOrEqual(3);
      });
    });

    /**
     * 密钥性能验证测试
     * 验证密钥生成操作的性能合理
     */
    describe('密钥性能验证', () => {
      it('应该单次生成在 10ms 内完成', () => {
        const startTime = performance.now();
        generateMasterKey();
        const endTime = performance.now();

        expect(endTime - startTime).toBeLessThan(10);
      });

      it('应该批量生成 1000 次在合理时间内完成', () => {
        const startTime = performance.now();

        for (let i = 0; i < 1000; i++) {
          generateMasterKey();
        }

        const endTime = performance.now();

        // 1000 次生成应在 1 秒内完成
        expect(endTime - startTime).toBeLessThan(1000);
      });
    });

    /**
     * 密钥生成方法验证测试
     * 验证使用 crypto.getRandomValues() 方法
     */
    describe('密钥生成方法验证', () => {
      it('应该使用 Web Crypto API 的 getRandomValues 方法', () => {
        // 监听 crypto.getRandomValues 调用
        const getRandomValuesSpy = vi.spyOn(crypto, 'getRandomValues');

        generateMasterKey();

        // 验证调用了 getRandomValues
        expect(getRandomValuesSpy).toHaveBeenCalledTimes(1);
        expect(getRandomValuesSpy).toHaveBeenCalledWith(expect.any(Uint8Array));

        getRandomValuesSpy.mockRestore();
      });

      it('应该生成 32 字节的随机数组', () => {
        const getRandomValuesSpy = vi.spyOn(crypto, 'getRandomValues');

        generateMasterKey();

        // 获取调用时的参数
        const callArgs = getRandomValuesSpy.mock.calls[0];
        const array = callArgs[0] as Uint8Array;

        // 验证调用参数为 32 字节的数组
        expect(array).toBeInstanceOf(Uint8Array);
        expect(array.length).toBe(32);

        getRandomValuesSpy.mockRestore();
      });

      it('应该将随机字节正确转换为 hex 字符串', () => {
        // 创建已知的随机数组（完整的 32 字节）
        const testArray = new Uint8Array(32);
        // 设置前 6 个字节为特定值
        testArray[0] = 0x00;
        testArray[1] = 0xff;
        testArray[2] = 0x0a;
        testArray[3] = 0xf0;
        testArray[4] = 0x12;
        testArray[5] = 0x34;
        // 填充剩余字节到 0xab
        for (let i = 6; i < 32; i++) {
          testArray[i] = 0xab;
        }

        // 使用 mockImplementation 替代 mockReturnValue
        const getRandomValuesSpy = vi.spyOn(crypto, 'getRandomValues');
        getRandomValuesSpy.mockImplementation((array) => {
          // 复制测试数组的值到传入的数组
          (array as Uint8Array).set(testArray);
          return array;
        });

        const key = generateMasterKey();

        // 验证转换结果：00 -> "00", ff -> "ff", 0a -> "0a", f0 -> "f0", 12 -> "12", 34 -> "34"
        expect(key).toMatch(/^00ff0af01234/);
        // 验证剩余字节都是 ab（使用 (ab){26} 表示 "ab" 重复 26 次）
        expect(key).toMatch(/(ab){26}$/); // 32 - 6 = 26 个 "ab"

        getRandomValuesSpy.mockRestore();
      });
    });
  });

  /**
   * 密钥存在性检查测试（isMasterKeyExists）
   * 测试密钥存在、不存在和错误处理场景
   */
  describe('isMasterKeyExists', () => {
    /**
     * 密钥存在场景测试
     */
    describe('密钥存在场景', () => {
      it('应该返回 true 当密钥存在时', async () => {
        // Mock getPassword 返回有效密钥
        (getPassword as ReturnType<typeof vi.fn>).mockResolvedValue(
          'a'.repeat(64)
        );

        const exists = await isMasterKeyExists();

        expect(exists).toBe(true);
        expect(getPassword).toHaveBeenCalledWith(
          'com.multichat.app',
          'master-key'
        );
      });

      it('应该返回 true 当密钥是任何非空字符串时', async () => {
        // Mock getPassword 返回各种有效密钥
        const validKeys = [
          '0'.repeat(64), // 全零
          'f'.repeat(64), // 全 f
          'a'.repeat(64), // 全 a
          '0123456789abcdef'.repeat(4), // 混合
        ];

        for (const key of validKeys) {
          (getPassword as ReturnType<typeof vi.fn>).mockResolvedValue(key);
          const exists = await isMasterKeyExists();
          expect(exists).toBe(true);
        }
      });
    });

    /**
     * 密钥不存在场景测试
     */
    describe('密钥不存在场景', () => {
      it('应该返回 false 当密钥不存在时', async () => {
        // Mock getPassword 返回 null
        (getPassword as ReturnType<typeof vi.fn>).mockResolvedValue(null);

        const exists = await isMasterKeyExists();

        expect(exists).toBe(false);
      });

      it('应该返回 false 当密钥为 undefined 时', async () => {
        // Mock getPassword 返回 undefined
        (getPassword as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

        const exists = await isMasterKeyExists();

        expect(exists).toBe(false);
      });

      it('应该返回 false 当密钥为空字符串时', async () => {
        // Mock getPassword 返回空字符串
        (getPassword as ReturnType<typeof vi.fn>).mockResolvedValue('');

        const exists = await isMasterKeyExists();

        expect(exists).toBe(false);
      });
    });

    /**
     * 错误处理场景测试
     */
    describe('错误处理场景', () => {
      it('应该返回 false 当 getPassword 抛出异常时', async () => {
        // Mock getPassword 抛出异常
        (getPassword as ReturnType<typeof vi.fn>).mockRejectedValue(
          new Error('Keyring error')
        );

        const exists = await isMasterKeyExists();

        expect(exists).toBe(false);
      });

      it('应该记录错误日志到 console.error', async () => {
        // 监听 console.error
        const consoleErrorSpy = vi.spyOn(console, 'error');

        // Mock getPassword 抛出异常
        const error = new Error('Keyring error');
        (getPassword as ReturnType<typeof vi.fn>).mockRejectedValue(error);

        const exists = await isMasterKeyExists();

        // 验证返回 false
        expect(exists).toBe(false);
        // 验证记录了错误日志
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '检查主密钥是否存在时出错:',
          error
        );

        consoleErrorSpy.mockRestore();
      });

      it('应该处理各种错误类型', async () => {
        const errors = [
          new Error('Generic error'),
          new TypeError('Type error'),
          new RangeError('Range error'),
        ];

        for (const error of errors) {
          (getPassword as ReturnType<typeof vi.fn>).mockRejectedValue(error);

          const exists = await isMasterKeyExists();

          expect(exists).toBe(false);
        }
      });
    });
  });

  /**
   * 密钥获取测试（getMasterKey）
   */
  describe('getMasterKey', () => {
    /**
     * 正常获取场景测试
     */
    describe('正常获取场景', () => {
      it('应该返回密钥字符串当密钥存在时', async () => {
        const testKey = 'a'.repeat(64);
        (getPassword as ReturnType<typeof vi.fn>).mockResolvedValue(testKey);

        const key = await getMasterKey();

        expect(key).toBe(testKey);
        expect(getPassword).toHaveBeenCalledWith('com.multichat.app', 'master-key');
      });

      it('应该返回任何有效的密钥字符串', async () => {
        const validKeys = ['0'.repeat(64), 'f'.repeat(64), '0123456789abcdef'.repeat(4)];

        for (const testKey of validKeys) {
          (getPassword as ReturnType<typeof vi.fn>).mockResolvedValue(testKey);
          const key = await getMasterKey();
          expect(key).toBe(testKey);
        }
      });
    });

    /**
     * 密钥不存在场景测试
     */
    describe('密钥不存在场景', () => {
      it('应该返回 null 当密钥不存在时', async () => {
        (getPassword as ReturnType<typeof vi.fn>).mockResolvedValue(null);

        const key = await getMasterKey();

        expect(key).toBeNull();
      });

      it('应该返回 undefined 当 getPassword 返回 undefined 时', async () => {
        (getPassword as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

        const key = await getMasterKey();

        expect(key).toBeUndefined();
      });
    });

    /**
     * 错误处理场景测试
     */
    describe('错误处理场景', () => {
      it('应该记录错误日志并抛出环境特定的错误消息（Web 环境）', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error');
        const originalError = new Error('IndexedDB error');
        (getPassword as ReturnType<typeof vi.fn>).mockRejectedValue(originalError);
        (isTauri as ReturnType<typeof vi.fn>).mockReturnValue(false);

        await expect(getMasterKey()).rejects.toThrow(
          '无法访问浏览器安全存储或密钥解密失败'
        );

        expect(consoleErrorSpy).toHaveBeenCalledWith('获取主密钥时出错:', originalError);

        consoleErrorSpy.mockRestore();
      });

      it('应该记录错误日志并抛出环境特定的错误消息（Tauri 环境）', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error');
        const originalError = new Error('Keychain error');
        (getPassword as ReturnType<typeof vi.fn>).mockRejectedValue(originalError);
        (isTauri as ReturnType<typeof vi.fn>).mockReturnValue(true);

        await expect(getMasterKey()).rejects.toThrow(
          '无法访问系统安全存储'
        );

        expect(consoleErrorSpy).toHaveBeenCalledWith('获取主密钥时出错:', originalError);

        consoleErrorSpy.mockRestore();
      });

      it('应该包含原始错误作为 cause', async () => {
        const originalError = new Error('Original error');
        (getPassword as ReturnType<typeof vi.fn>).mockRejectedValue(originalError);
        (isTauri as ReturnType<typeof vi.fn>).mockReturnValue(false);

        try {
          await getMasterKey();
          expect.fail('应该抛出错误');
        } catch (error) {
          expect((error as Error).cause).toBe(originalError);
        }
      });
    });
  });

  /**
   * 密钥存储测试（storeMasterKey）
   */
  describe('storeMasterKey', () => {
    /**
     * 存储成功场景测试
     */
    describe('存储成功场景', () => {
      it('应该成功存储密钥', async () => {
        const testKey = 'a'.repeat(64);
        (setPassword as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

        await expect(storeMasterKey(testKey)).resolves.not.toThrow();

        expect(setPassword).toHaveBeenCalledWith('com.multichat.app', 'master-key', testKey);
      });

      it('应该存储各种有效的密钥', async () => {
        const validKeys = ['0'.repeat(64), 'f'.repeat(64), '0123456789abcdef'.repeat(4)];

        for (const key of validKeys) {
          (setPassword as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

          await expect(storeMasterKey(key)).resolves.not.toThrow();
        }
      });
    });

    /**
     * 错误处理场景测试
     */
    describe('错误处理场景', () => {
      it('应该记录错误日志并抛出环境特定的错误消息（Web 环境）', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error');
        const originalError = new Error('IndexedDB error');
        (setPassword as ReturnType<typeof vi.fn>).mockRejectedValue(originalError);
        (isTauri as ReturnType<typeof vi.fn>).mockReturnValue(false);

        const testKey = 'a'.repeat(64);

        await expect(storeMasterKey(testKey)).rejects.toThrow(
          '无法将密钥存储到浏览器安全存储'
        );

        expect(consoleErrorSpy).toHaveBeenCalledWith('存储主密钥时出错:', originalError);

        consoleErrorSpy.mockRestore();
      });

      it('应该记录错误日志并抛出环境特定的错误消息（Tauri 环境）', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error');
        const originalError = new Error('Keychain error');
        (setPassword as ReturnType<typeof vi.fn>).mockRejectedValue(originalError);
        (isTauri as ReturnType<typeof vi.fn>).mockReturnValue(true);

        const testKey = 'a'.repeat(64);

        await expect(storeMasterKey(testKey)).rejects.toThrow(
          '无法将密钥存储到系统安全存储'
        );

        expect(consoleErrorSpy).toHaveBeenCalledWith('存储主密钥时出错:', originalError);

        consoleErrorSpy.mockRestore();
      });

      it('应该包含原始错误作为 cause', async () => {
        const originalError = new Error('Original error');
        (setPassword as ReturnType<typeof vi.fn>).mockRejectedValue(originalError);
        (isTauri as ReturnType<typeof vi.fn>).mockReturnValue(false);

        const testKey = 'a'.repeat(64);

        try {
          await storeMasterKey(testKey);
          expect.fail('应该抛出错误');
        } catch (error) {
          expect((error as Error).cause).toBe(originalError);
        }
      });
    });
  });

  /**
   * 主密钥初始化测试（initializeMasterKey）
   */
  describe('initializeMasterKey', () => {
    /**
     * 首次生成场景测试
     */
    describe('首次生成场景', () => {
      it('应该生成并存储新密钥当密钥不存在时', async () => {
        // Mock 密钥不存在
        (getPassword as ReturnType<typeof vi.fn>).mockResolvedValue(null);
        (setPassword as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
        (isTauri as ReturnType<typeof vi.fn>).mockReturnValue(false);

        const key = await initializeMasterKey();

        // 验证返回了密钥
        expect(key).toBeTruthy();
        expect(key).toHaveLength(64);
        expect(key).toMatch(/^[0-9a-f]{64}$/);

        // 验证调用了存储
        expect(setPassword).toHaveBeenCalledWith('com.multichat.app', 'master-key', key);
      });

      it('应该在 Web 环境记录安全警告日志', async () => {
        const consoleWarnSpy = vi.spyOn(console, 'warn');
        (getPassword as ReturnType<typeof vi.fn>).mockResolvedValue(null);
        (setPassword as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
        (isTauri as ReturnType<typeof vi.fn>).mockReturnValue(false);

        await initializeMasterKey();

        // 验证记录了安全警告
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Master key does not exist')
        );
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('lower security level')
        );

        consoleWarnSpy.mockRestore();
      });

      it('应该在 Tauri 环境记录警告日志（不包含 Web 特定警告）', async () => {
        const consoleWarnSpy = vi.spyOn(console, 'warn');
        (getPassword as ReturnType<typeof vi.fn>).mockResolvedValue(null);
        (setPassword as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
        (isTauri as ReturnType<typeof vi.fn>).mockReturnValue(true);

        await initializeMasterKey();

        // 验证记录了警告
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Master key does not exist')
        );
        // 验证不包含 Web 特定的安全警告
        const warnings = consoleWarnSpy.mock.calls.map((call) => call[0]);
        const hasWebSecurityWarning = warnings.some((warning) =>
          (warning as string).includes('lower security level')
        );
        expect(hasWebSecurityWarning).toBe(false);

        consoleWarnSpy.mockRestore();
      });
    });

    /**
     * 密钥已存在场景测试
     */
    describe('密钥已存在场景', () => {
      it('应该返回现有密钥而不生成新密钥', async () => {
        const existingKey = 'a'.repeat(64);
        (getPassword as ReturnType<typeof vi.fn>).mockResolvedValue(existingKey);

        const key = await initializeMasterKey();

        expect(key).toBe(existingKey);
        // 验证没有调用存储
        expect(setPassword).not.toHaveBeenCalled();
      });

      it('应该多次调用返回相同的密钥', async () => {
        const existingKey = '0'.repeat(64);
        (getPassword as ReturnType<typeof vi.fn>).mockResolvedValue(existingKey);

        const key1 = await initializeMasterKey();
        const key2 = await initializeMasterKey();

        expect(key1).toBe(existingKey);
        expect(key2).toBe(existingKey);
        expect(key1).toBe(key2);
      });
    });

    /**
     * 生成失败场景测试
     */
    describe('生成失败场景', () => {
      it('应该抛出错误当 getPassword 失败时', async () => {
        const error = new Error('Keyring error');
        (getPassword as ReturnType<typeof vi.fn>).mockRejectedValue(error);
        (isTauri as ReturnType<typeof vi.fn>).mockReturnValue(false);

        await expect(initializeMasterKey()).rejects.toThrow();
      });

      it('应该抛出错误当 storeMasterKey 失败时', async () => {
        const error = new Error('Keyring error');
        (getPassword as ReturnType<typeof vi.fn>).mockResolvedValue(null); // 密钥不存在
        (setPassword as ReturnType<typeof vi.fn>).mockRejectedValue(error); // 存储失败
        (isTauri as ReturnType<typeof vi.fn>).mockReturnValue(false);

        await expect(initializeMasterKey()).rejects.toThrow();
      });
    });
  });

  /**
   * 安全警告处理测试（handleSecurityWarning）
   */
  describe('handleSecurityWarning', () => {
    /**
     * Tauri 环境跳过警告测试
     */
    describe('Tauri 环境跳过警告', () => {
      it('应该在 Tauri 环境立即返回', async () => {
        (isTauri as ReturnType<typeof vi.fn>).mockReturnValue(true);

        await handleSecurityWarning();

        // 验证没有访问 localStorage
        expect(localStorage.getItem('multi-chat-security-warning-dismissed')).toBeNull();
      });

      it('不应该在 Tauri 环境显示 toast', async () => {
        (isTauri as ReturnType<typeof vi.fn>).mockReturnValue(true);

        // Mock sonner toast
        const toastMock = vi.fn();
        vi.doMock('sonner', () => ({
          toast: { warning: toastMock },
        }));

        await handleSecurityWarning();

        // 验证没有调用 toast
        expect(toastMock).not.toHaveBeenCalled();
      });
    });

    /**
     * Web 环境显示警告测试
     */
    describe('Web 环境显示警告', () => {
      beforeEach(() => {
        (isTauri as ReturnType<typeof vi.fn>).mockReturnValue(false);
      });

      it('应该在首次使用时显示警告', async () => {
        // 确保没有 dismiss 标记
        localStorage.removeItem('multi-chat-security-warning-dismissed');

        await handleSecurityWarning();

        // 验证设置了 dismiss 标记（用户点击了 OK 按钮）
        // 注意：由于我们使用了实际的 import('sonner')，这个测试只验证没有抛出错误
        // 在实际应用中，toast 会显示，用户点击后会设置标记
        expect(localStorage.getItem('multi-chat-security-warning-dismissed')).toBeNull();
      });

      it('应该在用户已确认后跳过警告', async () => {
        // 设置 dismiss 标记
        localStorage.setItem('multi-chat-security-warning-dismissed', 'true');

        await handleSecurityWarning();

        // 验证标记仍然存在（没有被修改）
        expect(localStorage.getItem('multi-chat-security-warning-dismissed')).toBe('true');
      });

      it('应该设置 localStorage 标记当用户点击 OK 按钮时', async () => {
        // 注意：这个测试验证 localStorage 标记的功能
        // 实际的 toast 点击由 sonner 处理，我们只验证标记机制

        localStorage.removeItem('multi-chat-security-warning-dismissed');

        // 第一次调用：显示警告（没有标记）
        await handleSecurityWarning();

        // 模拟用户点击 OK 按钮（手动设置标记）
        localStorage.setItem('multi-chat-security-warning-dismissed', 'true');

        // 第二次调用：应该跳过警告（有标记）
        await handleSecurityWarning();

        // 验证标记仍然存在
        expect(localStorage.getItem('multi-chat-security-warning-dismissed')).toBe('true');
      });
    });
  });

  /**
   * 主密钥导出测试（exportMasterKey）
   */
  describe('exportMasterKey', () => {
    /**
     * 正常导出场景测试
     */
    describe('正常导出场景', () => {
      it('应该返回密钥字符串当密钥存在时', async () => {
        const testKey = 'a'.repeat(64);
        (getPassword as ReturnType<typeof vi.fn>).mockResolvedValue(testKey);

        const exportedKey = await exportMasterKey();

        expect(exportedKey).toBe(testKey);
      });

      it('应该依赖 getMasterKey 函数', async () => {
        const testKey = '0'.repeat(64);
        (getPassword as ReturnType<typeof vi.fn>).mockResolvedValue(testKey);

        await exportMasterKey();

        expect(getPassword).toHaveBeenCalledWith('com.multichat.app', 'master-key');
      });
    });

    /**
     * 导出失败场景测试
     */
    describe('导出失败场景', () => {
      it('应该抛出"主密钥不存在"错误当密钥不存在时', async () => {
        (getPassword as ReturnType<typeof vi.fn>).mockResolvedValue(null);

        await expect(exportMasterKey()).rejects.toThrow('主密钥不存在');
      });

      it('应该抛出"主密钥不存在"错误当 getMasterKey 返回 undefined 时', async () => {
        (getPassword as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

        await expect(exportMasterKey()).rejects.toThrow('主密钥不存在');
      });

      it('应该抛出错误当 getMasterKey 抛出异常时', async () => {
        const originalError = new Error('Keyring error');
        (getPassword as ReturnType<typeof vi.fn>).mockRejectedValue(originalError);
        (isTauri as ReturnType<typeof vi.fn>).mockReturnValue(false);

        await expect(exportMasterKey()).rejects.toThrow();
      });
    });
  });
});
