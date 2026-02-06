/**
 * WebSocket Authentication and Rate Limiting for Molt Wars
 *
 * Provides authentication and rate limiting for WebSocket connections,
 * particularly for the chat feature.
 */

import escapeHtml from 'escape-html';
import { parseAuthHeader, verifySignature, isValidPublicKey } from './auth.js';
import { logWSAuth, logWSRateLimit } from './securityLogger.js';

// Configuration
const config = {
  chatAuthRequired: process.env.WS_CHAT_AUTH_REQUIRED === 'true',
  chatRateLimit: {
    maxMessages: 5,      // Max messages per window
    windowMs: 10000,     // 10 second window
  },
  chatMaxLength: 500,
  senderMaxLength: 32,
  authMaxAge: 5 * 60 * 1000, // 5 minutes
};

/**
 * Client connection state
 */
export class WSClientInfo {
  constructor() {
    this.authenticated = false;
    this.wallet = null;
    this.chatHistory = [];  // Timestamps of recent messages
  }

  /**
   * Check if client can send a chat message (rate limiting)
   */
  canSendChat() {
    const now = Date.now();
    // Remove old messages outside the window
    this.chatHistory = this.chatHistory.filter(
      ts => now - ts < config.chatRateLimit.windowMs
    );

    if (this.chatHistory.length >= config.chatRateLimit.maxMessages) {
      return false;
    }

    this.chatHistory.push(now);
    return true;
  }

  /**
   * Set authenticated state
   */
  setAuthenticated(wallet) {
    this.authenticated = true;
    this.wallet = wallet;
  }

  /**
   * Clear chat history (for cleanup)
   */
  clearChatHistory() {
    this.chatHistory = [];
  }
}

/**
 * Authenticate a WebSocket connection
 * Auth format: <wallet>:<signature>:<timestamp>
 *
 * @param {string} authString - The auth string from the client
 * @returns {{ success: boolean, wallet?: string, error?: string }}
 */
export function authenticateWS(authString) {
  if (!authString || typeof authString !== 'string') {
    return { success: false, error: 'Missing auth string' };
  }

  const auth = parseAuthHeader(authString);
  if (!auth) {
    return { success: false, error: 'Invalid auth format' };
  }

  const { wallet, signature, timestamp } = auth;

  // Validate wallet is a valid public key
  if (!isValidPublicKey(wallet)) {
    logWSAuth(false, wallet, 'invalid_wallet');
    return { success: false, error: 'Invalid wallet address' };
  }

  // Check timestamp is within allowed window (replay protection)
  const now = Date.now();
  if (Math.abs(now - timestamp) > config.authMaxAge) {
    logWSAuth(false, wallet, 'expired_timestamp');
    return { success: false, error: 'Timestamp expired' };
  }

  // Verify signature
  const message = `molt-of-empires:${timestamp}`;
  if (!verifySignature(message, signature, wallet)) {
    logWSAuth(false, wallet, 'invalid_signature');
    return { success: false, error: 'Invalid signature' };
  }

  logWSAuth(true, wallet);
  return { success: true, wallet };
}

/**
 * Sanitize a chat message
 * Returns null if the message is invalid
 *
 * @param {string} sender - The sender name/address
 * @param {string} text - The message text
 * @returns {{ sender: string, text: string } | null}
 */
export function sanitizeChatMessage(sender, text) {
  // Validate inputs
  if (typeof text !== 'string' || text.trim().length === 0) {
    return null;
  }

  const sanitizedSender = escapeHtml(
    String(sender || 'Anonymous').slice(0, config.senderMaxLength)
  );
  const sanitizedText = escapeHtml(
    String(text).slice(0, config.chatMaxLength)
  );

  return {
    sender: sanitizedSender,
    text: sanitizedText,
  };
}

/**
 * Check if chat authentication is required
 */
export function isChatAuthRequired() {
  return config.chatAuthRequired;
}

/**
 * Log a WebSocket rate limit event
 */
export function logChatRateLimit(wallet) {
  logWSRateLimit(wallet);
}

/**
 * Export config for testing/debugging
 */
export { config as wsAuthConfig };
