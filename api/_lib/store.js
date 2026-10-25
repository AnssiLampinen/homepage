// Disabled series are kept in a Redis set (Upstash, added through the Vercel marketplace)

const SET = 'uni-feed:disabled';

async function redis(command) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('Redis is not configured');
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(`Redis error: ${data.error || res.status}`);
  return data.result;
}

async function getDisabled() {
  return new Set(await redis(['SMEMBERS', SET]));
}

async function setDisabled(key, off) {
  await redis([off ? 'SADD' : 'SREM', SET, key]);
}

module.exports = { getDisabled, setDisabled };
