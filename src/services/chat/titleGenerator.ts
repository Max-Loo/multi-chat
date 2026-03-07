import { generateText } from 'ai';
import { getProvider } from '@/services/chat/providerFactory';
import { Model } from '@/types/model';
import { StandardMessage, ChatRoleEnum } from '@/types/chat';

/**
 * 移除标题中的标点符号
 * @param title 原始标题
 * @returns 移除标点后的标题
 */
export function removePunctuation(title: string): string {
  // 移除所有非汉字、字母、数字和空格的字符，然后 trim
  return title
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '') // 移除标点
    .replace(/\s+/g, ' ') // 合并多个空格为一个
    .trim(); // 移除首尾空格
}

/**
 * 截取标题到指定长度
 * @param title 原始标题
 * @param maxLength 最大长度（默认 10）
 * @returns 截取后的标题
 */
export function truncateTitle(title: string, maxLength: number = 10): string {
  return title.slice(0, maxLength);
}

/**
 * 生成聊天标题的服务
 * @param messages 消息历史（应为最后一条用户消息和最后一条 AI 回复）
 * @param model 使用的模型配置
 * @returns 生成的标题
 * @throws 当 API 调用失败或生成内容为空时抛出错误
 */
export async function generateChatTitleService(
  messages: StandardMessage[],
  model: Model
): Promise<string> {
  // 1. 提取最后一条用户消息和最后一条 AI 回复
  const lastTwoMessages = messages.slice(-2);

  // 2. 构建提示词
  const userMessage = lastTwoMessages.find(msg => msg.role === ChatRoleEnum.USER)?.content || '';
  const assistantMessage = lastTwoMessages.find(msg => msg.role === ChatRoleEnum.ASSISTANT)?.content || '';

  const prompt = `你是一个聊天标题生成助手。请根据以下对话内容生成一个简洁的标题。

要求：
- 长度：5-10 个汉字
- 风格：专业、概括性
- 不包含标点符号

对话：
用户：${userMessage}
助手：${assistantMessage}

标题：`;

  // 3. 调用 generateText API
  const provider = getProvider(model.providerKey, model.apiKey, model.apiAddress);
  const { text } = await generateText({
    model: provider(model.modelKey),
    prompt,
  });

  // 4. 后处理：移除标点符号、截取前 10 个字符
  const cleanedTitle = truncateTitle(removePunctuation(text));

  // 5. 验证结果
  if (!cleanedTitle || cleanedTitle.length === 0) {
    throw new Error('Generated title is empty');
  }

  return cleanedTitle;
}
