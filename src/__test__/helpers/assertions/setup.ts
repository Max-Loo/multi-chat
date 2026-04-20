/**
 * 断言自动扩展设置
 *
 * 在 setup.ts 中导入此文件以自动扩展断言
 */

import { extendExpect } from './crypto';
import { extendExpectWithMock } from './mock';

/**
 * 设置所有自定义断言
 */
export const setupCustomAssertions = (): void => {
  extendExpect();
  extendExpectWithMock();
};
