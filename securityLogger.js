/**
 * Security Event Logger for Molt Wars
 *
 * Provides structured logging for security-related events
 * including authentication, authorization, and rate limiting.
 */

// Security event types
export const SecurityEventType = {
  AUTH_SUCCESS: 'AUTH_SUCCESS',
  AUTH_FAILURE: 'AUTH_FAILURE',
  ADMIN_ACCESS: 'ADMIN_ACCESS',
  ADMIN_AUTH_FAILED: 'ADMIN_AUTH_FAILED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  WS_AUTH_SUCCESS: 'WS_AUTH_SUCCESS',
  WS_AUTH_FAILURE: 'WS_AUTH_FAILURE',
  WS_RATE_LIMIT: 'WS_RATE_LIMIT',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
};

/**
 * Format a security event for logging
 */
function formatEvent(eventType, details) {
  return {
    timestamp: new Date().toISOString(),
    event: eventType,
    ...details,
  };
}

/**
 * Log a security event to console (structured JSON)
 * In production, this could be extended to send to external logging services
 */
export function logSecurityEvent(eventType, details = {}) {
  const event = formatEvent(eventType, details);

  // Use appropriate log level based on event type
  switch (eventType) {
    case SecurityEventType.AUTH_FAILURE:
    case SecurityEventType.ADMIN_AUTH_FAILED:
    case SecurityEventType.SUSPICIOUS_ACTIVITY:
      console.warn('[SECURITY]', JSON.stringify(event));
      break;
    case SecurityEventType.RATE_LIMIT_EXCEEDED:
    case SecurityEventType.WS_RATE_LIMIT:
      console.log('[SECURITY]', JSON.stringify(event));
      break;
    default:
      // AUTH_SUCCESS, ADMIN_ACCESS, WS_AUTH_SUCCESS - only log in debug mode
      if (process.env.DEBUG_SECURITY === 'true') {
        console.log('[SECURITY]', JSON.stringify(event));
      }
  }
}

/**
 * Log authentication success
 */
export function logAuthSuccess(wallet, endpoint) {
  logSecurityEvent(SecurityEventType.AUTH_SUCCESS, {
    wallet: wallet?.slice(0, 8) + '...',
    endpoint,
  });
}

/**
 * Log authentication failure
 */
export function logAuthFailure(reason, wallet, endpoint, ip) {
  logSecurityEvent(SecurityEventType.AUTH_FAILURE, {
    reason,
    wallet: wallet?.slice(0, 8) + '...' || 'unknown',
    endpoint,
    ip: ip || 'unknown',
  });
}

/**
 * Log admin access attempt
 */
export function logAdminAccess(success, endpoint, ip) {
  logSecurityEvent(
    success ? SecurityEventType.ADMIN_ACCESS : SecurityEventType.ADMIN_AUTH_FAILED,
    {
      endpoint,
      ip: ip || 'unknown',
    }
  );
}

/**
 * Log rate limit exceeded
 */
export function logRateLimitExceeded(wallet, endpoint, limitType) {
  logSecurityEvent(SecurityEventType.RATE_LIMIT_EXCEEDED, {
    wallet: wallet?.slice(0, 8) + '...',
    endpoint,
    limitType,
  });
}

/**
 * Log WebSocket authentication
 */
export function logWSAuth(success, wallet, reason = null) {
  logSecurityEvent(
    success ? SecurityEventType.WS_AUTH_SUCCESS : SecurityEventType.WS_AUTH_FAILURE,
    {
      wallet: wallet?.slice(0, 8) + '...' || 'unknown',
      ...(reason && { reason }),
    }
  );
}

/**
 * Log WebSocket rate limit
 */
export function logWSRateLimit(wallet) {
  logSecurityEvent(SecurityEventType.WS_RATE_LIMIT, {
    wallet: wallet?.slice(0, 8) + '...',
  });
}

/**
 * Log suspicious activity
 */
export function logSuspiciousActivity(type, details) {
  logSecurityEvent(SecurityEventType.SUSPICIOUS_ACTIVITY, {
    type,
    ...details,
  });
}
