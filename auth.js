/**
 * Solana Wallet Authentication Middleware for Molt Wars
 *
 * Authentication flow:
 * 1. Client signs message "molt-of-empires:<timestamp>" with wallet
 * 2. Sends header: X-Solana-Auth: <wallet_pubkey>:<signature>:<timestamp>
 * 3. Server verifies signature and checks $MOLTIUM token balance
 */

import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";
import nacl from "tweetnacl";
import bs58 from "bs58";
import crypto from "crypto";
import { logAdminAccess } from "./securityLogger.js";

// Configuration from environment
const config = {
  rpcUrl: process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
  moltiumMint: process.env.MOLTIUM_MINT_ADDRESS || "",
  minBalance: parseInt(process.env.MOLTIUM_MIN_BALANCE || "0", 10), // 0 = no balance requirement
  cacheTtl: parseInt(process.env.BALANCE_CACHE_TTL || "60", 10) * 1000, // Convert to ms
  authEnabled: process.env.AUTH_ENABLED !== "false",
  skipTokenCheck: process.env.SKIP_TOKEN_CHECK === "true",
  adminSecret: process.env.ADMIN_SECRET || "",
  nodeEnv: process.env.NODE_ENV || "development",
};

// Balance cache: wallet -> { balance, timestamp }
const balanceCache = new Map();

// Solana connection (lazy-initialized)
let connection = null;

function getConnection() {
  if (!connection) {
    connection = new Connection(config.rpcUrl, "confirmed");
  }
  return connection;
}

/**
 * Check if a string is a valid Solana public key
 */
