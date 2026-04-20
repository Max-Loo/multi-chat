/**
 * urlUtils 单元测试
 *
 * 测试 clearUrlSearchParams 的参数清除功能
 */

import { describe, it, expect } from 'vitest';
import { clearUrlSearchParams } from '@/utils/urlUtils';

describe('clearUrlSearchParams', () => {
  it('应该清除存在的参数', () => {
    const original = new URLSearchParams('chatId=123&other=456');
    const result = clearUrlSearchParams(['chatId'], original);

    expect(result.get('other')).toBe('456');
    expect(result.has('chatId')).toBe(false);
    // 不修改原对象
    expect(original.get('chatId')).toBe('123');
  });

  it('应该清除多个参数', () => {
    const result = clearUrlSearchParams(
      ['a', 'b'],
      new URLSearchParams('a=1&b=2&c=3'),
    );

    expect(result.get('c')).toBe('3');
    expect(result.has('a')).toBe(false);
    expect(result.has('b')).toBe(false);
  });

  it('应该无副作用 当清除不存在的参数', () => {
    const result = clearUrlSearchParams(
      ['nonexistent'],
      new URLSearchParams('a=1'),
    );

    expect(result.get('a')).toBe('1');
  });

  it('应该返回原参数副本 当参数列表为空', () => {
    const original = new URLSearchParams('a=1');
    const result = clearUrlSearchParams([], original);

    expect(result.get('a')).toBe('1');
    // 返回的是新对象
    expect(result).not.toBe(original);
  });
});
