const { createHmac } = require('crypto');

const TOTP_VERSION = '61';
const TOTP_SECRET = [44, 55, 47, 42, 70, 40, 34, 114, 76, 74, 50, 111, 120, 97, 75, 76, 94, 102, 43, 69, 49, 120, 118, 80, 64, 78];
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36';

function toBase32(buf) {
  let result = '', bits = 0, value = 0;
  for (const byte of buf) {
    value = (value << 8) | byte; bits += 8;
    while (bits >= 5) { result += B32[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) result += B32[(value << (5 - bits)) & 31];
  return result;
}

function fromBase32(str) {
  str = str.replace(/=+$/, '').toUpperCase();
  let bits = 0, value = 0;
  const result = [];
  for (const c of str) {
    const idx = B32.indexOf(c); if (idx === -1) continue;
    value = (value << 5) | idx; bits += 5;
    if (bits >= 8) { result.push((value >>> (bits - 8)) & 0xff); bits -= 8; }
  }
  return Buffer.from(result);
}

function computeTotp(timestampSec) {
  const transformed = TOTP_SECRET.map((e, t) => e ^ ((t % 33) + 9));
  const joined = transformed.map(n => String(n)).join('');
  const hexStr = Buffer.from(joined).toString('hex');
  const bytes = Buffer.from(hexStr, 'hex');
  const base32 = toBase32(bytes);

  const counter = Math.floor(timestampSec / 30);
  const key = fromBase32(base32);
  const cb = Buffer.alloc(8);
  cb.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  cb.writeUInt32BE(counter >>> 0, 4);
  const hmac = createHmac('sha1', key).update(cb).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = ((hmac[offset] & 0x7f) << 24 | (hmac[offset + 1] & 0xff) << 16 | (hmac[offset + 2] & 0xff) << 8 | (hmac[offset + 3] & 0xff)) % 1_000_000;
  return code.toString().padStart(6, '0');
}

async function getSpotifyToken() {
  const tsRes = await fetch('https://open.spotify.com/api/server-time', {
    headers: { 'User-Agent': UA, Accept: 'application/json', Referer: 'https://open.spotify.com/' },
  });
  if (!tsRes.ok) throw new Error(`Server time fetch failed: ${tsRes.status}`);
  const { serverTime } = await tsRes.json();

  const totp = computeTotp(serverTime);
  const params = new URLSearchParams({
    reason: 'init',
    productType: 'web-player',
    totp,
    totpVer: TOTP_VERSION,
    ts: String(serverTime),
  });

  const tokRes = await fetch(`https://open.spotify.com/api/token?${params}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json', Referer: 'https://open.spotify.com/' },
  });
  if (!tokRes.ok) throw new Error(`Token fetch failed: ${tokRes.status}`);
  const data = await tokRes.json();
  if (!data.accessToken) throw new Error('No accessToken in response');
  return data.accessToken;
}

module.exports = { getSpotifyToken };
