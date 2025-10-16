import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIdentifier, RateLimits } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const authHandlers = toNextJsHandler(auth);

/**
 * Wrap auth handlers with rate limiting
 */
function withRateLimit(handler: Function) {
  return async (req: NextRequest) => {
    const startTime = Date.now();
    const identifier = getClientIdentifier(req);
    const pathname = req.nextUrl.pathname;
    
    // Skip rate limiting for OAuth callbacks
    const isOAuthCallback = pathname.includes('/callback/');
    
    if (!isOAuthCallback) {
      // Apply rate limiting to auth endpoints
      const rateLimitResult = checkRateLimit(identifier, RateLimits.AUTH);

      if (!rateLimitResult.allowed) {
        const resetDate = new Date(rateLimitResult.resetTime);
        
        logger.warn('Rate limit exceeded', {
          identifier,
          path: pathname,
          method: req.method,
        });
        
        return NextResponse.json(
          {
            error: 'Too many attempts. Please try again later.',
            resetTime: resetDate.toISOString(),
          },
          {
            status: 429,
            headers: {
              'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
              'X-RateLimit-Limit': RateLimits.AUTH.maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            },
          }
        );
      }
    }

    // Execute handler and add rate limit headers
    try {
      logger.info('Auth request', {
        path: pathname,
        method: req.method,
        isCallback: isOAuthCallback,
      });
      
      const response = await handler(req);
      
      if (response instanceof NextResponse && !isOAuthCallback) {
        const rateLimitResult = checkRateLimit(identifier, RateLimits.AUTH);
        response.headers.set('X-RateLimit-Limit', RateLimits.AUTH.maxRequests.toString());
        response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
        response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
      }

      // Log successful auth requests
      const duration = Date.now() - startTime;
      logger.request(req.method, pathname, response?.status || 200, duration);

      return response;
    } catch (error) {
      logger.error('Auth handler error', error, {
        path: pathname,
        method: req.method,
        isCallback: isOAuthCallback,
      });
      throw error;
    }
  };
}

export const GET = withRateLimit(authHandlers.GET);
export const POST = withRateLimit(authHandlers.POST);

