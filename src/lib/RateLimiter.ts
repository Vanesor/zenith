import { NextRequest, NextResponse } from 'next/server';
import { CacheManager } from './CacheManager';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitInfo {
  requests: number;
  resetTime: number;
}

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      message: 'Too many requests from this IP, please try again later.',
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config
    };
  }

  // Create rate limit key based on IP and endpoint
  private createKey(identifier: string, endpoint: string): string {
    return `ratelimit:${identifier}:${endpoint}`;
  }

  // Check if request should be rate limited
  async checkRateLimit(
    identifier: string,
    endpoint: string
  ): Promise<{
    allowed: boolean;
    limit: number;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  }> {
    const key = this.createKey(identifier, endpoint);
    const now = Date.now();

    // Get current rate limit info from cache
    const rateLimitInfo = await CacheManager.get<RateLimitInfo>(key);

    if (!rateLimitInfo || rateLimitInfo.resetTime <= now) {
      // First request or window expired, create new limit
      const newInfo: RateLimitInfo = {
        requests: 1,
        resetTime: now + this.config.windowMs
      };

      await CacheManager.set(key, newInfo, Math.ceil(this.config.windowMs / 1000));

      return {
        allowed: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests - 1,
        resetTime: newInfo.resetTime
      };
    }

    // Check if limit exceeded
    if (rateLimitInfo.requests >= this.config.maxRequests) {
      return {
        allowed: false,
        limit: this.config.maxRequests,
        remaining: 0,
        resetTime: rateLimitInfo.resetTime,
        retryAfter: Math.ceil((rateLimitInfo.resetTime - now) / 1000)
      };
    }

    // Increment request count
    const updatedInfo: RateLimitInfo = {
      ...rateLimitInfo,
      requests: rateLimitInfo.requests + 1
    };

    await CacheManager.set(key, updatedInfo, Math.ceil((rateLimitInfo.resetTime - now) / 1000));

    return {
      allowed: true,
      limit: this.config.maxRequests,
      remaining: this.config.maxRequests - updatedInfo.requests,
      resetTime: rateLimitInfo.resetTime
    };
  }

  // Middleware function for Next.js API routes
  async middleware(
    request: NextRequest,
    identifier?: string
  ): Promise<NextResponse | null> {
    // Use provided identifier or extract from IP
    const id = identifier || this.extractIdentifier(request);
    const endpoint = this.extractEndpoint(request);

    const result = await this.checkRateLimit(id, endpoint);

    // Add rate limit headers
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', result.limit.toString());
    headers.set('X-RateLimit-Remaining', result.remaining.toString());
    headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

    if (!result.allowed) {
      headers.set('Retry-After', result.retryAfter?.toString() || '60');
      
      return NextResponse.json(
        { 
          error: this.config.message,
          limit: result.limit,
          remaining: result.remaining,
          resetTime: result.resetTime
        },
        { 
          status: 429,
          headers 
        }
      );
    }

    // Request is allowed, but we need to pass headers to the response
    // This will be handled by the calling function
    return null;
  }

  // Extract identifier from request (IP address or user ID)
  private extractIdentifier(request: NextRequest): string {
    // Try to get IP from various headers
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfConnectingIp = request.headers.get('cf-connecting-ip');
    
    let ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown';
    
    // Clean up IP
    if (ip.includes(':')) {
      ip = ip.split(':')[0];
    }
    
    return ip.trim();
  }

  // Extract endpoint from request
  private extractEndpoint(request: NextRequest): string {
    const url = new URL(request.url);
    return `${request.method}:${url.pathname}`;
  }

  // Create different rate limiters for different endpoints
  static createApiLimiter(): RateLimiter {
    return new RateLimiter({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
      message: 'Too many API requests from this IP, please try again later.'
    });
  }

  static createAuthLimiter(): RateLimiter {
    return new RateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // Only 5 login attempts per 15 minutes
      message: 'Too many authentication attempts, please try again later.'
    });
  }

  static createChatLimiter(): RateLimiter {
    return new RateLimiter({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30, // 30 messages per minute
      message: 'You are sending messages too quickly, please slow down.'
    });
  }

  static createUploadLimiter(): RateLimiter {
    return new RateLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10, // 10 uploads per hour
      message: 'Too many file uploads, please try again later.'
    });
  }
}

// Middleware wrapper for easy use in API routes
export function withRateLimit(
  rateLimiter: RateLimiter,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Check rate limit
    const rateLimitResponse = await rateLimiter.middleware(request);
    
    if (rateLimitResponse) {
      return rateLimitResponse; // Rate limited
    }

    // Execute the original handler
    const response = await handler(request);

    // Add rate limit headers to successful responses
    const identifier = rateLimiter['extractIdentifier'](request);
    const endpoint = rateLimiter['extractEndpoint'](request);
    const result = await rateLimiter.checkRateLimit(identifier, endpoint);

    response.headers.set('X-RateLimit-Limit', result.limit.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

    return response;
  };
}

// User-based rate limiting (for authenticated requests)
export async function checkUserRateLimit(
  userId: string,
  action: string,
  maxRequests: number = 60,
  windowMs: number = 60000
): Promise<boolean> {
  const rateLimiter = new RateLimiter({
    windowMs,
    maxRequests
  });

  const result = await rateLimiter.checkRateLimit(userId, action);
  return result.allowed;
}
