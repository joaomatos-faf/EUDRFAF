interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStores = new Map<string, Map<string, RateLimitRecord>>();

/**
 * Extracts client IP from standard proxy and Cloudflare headers
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "127.0.0.1"
  );
}

/**
 * Checks in-memory sliding window rate limit for a specific route scope and client IP
 */
export function checkRouteRateLimit(
  scope: string,
  ip: string,
  maxRequests = 20,
  windowMs = 60_000
): { allowed: boolean; remaining: number; retryAfter: number; limit: number } {
  let store = rateLimitStores.get(scope);
  if (!store) {
    store = new Map<string, RateLimitRecord>();
    rateLimitStores.set(scope, store);
  }

  const now = Date.now();
  const record = store.get(ip);

  if (!record || now > record.resetAt) {
    store.set(ip, { count: 1, resetAt: now + windowMs });
    // Garbage collection if map grows large
    if (store.size > 2000) {
      for (const [k, v] of store.entries()) {
        if (now > v.resetAt) store.delete(k);
      }
    }
    return { allowed: true, remaining: maxRequests - 1, retryAfter: 0, limit: maxRequests };
  }

  record.count += 1;
  const retryAfter = Math.max(1, Math.ceil((record.resetAt - now) / 1000));

  if (record.count > maxRequests) {
    return { allowed: false, remaining: 0, retryAfter, limit: maxRequests };
  }

  return { allowed: true, remaining: maxRequests - record.count, retryAfter: 0, limit: maxRequests };
}
