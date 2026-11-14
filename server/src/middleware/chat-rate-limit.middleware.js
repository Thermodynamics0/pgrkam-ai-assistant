const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 10;

function positiveInteger(value, fallback, max) {
  if (value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= max ? parsed : fallback;
}

function createChatRateLimiter({ env = process.env, now = Date.now } = {}) {
  const windowMs = positiveInteger(env.AI_CHAT_RATE_LIMIT_WINDOW_MS, DEFAULT_WINDOW_MS, 3_600_000);
  const maxRequests = positiveInteger(env.AI_CHAT_RATE_LIMIT_MAX, DEFAULT_MAX_REQUESTS, 1000);
  const clients = new Map();
  let callsSinceCleanup = 0;

  return (req, res, next) => {
    const time = now();
    const key = req.ip || req.socket?.remoteAddress || "unknown";
    let bucket = clients.get(key);
    if (!bucket || time - bucket.startedAt >= windowMs) {
      if (!bucket && clients.size >= 10_000) clients.delete(clients.keys().next().value);
      bucket = { startedAt: time, count: 0 };
      clients.set(key, bucket);
    }
    bucket.count += 1;

    callsSinceCleanup += 1;
    if (callsSinceCleanup >= 256 || clients.size > 10_000) {
      for (const [client, current] of clients) {
        if (time - current.startedAt >= windowMs) clients.delete(client);
      }
      callsSinceCleanup = 0;
    }

    const remainingMs = Math.max(1, bucket.startedAt + windowMs - time);
    res.set("RateLimit-Limit", String(maxRequests));
    res.set("RateLimit-Remaining", String(Math.max(0, maxRequests - bucket.count)));
    if (bucket.count > maxRequests) {
      res.set("Retry-After", String(Math.ceil(remainingMs / 1000)));
      return res.status(429).json({
        success: false,
        code: "CHAT_RATE_LIMITED",
        message: "You have sent too many chat requests. Please wait a little and try again.",
      });
    }
    return next();
  };
}

module.exports = { createChatRateLimiter };
