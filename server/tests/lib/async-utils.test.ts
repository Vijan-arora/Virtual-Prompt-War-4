import { describe, expect, it, vi } from 'vitest';
import { delay, retryWithDelay, withTimeout } from '../../src/lib/async-utils.js';

describe('async-utils', () => {
  describe('delay', () => {
    it('should wait for at least the specified time', async () => {
      const start = Date.now();
      await delay(50);
      const diff = Date.now() - start;
      expect(diff).toBeGreaterThanOrEqual(40);
    });

    it('should resolve instantly if delay is 0 or negative', async () => {
      const start = Date.now();
      await delay(0);
      await delay(-10);
      const diff = Date.now() - start;
      expect(diff).toBeLessThan(10);
    });
  });

  describe('retryWithDelay', () => {
    it('should resolve immediately if the function succeeds', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await retryWithDelay(fn, 3, 5);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry if the function fails and eventually succeed', async () => {
      let calls = 0;
      const fn = vi.fn().mockImplementation(() => {
        calls++;
        if (calls < 3) {
          return Promise.reject(new Error('fail'));
        }
        return Promise.resolve('success');
      });

      const result = await retryWithDelay(fn, 3, 5);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should work without delay if delayMs is 0 or negative', async () => {
      let calls = 0;
      const fn = vi.fn().mockImplementation(() => {
        calls++;
        if (calls < 2) {
          return Promise.reject(new Error('fail fast'));
        }
        return Promise.resolve('success fast');
      });

      const result = await retryWithDelay(fn, 2, 0);
      expect(result).toBe('success fast');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should throw the error if all retries fail', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('always fail'));
      await expect(retryWithDelay(fn, 2, 5)).rejects.toThrow('always fail');
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('withTimeout', () => {
    it('should resolve if the promise completes in time', async () => {
      const p = (async () => {
        await delay(5);
        return 'done';
      })();
      const result = await withTimeout(p, 50);
      expect(result).toBe('done');
    });

    it('should throw default message if no custom error message is provided', async () => {
      const p = new Promise((_, reject) => {
        setTimeout(reject, 100);
      });
      await expect(withTimeout(p, 5)).rejects.toThrow('Operation timed out');
    });

    it('should reject if the promise times out with custom message', async () => {
      const p = (async () => {
        await delay(100);
        return 'done';
      })();
      await expect(withTimeout(p, 10, 'timed out!')).rejects.toThrow('timed out!');
    });

    it('should clear timeout when the promise resolves immediately', async () => {
      const spyClear = vi.spyOn(global, 'clearTimeout');
      const p = Promise.resolve('instant');
      const result = await withTimeout(p, 1000);
      expect(result).toBe('instant');
      expect(spyClear).toHaveBeenCalled();
      spyClear.mockRestore();
    });
  });
});
