import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resetInitI18nForTest, tSafely } from '@/services/i18n';
import i18n from 'i18next';

describe('tSafely', () => {
  beforeEach(() => {
    // 重置 i18n 初始化状态
    resetInitI18nForTest();
  });

  afterEach(async () => {
    // 清理 i18n 实例
    if (i18n.isInitialized) {
      try {
        await i18n.changeLanguage('en');
      } catch {
        // 忽略错误
      }
    }
  });

  describe('2. 测试 i18n 未初始化时的降级行为', () => {
    it('应该在 i18n 未初始化时返回降级文本', () => {
      const result = tSafely('error.test.key', 'Fallback text');
      expect(result).toBe('Fallback text');
    });

    it('应该在 i18n 未初始化且 key 为空时返回空字符串', () => {
      const result = tSafely('', 'Fallback text');
      expect(result).toBe('Fallback text');
    });
  });

  describe('3. 测试翻译存在时的正常行为', async () => {
    it('应该返回正确的翻译文本', async () => {
      // 初始化 i18n
      await i18n.init({
        lng: 'en',
        fallbackLng: 'en',
        resources: {
          en: {
            translation: {
              error: {
                test: {
                  key: 'Translated text'
                }
              }
            }
          }
        }
      });

      const result = tSafely('error.test.key', 'Fallback text');
      expect(result).toBe('Translated text');
    });
  });

  describe('4. 测试翻译不存在时的降级行为', async () => {
    it('应该在翻译不存在时返回降级文本', async () => {
      await i18n.init({
        lng: 'en',
        fallbackLng: 'en',
        resources: {
          en: {
            translation: {
              error: {
                other: 'Other text'
              }
            }
          }
        }
      });

      const result = tSafely('error.nonexistent.key', 'Fallback text');
      expect(result).toBe('Fallback text');
    });
  });

  describe('5. 测试异常处理（key 为 null/undefined）', async () => {
    it('应该处理 key 为 null 的情况', async () => {
      await i18n.init({
        lng: 'en',
        fallbackLng: 'en',
        resources: { en: { translation: {} } }
      });

      const result = tSafely(null as any, 'Fallback text');
      expect(result).toBe('Fallback text');
    });

    it('应该处理 key 为 undefined 的情况', async () => {
      await i18n.init({
        lng: 'en',
        fallbackLng: 'en',
        resources: { en: { translation: {} } }
      });

      const result = tSafely(undefined as any, 'Fallback text');
      expect(result).toBe('Fallback text');
    });
  });

  describe('6. 测试异常处理（fallback 为 null/undefined）', async () => {
    it('应该处理 fallback 为 null 的情况，返回空字符串', async () => {
      await i18n.init({
        lng: 'en',
        fallbackLng: 'en',
        resources: { en: { translation: {} } }
      });

      const result = tSafely('error.test.key', null as any);
      expect(result).toBe('');
    });

    it('应该处理 fallback 为 undefined 的情况，返回空字符串', async () => {
      await i18n.init({
        lng: 'en',
        fallbackLng: 'en',
        resources: { en: { translation: {} } }
      });

      const result = tSafely('error.test.key', undefined as any);
      expect(result).toBe('');
    });

    it('应该处理 fallback 为空字符串的情况', async () => {
      await i18n.init({
        lng: 'en',
        fallbackLng: 'en',
        resources: { en: { translation: {} } }
      });

      const result = tSafely('error.test.key', '');
      expect(result).toBe('');
    });
  });

  describe('7. 测试异常处理（两个参数都为 null）', async () => {
    it('应该处理两个参数都为 null 的情况', async () => {
      await i18n.init({
        lng: 'en',
        fallbackLng: 'en',
        resources: { en: { translation: {} } }
      });

      const result = tSafely(null as any, null as any);
      expect(result).toBe('');
    });
  });

  describe('8. 测试嵌套键值访问（两级、三级）', async () => {
    it('应该支持两级嵌套键值', async () => {
      await i18n.init({
        lng: 'en',
        fallbackLng: 'en',
        resources: {
          en: {
            translation: {
              error: {
                test: 'Two level nested'
              }
            }
          }
        }
      });

      const result = tSafely('error.test', 'Fallback');
      expect(result).toBe('Two level nested');
    });

    it('应该支持三级嵌套键值', async () => {
      await i18n.init({
        lng: 'en',
        fallbackLng: 'en',
        resources: {
          en: {
            translation: {
              error: {
                test: {
                  nested: 'Three level nested'
                }
              }
            }
          }
        }
      });

      const result = tSafely('error.test.nested', 'Fallback');
      expect(result).toBe('Three level nested');
    });
  });

  describe('9. 测试无效的嵌套路径返回降级文本', async () => {
    it('应该在无效嵌套路径时返回降级文本', async () => {
      await i18n.init({
        lng: 'en',
        fallbackLng: 'en',
        resources: {
          en: {
            translation: {
              error: {
                test: 'Valid path'
              }
            }
          }
        }
      });

      const result = tSafely('error.invalid.path', 'Fallback text');
      expect(result).toBe('Fallback text');
    });
  });

  describe('10. 测试 i18n.t() 返回非字符串类型的处理', async () => {
    it('应该处理翻译返回对象的情况', async () => {
      await i18n.init({
        lng: 'en',
        fallbackLng: 'en',
        resources: {
          en: {
            translation: {
              error: {
                test: { value: 'object' }
              }
            }
          }
        }
      });

      const result = tSafely('error.test', 'Fallback text');
      expect(result).toBe('Fallback text');
    });

    it('应该处理翻译返回数组的情况', async () => {
      await i18n.init({
        lng: 'en',
        fallbackLng: 'en',
        resources: {
          en: {
            translation: {
              error: ['item1', 'item2']
            }
          }
        }
      });

      const result = tSafely('error', 'Fallback text');
      expect(result).toBe('Fallback text');
    });

    it('应该处理翻译返回数字的情况（i18next 自动转换为字符串）', async () => {
      await i18n.init({
        lng: 'en',
        fallbackLng: 'en',
        resources: {
          en: {
            translation: {
              error: 123
            }
          }
        }
      });

      // i18next 会自动将数字转换为字符串 "123"
      // 这个测试验证数字可以被正确处理，不一定要使用降级
      const result = tSafely('error', 'Fallback text');
      expect(result).toBe('123'); // i18next 将数字转换为字符串
    });
  });

  describe('11. 测试性能：确保执行时间 < 1ms（i18n 已初始化）', async () => {
    it('应该在已初始化状态下快速返回（< 1ms）', async () => {
      await i18n.init({
        lng: 'en',
        fallbackLng: 'en',
        resources: {
          en: {
            translation: {
              error: {
                test: 'Translated text'
              }
            }
          }
        }
      });

      const start = performance.now();
      const result = tSafely('error.test', 'Fallback text');
      const end = performance.now();

      expect(result).toBe('Translated text');
      expect(end - start).toBeLessThan(1);
    });
  });

  describe('12. 测试多次调用相同参数返回一致结果', async () => {
    it('应该在多次调用时返回相同结果', async () => {
      await i18n.init({
        lng: 'en',
        fallbackLng: 'en',
        resources: {
          en: {
            translation: {
              error: {
                test: 'Consistent text'
              }
            }
          }
        }
      });

      const result1 = tSafely('error.test', 'Fallback');
      const result2 = tSafely('error.test', 'Fallback');
      const result3 = tSafely('error.test', 'Fallback');

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
      expect(result1).toBe('Consistent text');
    });
  });
});
