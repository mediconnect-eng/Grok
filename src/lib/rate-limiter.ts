/**
 * Rate Limiting Middleware
 * 
 * Prevents brute force attacks and API abuse by limiting request rates.
 * Uses in-memory storage for development. For production with multiple
 * servers, use Redis or similar distributed cache.
 */

import { NextRequest, NextResponse } from 'next/server';
import { logWarning } from './logger';

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blockedUntil?: number;
}

interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Optional: Block duration in seconds after exceeding limit */
  blockDurationSeconds?: number;
  /** Optional: Custom identifier (default: IP address) */
  identifier?: (request: NextRequest) => string;
  /** Optional: Custom error message */
  message?: string;
}

// In-memory store for rate limiting
// In production, replace with Redis or similar distributed cache
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Clean up expired entries periodically
 */
setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  rateLimitStore.forEach((entry, key) => {
    if (entry.resetTime < now && (!entry.blockedUntil || entry.blockedUntil < now)) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => rateLimitStore.delete(key));
}, 60000); // Clean up every minute

/**
 * Get client identifier (IP address or custom identifier)
 */
function getIdentifier(request: NextRequest, customIdentifier?: (req: NextRequest) => string): string {
  if (customIdentifier) {
    return customIdentifier(request);
  }

  // Try to get real IP from various headers (reverse proxy support)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to connection IP (may not be available in all environments)
  return request.ip || 'unknown';
}

/**
 * Check if request should be rate limited
 * 
 * @param request - Next.js request object
 * @param config - Rate limit configuration
 * @returns Object with success status and optional error response
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): {
  success: boolean;
  response?: NextResponse;
  remaining?: number;
} {
  const identifier = getIdentifier(request, config.identifier);
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  
  let entry = rateLimitStore.get(identifier);

  // Initialize entry if doesn't exist
  if (!entry) {
    entry = {
      count: 0,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(identifier, entry);
  }

  // Check if currently blocked
  if (entry.blockedUntil && entry.blockedUntil > now) {
    const remainingBlockSeconds = Math.ceil((entry.blockedUntil - now) / 1000);
    
    logWarning('Rate limit block active', {
      identifier,
      remainingSeconds: remainingBlockSeconds,
    });

    return {
      success: false,
      response: NextResponse.json(
        {
          error: config.message || 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: remainingBlockSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': remainingBlockSeconds.toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(entry.blockedUntil).toISOString(),
          },
        }
      ),
    };
  }

  // Reset window if expired
  if (entry.resetTime < now) {
    entry.count = 0;
    entry.resetTime = now + windowMs;
    entry.blockedUntil = undefined;
  }

  // Increment counter
  entry.count += 1;

  // Check if limit exceeded
  if (entry.count > config.maxRequests) {
    // Apply block if configured
    if (config.blockDurationSeconds) {
      entry.blockedUntil = now + (config.blockDurationSeconds * 1000);
    }

    const resetSeconds = Math.ceil((entry.resetTime - now) / 1000);
    
    logWarning('Rate limit exceeded', {
      identifier,
      count: entry.count,
      limit: config.maxRequests,
      resetSeconds,
    });

    return {
      success: false,
      response: NextResponse.json(
        {
          error: config.message || 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: resetSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': resetSeconds.toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(entry.resetTime).toISOString(),
          },
        }
      ),
    };
  }

  // Request allowed
  const remaining = config.maxRequests - entry.count;
  
  return {
    success: true,
    remaining,
  };
}

/**
 * Preset rate limit configurations for common use cases
 */
export const RateLimitPresets = {
  /** Strict rate limit for authentication endpoints */
  AUTH: {
    maxRequests: 5,
    windowSeconds: 300, // 5 minutes
    blockDurationSeconds: 900, // 15 minutes block after exceeding
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  } as RateLimitConfig,

  /** Moderate rate limit for API endpoints */
  API: {
    maxRequests: 100,
    windowSeconds: 60, // 1 minute
    message: 'Too many requests. Please slow down.',
  } as RateLimitConfig,

  /** Strict rate limit for sensitive operations */
  SENSITIVE: {
    maxRequests: 10,
    windowSeconds: 60, // 1 minute
    blockDurationSeconds: 300, // 5 minutes block
    message: 'Too many requests to sensitive endpoint. Please try again later.',
  } as RateLimitConfig,

  /** Lenient rate limit for public endpoints */
  PUBLIC: {
    maxRequests: 300,
    windowSeconds: 60, // 1 minute
    message: 'Too many requests. Please try again shortly.',
  } as RateLimitConfig,

  /** Very strict for password reset / email operations */
  EMAIL: {
    maxRequests: 3,
    windowSeconds: 3600, // 1 hour
    blockDurationSeconds: 3600, // 1 hour block
    message: 'Too many email requests. Please try again in 1 hour.',
  } as RateLimitConfig,
};

/**
 * Higher-order function to wrap API route with rate limiting
 * 
 * Usage:
 * ```typescript
 * export const POST = withRateLimit(
 *   async (request) => {
 *     // Your route handler
 *   },
 *   RateLimitPresets.AUTH
 * );
 * ```
 */
export function withRateLimit(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  config: RateLimitConfig
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const rateLimitResult = checkRateLimit(request, config);
    
    if (!rateLimitResult.success) {
      return rateLimitResult.response!;
    }

    // Add rate limit headers to successful response
    const response = await handler(request, ...args);
    
    if (rateLimitResult.remaining !== undefined) {
      response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    }

    return response;
  };
}

/**
 * Clear rate limit for a specific identifier (useful for testing or admin override)
 */
export function clearRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Get current rate limit status for an identifier
 */
export function getRateLimitStatus(identifier: string): {
  exists: boolean;
  count?: number;
  remaining?: number;
  resetTime?: Date;
  blockedUntil?: Date;
} {
  const entry = rateLimitStore.get(identifier);
  
  if (!entry) {
    return { exists: false };
  }

  return {
    exists: true,
    count: entry.count,
    resetTime: new Date(entry.resetTime),
    blockedUntil: entry.blockedUntil ? new Date(entry.blockedUntil) : undefined,
  };
}
