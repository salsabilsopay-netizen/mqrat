import * as sqliteDb from './db';
import { getDataSource } from './data-layer';
import { createSupabaseServiceClient, isSupabaseServiceConfigured } from './supabase/server';

interface MemoryRateRecord {
  attempts: number;
  windowStart: number;
  blockedUntil: number | null;
}

const memoryFallbackStore = new Map<string, MemoryRateRecord>();
const MAX_MEMORY_ENTRIES = 2000;

function checkMemoryFallback(key: string): { allowed: boolean; retryAfterSeconds?: number } {
  const row = memoryFallbackStore.get(key);
  if (!row) return { allowed: true };
  if (row.blockedUntil && row.blockedUntil > Date.now()) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((row.blockedUntil - Date.now()) / 1000),
    };
  }
  return { allowed: true };
}

function recordMemoryFallback(
  key: string,
  maxAttempts: number,
  windowMs: number,
  blockDurationMs: number
): { blocked: boolean; remainingAttempts: number } {
  if (memoryFallbackStore.size >= MAX_MEMORY_ENTRIES) {
    memoryFallbackStore.clear();
  }
  const now = Date.now();
  const row = memoryFallbackStore.get(key);
  if (!row || now - row.windowStart > windowMs) {
    memoryFallbackStore.set(key, { attempts: 1, windowStart: now, blockedUntil: null });
    return { blocked: false, remainingAttempts: Math.max(0, maxAttempts - 1) };
  }
  const nextAttempts = row.attempts + 1;
  const blocked = nextAttempts >= maxAttempts;
  memoryFallbackStore.set(key, {
    attempts: nextAttempts,
    windowStart: row.windowStart,
    blockedUntil: blocked ? now + blockDurationMs : null,
  });
  return { blocked, remainingAttempts: Math.max(0, maxAttempts - nextAttempts) };
}

/**
 * Shared persistent Rate Limiter:
 * - DATA_SOURCE='sqlite' -> SQLite persistent `rate_limits` table
 * - DATA_SOURCE='supabase' -> Shared PostgreSQL `rate_limit_*` atomic RPCs across all serverless instances
 */
export async function checkRateLimit(
  key: string
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  if (getDataSource() === 'sqlite') {
    return sqliteDb.checkRateLimit(key);
  }

  if (!isSupabaseServiceConfigured()) {
    return checkMemoryFallback(key);
  }

  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase.rpc('rate_limit_check', { p_key: key });
    if (error || !data) {
      return checkMemoryFallback(key);
    }
    const res = data as { allowed: boolean; retry_after_seconds?: number };
    return {
      allowed: Boolean(res.allowed),
      retryAfterSeconds: res.retry_after_seconds,
    };
  } catch {
    return checkMemoryFallback(key);
  }
}

export async function recordRateLimitFailure(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000,
  blockDurationMs: number = 15 * 60 * 1000
): Promise<{ blocked: boolean; remainingAttempts: number }> {
  if (getDataSource() === 'sqlite') {
    return sqliteDb.recordRateLimitFailure(key, maxAttempts, windowMs, blockDurationMs);
  }

  if (!isSupabaseServiceConfigured()) {
    return recordMemoryFallback(key, maxAttempts, windowMs, blockDurationMs);
  }

  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase.rpc('rate_limit_record_failure', {
      p_key: key,
      p_max_attempts: maxAttempts,
      p_window_ms: windowMs,
      p_block_ms: blockDurationMs,
    });
    if (error || !data) {
      return recordMemoryFallback(key, maxAttempts, windowMs, blockDurationMs);
    }
    const res = data as { blocked: boolean; remaining_attempts: number };
    return {
      blocked: Boolean(res.blocked),
      remainingAttempts: res.remaining_attempts ?? 0,
    };
  } catch {
    return recordMemoryFallback(key, maxAttempts, windowMs, blockDurationMs);
  }
}

export async function clearRateLimit(key: string): Promise<void> {
  memoryFallbackStore.delete(key);

  if (getDataSource() === 'sqlite') {
    sqliteDb.clearRateLimit(key);
    return;
  }

  if (!isSupabaseServiceConfigured()) return;

  try {
    const supabase = createSupabaseServiceClient();
    await supabase.rpc('rate_limit_clear', { p_key: key });
  } catch {
    // non-fatal
  }
}
