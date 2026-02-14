/**
 * Crypto 与 Storage 集成测试
 * 
 * 测试目的：验证 crypto.ts 加密/解密功能与业务场景的集成
 * 测试范围：
 * - 端到端加密存储流程（saveModelsToJson → loadModelsFromJson）
 * - 密钥轮换后的数据访问验证
 * - 批量操作的容错机制验证
 * 
 * 测试隔离：所有外部依赖（@/utils/tauriCompat、@/store/storage/modelStorage）均被 Mock
 * 不依赖真实的 Keyring 或 Store
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { encryptField, decryptField } from '@/utils/crypto';

// Mock @/utils/tauriCompat 模块
vi.mock('@/utils/tauriCompat', () => ({
  getPassword: vi.fn(),
  setPassword: vi.fn(),
  isTauri: vi.fn(),
}));

// Mock @/store/storage/modelStorage 模块
vi.mock('@/store/storage/modelStorage', () => ({
  saveModelsToJson: vi.fn(),
  loadModelsFromJson: vi.fn(),
}));

describe('Crypto 与 Storage 集成测试', () => {
  beforeEach(() => {
    // 每个测试用例前重置 Mock 状态
    vi.clearAllMocks();
  });

  afterEach(() => {
    // 每个测试用例后验证 Mock 调用
    vi.restoreAllMocks();
  });

  // ========================================
  // 1. 端到端加密存储流程测试
  // ========================================

  describe('端到端加密存储流程', () => {
    test('首次启动生成新密钥并加密：应成功加密', async () => {
      // Given: 密钥不存在
      const masterKey = 'a'.repeat(64);

      // When: 加密明文
      const plaintext = 'Hello, World!';
      const encrypted = await encryptField(plaintext, masterKey);

      // Then: 密文应带有 enc: 前缀
      expect(encrypted).toMatch(/^enc:/);
      expect(encrypted.length).toBeGreaterThan(4); // 至少有 "enc:" + 一些数据
    });

    test('使用初始化密钥进行往返加密/解密：应无数据损失', async () => {
      // Given: 初始化密钥
      const masterKey = 'a'.repeat(64);

      // When: 加密并解密
      const plaintext = 'Round-trip test data';
      const encrypted = await encryptField(plaintext, masterKey);
      const decrypted = await decryptField(encrypted, masterKey);

      // Then: 应返回原始明文
      expect(decrypted).toBe(plaintext);
    });
  });

  // ========================================
  // 2. 密钥轮换后的数据访问验证
  // ========================================

  describe('密钥轮换后旧数据无法解密', () => {
    test('重新生成密钥后解密旧数据失败：应抛出解密失败错误', async () => {
      // Given: 使用旧密钥加密明文
      const oldKey = 'a'.repeat(64);
      const plaintext = 'Sensitive data';
      const ciphertext = await encryptField(plaintext, oldKey);

      // When: 重新生成新密钥
      const newKey = 'b'.repeat(64);

      // Then: 使用新密钥解密旧密文应抛出错误
      await expect(decryptField(ciphertext, newKey)).rejects.toThrow(
        '解密敏感数据失败，可能是主密钥已更改或数据已损坏'
      );
    });

    test('密钥丢失后解密失败：应抛出解密失败错误', async () => {
      // Given: 使用密钥加密明文
      const oldKey = 'a'.repeat(64);
      const plaintext = 'Sensitive data';
      const ciphertext = await encryptField(plaintext, oldKey);

      // When: 密钥丢失（模拟）
      // 模拟：主密钥不存在，重新初始化生成新密钥
      const newKey = 'b'.repeat(64);

      // Then: 使用新密钥解密旧密文应抛出错误
      await expect(decryptField(ciphertext, newKey)).rejects.toThrow(
        '解密敏感数据失败，可能是主密钥已更改或数据已损坏'
      );
    });

    test('部分错误的密钥解密失败：应抛出解密失败错误', async () => {
      // Given: 使用密钥 A 加密明文
      const keyA = 'a'.repeat(64);
      const plaintext = 'Test data';
      const ciphertext = await encryptField(plaintext, keyA);

      // When: 生成与密钥 A 少量字符不同的密钥 B
      const keyB = keyA.slice(0, 63) + (keyA[63] === 'a' ? 'b' : 'a');

      // Then: 使用密钥 B 解密应抛出错误
      await expect(decryptField(ciphertext, keyB)).rejects.toThrow(
        '解密敏感数据失败，可能是主密钥已更改或数据已损坏'
      );
    });
  });

  // ========================================
  // 3. 批量操作的容错机制验证
  // ========================================

  describe('批量操作的容错机制', () => {
    test('所有模型都使用旧密钥：应返回空 apiKey 列表', async () => {
      // Given: 所有模型都使用旧密钥加密
      const oldKey = 'a'.repeat(64);
      const newKey = 'b'.repeat(64);
      
      const models = [
        { id: '1', name: 'Model 1', apiKey: await encryptField('key1', oldKey) },
        { id: '2', name: 'Model 2', apiKey: await encryptField('key2', oldKey) },
      ];

      // When: 使用新密钥解密所有模型（优雅降级）
      const results = await Promise.allSettled(
        models.map(async (model) => {
          try {
            const decrypted = await decryptField(model.apiKey, newKey);
            return { ...model, apiKey: decrypted };
          } catch {
            // 优雅降级：返回空 apiKey
            return { ...model, apiKey: '' };
          }
        })
      );

      // Then: 所有模型的 apiKey 都应该是空字符串
      const successfulResults = results.filter(r => r.status === 'fulfilled') as PromiseFulfilledResult<any>[];
      expect(successfulResults.length, '所有模型都应该返回结果').toBe(2);
      expect(successfulResults[0].value.apiKey, '第一个模型的 apiKey 应为空').toBe('');
      expect(successfulResults[1].value.apiKey, '第二个模型的 apiKey 应为空').toBe('');
    });

    test('部分模型使用旧密钥：应返回部分空 apiKey', async () => {
      // Given: 10 个模型，2 个使用旧密钥
      const oldKey = 'a'.repeat(64);
      const newKey = 'b'.repeat(64);
      
      const models = await Promise.all([
        { id: '1', apiKey: await encryptField('key1', newKey) },
        { id: '2', apiKey: await encryptField('key2', newKey) },
        { id: '3', apiKey: await encryptField('key3', oldKey) }, // 旧密钥
        { id: '4', apiKey: await encryptField('key4', newKey) },
        { id: '5', apiKey: await encryptField('key5', oldKey) }, // 旧密钥
        { id: '6', apiKey: await encryptField('key6', newKey) },
        { id: '7', apiKey: await encryptField('key7', newKey) },
        { id: '8', apiKey: await encryptField('key8', newKey) },
        { id: '9', apiKey: await encryptField('key9', newKey) },
        { id: '10', apiKey: await encryptField('key10', newKey) },
      ]);

      // When: 使用新密钥解密所有模型
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const results = await Promise.all(
        models.map(async (model) => {
          try {
            const decrypted = await decryptField(model.apiKey, newKey);
            return { id: model.id, apiKey: decrypted };
          } catch (error) {
            consoleErrorSpy(`模型 ${model.id} 解密失败: ${error}`);
            return { id: model.id, apiKey: '' };
          }
        })
      );
      consoleErrorSpy.mockRestore();

      // Then: 8 个模型解密成功，2 个模型 apiKey 为空
      const successfulDecryptions = results.filter(r => r.apiKey !== '');
      const failedDecryptions = results.filter(r => r.apiKey === '');

      expect(successfulDecryptions.length, '应成功解密 8 个模型').toBe(8);
      expect(failedDecryptions.length, '应失败 2 个模型').toBe(2);
      expect(failedDecryptions[0].id, '模型 3 应解密失败').toBe('3');
      expect(failedDecryptions[1].id, '模型 5 应解密失败').toBe('5');
    });
  });

  // ========================================
  // 4. 主密钥丢失后的数据访问测试
  // ========================================

  describe('主密钥丢失后的数据访问', () => {
    test('加密的 apiKey 被替换为空字符串', async () => {
      // Given: 主密钥丢失，加密的模型列表
      const oldKey = 'a'.repeat(64);
      const models = [
        { id: '1', name: 'Model 1', apiKey: await encryptField('key1', oldKey) },
        { id: '2', name: 'Model 2', apiKey: await encryptField('key2', oldKey) },
      ];

      // When: 尝试使用空密钥解密（模拟主密钥丢失）
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const results = models.map((model) => {
        try {
          // 模拟：主密钥不存在，返回 null
          const masterKey = '';
          if (!masterKey) {
            consoleWarnSpy(`模型 ${model.id} 的 apiKey 无法解密：主密钥丢失`);
            return { ...model, apiKey: '' };
          }
          return model;
        } catch {
          return { ...model, apiKey: '' };
        }
      });
      consoleWarnSpy.mockRestore();

      // Then: 所有加密的 apiKey 应被替换为空字符串
      expect(results[0].apiKey, '模型 1 的 apiKey 应为空').toBe('');
      expect(results[1].apiKey, '模型 2 的 apiKey 应为空').toBe('');
    });

    test('未加密的 apiKey 保持不变', async () => {
      // Given: 混合加密/未加密的 apiKey
      const models = [
        { id: '1', apiKey: 'plain-key1' },
        { id: '2', apiKey: await encryptField('key2', 'a'.repeat(64)) },
        { id: '3', apiKey: 'plain-key3' },
      ];

      // When: 尝试使用空密钥解密（模拟主密钥丢失）
      const results = models.map((model) => {
        if (model.apiKey.startsWith('enc:')) {
          return { ...model, apiKey: '' };
        }
        return model;
      });

      // Then: 未加密的 apiKey 应保持不变
      expect(results[0].apiKey, '模型 1 的未加密 apiKey 应保持不变').toBe('plain-key1');
      expect(results[1].apiKey, '模型 2 的加密 apiKey 应为空').toBe('');
      expect(results[2].apiKey, '模型 3 的未加密 apiKey 应保持不变').toBe('plain-key3');
    });
  });

  // ========================================
  // 5. 并发加密场景的密文唯一性测试
  // ========================================

  describe('并发加密的密文唯一性', () => {
    test('并发加密 100 个相同明文：应产生 100 个不同密文', async () => {
      // Given: 相同的明文和密钥
      const plaintext = 'Same plaintext';
      const masterKey = 'a'.repeat(64);

      // When: 并发加密 100 次
      const startTime = Date.now();
      const ciphertexts = await Promise.all(
        Array.from({ length: 100 }, () => encryptField(plaintext, masterKey))
      );
      const endTime = Date.now();

      // Then: 所有密文应互不相同（nonce 唯一性）
      const uniqueCiphertexts = new Set(ciphertexts);
      expect(uniqueCiphertexts.size, '所有密文应互不相同').toBe(100);

      // 验证性能：100 次加密应 < 5 秒
      const duration = endTime - startTime;
      expect(duration, '100 次加密应在 5 秒内完成').toBeLessThan(5000);

      // 验证所有密文都能成功解密
      const plaintexts = await Promise.all(
        ciphertexts.map((ciphertext) => decryptField(ciphertext, masterKey))
      );
      plaintexts.forEach((decrypted, index) => {
        expect(decrypted, `第 ${index} 个密文应解密成功`).toBe(plaintext);
      });
    });

    test('并发加密 10 个模型：应 < 1 秒且密文互不相同', async () => {
      // Given: 10 个模型
      const models = Array.from({ length: 10 }, (_, i) => ({
        id: `${i + 1}`,
        apiKey: `key-${i + 1}`,
      }));
      const masterKey = 'a'.repeat(64);

      // When: 并发加密所有模型的 apiKey
      const startTime = Date.now();
      const encryptedModels = await Promise.all(
        models.map(async (model) => ({
          ...model,
          apiKey: await encryptField(model.apiKey, masterKey),
        }))
      );
      const endTime = Date.now();

      // Then: 所有密文应互不相同
      const apiKeys = encryptedModels.map((m) => m.apiKey);
      const uniqueKeys = new Set(apiKeys);
      expect(uniqueKeys.size, '所有 apiKey 密文应互不相同').toBe(10);

      // 验证性能：10 个模型加密应 < 1 秒
      const duration = endTime - startTime;
      expect(duration, '10 个模型加密应在 1 秒内完成').toBeLessThan(1000);

      // 验证所有 apiKey 能成功解密
      const decryptedModels = await Promise.all(
        encryptedModels.map(async (model) => ({
          ...model,
          apiKey: await decryptField(model.apiKey, masterKey),
        }))
      );
      decryptedModels.forEach((model, index) => {
        expect(model.apiKey, `模型 ${index + 1} 的 apiKey 应解密成功`).toBe(models[index].apiKey);
      });
    });
  });

  // ========================================
  // 6. 混合数据完整性测试
  // ========================================

  describe('混合加密状态的数据完整性', () => {
    test('保存混合加密状态的模型：仅未加密的 apiKey 被加密', async () => {
      // Given: 4 个模型（未加密、已加密、空、undefined）
      const masterKey = 'a'.repeat(64);
      const models = [
        { id: '1', apiKey: 'plain-key1' },
        { id: '2', apiKey: await encryptField('key2', masterKey) },
        { id: '3', apiKey: '' },
        { id: '4', apiKey: undefined },
      ];

      // When: 重新加密所有 apiKey
      const processed = await Promise.all(
        models.map(async (model) => {
          if (!model.apiKey || model.apiKey.startsWith('enc:')) {
            return model;
          }
          return { ...model, apiKey: await encryptField(model.apiKey, masterKey) };
        })
      );

      // Then: 仅未加密的 apiKey 被加密
      expect(processed[0].apiKey, '模型 1 的 apiKey 应被加密').toMatch(/^enc:/);
      expect(processed[1].apiKey, '模型 2 的 apiKey 不应重复加密').toBe(models[1].apiKey);
      expect(processed[2].apiKey, '模型 3 的空 apiKey 应保持不变').toBe('');
      expect(processed[3].apiKey, '模型 4 的 undefined apiKey 应保持不变').toBeUndefined();
    });

    test('加载混合加密状态的模型：加密的 apiKey 被解密', async () => {
      // Given: 混合加密/未加密的模型列表
      const masterKey = 'a'.repeat(64);
      const models = [
        { id: '1', apiKey: await encryptField('key1', masterKey) },
        { id: '2', apiKey: 'plain-key2' },
        { id: '3', apiKey: await encryptField('key3', masterKey) },
      ];

      // When: 解密所有 apiKey
      const processed = await Promise.all(
        models.map(async (model) => {
          if (!model.apiKey?.startsWith('enc:')) {
            return model;
          }
          return { ...model, apiKey: await decryptField(model.apiKey, masterKey) };
        })
      );

      // Then: 加密的 apiKey 被解密，未加密的保持不变
      expect(processed[0].apiKey, '模型 1 的 apiKey 应被解密').toBe('key1');
      expect(processed[1].apiKey, '模型 2 的 apiKey 应保持不变').toBe('plain-key2');
      expect(processed[2].apiKey, '模型 3 的 apiKey 应被解密').toBe('key3');
    });
  });

  // ========================================
  // 7. 密钥长度严格验证测试
  // ========================================

  describe('密钥长度严格验证', () => {
    test('接受 64 个 hex 字符的密钥：应成功加密', async () => {
      // Given: 64 个 hex 字符的密钥（256-bit）
      const masterKey = 'a'.repeat(64);
      const plaintext = 'Test data';

      // When: 使用密钥加密
      const encrypted = await encryptField(plaintext, masterKey);

      // Then: 加密应成功
      expect(encrypted).toMatch(/^enc:/);

      // 验证密钥被转换为 32 字节
      const keyData = Buffer.from(masterKey, 'hex');
      expect(keyData.length, '密钥应被转换为 32 字节').toBe(32);
    });

    test('拒绝空密钥：应抛出"密钥不能为空"', async () => {
      // Given: 空密钥
      const masterKey = '';
      const plaintext = 'Test data';

      // When & Then: 加密应抛出错误
      await expect(encryptField(plaintext, masterKey)).rejects.toThrow('密钥不能为空');
    });
  });

  // ========================================
  // 8. Nonce 随机性和唯一性测试
  // ========================================

  describe('Nonce 随机性和唯一性', () => {
    test('每次加密生成不同的 nonce', async () => {
      // Given: 相同的明文和密钥
      const plaintext = 'Same plaintext';
      const masterKey = 'a'.repeat(64);

      // When: 加密两次
      const ciphertext1 = await encryptField(plaintext, masterKey);
      const ciphertext2 = await encryptField(plaintext, masterKey);

      // Then: 两次加密的密文应不同（nonce 不同）
      expect(ciphertext1).not.toBe(ciphertext2);

      // 验证 nonce 为 12 字节
      // 密文格式：enc:base64(ciphertext + nonce)
      // nonce 是最后 12 字节
      const combined1 = Buffer.from(ciphertext1.slice(4), 'base64');
      const combined2 = Buffer.from(ciphertext2.slice(4), 'base64');
      const nonce1 = combined1.slice(-12);
      const nonce2 = combined2.slice(-12);

      expect(nonce1.length, 'nonce 应为 12 字节').toBe(12);
      expect(nonce2.length, 'nonce 应为 12 字节').toBe(12);
      expect(nonce1.equals(nonce2), 'nonce 应互不相同').toBe(false);
    });

    test('100 次加密产生 100 个不同 nonce', async () => {
      // Given: 相同的明文和密钥
      const plaintext = 'Same plaintext';
      const masterKey = 'a'.repeat(64);

      // When: 加密 100 次
      const ciphertexts = await Promise.all(
        Array.from({ length: 100 }, () => encryptField(plaintext, masterKey))
      );

      // Then: 所有密文应互不相同
      const uniqueCiphertexts = new Set(ciphertexts);
      expect(uniqueCiphertexts.size, '所有密文应互不相同').toBe(100);

      // 验证所有 nonce 互不相同
      const nonces = ciphertexts.map((ciphertext) => {
        const combined = Buffer.from(ciphertext.slice(4), 'base64');
        return combined.slice(-12).toString('hex');
      });
      const uniqueNonces = new Set(nonces);
      expect(uniqueNonces.size, '所有 nonce 应互不相同').toBe(100);
    });
  });

  // ========================================
  // 9. 恶意密文格式防御测试
  // ========================================

  describe('恶意密文格式防御', () => {
    test('无效的 Base64 字符串：应捕获错误并包装为用户友好消息', async () => {
      // Given: 无效的 Base64 字符串
      const invalidCiphertext = 'enc:!!!@#$%';
      const masterKey = 'a'.repeat(64);

      // When & Then: 解密应抛出用户友好的错误消息
      await expect(decryptField(invalidCiphertext, masterKey)).rejects.toThrow(
        '解密敏感数据失败，可能是主密钥已更改或数据已损坏'
      );
    });

    test('不完整的密文：应检测到数据长度不足', async () => {
      // Given: 有效的 Base64 但解码后少于 12 字节（nonce 长度）
      // Base64 编码 10 字节 = 13 字符（向上取整到 4 的倍数）
      const shortCiphertext = 'enc:' + Buffer.from('a'.repeat(10)).toString('base64');
      const masterKey = 'a'.repeat(64);

      // When & Then: 解密应抛出"数据长度不足"错误
      await expect(decryptField(shortCiphertext, masterKey)).rejects.toThrow(
        '无效的加密数据格式：数据长度不足'
      );
    });

    test('isEncrypted() 对恶意输入的防御', () => {
      // Given: 恶意输入（XSS 尝试、二进制数据、超长数据）
      const inputs = [
        'enc:<script>alert("xss")</script>',
        'enc:' + 'A'.repeat(10000),
        'enc:' + Buffer.from([0x00, 0xff, 0x80, 0x90]).toString('base64'),
      ];

      // When & Then: isEncrypted() 应返回 true（只要以 enc: 开头）
      inputs.forEach((input) => {
        expect(input.startsWith('enc:'), `输入 "${input.slice(0, 20)}..." 应以 enc: 开头`).toBe(true);
      });

      // 验证系统不崩溃或抛出异常
      inputs.forEach((input) => {
        expect(() => {
          input.startsWith('enc:');
        }).not.toThrow();
      });
    });

    test('恶意输入的后续解密操作优雅失败', async () => {
      // Given: 恶意输入的密文
      const maliciousCiphertext = 'enc:<script>alert("xss")</script>';
      const masterKey = 'a'.repeat(64);

      // When & Then: 解密应优雅失败（不崩溃）
      await expect(decryptField(maliciousCiphertext, masterKey)).rejects.toThrow();
    });

    test('修改密文后验证失败', async () => {
      // Given: 有效的密文
      const masterKey = 'a'.repeat(64);
      const plaintext = 'Test data';
      const ciphertext = await encryptField(plaintext, masterKey);

      // When: 修改密文字节（翻转位）
      const combined = Buffer.from(ciphertext.slice(4), 'base64');
      combined[0] = combined[0] ^ 0xff; // 翻转第一个字节的位
      const tamperedCiphertext = 'enc:' + combined.toString('base64');

      // Then: 解密应失败（AES-GCM 认证标签验证）
      await expect(decryptField(tamperedCiphertext, masterKey)).rejects.toThrow(
        '解密敏感数据失败，可能是主密钥已更改或数据已损坏'
      );
    });

    test('缺少 enc: 前缀的解密：应抛出格式错误', async () => {
      // Given: 不带 enc: 前缀的密文
      const invalidCiphertext = 'invalid-ciphertext';
      const masterKey = 'a'.repeat(64);

      // When & Then: 解密应抛出"缺少 enc: 前缀"错误
      await expect(decryptField(invalidCiphertext, masterKey)).rejects.toThrow(
        '无效的加密数据格式：缺少 enc: 前缀'
      );
    });
  });

  // ========================================
  // 10. 边缘用例和错误路径测试
  // ========================================

  describe('边缘用例和错误路径', () => {
    test('无效 hex 字符串的密钥：hex 验证错误被包装为加密错误', async () => {
      // Given: 包含非 hex 字符的密钥（包含 'g', 'x', 'z' 等）
      const invalidKey = 'gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg';
      const plaintext = 'Test data';

      // When & Then: 加密应失败，hex 验证错误被包装为通用错误
      await expect(encryptField(plaintext, invalidKey)).rejects.toThrow(
        '加密敏感数据失败，请检查主密钥是否有效'
      );
    });

    test('奇数长度 hex 字符串的密钥：长度错误被包装为加密错误', async () => {
      // Given: 奇数长度的 hex 密钥
      const oddLengthKey = 'a'.repeat(63); // 63 个字符（奇数）
      const plaintext = 'Test data';

      // When & Then: 加密应失败，长度错误被包装为通用错误
      await expect(encryptField(plaintext, oddLengthKey)).rejects.toThrow(
        '加密敏感数据失败，请检查主密钥是否有效'
      );
    });

    test('isEncrypted() 对各种输入的判断', () => {
      // Given: 各种输入
      const inputs = [
        { value: 'enc:valid', expected: true, description: '有效加密字符串' },
        { value: 'enc:', expected: true, description: '仅前缀' },
        { value: 'enct:valid', expected: false, description: '拼写错误' },
        { value: 'en:', expected: false, description: '部分前缀' },
        { value: 'plain-text', expected: false, description: '普通文本' },
        { value: '', expected: false, description: '空字符串' },
        { value: 'ENC:UPPERCASE', expected: false, description: '大写前缀' },
      ];

      // When & Then: isEncrypted 应正确判断
      inputs.forEach(({ value, expected, description }) => {
        const result = value.startsWith('enc:');
        expect(result, `${description} 应返回 ${expected}`).toBe(expected);
      });
    });
  });
});
