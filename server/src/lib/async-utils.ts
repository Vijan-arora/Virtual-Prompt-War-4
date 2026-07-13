/** A simple promise-based delay helper. */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Retries an async function up to a specified number of times with an optional delay. */
export async function retryWithDelay<T>(
  fn: () => Promise<T>,
  retries = 1,
  delayMs = 0,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    if (delayMs > 0) {
      await delay(delayMs);
    }
    return retryWithDelay(fn, retries - 1, delayMs);
  }
}

/** Rejects if the promise doesn't resolve within timeoutMs. */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operation timed out',
): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });
}
