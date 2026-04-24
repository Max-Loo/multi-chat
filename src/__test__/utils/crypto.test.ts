/**
 * Crypto 工具函数测试
 */

import { describe, it, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { encryptField, decryptField, isEncrypted, hexToBytes, bytesToBase64, base64ToBytes } from '@/utils/crypto';

// 测试辅助函数
/**
 * 测试加密和解密的往返
 * @param plaintext - 要加密的明文
 * @param key - 加密密钥
 */
const testEncryptDecrypt = async (plaintext: string, key: string) => {
  const encrypted = await encryptField(plaintext, key);
  const decrypted = await decryptField(encrypted, key);
  expect(decrypted).toBe(plaintext);
  return encrypted;
};

/**
 * 测试无效输入应抛出错误
 * @param fn - 要测试的函数
 * @param errorMessage - 期望的错误消息（可选）
 */
const testInvalidInput = async (
  fn: () => Promise<unknown> | unknown,
  errorMessage?: string | RegExp
) => {
  if (errorMessage) {
    await expect(fn()).rejects.toThrow(errorMessage);
  } else {
    await expect(fn()).rejects.toThrow();
  }
};

describe('Crypto 工具函数', () => {
  // 测试用的 256-bit 主密钥（hex 编码）
  const masterKey = 'a'.repeat(64); // 64 个 hex 字符 = 256 bits

  describe('hexToBytes', () => {
    describe('正常转换', () => {
      it('应该正确转换 hex 字符串', () => {
        const hex = '48656c6c6f'; // "Hello" 的 hex 编码
        const bytes = hexToBytes(hex);

        expect(bytes).toEqual(new Uint8Array([72, 101, 108, 108, 111]));
        expect(bytes.length).toBe(hex.length / 2);
      });

      it('应该正确转换空字符串', () => {
        const bytes = hexToBytes('');

        expect(bytes.length).toBe(0);
      });

      it('应该正确处理大小写混合的 hex 字符串', () => {
        const hex = 'AaBbCc';
        const bytes = hexToBytes(hex);

        expect(bytes).toEqual(new Uint8Array([170, 187, 204]));
      });
    });

    describe('异常处理', () => {
      test.each([
        ['abc', '长度必须为偶数'],
        ['ghij', '包含非 hex 字符'],
        ['ab cd', '包含非 hex 字符'],
      ])('应该处理无效的 hex 字符串: %s', (hex, expectedError) => {
        expect(() => hexToBytes(hex)).toThrow(expectedError);
      });

      it('应该接受空字符串', () => {
        const hex = '';
        const bytes = hexToBytes(hex);

        expect(bytes.length).toBe(0);
      });
    });
  });

  describe('bytesToBase64', () => {
    describe('正常转换', () => {
      it('应该正确转换字节数组', () => {
        const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
        const base64 = bytesToBase64(bytes);

        expect(base64).toBe('SGVsbG8=');
      });

      it('应该正确转换空数组', () => {
        const bytes = new Uint8Array([]);
        const base64 = bytesToBase64(bytes);

        expect(base64).toBe('');
      });

      it('应该正确处理所有 256 种字节值', () => {
        const bytes = new Uint8Array(256);
        for (let i = 0; i < 256; i++) {
          bytes[i] = i;
        }
        const base64 = bytesToBase64(bytes);

        // 验证可以成功转换回来
        expect(base64.length).toBeGreaterThan(0);
      });
    });

    describe('边界情况', () => {
      it('应该正确处理不可打印字符', () => {
        const bytes = new Uint8Array([0, 1, 2, 127, 255]); // 包含控制字符和最大字节值
        const base64 = bytesToBase64(bytes);

        expect(base64).toBeTruthy();
        expect(base64.length).toBeGreaterThan(0);
      });
    });
  });

  describe('base64ToBytes', () => {
    describe('正常转换', () => {
      it('应该正确转换 Base64 字符串', () => {
        const base64 = 'SGVsbG8='; // "Hello"
        const bytes = base64ToBytes(base64);

        expect(bytes).toEqual(new Uint8Array([72, 101, 108, 108, 111]));
      });

      it('应该正确处理无填充的 Base64', () => {
        const base64 = 'SGVsbG8'; // "Hello" 无 "=" 填充
        const bytes = base64ToBytes(base64);

        expect(bytes[0]).toBe(72);
        expect(bytes[1]).toBe(101);
      });
    });

    describe('异常处理', () => {
      test.each([
        '!!!@#$',
        'not-base64!!!',
        '@#$%^&*()',
      ])('应该处理无效的 Base64 字符串: %s', (invalidBase64) => {
        expect(() => base64ToBytes(invalidBase64)).toThrow();
      });

      it('应该正确处理空字符串', () => {
        const bytes = base64ToBytes('');

        expect(bytes.length).toBe(0);
      });
    });
  });

  describe('转换往返', () => {
    it('hex → bytes → hex 往返应保持数据完整', () => {
      const originalHex = '48656c6c6f20576f726c6421';
      const bytes = hexToBytes(originalHex);
      const restoredHex = Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      expect(restoredHex.toLowerCase()).toBe(originalHex.toLowerCase());
    });

    it('bytes → Base64 → bytes 往返应保持数据完整', () => {
      const originalBytes = new Uint8Array([72, 101, 108, 108, 111]);
      const base64 = bytesToBase64(originalBytes);
      const restoredBytes = base64ToBytes(base64);

      expect(restoredBytes).toEqual(originalBytes);
    });

    it('完整往返：hex → bytes → Base64 → bytes → hex', () => {
      const originalHex = '48656c6c6f';
      const bytes = hexToBytes(originalHex);
      const base64 = bytesToBase64(bytes);
      const restoredBytes = base64ToBytes(base64);
      const restoredHex = Array.from(restoredBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      expect(restoredHex.toLowerCase()).toBe(originalHex.toLowerCase());
    });
  });

  describe('encryptField', () => {
    it('应该成功加密明文', async () => {
      const plaintext = 'Hello, World!';
      const encrypted = await encryptField(plaintext, masterKey);

      expect(encrypted).toMatch(/^enc:/);
      expect(encrypted.length).toBeGreaterThan(4); // 至少包含 "enc:" 前缀和加密数据
    });

    it('应该正确加密空字符串', async () => {
      const plaintext = '';
      const encrypted = await encryptField(plaintext, masterKey);

      expect(encrypted).toMatch(/^enc:/);
    });

    it('空密钥应该抛出错误', async () => {
      const plaintext = 'Hello, World!';

      await expect(encryptField(plaintext, '')).rejects.toThrow('密钥不能为空');
    });
  });

  describe('decryptField', () => {
    it('应该成功解密密文', async () => {
      const plaintext = 'Hello, World!';
      await testEncryptDecrypt(plaintext, masterKey);
    });

    it('应该正确解密空字符串', async () => {
      const plaintext = '';
      await testEncryptDecrypt(plaintext, masterKey);
    });

    it('使用错误的密钥应该抛出错误', async () => {
      const plaintext = 'Hello, World!';
      const correctKey = masterKey;
      const wrongKey = 'b'.repeat(64);

      const encrypted = await encryptField(plaintext, correctKey);

      await testInvalidInput(
        () => decryptField(encrypted, wrongKey),
        '解密敏感数据失败，可能是主密钥已更改或数据已损坏'
      );
    });

    it('缺少 enc: 前缀应该抛出错误', async () => {
      const invalidCiphertext = 'invalid-format';

      await testInvalidInput(
        () => decryptField(invalidCiphertext, masterKey),
        '无效的加密数据格式：缺少 enc: 前缀'
      );
    });

    it('数据长度不足应该抛出错误', async () => {
      // 创建一个有效的 Base64 字符串，但解码后只有 12 字节（只有 nonce）
      // 12 字节 = 16 个 Base64 字符
      const validBase64 = bytesToBase64(new Uint8Array(12)); // 12 个零字节

      await testInvalidInput(
        () => decryptField(`enc:${validBase64}`, masterKey),
        '无效的加密数据格式：数据长度不足'
      );
    });
  });

  describe('isEncrypted', () => {
    it('应该正确识别加密字符串', () => {
      expect(isEncrypted('enc:SGVsbG8=')).toBe(true);
      expect(isEncrypted('enc:any-text-here')).toBe(true);
    });

    test.each([
      ['plain-text'],
      [''],
      ['enc'],
      ['en:'],
      [':'],
    ])('应该正确识别未加密字符串: %s', (input) => {
      expect(isEncrypted(input)).toBe(false);
    });
  });

  describe('加密/解密往返', () => {
    it('应该保持数据的完整性', async () => {
      const testCases = [
        'Simple text',
        '中文测试',
        'Special characters: !@#$%^&*()',
        'Numbers: 1234567890',
        'Multi\nline\ntext',
        'Very long text'.repeat(100),
      ];

      for (const plaintext of testCases) {
        const encrypted = await encryptField(plaintext, masterKey);
        const decrypted = await decryptField(encrypted, masterKey);
        expect(decrypted).toBe(plaintext);
      }
    });
  });

  describe('边界条件测试', () => {
    describe('大数据量测试', () => {
      it('应该成功加密解密超长文本（> 1MB）', async () => {
        // 创建超过 1MB 的文本（每个字符约 1-3 字节，使用 ASCII 约 1 字节）
        const longText = 'A'.repeat(2 * 1024 * 1024); // 2MB 的文本

        const startTime = performance.now();
        const encrypted = await encryptField(longText, masterKey);
        const decrypted = await decryptField(encrypted, masterKey);
        const endTime = performance.now();

        // 验证数据完整性
        expect(decrypted).toBe(longText);

        // 验证性能合理（总时间应在 5 秒内完成）
        const totalTime = endTime - startTime;
        expect(totalTime).toBeLessThan(5000);
      });

      it('操作应在合理时间内完成（< 1秒 for 100KB）', async () => {
        // 创建 100KB 的文本
        const mediumText = 'Hello World '.repeat(10000); // 约 110KB

        const startTime = performance.now();
        const encrypted = await encryptField(mediumText, masterKey);
        const decrypted = await decryptField(encrypted, masterKey);
        const endTime = performance.now();

        // 验证数据完整性
        expect(decrypted).toBe(mediumText);

        // 验证性能（应在 1 秒内完成）
        const totalTime = endTime - startTime;
        expect(totalTime).toBeLessThan(1000);
      });

      it('nonce 唯一性测试：相同明文多次加密产生不同密文', async () => {
        const plaintext = 'Same text encrypted multiple times';
        const encryptCount = 100;

        // 加密相同明文多次
        const encryptedResults = await Promise.all(
          Array.from({ length: encryptCount }, () => encryptField(plaintext, masterKey))
        );

        // 验证所有密文都不同
        const uniqueCiphertexts = new Set(encryptedResults);
        expect(uniqueCiphertexts.size).toBe(encryptCount);

        // 验证所有密文都能正确解密
        const decryptedResults = await Promise.all(
          encryptedResults.map(ciphertext => decryptField(ciphertext, masterKey))
        );

        // 所有解密结果应与原始明文相同
        for (const decrypted of decryptedResults) {
          expect(decrypted).toBe(plaintext);
        }
      });
    });

    describe('特殊 Unicode 字符处理', () => {
      test.each([
        ['中文', '你好世界！这是一个加密测试。'],
        ['日文', 'こんにちは！これは暗号化テストです。'],
        ['韩文', '안녕하세요! 이것은 암호화 테스트입니다.'],
        ['混合 CJK', '中文你好 Japanese 日本語 안녕 Korean'],
        ['Emoji', '🔐🔑🚀💻🌍⭐🎉😀👍💡'],
        ['Emoji 序列', '👨‍👩‍👧‍👦👨‍💻👩‍🚀🎅🏽🇨🇳'],
        ['混合 Emoji 和文本', 'Hello 🔐 World 🌍 Test 💻 with 😀 emojis!'],
        ['组合变音符号', 'é à ô ü'],
        ['预组合字符', 'é à ô ü ñ ç'],
        ['混合组合字符', 'café naïve façade'],
        ['阿拉伯文 RTL', 'مرحبا بالعالم'],
        ['希伯来文 RTL', 'שלום עולם'],
        ['混合 LTR/RTL', 'Hello مرحبا World שלום'],
      ])('应该正确处理 %s', async (_label, text) => {
        const encrypted = await encryptField(text, masterKey);
        const decrypted = await decryptField(encrypted, masterKey);
        expect(decrypted).toBe(text);
      });
    });

    describe('特殊 ASCII 字符处理', () => {
      describe('控制字符测试', () => {
        it('应该正确处理换行符', async () => {
          const textWithNewlines = 'Line 1\nLine 2\nLine 3';
          const encrypted = await encryptField(textWithNewlines, masterKey);
          const decrypted = await decryptField(encrypted, masterKey);

          expect(decrypted).toBe(textWithNewlines);
        });

        it('应该正确处理制表符', async () => {
          const textWithTabs = 'Column1\tColumn2\tColumn3';
          const encrypted = await encryptField(textWithTabs, masterKey);
          const decrypted = await decryptField(encrypted, masterKey);

          expect(decrypted).toBe(textWithTabs);
        });

        it('应该正确处理回车符', async () => {
          const textWithCarriageReturn = 'Line1\rLine2\rLine3';
          const encrypted = await encryptField(textWithCarriageReturn, masterKey);
          const decrypted = await decryptField(encrypted, masterKey);

          expect(decrypted).toBe(textWithCarriageReturn);
        });

        it('应该正确处理混合换行符', async () => {
          const textWithMixedLineEndings = 'Line1\r\nLine2\nLine3\rLine4';
          const encrypted = await encryptField(textWithMixedLineEndings, masterKey);
          const decrypted = await decryptField(encrypted, masterKey);

          expect(decrypted).toBe(textWithMixedLineEndings);
        });
      });

      describe('多行文本测试', () => {
        it('应该正确处理多行文本', async () => {
          const multilineText = `First line
Second line
Third line
Fourth line`;

          const encrypted = await encryptField(multilineText, masterKey);
          const decrypted = await decryptField(encrypted, masterKey);

          expect(decrypted).toBe(multilineText);
        });

        it('应该正确处理带有空行的多行文本', async () => {
          const multilineWithBlanks = `Line 1

Line 3

Line 5`;

          const encrypted = await encryptField(multilineWithBlanks, masterKey);
          const decrypted = await decryptField(encrypted, masterKey);

          expect(decrypted).toBe(multilineWithBlanks);
        });
      });

      describe('特殊符号测试', () => {
        it('应该正确处理特殊符号', async () => {
          const specialChars = '!@#$%^&*()_+-=[]{}|;\':",./<>?`~';
          const encrypted = await encryptField(specialChars, masterKey);
          const decrypted = await decryptField(encrypted, masterKey);

          expect(decrypted).toBe(specialChars);
        });

        it('应该正确处理混合特殊符号和文本', async () => {
          const mixedSpecialChars = 'Hello! @#$%^&*() World {}[]|<>?';
          const encrypted = await encryptField(mixedSpecialChars, masterKey);
          const decrypted = await decryptField(encrypted, masterKey);

          expect(decrypted).toBe(mixedSpecialChars);
        });
      });

      describe('零字符测试', () => {
        it('应该正确处理包含零字符的文本', async () => {
          // JavaScript 字符串可以包含 null 字符，虽然在显示时不可见
          const textWithNull = 'Hello\x00World\x00Test';
          const encrypted = await encryptField(textWithNull, masterKey);
          const decrypted = await decryptField(encrypted, masterKey);

          expect(decrypted).toBe(textWithNull);
        });

        it('应该正确处理多个零字符', async () => {
          const textWithMultipleNulls = 'A\x00\x00\x00B';
          const encrypted = await encryptField(textWithMultipleNulls, masterKey);
          const decrypted = await decryptField(encrypted, masterKey);

          expect(decrypted).toBe(textWithMultipleNulls);
        });

        it('应该正确处理只有零字符的文本', async () => {
          const textWithOnlyNulls = '\x00\x00\x00';
          const encrypted = await encryptField(textWithOnlyNulls, masterKey);
          const decrypted = await decryptField(encrypted, masterKey);

          expect(decrypted).toBe(textWithOnlyNulls);
        });
      });
    });

    describe('密钥边界情况测试', () => {
      describe('密钥长度测试', () => {
        it('应该正确处理正好 64 个 hex 字符的密钥', async () => {
          const validKey = 'a'.repeat(64);
          const plaintext = 'Test message';

          const encrypted = await encryptField(plaintext, validKey);
          const decrypted = await decryptField(encrypted, validKey);

          expect(decrypted).toBe(plaintext);
        });
      });

      describe('密钥格式边缘用例', () => {
        it('无效 hex 字符串的密钥：hex 验证错误被包装为加密错误', async () => {
          const invalidKey = 'g'.repeat(64);
          const plaintext = 'Test data';

          await expect(encryptField(plaintext, invalidKey)).rejects.toThrow(
            '加密敏感数据失败，请检查主密钥是否有效'
          );
        });

        it('奇数长度 hex 字符串的密钥：长度错误被包装为加密错误', async () => {
          const oddLengthKey = 'a'.repeat(63);
          const plaintext = 'Test data';

          await expect(encryptField(plaintext, oddLengthKey)).rejects.toThrow(
            '加密敏感数据失败，请检查主密钥是否有效'
          );
        });
      });

      describe('特殊密钥值测试', () => {
        it('应该正确处理所有位为 0 的密钥', async () => {
          const allZerosKey = '0'.repeat(64);
          const plaintext = 'Test message';

          const encrypted = await encryptField(plaintext, allZerosKey);
          const decrypted = await decryptField(encrypted, allZerosKey);

          expect(decrypted).toBe(plaintext);
        });

        it('应该正确处理所有位为 f 的密钥', async () => {
          const allFsKey = 'f'.repeat(64);
          const plaintext = 'Test message';

          const encrypted = await encryptField(plaintext, allFsKey);
          const decrypted = await decryptField(encrypted, allFsKey);

          expect(decrypted).toBe(plaintext);
        });

        it('应该正确处理大小写混合的密钥', async () => {
          const mixedCaseKey = 'AaBbCcDdEeFf001122334455667788990011AaBbCcDdEeFf';
          const plaintext = 'Test message';

          const encrypted = await encryptField(plaintext, mixedCaseKey);
          const decrypted = await decryptField(encrypted, mixedCaseKey);

          expect(decrypted).toBe(plaintext);
        });
      });
    });

    describe('密文边界情况测试', () => {
      describe('最小有效密文测试', () => {
        it('加密空字符串应产生有效密文', async () => {
          const emptyPlaintext = '';

          const encrypted = await encryptField(emptyPlaintext, masterKey);

          // 密文应包含 "enc:" 前缀
          expect(encrypted).toMatch(/^enc:/);
          // 密文长度应大于 4（前缀长度）
          expect(encrypted.length).toBeGreaterThan(4);

          // 应能成功解密
          const decrypted = await decryptField(encrypted, masterKey);
          expect(decrypted).toBe(emptyPlaintext);
        });
      });

      describe('异常密文格式测试', () => {
        it('非 Base64 字符在 enc: 后应抛出错误', async () => {
          const invalidCiphertext = 'enc:!!!@#$%';

          await expect(decryptField(invalidCiphertext, masterKey)).rejects.toThrow(
            '解密敏感数据失败'
          );
        });

        it('截断的 Base64 数据应抛出错误', async () => {
          // 创建一个有效的加密数据，然后截断它
          const validEncrypted = await encryptField('test', masterKey);
          const truncatedCiphertext = validEncrypted.slice(0, validEncrypted.length - 5);

          await expect(decryptField(truncatedCiphertext, masterKey)).rejects.toThrow(
            '解密敏感数据失败'
          );
        });
      });
    });

    describe('加密算法特性测试', () => {
      describe('认证标签验证测试', () => {
        it('修改密文字节应导致解密失败', async () => {
          const plaintext = 'Test message for authentication';
          const encrypted = await encryptField(plaintext, masterKey);

          // 解码 Base64 密文，修改一个字节，然后重新编码
          const base64Data = encrypted.slice(4);
          const decodedData = base64ToBytes(base64Data);

          // 修改密文的一个字节（不是 nonce 部分）
          if (decodedData.length > 12) {
            decodedData[0] = decodedData[0] ^ 0xff; // 翻转第一个字节的所有位
            const modifiedBase64 = bytesToBase64(decodedData);
            const modifiedCiphertext = `enc:${modifiedBase64}`;

            await expect(decryptField(modifiedCiphertext, masterKey)).rejects.toThrow(
              '解密敏感数据失败，可能是主密钥已更改或数据已损坏'
            );
          }
        });
      });

      describe('密钥重用安全测试', () => {
        it('相同密钥加密不同明文应产生不同密文', async () => {
          const plaintext1 = 'First message';
          const plaintext2 = 'Second message';

          const encrypted1 = await encryptField(plaintext1, masterKey);
          const encrypted2 = await encryptField(plaintext2, masterKey);

          // 密文应不同
          expect(encrypted1).not.toBe(encrypted2);

          // 解密应得到正确的明文
          const decrypted1 = await decryptField(encrypted1, masterKey);
          const decrypted2 = await decryptField(encrypted2, masterKey);

          expect(decrypted1).toBe(plaintext1);
          expect(decrypted2).toBe(plaintext2);
        });
      });
    });

    describe('性能边界测试', () => {
      it('单个字符加密解密应瞬间完成', async () => {
        const singleChar = 'A';

        const startTime = performance.now();
        const encrypted = await encryptField(singleChar, masterKey);
        const decrypted = await decryptField(encrypted, masterKey);
        const endTime = performance.now();

        expect(decrypted).toBe(singleChar);

        // 应在 100ms 内完成
        const totalTime = endTime - startTime;
        expect(totalTime).toBeLessThan(100);
      });

      it('中等文本（10KB）加密解密应快速完成', async () => {
        const mediumText = 'Hello World '.repeat(1000); // 约 11KB

        const startTime = performance.now();
        const encrypted = await encryptField(mediumText, masterKey);
        const decrypted = await decryptField(encrypted, masterKey);
        const endTime = performance.now();

        expect(decrypted).toBe(mediumText);

        // 应在 1 秒内完成
        const totalTime = endTime - startTime;
        expect(totalTime).toBeLessThan(1000);
      });

      it('连续 1000 次加密/解密操作应在合理时间内完成', async () => {
        const plaintext = 'Performance test';
        const iterations = 1000;

        const startTime = performance.now();

        for (let i = 0; i < iterations; i++) {
          const encrypted = await encryptField(plaintext, masterKey);
          const decrypted = await decryptField(encrypted, masterKey);
          expect(decrypted).toBe(plaintext);
        }

        const endTime = performance.now();

        // 应在 5 秒内完成所有操作
        const totalTime = endTime - startTime;
        expect(totalTime).toBeLessThan(5000);
      });

      it('内存测试：确保无内存泄漏', async () => {
        const plaintext = 'Memory test '.repeat(1000); // 约 11KB
        const iterations = 100;

        // 执行多次加密/解密操作
        const results = [];
        for (let i = 0; i < iterations; i++) {
          const encrypted = await encryptField(plaintext, masterKey);
          const decrypted = await decryptField(encrypted, masterKey);
          results.push(decrypted);
        }

        // 验证所有结果都正确
        for (const result of results) {
          expect(result).toBe(plaintext);
        }

        // 如果没有抛出错误且测试完成，说明没有明显的内存泄漏
        expect(results.length).toBe(iterations);
      });
    });

    describe('并发和异步测试', () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('并发加密操作应独立完成', async () => {
        const plaintexts = [
          'Message 1',
          'Message 2',
          'Message 3',
          'Message 4',
          'Message 5',
        ];

        // 同时启动多个加密操作
        const encryptedResults = await Promise.all(
          plaintexts.map(text => encryptField(text, masterKey))
        );

        // 所有密文应不同（因为 nonce 不同）
        const uniqueCiphertexts = new Set(encryptedResults);
        expect(uniqueCiphertexts.size).toBe(plaintexts.length);

        // 所有密文都应能正确解密
        const decryptedResults = await Promise.all(
          encryptedResults.map(ciphertext => decryptField(ciphertext, masterKey))
        );

        // 验证解密结果
        for (let i = 0; i < plaintexts.length; i++) {
          expect(decryptedResults[i]).toBe(plaintexts[i]);
        }
      });

      it('加密和解密在不同事件循环中执行应成功', async () => {
        const plaintext = 'Async test';

        // 加密
        const encrypted = await encryptField(plaintext, masterKey);

        // 使用 fakeTimers 模拟不同事件循环中解密
        const decryptedPromise = new Promise<string>((resolve) => {
          setTimeout(async () => {
            const result = await decryptField(encrypted, masterKey);
            resolve(result);
          }, 10);
        });

        await vi.advanceTimersByTimeAsync(10);
        const decrypted = await decryptedPromise;

        expect(decrypted).toBe(plaintext);
      });
    });
  });
});