function isValidPublicKey(str) {
  try {
    new PublicKey(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Verify Ed25519 signature using tweetnacl
 */
function verifySignature(message, signature, publicKey) {
  try {
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = bs58.decode(publicKey);
    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  } catch (err) {
    console.error("Signature verification error:", err.message);
    return false;
  }
}

/**
 * Get $MOLTIUM token balance for a wallet
 * Uses caching to reduce RPC calls
 */
async function getMoltiumBalance(walletAddress) {
  // Check cache first
  const cached = balanceCache.get(walletAddress);
  if (cached && Date.now() - cached.timestamp < config.cacheTtl) {
    return cached.balance;
  }

  // Skip actual balance check if no mint configured or skipTokenCheck is true
  if (config.skipTokenCheck || !config.moltiumMint) {
    const balance = config.minBalance + 1; // Return balance above threshold
    balanceCache.set(walletAddress, { balance, timestamp: Date.now() });
    return balance;
  }

  try {
    const conn = getConnection();
    const walletPubkey = new PublicKey(walletAddress);
    const mintPubkey = new PublicKey(config.moltiumMint);

    // Get the associated token account
    const tokenAccount = await getAssociatedTokenAddress(mintPubkey, walletPubkey);

    try {
      const account = await getAccount(conn, tokenAccount);
      // SPL tokens have decimals, assume 6 decimals (common for SPL tokens)
      // Adjust divisor based on actual token decimals when deployed
      const balance = Number(account.amount) / 1_000_000;
      balanceCache.set(walletAddress, { balance, timestamp: Date.now() });
      return balance;
    } catch (err) {
      // Account doesn't exist = 0 balance
      if (err.name === "TokenAccountNotFoundError") {
        balanceCache.set(walletAddress, { balance: 0, timestamp: Date.now() });
        return 0;
      }
      throw err;
    }
  } catch (err) {
    console.error("Balance check error:", err.message);
    // On error, check cache even if stale
    if (cached) {
      return cached.balance;
    }
    throw err;
  }
}

/**
 * Parse the X-Solana-Auth header
 * Format: <wallet_pubkey>:<signature>:<timestamp>
 */
function parseAuthHeader(header) {
  if (!header) return null;

  const parts = header.split(":");
  if (parts.length !== 3) return null;

  const [wallet, signature, timestampStr] = parts;
  const timestamp = parseInt(timestampStr, 10);

  if (!wallet || !signature || isNaN(timestamp)) return null;

  return { wallet, signature, timestamp };
}

/**
 * Main authentication middleware
 * Validates wallet signature and $MOLTIUM balance
 * Sets req.walletAddress on success
 */
export async function requireAuth(req, res, next) {
  // Skip auth if disabled
  if (!config.authEnabled) {
    return next();
  }

  const authHeader = req.headers["x-solana-auth"];

  if (!authHeader) {
    return res.status(401).json({
      error: "Authentication required",
      message: "Missing X-Solana-Auth header",
      format: "X-Solana-Auth: <wallet_pubkey>:<signature>:<timestamp>",
    });
  }

  const auth = parseAuthHeader(authHeader);
  if (!auth) {
    return res.status(401).json({
      error: "Invalid auth header format",
      format: "X-Solana-Auth: <wallet_pubkey>:<signature>:<timestamp>",
    });
  }

  const { wallet, signature, timestamp } = auth;

  // Validate wallet is a valid public key
  if (!isValidPublicKey(wallet)) {
    return res.status(401).json({
      error: "Invalid wallet address",
      wallet,
    });
  }

  // Check timestamp is within 24 hours (session-based auth)
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  if (Math.abs(now - timestamp) > maxAge) {
    return res.status(401).json({
      error: "Timestamp expired or invalid",
      message: "Timestamp must be within 24 hours of server time - please reconnect wallet",
      serverTime: now,
      providedTime: timestamp,
    });
  }

  // Verify signature
  const message = `molt-of-empires:${timestamp}`;
  if (!verifySignature(message, signature, wallet)) {
    return res.status(401).json({
      error: "Invalid signature",
      message: "Signature verification failed",
    });
  }

  // Check $MOLTIUM balance (only if minBalance > 0)
  if (config.minBalance > 0) {
    try {
      const balance = await getMoltiumBalance(wallet);
      if (balance < config.minBalance) {
        return res.status(403).json({
          error: "Insufficient $MOLTIUM balance",
          required: config.minBalance,
          current: balance,
          message: `You need at least ${config.minBalance} $MOLTIUM to interact with the game`,
        });
      }
    } catch (err) {
      console.error("Balance check failed:", err.message);
      return res.status(500).json({
        error: "Balance check failed",
        message: "Could not verify $MOLTIUM balance. Please try again.",
      });
    }
  }

  // Auth successful - set wallet address and validate/override agentId in body
  req.walletAddress = wallet;

  // Validate and override agentId in request body with wallet address
  // This ensures the wallet IS the identity
  if (req.body && typeof req.body === "object") {
    // If agentId was provided and doesn't match wallet, reject the request
    if (req.body.agentId && req.body.agentId !== wallet) {
      return res.status(400).json({
        error: "agentId mismatch",
        message: "The agentId in request body must match your authenticated wallet address, or be omitted",
        authenticated: wallet,
        provided: req.body.agentId
      });
    }
    req.body.agentId = wallet;
  }

  next();
}

/**
 * Constant-time string comparison to prevent timing attacks
 * Pads both buffers to the same length to prevent length-based timing leaks
 */
function secureCompare(a, b) {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  const maxLen = Math.max(bufA.length, bufB.length);
  const paddedA = Buffer.alloc(maxLen);
  const paddedB = Buffer.alloc(maxLen);
  bufA.copy(paddedA);
  bufB.copy(paddedB);
  const lengthMatch = bufA.length === bufB.length;
  const contentsMatch = crypto.timingSafeEqual(paddedA, paddedB);
  return lengthMatch && contentsMatch;
}

/**
 * Admin-only middleware
 * Requires X-Admin-Secret header matching ADMIN_SECRET env var
 * Uses constant-time comparison to prevent timing attacks
 */
export function requireAdmin(req, res, next) {
  const ip = req.ip || req.connection?.remoteAddress || "unknown";
  const endpoint = req.originalUrl || req.url;

  // CRITICAL: Always require admin secret to be configured
  if (!config.adminSecret) {
    logAdminAccess(false, endpoint, ip);
    return res.status(403).json({
      error: "Admin endpoints disabled",
      message: "ADMIN_SECRET not configured",
    });
  }

  const providedSecret = req.headers["x-admin-secret"];
  if (!providedSecret) {
    logAdminAccess(false, endpoint, ip);
    return res.status(401).json({ error: "Admin authentication required" });
  }
  if (!secureCompare(providedSecret, config.adminSecret)) {
    logAdminAccess(false, endpoint, ip);
    return res.status(403).json({ error: "Invalid admin credentials" });
  }

  logAdminAccess(true, endpoint, ip);
  next();
}

/**
 * Get or create agent helper for auto-registration
 * Called after authentication to ensure wallet has an agent
 */
export function getOrCreateAgent(gameState, walletAddress, displayName) {
  if (gameState.agents.has(walletAddress)) {
    return { agent: gameState.agents.get(walletAddress), created: false };
  }
  // Will be registered via the normal registerAgent flow
  return { agent: null, created: false };
}

/**
 * Export config for use in server.js
 */
export { config as authConfig };

/**
 * Export helper functions for wsAuth.js
 */
export { parseAuthHeader, verifySignature, isValidPublicKey, getMoltiumBalance };
