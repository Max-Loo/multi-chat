import { test, expect } from 'vitest';
import 'fake-indexeddb/auto';

test('fake-indexeddb works', async () => {
  const request = indexedDB.open('test', 1);
  
  await new Promise<void>((resolve, reject) => {
    request.addEventListener('success', () => resolve());
    request.addEventListener('error', () => reject(request.error));
  });
  
  expect(true).toBe(true);
});
