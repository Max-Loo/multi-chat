import { describe, it, expect, vi } from 'vitest';
import { streamText, generateId } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';

describe('Verify Setup.ts Mocks', () => {
  it('streamText should be mocked', () => {
    console.log('streamText is mock:', vi.isMockFunction(streamText));
    expect(vi.isMockFunction(streamText)).toBe(true);
  });

  it('generateId should be mocked', () => {
    console.log('generateId is mock:', vi.isMockFunction(generateId));
    expect(vi.isMockFunction(generateId)).toBe(true);
  });

  it('createDeepSeek should be mocked', () => {
    console.log('createDeepSeek is mock:', vi.isMockFunction(createDeepSeek));
    expect(vi.isMockFunction(createDeepSeek)).toBe(true);
  });

  it('generateId should return mock value', () => {
    const id = generateId();
    console.log('Generated id:', id);
    expect(id).toBe('mock-generated-id');
  });
});
