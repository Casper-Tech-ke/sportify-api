const express = require('express');
const router = express.Router();
const { respond, respondError } = require('../response');
const { fetchEmbedEntity, fetchOEmbed } = require('../spotify-graphql');
const { getToken } = require('../token-manager');

// Timed lyrics for a track, by Spotify track ID.
//
// Sources, in order:
//   1. Spotify color-lyrics (from the Android app v9.2.0.2053 decompile:
//      GET spclient.wg.spotify.com/color-lyrics/v2/track/{id}?format=json)
//      — word-level timing when it works. NOTE: as of 2026-11-20 the
//      anonymous web-player (TOTP) token is rejected by spclient
//      (HTTP 400 on v2/v3, 403 on /download) — it needs a logged-in user
//      token. The attempt is kept first so the route upgrades
//      automatically if a user token is ever wired in.
//   2. LRCLIB (https://lrclib.net) — free, no key, line-level synced
//      lyrics. This is the source that works today.
//   3. If a track has lyrics but no sync data, plain (unsynced) lines
//      are returned with startTimeMs null and synced:false.

const CACHE_TTL = 5 * 60 * 1000;
const MAX_CACHE = 500;
const cache = new Map();

function cacheGet(key) {
  const e = cache.get(key);
  if (!e) return null;
  if (Date.now() - e.ts > CACHE_TTL) { cache.delete(key); return null; }
  return e.data;
}
function cacheSet(key, data) {
  if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value);
  cache.set(key, { data, ts: Date.now() });
}

// Parse LRC "[mm:ss.cc] words" into [{ startTimeMs, words }]
function parseLrc(lrc) {
  const lines = [];
  for (const raw of String(lrc || '').split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^\[(\d+):(\d\d)(?:[.:](\d+))?\]\s*(.*)$/);
    if (!m) continue;
    const min = parseInt(m[1], 10);
    const sec = parseInt(m[2], 10);
    const frac = m[3] || '';
    const ms = frac.length === 3 ? parseInt(frac, 10) : parseInt((frac + '00').slice(0, 3), 10) || 0;
    lines.push({ startTimeMs: (min * 60 + sec) * 1000 + ms, words: (m[4] || '').trim() });
  }
  return lines;
}

function parsePlainLyrics(text) {
  return String(text || '')
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean)
    .map(words => ({ startTimeMs: null, words }));
}

async function fetchSpotifyLyrics(trackId) {
  const token = await getToken().catch(() => null);
  if (!token) return null;
  const url = `https://spclient.wg.spotify.com/color-lyrics/v2/track/${trackId}?format=json&vocalRemoval=false&market=from_token`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'app-platform': 'WebPlayer',
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
    },
  });
  if (res.status !== 200) return null;
  const data = await res.json();
  const lyr = data?.lyrics;
  if (!lyr || !Array.isArray(lyr.lines) || lyr.lines.length === 0) return null;
  const lines = lyr.lines.map(l => ({
    startTimeMs: typeof l.startTimeMs === 'number' ? l.startTimeMs : null,
    words: l.words || '',
    ...(Array.isArray(l.syllables) && l.syllables.length
      ? { syllables: l.syllables.map(s => ({ startTimeMs: s.startTimeMs, endTimeMs: s.endTimeMs, text: s.text || '' })) }
      : {}),
  }));
  return {
    source: 'spotify',
    language: lyr.language || '',
    lyrics_provider: lyr.provider || 'spotify',
    synced: lyr.syncType === 'LINE_SYNCED',
    word_sync: lines.some(l => l.syllables),
    lines,
  };
}

async function fetchLrclibLyrics(title, artist, album, durationMs) {
  const params = new URLSearchParams({ artist_name: artist, track_name: title });
  if (album) params.set('album_name', album);
  if (durationMs) params.set('duration', String(Math.round(durationMs / 1000)));
  const res = await fetch(`https://lrclib.net/api/get?${params.toString()}`, {
    headers: { 'User-Agent': 'sportify-api/1.0' },
  });
  if (res.status !== 200) return null;
  const data = await res.json();
  if (!data || (!data.syncedLyrics && !data.plainLyrics)) return null;
  if (data.instrumental) {
    return { source: 'lrclib', language: '', lyrics_provider: 'lrclib', synced: false, word_sync: false, instrumental: true, lines: [] };
  }
  if (data.syncedLyrics) {
    const lines = parseLrc(data.syncedLyrics);
    if (lines.length) {
      return { source: 'lrclib', language: '', lyrics_provider: 'lrclib', synced: true, word_sync: false, lines };
    }
  }
  if (data.plainLyrics) {
    return { source: 'lrclib', language: '', lyrics_provider: 'lrclib', synced: false, word_sync: false, lines: parsePlainLyrics(data.plainLyrics) };
  }
  return null;
}

async function resolveTrack(trackId) {
  try {
    const entity = await fetchEmbedEntity('track', trackId);
    if (entity && (entity.name || entity.id)) {
      return {
        title: entity.name || '',
        artist: (entity.artists || []).map(a => a.name).filter(Boolean).join(', '),
        album: '',
        duration_ms: entity.duration || 0,
      };
    }
  } catch {}
  try {
    const oembed = await fetchOEmbed('track', trackId);
    if (oembed && oembed.title) {
      const parts = oembed.title.split(' by ');
      return { title: (parts[0] || '').trim(), artist: (parts[1] || '').trim(), album: '', duration_ms: 0 };
    }
  } catch {}
  return null;
}

router.get('/:id', async (req, res) => {
  const trackId = req.params.id;
  if (!trackId || trackId.length < 10) return respondError(res, 400, 'Invalid track ID');

  const cached = cacheGet(trackId);
  if (cached) return respond(res, 200, { track_id: trackId, cached: true, ...cached });

  try {
    const track = await resolveTrack(trackId);
    if (!track || !track.title) return respondError(res, 404, 'Track not found');

    // 1. Spotify color-lyrics (word-level when it works)
    let lyrics = null;
    try { lyrics = await fetchSpotifyLyrics(trackId); } catch {}

    // 2. LRCLIB fallback (line-level synced)
    if (!lyrics && track.artist) {
      try { lyrics = await fetchLrclibLyrics(track.title, track.artist, track.album, track.duration_ms); } catch {}
    }

    if (!lyrics) return respondError(res, 404, 'No lyrics found for this track');

    const payload = {
      track: { id: trackId, title: track.title, artist: track.artist, url: `https://open.spotify.com/track/${trackId}` },
      ...lyrics,
    };
    cacheSet(trackId, payload);
    respond(res, 200, { track_id: trackId, cached: false, ...payload });
  } catch (err) {
    respondError(res, 500, err.message || 'Lyrics lookup failed');
  }
});

module.exports = router;
