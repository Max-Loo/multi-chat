/**
 * Chat 测试数据工厂
 * 
 * 提供聊天消息测试所需的 Mock 数据
 */

import type { StandardMessage } from '@/types/chat';
import { ChatRoleEnum } from '@/types/chat';
import { createIdGenerator } from 'ai';

// 生成测试消息 ID 的工具函数（带前缀）
const generateMessageId = createIdGenerator({ prefix: 'test-msg-' });

/**
 * 创建 Mock StandardMessage 对象
 * @param overrides 要覆盖的字段
 * @returns StandardMessage 对象
 */
export const createMockMessage = (overrides?: Partial<StandardMessage>): StandardMessage => ({
  id: generateMessageId(),
  timestamp: Date.now() / 1000, // 转换为秒级时间戳
  modelKey: 'deepseek-chat',
  role: ChatRoleEnum.USER,
  content: 'Test message',
  finishReason: 'stop',
  ...overrides,
});

/**
 * 创建用户消息
 * @param content 消息内容
 * @param overrides 要覆盖的字段
 */
export const createUserMessage = (
  content: string = 'Hello, how are you?',
  overrides?: Partial<StandardMessage>
): StandardMessage =>
  createMockMessage({
    role: ChatRoleEnum.USER,
    content,
    ...overrides,
  });

/**
 * 创建助手消息
 * @param content 消息内容
 * @param overrides 要覆盖的字段
 */
export const createAssistantMessage = (
  content: string = 'I am doing well, thank you!',
  overrides?: Partial<StandardMessage>
): StandardMessage =>
  createMockMessage({
    role: ChatRoleEnum.ASSISTANT,
    content,
    ...overrides,
  });

/**
 * 创建包含推理内容的消息
 * @param content 消息内容
 * @param reasoning 推理内容
 * @param overrides 要覆盖的字段
 */
export const createReasoningMessage = (
  content: string,
  reasoning: string,
  overrides?: Partial<StandardMessage>
): StandardMessage =>
  createMockMessage({
    role: ChatRoleEnum.ASSISTANT,
    content,
    reasoningContent: reasoning,
    ...overrides,
  });

/**
 * 创建系统消息
 * @param content 消息内容
 * @param overrides 要覆盖的字段
 */
export const createSystemMessage = (
  content: string = 'You are a helpful assistant.',
  overrides?: Partial<StandardMessage>
): StandardMessage =>
  createMockMessage({
    role: ChatRoleEnum.SYSTEM,
    content,
    ...overrides,
  });

/**
 * 创建包含 token 使用信息的消息
 * @param inputTokens 输入 token 数量
 * @param outputTokens 输出 token 数量
 * @param overrides 要覆盖的字段
 */
export const createMessageWithUsage = (
  inputTokens: number = 100,
  outputTokens: number = 200,
  overrides?: Partial<StandardMessage>
): StandardMessage =>
  createMockMessage({
    usage: {
      inputTokens,
      outputTokens,
    },
    ...overrides,
  });

/**
 * 批量创建消息（模拟对话历史）
 * @param count 消息数量
 * @param overrides 每个消息要覆盖的字段（可选，可以是函数）
 */
export const createMockMessages = (
  count: number,
  overrides?: Partial<StandardMessage> | ((index: number) => Partial<StandardMessage>)
): StandardMessage[] => {
  return Array.from({ length: count }, (_, index) => {
    const override = typeof overrides === 'function' ? overrides(index) : overrides;
    return createMockMessage({
      role: index % 2 === 0 ? ChatRoleEnum.USER : ChatRoleEnum.ASSISTANT,
      content: `Message ${index + 1}`,
      ...override,
    });
  });
};

/**
 * 创建包含 Markdown 格式的消息
 * @param markdownContent Markdown 内容
 */
export const createMarkdownMessage = (
  markdownContent: string = `# Heading

This is a **bold** text and this is *italic*.

## Code Block

\`\`\`javascript
function hello() {
  console.log('Hello, world!');
}
\`\`\`

- List item 1
- List item 2
- List item 3

[Link](https://example.com)
`
): StandardMessage =>
  createAssistantMessage(markdownContent);

/**
 * 创建长消息（用于测试换行和截断）
 * @param lines 行数
 */
export const createLongMessage = (lines: number = 100): StandardMessage => {
  const longContent = Array.from({ length: lines }, (_, i) => `Line ${i + 1}: This is a long message.`).join('\n');
  return createAssistantMessage(longContent);
};

/**
 * 创建包含代码的消息
 * @param code 代码内容
 * @param language 编程语言
 */
export const createCodeMessage = (
  code: string = `function example() {
  return "Hello, world!";
}`,
  language: string = 'javascript'
): StandardMessage => {
  const content = `Here is an example in ${language}:

\`\`\`${language}
${code}
\`\`\`

This code demonstrates a simple function.`;
  return createAssistantMessage(content);
};

/**
 * 获取不同类型的测试消息
 */
export const getTestMessages = (): StandardMessage[] => [
  createUserMessage('What is the capital of France?'),
  createAssistantMessage('The capital of France is Paris.'),
  createUserMessage('Can you show me a code example?'),
  createCodeMessage('console.log("Hello!");', 'javascript'),
  createMarkdownMessage(),
  createReasoningMessage('The answer is 42.', 'Let me think... 1+1=2, 2*21=42, therefore 42.'),
  createSystemMessage('You are a helpful assistant.'),
  createLongMessage(50),
  createMessageWithUsage(150, 300),
];
