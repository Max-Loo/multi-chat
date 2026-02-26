/**
 * Utils 工具函数测试
 */

import { describe, it, expect } from 'vitest';
import { getCurrentTimestamp, getCurrentTimestampMs } from '@/utils/utils';

describe('时间戳工具函数', () => {
  describe('getCurrentTimestamp', () => {
    it('应该返回数字类型的时间戳', () => {
      const timestamp = getCurrentTimestamp();
      expect(typeof timestamp).toBe('number');
    });

    it('应该返回秒级精度的时间戳（10 位数字）', () => {
      const timestamp = getCurrentTimestamp();
      const timestampStr = Math.floor(timestamp).toString();
      expect(timestampStr.length).toBeGreaterThanOrEqual(10);
      expect(timestampStr.length).toBeLessThanOrEqual(10);
    });

    it('应该返回合理范围内的秒级时间戳（2023 年之后）', () => {
      const timestamp = getCurrentTimestamp();
      expect(timestamp).toBeGreaterThanOrEqual(1700000000); // 2023-11-15 左右
      expect(timestamp).toBeLessThan(2000000000); // 2033-05-18 左右
    });

    it('应该是整数，不包含小数部分', () => {
      const timestamp = getCurrentTimestamp();
      expect(timestamp).toBe(Math.floor(timestamp));
    });

    it('连续调用应该返回单调递增的值', () => {
      const timestamp1 = getCurrentTimestamp();
      // 等待 1 毫秒确保时间戳可能变化
      const startTime = Date.now();
      while (Date.now() - startTime < 1) {
        // 等待
      }
      const timestamp2 = getCurrentTimestamp();
      expect(timestamp2).toBeGreaterThanOrEqual(timestamp1);
    });
  });

  describe('getCurrentTimestampMs', () => {
    it('应该返回数字类型的时间戳', () => {
      const timestamp = getCurrentTimestampMs();
      expect(typeof timestamp).toBe('number');
    });

    it('应该返回毫秒级精度的时间戳（13 位数字）', () => {
      const timestamp = getCurrentTimestampMs();
      const timestampStr = Math.floor(timestamp).toString();
      expect(timestampStr.length).toBeGreaterThanOrEqual(13);
      expect(timestampStr.length).toBeLessThanOrEqual(13);
    });

    it('应该返回合理范围内的毫秒级时间戳（2023 年之后）', () => {
      const timestamp = getCurrentTimestampMs();
      expect(timestamp).toBeGreaterThanOrEqual(1700000000000); // 2023-11-15 左右
      expect(timestamp).toBeLessThan(2000000000000); // 2033-05-18 左右
    });

    it('应该是整数，不包含小数部分', () => {
      const timestamp = getCurrentTimestampMs();
      expect(timestamp).toBe(Math.floor(timestamp));
    });

    it('连续调用应该返回单调递增的值', () => {
      const timestamp1 = getCurrentTimestampMs();
      const timestamp2 = getCurrentTimestampMs();
      expect(timestamp2).toBeGreaterThanOrEqual(timestamp1);
    });
  });

  describe('秒级和毫秒级时间戳关系', () => {
    it('毫秒级时间戳应该大约是秒级时间戳的 1000 倍', () => {
      const timestampSeconds = getCurrentTimestamp();
      const timestampMs = getCurrentTimestampMs();
      const ratio = timestampMs / timestampSeconds;
      
      // 比值应该在 1000 附近（允许一定的误差）
      expect(ratio).toBeGreaterThanOrEqual(999);
      expect(ratio).toBeLessThanOrEqual(1001);
    });
  });
});
