import { describe, it, expect, vi, beforeEach } from 'vitest';
import { streamText } from 'ai';
import { createMockStreamResult } from '@/__test__/helpers';

describe('Debug Mock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(streamText).mockImplementation(() => {
      console.log('Mock implementation called!');
      return createMockStreamResult([{ type: 'text-delta', text: 'Hello' }]) as any;
    });
  });

  it('should verify mock is working', async () => {
    console.log('Is mock function?', vi.isMockFunction(streamText));
    
    const result = streamText({ model: {} as any, messages: [] });
    console.log('Result:', result);
    
    // Try to consume the stream
    const chunks = [];
    for await (const chunk of result.fullStream) {
      chunks.push(chunk);
    }
    console.log('Chunks:', chunks);
    
    expect(chunks).toHaveLength(1);
  });
});
