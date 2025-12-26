/**
 * Cloudflare KV client for storing large market data
 *
 * Free tier limits:
 * - 100,000 reads/day
 * - 1,000 writes/day
 * - 1GB storage
 *
 * Environment variables needed:
 * - CF_ACCOUNT_ID: Cloudflare account ID
 * - CF_KV_NAMESPACE_ID: KV namespace ID
 * - CF_API_TOKEN: API token with KV read/write permissions
 */

const CF_API_BASE = 'https://api.cloudflare.com/client/v4';

interface KVWriteOptions {
  expirationTtl?: number; // TTL in seconds
}

/**
 * Get a value from Cloudflare KV
 */
export async function kvGet<T>(key: string): Promise<T | null> {
  const accountId = process.env.CF_ACCOUNT_ID;
  const namespaceId = process.env.CF_KV_NAMESPACE_ID;
  const apiToken = process.env.CF_API_TOKEN;

  if (!accountId || !namespaceId || !apiToken) {
    console.warn('[CF-KV] Missing Cloudflare credentials');
    return null;
  }

  try {
    const url = `${CF_API_BASE}/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(key)}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
      },
      // Don't cache in Next.js - let CF handle caching
      cache: 'no-store',
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      console.warn(`[CF-KV] GET ${key} failed: ${response.status}`);
      return null;
    }

    const text = await response.text();
    return JSON.parse(text) as T;
  } catch (error) {
    console.error('[CF-KV] GET error:', error);
    return null;
  }
}

/**
 * Store a value in Cloudflare KV
 */
export async function kvPut(
  key: string,
  value: unknown,
  options?: KVWriteOptions
): Promise<boolean> {
  const accountId = process.env.CF_ACCOUNT_ID;
  const namespaceId = process.env.CF_KV_NAMESPACE_ID;
  const apiToken = process.env.CF_API_TOKEN;

  if (!accountId || !namespaceId || !apiToken) {
    console.warn('[CF-KV] Missing Cloudflare credentials');
    return false;
  }

  try {
    let url = `${CF_API_BASE}/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(key)}`;

    // Add TTL if specified
    if (options?.expirationTtl) {
      url += `?expiration_ttl=${options.expirationTtl}`;
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`[CF-KV] PUT ${key} failed: ${response.status}`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[CF-KV] PUT error:', error);
    return false;
  }
}

/**
 * Delete a value from Cloudflare KV
 */
export async function kvDelete(key: string): Promise<boolean> {
  const accountId = process.env.CF_ACCOUNT_ID;
  const namespaceId = process.env.CF_KV_NAMESPACE_ID;
  const apiToken = process.env.CF_API_TOKEN;

  if (!accountId || !namespaceId || !apiToken) {
    return false;
  }

  try {
    const url = `${CF_API_BASE}/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(key)}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('[CF-KV] DELETE error:', error);
    return false;
  }
}

/**
 * Check if Cloudflare KV is configured
 */
export function isKVConfigured(): boolean {
  return !!(
    process.env.CF_ACCOUNT_ID &&
    process.env.CF_KV_NAMESPACE_ID &&
    process.env.CF_API_TOKEN
  );
}

/**
 * Get KV configuration status (for debugging)
 */
export function getKVStatus(): {
  configured: boolean;
  hasAccountId: boolean;
  hasNamespaceId: boolean;
  hasApiToken: boolean;
} {
  return {
    configured: isKVConfigured(),
    hasAccountId: !!process.env.CF_ACCOUNT_ID,
    hasNamespaceId: !!process.env.CF_KV_NAMESPACE_ID,
    hasApiToken: !!process.env.CF_API_TOKEN,
  };
}
