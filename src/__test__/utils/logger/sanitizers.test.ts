/**
 * 脱敏器单元测试
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeApiKey,
  shouldSanitizeField,
  isApiKeyLike,
} from '@/utils/logger/sanitizers/apiKey';
import {
  sanitizeContent,
  shouldSanitizeContent,
  sanitizeContentRecursive,
} from '@/utils/logger/sanitizers/content';
import {
  sanitizeEmail,
  sanitizePhone,
  sanitizePiiInString,
  sanitizePath,
} from '@/utils/logger/sanitizers/pii';
import { sanitizeObject, sanitizeContext } from '@/utils/logger/sanitizers';

describe('apiKey sanitizer', () => {
  describe('shouldSanitizeField', () => {
    it('should identify sensitive field names', () => {
      expect(shouldSanitizeField('apiKey')).toBe(true);
      expect(shouldSanitizeField('api_key')).toBe(true);
      expect(shouldSanitizeField('token')).toBe(true);
      expect(shouldSanitizeField('accessToken')).toBe(true);
      expect(shouldSanitizeField('password')).toBe(true);
    });

    it('should not identify non-sensitive field names', () => {
      expect(shouldSanitizeField('name')).toBe(false);
      expect(shouldSanitizeField('email')).toBe(false);
      expect(shouldSanitizeField('data')).toBe(false);
    });
  });

  describe('sanitizeApiKey', () => {
    it('should mask API key preserving first 4 and last 4 chars', () => {
      expect(sanitizeApiKey('sk-1234567890abcd')).toBe('sk-1****abcd');
    });

    it('should return **** for short values (<=12 chars)', () => {
      expect(sanitizeApiKey('short')).toBe('****');
      expect(sanitizeApiKey('12charshere')).toBe('****');
    });

    it('should return [ENCRYPTED] for encrypted values', () => {
      expect(sanitizeApiKey('enc:something')).toBe('[ENCRYPTED]');
    });

    it('should handle empty string', () => {
      expect(sanitizeApiKey('')).toBe('');
    });

    it('should handle non-string values', () => {
      expect(sanitizeApiKey(null as unknown as string)).toBe(null);
      expect(sanitizeApiKey(undefined as unknown as string)).toBe(undefined);
    });
  });

  describe('isApiKeyLike', () => {
    it('should detect OpenAI API keys', () => {
      expect(isApiKeyLike('sk-xxxx')).toBe(true);
    });

    it('should detect Anthropic API keys', () => {
      expect(isApiKeyLike('sk-ant-xxxx')).toBe(true);
    });

    it('should detect OpenRouter API keys', () => {
      expect(isApiKeyLike('sk-or-xxxx')).toBe(true);
    });

    it('should detect Google API keys', () => {
      expect(isApiKeyLike('aiza1234')).toBe(true);
    });

    it('should detect GitHub PAT keys', () => {
      expect(isApiKeyLike('ghp_xxxx')).toBe(true);
    });

    it('should not detect regular strings', () => {
      expect(isApiKeyLike('hello world')).toBe(false);
    });

    it('should handle empty and non-string values', () => {
      expect(isApiKeyLike('')).toBe(false);
      expect(isApiKeyLike(null as unknown as string)).toBe(false);
    });
  });
});

describe('content sanitizer', () => {
  describe('shouldSanitizeContent', () => {
    it('should identify content fields', () => {
      expect(shouldSanitizeContent('content')).toBe(true);
      expect(shouldSanitizeContent('message')).toBe(true);
      expect(shouldSanitizeContent('text')).toBe(true);
      expect(shouldSanitizeContent('body')).toBe(true);
      expect(shouldSanitizeContent('prompt')).toBe(true);
    });

    it('should not identify non-content fields', () => {
      expect(shouldSanitizeContent('title')).toBe(false);
      expect(shouldSanitizeContent('name')).toBe(false);
      expect(shouldSanitizeContent('description')).toBe(false);
    });
  });

  describe('sanitizeContent', () => {
    it('should replace content with byte size', () => {
      const result = sanitizeContent('Hello World');
      expect(result).toMatch(/\[CONTENT: \d+B\]/);
    });

    it('should calculate correct byte size for ASCII', () => {
      const result = sanitizeContent('Hello');
      expect(result).toBe('[CONTENT: 5B]');
    });

    it('should handle empty string', () => {
      expect(sanitizeContent('')).toBe('');
    });

    it('should handle non-string values', () => {
      expect(sanitizeContent(null as unknown as string)).toBe(null);
      expect(sanitizeContent(undefined as unknown as string)).toBe(undefined);
    });
  });

  describe('sanitizeContentRecursive', () => {
    it('should sanitize nested objects', () => {
      const obj = {
        content: 'Hello World',
        nested: {
          message: 'Nested content',
        },
      };
      const result = sanitizeContentRecursive(obj) as Record<string, unknown>;
      expect(result.content).toMatch(/\[CONTENT: \d+B\]/);
      expect((result.nested as Record<string, unknown>).message).toMatch(/\[CONTENT: \d+B\]/);
    });

    it('should sanitize arrays', () => {
      const arr = [{ content: 'Item 1' }, { content: 'Item 2' }];
      const result = sanitizeContentRecursive(arr) as Array<Record<string, unknown>>;
      expect(result[0].content).toMatch(/\[CONTENT: \d+B\]/);
      expect(result[1].content).toMatch(/\[CONTENT: \d+B\]/);
    });

    it('should preserve non-content fields', () => {
      const obj = {
        content: 'Hello',
        name: 'John',
        count: 42,
      };
      const result = sanitizeContentRecursive(obj) as Record<string, unknown>;
      expect(result.content).toMatch(/\[CONTENT: \d+B\]/);
      expect(result.name).toBe('John');
      expect(result.count).toBe(42);
    });

    it('should handle null and undefined', () => {
      expect(sanitizeContentRecursive(null)).toBe(null);
      expect(sanitizeContentRecursive(undefined)).toBe(undefined);
    });

    it('should handle max depth', () => {
      // Create a deeply nested object that exceeds depth 10
      let deepObj: Record<string, unknown> = { content: 'deepest' };
      for (let i = 0; i < 15; i++) {
        deepObj = { content: `level${i}`, nested: deepObj };
      }
      // Starting at depth 0, after 11 nested levels it should return [MAX_DEPTH]
      const result = sanitizeContentRecursive(deepObj, 11);
      expect(result).toBe('[MAX_DEPTH]');
    });
  });
});

describe('pii sanitizer', () => {
  describe('sanitizeEmail', () => {
    it('should return [EMAIL]', () => {
      expect(sanitizeEmail('test@example.com')).toBe('[EMAIL]');
    });
  });

  describe('sanitizePhone', () => {
    it('should return [PHONE]', () => {
      expect(sanitizePhone('13812345678')).toBe('[PHONE]');
    });
  });

  describe('sanitizePiiInString', () => {
    it('should sanitize emails in string', () => {
      expect(sanitizePiiInString('Contact: test@example.com')).toBe('Contact: [EMAIL]');
    });

    it('should sanitize phone numbers in string', () => {
      expect(sanitizePiiInString('Phone: 13812345678')).toBe('Phone: [PHONE]');
    });

    it('should sanitize multiple PII types', () => {
      const result = sanitizePiiInString('Email: a@b.com, Phone: 13912345678');
      // Note: The email regex replaces "a@b.com," including the comma
      expect(result).toBe('Email: [EMAIL] Phone: [PHONE]');
    });

    it('should handle empty string', () => {
      expect(sanitizePiiInString('')).toBe('');
    });

    it('should handle non-string values', () => {
      expect(sanitizePiiInString(null as unknown as string)).toBe(null);
      expect(sanitizePiiInString(undefined as unknown as string)).toBe(undefined);
    });
  });

  describe('sanitizePath', () => {
    it('should sanitize macOS user paths', () => {
      expect(sanitizePath('/Users/john/Documents/file.txt')).toBe('/Users/.../Documents/file.txt');
    });

    it('should sanitize Linux home paths', () => {
      expect(sanitizePath('/home/user/data/file.log')).toBe('/home/.../data/file.log');
    });

    it('should sanitize Windows user paths', () => {
      expect(sanitizePath('C:\\Users\\john\\Documents\\file.txt')).toBe('C:\\Users\\...\\Documents\\file.txt');
    });

    it('should not modify paths without user info', () => {
      expect(sanitizePath('/var/log/app.log')).toBe('/var/log/app.log');
    });

    it('should handle empty string', () => {
      expect(sanitizePath('')).toBe('');
    });

    it('should handle non-string values', () => {
      expect(sanitizePath(null as unknown as string)).toBe(null);
    });
  });
});

describe('sanitizeObject', () => {
  it('should sanitize all sensitive data types', () => {
    const obj = {
      apiKey: 'sk-1234567890abcd',
      content: 'Hello World',
      email: 'test@example.com',
      name: 'John',
    };
    const result = sanitizeObject(obj) as Record<string, unknown>;
    expect(result.apiKey).toBe('sk-1****abcd');
    expect(result.content).toMatch(/\[CONTENT: \d+B\]/);
    expect(result.email).toBe('[EMAIL]');
    expect(result.name).toBe('John');
  });

  it('should sanitize nested objects', () => {
    const obj = {
      config: {
        token: 'secret-token-12345678',
      },
      data: {
        nested: {
          password: 'mypassword123456789', // 18 chars, > 12 so it will be masked
        },
      },
    };
    const result = sanitizeObject(obj) as Record<string, unknown>;
    const config = result.config as Record<string, unknown>;
    const nested = (result.data as Record<string, unknown>).nested as Record<string, unknown>;
    expect(config.token).toBe('secr****5678');
    expect(nested.password).toBe('mypa****6789');
  });

  it('should sanitize arrays with objects', () => {
    const obj = {
      tokens: [{ token: 'sk-1234567890abcd' }, { token: 'sk-9876543210efgh' }],
    };
    const result = sanitizeObject(obj) as Record<string, unknown>;
    const tokens = result.tokens as Array<Record<string, string>>;
    expect(tokens[0].token).toBe('sk-1****abcd');
    expect(tokens[1].token).toBe('sk-9****efgh');
  });

  it('should handle null and undefined', () => {
    expect(sanitizeObject(null)).toBe(null);
    expect(sanitizeObject(undefined)).toBe(undefined);
  });

  it('should preserve primitive values', () => {
    const obj = {
      count: 42,
      flag: true,
      description: 'normal text', // Use 'description' instead of 'text' to avoid content sanitization
    };
    const result = sanitizeObject(obj) as Record<string, unknown>;
    expect(result.count).toBe(42);
    expect(result.flag).toBe(true);
    expect(result.description).toBe('normal text');
  });
});

describe('sanitizeContext', () => {
  it('should return sanitized context', () => {
    const context = {
      token: 'secret-token-12345678',
      data: 'normal data',
    };
    const result = sanitizeContext(context);
    expect(result.token).toBe('secr****5678');
    expect(result.data).toBe('normal data');
  });

  it('should handle empty context', () => {
    const result = sanitizeContext({});
    expect(result).toEqual({});
  });
});
