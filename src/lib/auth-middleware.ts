/**
 * Authentication and Authorization Middleware for API Routes
 * 
 * Provides centralized authentication verification and authorization checks
 * to secure all API endpoints against unauthorized access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from './auth';
import { logError, logWarning } from './logger';

/**
 * User session type extracted from better-auth
 */
export interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string;
    role?: string;
    emailVerified?: boolean;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
  };
}

/**
 * Configuration for authentication requirements
 */
export interface AuthConfig {
  /** Require user to be authenticated */
  requireAuth: boolean;
  /** Require specific roles (empty = any authenticated user) */
  requiredRoles?: string[];
  /** Require email verification */
  requireEmailVerification?: boolean;
  /** Optional custom authorization check */
  customAuthCheck?: (session: AuthSession, request: NextRequest) => Promise<boolean | string>;
}

/**
 * Result of authentication check
 */
export interface AuthResult {
  success: boolean;
  session?: AuthSession;
  error?: string;
  statusCode?: number;
}

/**
 * Authenticate a request and return session data
 * 
 * @param request - Next.js request object
 * @returns Authentication result with session data or error
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  try {
    // Get session from better-auth
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return {
        success: false,
        error: 'Authentication required. Please log in.',
        statusCode: 401,
      };
    }

    return {
      success: true,
      session: session as AuthSession,
    };
  } catch (error) {
    logError('Authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed',
      statusCode: 401,
    };
  }
}

/**
 * Verify user has required role
 * 
 * @param session - User session
 * @param requiredRoles - Array of acceptable roles
 * @returns True if user has required role
 */
export function verifyRole(session: AuthSession, requiredRoles: string[]): boolean {
  if (!requiredRoles || requiredRoles.length === 0) {
    return true; // No specific role required
  }

  const userRole = session.user.role;
  if (!userRole) {
    return false;
  }

  return requiredRoles.includes(userRole);
}

/**
 * Verify user owns the resource
 * 
 * @param session - User session
 * @param resourceUserId - User ID that owns the resource
 * @returns True if user owns the resource
 */
export function verifyOwnership(session: AuthSession, resourceUserId: string): boolean {
  return session.user.id === resourceUserId;
}

/**
 * Verify user email is verified
 * 
 * @param session - User session
 * @returns True if email is verified
 */
export function verifyEmailVerified(session: AuthSession): boolean {
  return session.user.emailVerified === true;
}

/**
 * Main authentication middleware wrapper for API routes
 * 
 * Usage:
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const authResult = await requireAuth(request, {
 *     requireAuth: true,
 *     requiredRoles: ['patient'],
 *   });
 * 
 *   if (!authResult.success) {
 *     return authResult.response;
 *   }
 * 
 *   const session = authResult.session;
 *   // ... your route logic
 * }
 * ```
 * 
 * @param request - Next.js request object
 * @param config - Authentication configuration
 * @returns Auth result with session or error response
 */
export async function requireAuth(
  request: NextRequest,
  config: AuthConfig = { requireAuth: true }
): Promise<{
  success: boolean;
  session?: AuthSession;
  response?: NextResponse;
}> {
  // If auth not required, skip all checks
  if (!config.requireAuth) {
    return { success: true };
  }

  // Step 1: Authenticate the request
  const authResult = await authenticateRequest(request);
  
  if (!authResult.success) {
    return {
      success: false,
      response: NextResponse.json(
        { 
          error: authResult.error,
          code: 'AUTHENTICATION_REQUIRED',
        },
        { status: authResult.statusCode || 401 }
      ),
    };
  }

  const session = authResult.session!;

  // Step 2: Check email verification
  if (config.requireEmailVerification && !verifyEmailVerified(session)) {
    logWarning('Email verification required', { userId: session.user.id });
    return {
      success: false,
      response: NextResponse.json(
        { 
          error: 'Email verification required. Please verify your email.',
          code: 'EMAIL_VERIFICATION_REQUIRED',
        },
        { status: 403 }
      ),
    };
  }

  // Step 3: Check role requirements
  if (config.requiredRoles && config.requiredRoles.length > 0) {
    if (!verifyRole(session, config.requiredRoles)) {
      logWarning('Insufficient permissions', { 
        userId: session.user.id,
        userRole: session.user.role,
        requiredRoles: config.requiredRoles,
      });
      return {
        success: false,
        response: NextResponse.json(
          { 
            error: 'Insufficient permissions. You do not have access to this resource.',
            code: 'INSUFFICIENT_PERMISSIONS',
          },
          { status: 403 }
        ),
      };
    }
  }

  // Step 4: Custom authorization check
  if (config.customAuthCheck) {
    try {
      const customResult = await config.customAuthCheck(session, request);
      
      if (customResult === false) {
        logWarning('Custom authorization failed', { userId: session.user.id });
        return {
          success: false,
          response: NextResponse.json(
            { 
              error: 'Authorization failed',
              code: 'AUTHORIZATION_FAILED',
            },
            { status: 403 }
          ),
        };
      }
      
      if (typeof customResult === 'string') {
        // Custom error message
        return {
          success: false,
          response: NextResponse.json(
            { 
              error: customResult,
              code: 'AUTHORIZATION_FAILED',
            },
            { status: 403 }
          ),
        };
      }
    } catch (error) {
      logError('Custom auth check error:', error);
      return {
        success: false,
        response: NextResponse.json(
          { 
            error: 'Authorization check failed',
            code: 'AUTHORIZATION_ERROR',
          },
          { status: 500 }
        ),
      };
    }
  }

  // All checks passed
  return {
    success: true,
    session,
  };
}

/**
 * Verify user owns a resource (helper for common authorization check)
 * 
 * Usage:
 * ```typescript
 * const authResult = await requireAuth(request, {
 *   requireAuth: true,
 *   customAuthCheck: async (session) => requireOwnership(session, patientId),
 * });
 * ```
 * 
 * @param session - User session
 * @param resourceUserId - User ID that owns the resource
 * @param customMessage - Optional custom error message
 * @returns True if authorized, string error message if not
 */
export function requireOwnership(
  session: AuthSession,
  resourceUserId: string,
  customMessage?: string
): boolean | string {
  if (!verifyOwnership(session, resourceUserId)) {
    return customMessage || 'You do not have permission to access this resource';
  }
  return true;
}

/**
 * Extract user ID from query params or body
 * Useful for ownership verification
 * 
 * @param request - Next.js request object
 * @param paramName - Name of the parameter (default: 'userId')
 * @returns User ID or null
 */
export async function extractUserId(
  request: NextRequest,
  paramName: string = 'userId'
): Promise<string | null> {
  // Try URL search params first
  const searchParams = request.nextUrl.searchParams;
  const userIdFromParams = searchParams.get(paramName);
  
  if (userIdFromParams) {
    return userIdFromParams;
  }

  // Try request body
  try {
    const body = await request.json();
    return body[paramName] || null;
  } catch {
    return null;
  }
}

/**
 * Create error response for authentication failures
 * 
 * @param message - Error message
 * @param statusCode - HTTP status code
 * @returns NextResponse with error
 */
export function authErrorResponse(message: string, statusCode: number = 401): NextResponse {
  return NextResponse.json(
    { 
      error: message,
      code: statusCode === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN',
    },
    { status: statusCode }
  );
}
