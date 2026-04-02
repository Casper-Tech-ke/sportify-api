const express = require('express');
const router = express.Router();
const { getToken } = require('../token-manager');
const { respond, respondError } = require('../response');

router.get('/', async (req, res) => {
  const { q, type = 'track', limit = 10, offset = 0 } = req.query;
  if (!q) return respondError(res, 400, 'Missing query parameter: q');

  const validTypes = ['track', 'album', 'artist', 'playlist', 'episode', 'show'];
  const types = type.split(',').filter(t => validTypes.includes(t));
  if (types.length === 0)
    return respondError(res, 400, `Invalid type. Valid values: ${validTypes.join(', ')}`);

  try {
    const token = await getToken();
    if (!token) return respondError(res, 503, 'Spotify token unavailable, please try again shortly');

    const params = new URLSearchParams({ q, type: types.join(','), limit, offset });
    const result = await fetch(`https://api.spotify.com/v1/search?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!result.ok) throw new Error(`Spotify API returned ${result.status}`);
    const data = await result.json();
    respond(res, 200, { query: q, type: types.join(','), ...data });
  } catch (err) {
    respondError(res, 500, err.message);
  }
});

module.exports = router;
