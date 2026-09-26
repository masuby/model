/** Run async work over many items with bounded concurrency, collecting per-item outcomes in order. */

export type BatchOutcome<T, R> = { ok: true; item: T; value: R } | { ok: false; item: T; error: unknown };

export async function runInBatches<T, R>(
  items: readonly T[],
  worker: (item: T, index: number) => Promise<R>,
  { concurrency = 4, onProgress, signal }: { concurrency?: number; onProgress?: (done: number, total: number) => void; signal?: { aborted: boolean } } = {},
): Promise<Array<BatchOutcome<T, R>>> {
  const results = new Array<BatchOutcome<T, R>>(items.length);
  let next = 0;
  let done = 0;
  const total = items.length;
  const lane = async () => {
    while (next < total) {
      const i = next++;
      const item = items[i];
      if (signal?.aborted) {
        results[i] = { ok: false, item, error: new Error('aborted') };
      } else {
        try {
          results[i] = { ok: true, item, value: await worker(item, i) };
        } catch (error) {
          results[i] = { ok: false, item, error };
        }
      }
      done++;
      onProgress?.(done, total);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(concurrency, total)) }, lane));
  return results;
}

/** Human error text from anything thrown. */
export const errorMessage = (e: unknown): string => (e instanceof Error ? e.message : typeof e === 'string' ? e : 'Unknown error');
