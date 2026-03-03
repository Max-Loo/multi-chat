/**
 * MSW Handlers 统一导出
 * 导出所有供应商的 MSW handlers
 */

import {
  deepSeekHandlers,
  deepSeekHandlersList,
} from './deepseek';
import {
  kimiHandlers,
  kimiHandlersList,
} from './kimi';
import {
  zhipuHandlers,
  zhipuHandlersList,
} from './zhipu';
import {
  modelsDevHandlers,
  modelsDevHandlersList,
} from './models-dev';

// 重新导出所有供应商 handlers
export {
  deepSeekHandlers,
  deepSeekHandlersList,
  kimiHandlers,
  kimiHandlersList,
  zhipuHandlers,
  zhipuHandlersList,
  modelsDevHandlers,
  modelsDevHandlersList,
};

// 导出类型
export type { StreamOptions, ApiHandlerFactory } from '../types';

/**
 * 所有默认 handlers（用于初始化 MSW server）
 * 包含所有供应商的成功场景 handlers
 */
export const allHandlers = [
  ...deepSeekHandlersList,
  ...kimiHandlersList,
  ...zhipuHandlersList,
  ...modelsDevHandlersList,
];
