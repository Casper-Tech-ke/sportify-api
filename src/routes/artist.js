const express = require('express');
const router = express.Router();
const { getToken } = require('../token-manager');
const { respond, respondError } = require('../response');

router.get('/:id', async (req, res) => {
  try {
    const token = await getToken();
    if (!token) return respondError(res, 503, 'Spotify token unavailable, please try again shortly');
    const result = await fetch(`https://api.spotify.com/v1/artists/${req.params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!result.ok) throw new Error(`Spotify API returned ${result.status}`);
    respond(res, 200, await result.json());
  } catch (err) {
    respondError(res, 500, err.message);
  }
});

router.get('/:id/top-tracks', async (req, res) => {
  try {
    const token = await getToken();
    if (!token) return respondError(res, 503, 'Spotify token unavailable, please try again shortly');
    const market = req.query.market || 'US';
    const result = await fetch(`https://api.spotify.com/v1/artists/${req.params.id}/top-tracks?market=${market}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!result.ok) throw new Error(`Spotify API returned ${result.status}`);
    respond(res, 200, await result.json());
  } catch (err) {
    respondError(res, 500, err.message);
  }
});

module.exports = router;
