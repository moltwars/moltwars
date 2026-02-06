/**
 * Rate Limiting Middleware for Molt Wars
 *
 * Token bucket algorithm for per-agent rate limiting.
 * Separate buckets for read (GET) and write (POST/PUT/DELETE) operations.
 */

// Configuration from environment with defaults
// Default: 10 read/sec, 5 write/sec, no burst allowance
const config = {
  enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
  read: {
    rate: parseInt(process.env.RATE_LIMIT_READ || '10', 10),
    burst: null, // Calculated below
  },
  write: {
    rate: parseInt(process.env.RATE_LIMIT_WRITE || '5', 10),
    burst: null, // Calculated below
  },
  burstFactor: parseFloat(process.env.RATE_LIMIT_BURST_FACTOR || '1.0'),
};

// Calculate burst limits (with burstFactor=1.0, burst equals rate - no extra allowance)
config.read.burst = Math.max(1, Math.floor(config.read.rate * config.burstFactor));
config.write.burst = Math.max(1, Math.floor(config.write.rate * config.burstFactor));

/**
 * Token Bucket implementation
 * Allows bursts up to maxTokens while enforcing average rate
 */
class TokenBucket {
  constructor(refillRate, maxTokens) {
    this.refillRate = refillRate;     // Tokens per second
    this.maxTokens = maxTokens;       // Maximum tokens (burst capacity)
    this.tokens = maxTokens;          // Start full
    this.lastRefill = Date.now();
  }

  /**
   * Refill tokens based on elapsed time
   */
  refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // Convert to seconds
    const tokensToAdd = elapsed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  /**
   * Try to consume one token
   * @returns {boolean} true if token was consumed, false if bucket empty
   */
  tryConsume() {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }

  /**
   * Get time until next token is available (in seconds)
   */
  getRetryAfter() {
    if (this.tokens >= 1) return 0;
    return (1 - this.tokens) / this.refillRate;
  }

  /**
   * Get current state for rate limit headers
   */
  getState() {
    this.refill();
    return {
      remaining: Math.floor(this.tokens),
      resetTime: Date.now() + Math.ceil((this.maxTokens - this.tokens) / this.refillRate * 1000),
    };
  }
}

/**
 * Per-agent bucket storage
 * Map<walletAddress, { read: TokenBucket, write: TokenBucket }>
 */
const agentBuckets = new Map();

/**
 * Maximum number of buckets to prevent memory exhaustion
 */
const MAX_BUCKETS = 10000;

/**
 * Get or create buckets for an agent
 * Proactively cleans up old buckets when approaching limit
 */
function getBuckets(walletAddress) {
  // Proactive cleanup when approaching limit
  if (agentBuckets.size >= MAX_BUCKETS * 0.9) {
    cleanupOldBuckets(300000); // Clean buckets older than 5 minutes
  }

  if (!agentBuckets.has(walletAddress)) {
    // If still at limit after cleanup, remove oldest entry
    if (agentBuckets.size >= MAX_BUCKETS) {
      const oldestKey = agentBuckets.keys().next().value;
      agentBuckets.delete(oldestKey);
    }
    agentBuckets.set(walletAddress, {
      read: new TokenBucket(config.read.rate, config.read.burst),
      write: new TokenBucket(config.write.rate, config.write.burst),
    });
  }
  return agentBuckets.get(walletAddress);
}

/**
 * Determine bucket type based on HTTP method
 */
function getBucketType(method) {
  return method === 'GET' || method === 'HEAD' ? 'read' : 'write';
}

/**
 * Rate limiting middleware
 * Uses wallet address for authenticated requests, IP address for unauthenticated
 */
export function rateLimitMiddleware(req, res, next) {
  // Skip if rate limiting is disabled
  if (!config.enabled) {
    return next();
  }

  // Use wallet address if authenticated, otherwise use IP
  const walletAddress = req.walletAddress;
  const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';
  const rateLimitKey = walletAddress || `ip:${clientIp}`;

  const bucketType = getBucketType(req.method);
  const buckets = getBuckets(rateLimitKey);
  const bucket = buckets[bucketType];
  const bucketConfig = config[bucketType];

  // Try to consume a token
  if (bucket.tryConsume()) {
    // Success - add rate limit headers
    const state = bucket.getState();
    res.set({
      'X-RateLimit-Limit': bucketConfig.rate,
      'X-RateLimit-Remaining': state.remaining,
      'X-RateLimit-Reset': Math.ceil(state.resetTime / 1000), // Unix timestamp
    });
    return next();
  }

  // Rate limit exceeded
  const retryAfter = bucket.getRetryAfter();

  res.set({
    'X-RateLimit-Limit': bucketConfig.rate,
    'X-RateLimit-Remaining': 0,
    'X-RateLimit-Reset': Math.ceil((Date.now() + retryAfter * 1000) / 1000),
    'Retry-After': Math.ceil(retryAfter),
  });

  return res.status(429).json({
    error: 'Rate limit exceeded',
    type: bucketType,
    limit: bucketConfig.rate,
    retryAfter: parseFloat(retryAfter.toFixed(2)),
    message: 'Too many requests. Please slow down.',
  });
}

/**
 * Cleanup old buckets (call periodically to prevent memory leaks)
 * Removes buckets that haven't been used in the specified time
 */
export function cleanupOldBuckets(maxAgeMs = 3600000) { // Default: 1 hour
  const now = Date.now();
  for (const [wallet, buckets] of agentBuckets) {
    // Check if both buckets are old
    const readAge = now - buckets.read.lastRefill;
    const writeAge = now - buckets.write.lastRefill;
    if (readAge > maxAgeMs && writeAge > maxAgeMs) {
      agentBuckets.delete(wallet);
    }
  }
}

/**
 * Get current rate limit config (for debugging/monitoring)
 */
export function getRateLimitConfig() {
  return {
    enabled: config.enabled,
    read: { rate: config.read.rate, burst: config.read.burst },
    write: { rate: config.write.rate, burst: config.write.burst },
  };
}

export { config as rateLimitConfig };
