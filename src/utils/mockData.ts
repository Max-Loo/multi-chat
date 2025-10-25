import { v4 as uuidv4 } from 'uuid';
import { Model } from '@/types/model';
import dayjs from 'dayjs';


const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

// 生成mock模型数据用于测试
export const generateMockModels = (): Model[] => {
  return [
    {
      id: uuidv4(),
      nickname: '深度搜索助手',
      provider: 'deepseek',
      modelName: 'deepseek-v2.5',
      createdAt: formatDate('2024-01-15 14:15:01'),
      remark: '用于深度搜索和知识问答',
    },
    {
      id: uuidv4(),
      nickname: 'Kimi智能助手',
      provider: 'kimi',
      modelName: 'kimi-v2.0',
      createdAt: formatDate('2024-02-20 14:15:00'),
      remark: '支持长文本处理',
    },
    {
      id: uuidv4(),
      nickname: 'ChatGPT-4',
      provider: 'openai',
      modelName: 'gpt-4-turbo',
      createdAt: formatDate('2024-03-10 09:45:00'),
      remark: '强大的对话AI模型',
    },
    {
      id: uuidv4(),
      nickname: 'Claude 3.5',
      provider: 'anthropic',
      modelName: 'claude-3.5-sonnet',
      createdAt: formatDate('2024-04-05 16:20:00'),
      remark: '适合编程和写作',
    },
    {
      id: uuidv4(),
      nickname: '智谱GLM-4',
      provider: 'bigmodel',
      modelName: 'glm-4',
      createdAt: formatDate('2024-05-12 11:00:00'),
      remark: '中文语言理解能力强',
    },
    {
      id: uuidv4(),
      nickname: '深度搜索助手',
      provider: 'deepseek',
      modelName: 'deepseek-v2.5',
      createdAt: formatDate('2024-01-15 10:30:00'),
      remark: '用于深度搜索和知识问答',
    },
    {
      id: uuidv4(),
      nickname: 'Kimi智能助手',
      provider: 'kimi',
      modelName: 'kimi-v2.0',
      createdAt: formatDate('2024-02-20 14:15:00'),
      remark: '支持长文本处理',
    },
    {
      id: uuidv4(),
      nickname: 'ChatGPT-4',
      provider: 'openai',
      modelName: 'gpt-4-turbo',
      createdAt: formatDate('2024-03-10 09:45:00'),
      remark: '强大的对话AI模型',
    },
    {
      id: uuidv4(),
      nickname: 'Claude 3.5',
      provider: 'anthropic',
      modelName: 'claude-3.5-sonnet',
      createdAt: formatDate('2024-04-05 16:20:00'),
      remark: '适合编程和写作',
    },
    {
      id: uuidv4(),
      nickname: '智谱GLM-4',
      provider: 'bigmodel',
      modelName: 'glm-4',
      createdAt: formatDate('2024-05-12 11:00:00'),
      remark: '中文语言理解能力强',
    },
    {
      id: uuidv4(),
      nickname: '深度搜索助手',
      provider: 'deepseek',
      modelName: 'deepseek-v2.5',
      createdAt: formatDate('2024-01-15 10:30:00'),
      remark: '用于深度搜索和知识问答',
    },
    {
      id: uuidv4(),
      nickname: 'Kimi智能助手',
      provider: 'kimi',
      modelName: 'kimi-v2.0',
      createdAt: formatDate('2024-02-20 14:15:00'),
      remark: '支持长文本处理',
    },
    {
      id: uuidv4(),
      nickname: 'ChatGPT-4',
      provider: 'openai',
      modelName: 'gpt-4-turbo',
      createdAt: formatDate('2024-03-10 09:45:00'),
      remark: '强大的对话AI模型',
    },
    {
      id: uuidv4(),
      nickname: 'Claude 3.5',
      provider: 'anthropic',
      modelName: 'claude-3.5-sonnet',
      createdAt: formatDate('2024-04-05 16:20:00'),
      remark: '适合编程和写作',
    },
    {
      id: uuidv4(),
      nickname: '智谱GLM-4',
      provider: 'bigmodel',
      modelName: 'glm-4',
      createdAt: formatDate('2024-05-12 11:00:00'),
      remark: '中文语言理解能力强',
    },
    {
      id: uuidv4(),
      nickname: '深度搜索助手',
      provider: 'deepseek',
      modelName: 'deepseek-v2.5',
      createdAt: formatDate('2024-01-15 10:30:00'),
      remark: '用于深度搜索和知识问答',
    },
    {
      id: uuidv4(),
      nickname: 'Kimi智能助手',
      provider: 'kimi',
      modelName: 'kimi-v2.0',
      createdAt: formatDate('2024-02-20 14:15:00'),
      remark: '支持长文本处理',
    },
    {
      id: uuidv4(),
      nickname: 'ChatGPT-4',
      provider: 'openai',
      modelName: 'gpt-4-turbo',
      createdAt: formatDate('2024-03-10 09:45:00'),
      remark: '强大的对话AI模型',
    },
    {
      id: uuidv4(),
      nickname: 'Claude 3.5',
      provider: 'anthropic',
      modelName: 'claude-3.5-sonnet',
      createdAt: formatDate('2024-04-05 16:20:00'),
      remark: '适合编程和写作',
    },
    {
      id: uuidv4(),
      nickname: '智谱GLM-4',
      provider: 'bigmodel',
      modelName: 'glm-4',
      createdAt: formatDate('2024-05-12 11:00:00'),
      remark: '中文语言理解能力强',
    },

  ].slice(0, 2);
};