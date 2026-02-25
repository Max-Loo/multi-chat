/**
 * 断言自动扩展设置
 * 
 * 在 setup.ts 中导入此文件以自动扩展断言
 */

import { extendExpect, toBeEncrypted, toBeValidMasterKey } from './crypto';
import { extendExpectWithMock, toHaveBeenCalledWithService } from './mock';

// 导出所有断言函数
export { toBeEncrypted, toBeValidMasterKey, toHaveBeenCalledWithService };

/**
 * 设置所有自定义断言
 */
export const setupCustomAssertions = (): void => {
  extendExpect();
  extendExpectWithMock();
};
