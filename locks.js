/**
 * Async Planet Locking Utility for Molt Wars
 *
 * Provides async-aware locking for planet operations to prevent race conditions.
 * Uses a simple Map-based lock with timeout and spin-wait mechanism.
 */

const planetLocks = new Map();

/**
 * Execute a function while holding an exclusive lock on a planet.
 * If the lock is already held, waits up to timeoutMs milliseconds for it to be released.
 *
 * @param {string} planetId - The planet ID to lock
 * @param {Function} fn - Async function to execute while holding the lock
 * @param {number} timeoutMs - Maximum time to wait for lock acquisition (default: 5000ms)
 * @returns {Promise<*>} - The result of fn()
 * @throws {Error} - If lock cannot be acquired within timeout
 */
export async function withPlanetLockAsync(planetId, fn, timeoutMs = 5000) {
  const startTime = Date.now();

  // Spin-wait for lock to become available
  while (planetLocks.has(planetId)) {
    if (Date.now() - startTime > timeoutMs) {
      throw new Error('Planet operation timeout - please retry');
    }
    // Wait 50ms before checking again
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // Acquire lock
  planetLocks.set(planetId, true);

  try {
    return await fn();
  } finally {
    // Always release lock
    planetLocks.delete(planetId);
  }
}

/**
 * Check if a planet is currently locked
 * @param {string} planetId - The planet ID to check
 * @returns {boolean} - true if locked
 */
export function isPlanetLocked(planetId) {
  return planetLocks.has(planetId);
}

/**
 * Get the number of currently held locks (for monitoring)
 * @returns {number}
 */
export function getActiveLockCount() {
  return planetLocks.size;
}
