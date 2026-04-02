const express = require('express');
const router = express.Router();
const { getToken } = require('../token-manager');

router.get('/:id', async (req, res) => {
  try {
    const token = await getToken();
    if (!token) return res.status(503).json({ success: false, error: 'Spotify token unavailable' });

    const result = await fetch(`https://api.spotify.com/v1/playlists/${req.params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!result.ok) throw new Error(`Spotify API: ${result.status}`);
    const data = await result.json();
    res.json({ success: true, provider: 'CASPER TECH', ...data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
