/**
 * 测试数据工厂
 *
 * 用于生成 E2E 测试所需的测试数据，确保每个测试使用独立的数据。
 */

/**
 * 测试用模型类型
 */
export interface TestModel {
  id: string;
  nickname: string;
  apiKey: string;
  apiAddress: string;
  modelKey: string;
  providerKey: string;
  isDeleted?: boolean;
  createdAt?: number | string;
  updatedAt?: number | string;
}

/**
 * 创建测试模型数据
 * @param overrides 覆盖默认值
 * @returns 测试模型对象
 */
export function testModelFactory(overrides?: Partial<TestModel>): TestModel {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).slice(2, 8);

  return {
    id: `test-model-${timestamp}-${randomId}`,
    nickname: `E2E Test Model ${timestamp}`,
    apiKey: 'test-api-key-123456',
    apiAddress: 'https://api.test.com/v1',
    modelKey: 'test-model',
    providerKey: 'test-provider',
    isDeleted: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

/**
 * 创建测试聊天数据
 * @param overrides 覆盖默认值
 * @returns 测试聊天对象
 */
export function testChatFactory(overrides?: Partial<any>): any {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).slice(2, 8);

  return {
    id: `test-chat-${timestamp}-${randomId}`,
    title: `E2E Test Chat ${timestamp}`,
    modelId: 'test-model-id',
    messages: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

/**
 * 创建测试消息数据
 * @param overrides 覆盖默认值
 * @returns 测试消息对象
 */
export function testMessageFactory(overrides?: Partial<any>): any {
  const timestamp = Date.now();

  return {
    id: `test-message-${Date.now()}-${Math.random()}`,
    role: 'user',
    content: 'This is a test message',
    timestamp,
    ...overrides,
  };
}

/**
 * 测试常量
 */
export const TEST_CONSTANTS = {
  // 测试消息前缀
  TEST_CHAT_PREFIX: 'test-chat-',
  TEST_MODEL_PREFIX: 'E2E Test Model',

  // 测试消息内容
  TEST_MESSAGE_CONTENT: 'This is a test message',
  TEST_LONG_MESSAGE: 'Please explain quantum computing in detail.',

  // 测试超时时间
  DEFAULT_TIMEOUT: 30000,
  NAVIGATION_TIMEOUT: 10000,
};
