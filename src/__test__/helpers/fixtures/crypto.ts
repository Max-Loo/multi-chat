/**
 * 加密测试数据工厂
 * 
 * 提供加密测试所需的固定数据
 */

/**
 * 加密测试数据
 */
export interface CryptoTestData {
  /** 主密钥（64个十六进制字符） */
  masterKey: string;
  /** 明文 */
  plaintext: string;
  /** 密文（加密后） */
  ciphertext?: string;
}

/**
 * 创建加密测试数据
 * @param options 配置选项
 * @returns 加密测试数据
 */
export const createCryptoTestData = (options?: {
  /** 包含 Unicode 字符 */
  includeUnicode?: boolean;
  /** 包含 Emoji */
  includeEmoji?: boolean;
  /** 自定义明文 */
  customPlaintext?: string;
}): CryptoTestData => {
  const { includeUnicode = false, includeEmoji = false, customPlaintext } = options ?? {};

  // 默认主密钥（64个十六进制字符 = 256 bits）
  const masterKey = 'a'.repeat(64);

  // 根据选项生成明文
  let plaintext = customPlaintext ?? 'Hello, World!';

  if (includeUnicode) {
    plaintext = '你好世界！这是一个加密测试。';
  }

  if (includeEmoji) {
    plaintext = '🔐🔑🚀💻🌍 Test with emojis!';
  }

  return {
    masterKey,
    plaintext,
  };
};

/**
 * 创建批量加密测试数据
 * @param count 数量
 * @returns 加密测试数据数组
 */
export const createCryptoTestDataList = (count: number): CryptoTestData[] => {
  const testCases: CryptoTestData[] = [
    { masterKey: 'a'.repeat(64), plaintext: 'Simple text' },
    { masterKey: 'b'.repeat(64), plaintext: '中文测试' },
    { masterKey: 'c'.repeat(64), plaintext: '🔐🔑 Emoji test' },
    { masterKey: 'd'.repeat(64), plaintext: '!@#$%^&*() Special chars' },
    { masterKey: 'e'.repeat(64), plaintext: '' },
  ];

  return Array.from({ length: count }, (_, index) => {
    const testCase = testCases[index % testCases.length];
    return {
      ...testCase,
      masterKey: testCase.masterKey.slice(0, 63) + index.toString(16).slice(-1),
    };
  });
};

/**
 * 获取有效的测试主密钥
 */
export const getValidTestMasterKey = (): string => 'a'.repeat(64);

/**
 * 获取无效的测试主密钥（长度不正确）
 */
export const getInvalidTestMasterKey = (): string => 'invalid-key';

/**
 * 获取空的测试主密钥
 */
export const getEmptyTestMasterKey = (): string => '';
