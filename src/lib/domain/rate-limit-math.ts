/**
 * Sliding-window estimate from two fixed windows: the current window's count
 * plus the previous window's count weighted by how much of it still overlaps.
 */
export function slidingWindowCount(
  current: number,
  previous: number,
  elapsedInWindowMs: number,
  windowMs: number,
): number {
  const overlap = Math.max(0, 1 - elapsedInWindowMs / windowMs);
  return current + previous * overlap;
}

export function windowStart(now: number, windowMs: number): number {
  return Math.floor(now / windowMs) * windowMs;
}
