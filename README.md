# Sportify API

> **Free, unlimited Spotify search API. No API key required.**

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Live-brightgreen)](https://sportify.xcasper.space)
[![Built by](https://img.shields.io/badge/Built%20by-TRABY%20CASPER-7c3aed)](https://xcasper.space)
[![CASPER TECH](https://img.shields.io/badge/CASPER%20TECH-Open%20API-a855f7)](https://xcasper.space)

**Live:** [https://sportify.xcasper.space](https://sportify.xcasper.space)

---

## What Is This?

Sportify API is a free public REST API that gives developers instant access to Spotify's full music catalogue — tracks, albums, artists, playlists and more — without needing a Spotify developer account, API key, or OAuth flow.

Built and maintained by **TRABY CASPER** under the **CASPER TECH** umbrella.

---

## Owner & Author

| | |
|---|---|
| **Name** | TRABY CASPER |
| **Organisation** | CASPER TECH |
| **Country** | Kenya 🇰🇪 |
| **Website** | [xcasper.space](https://xcasper.space) |
| **GitHub** | [@Casper-Tech-ke](https://github.com/Casper-Tech-ke) |
| **Role** | Founder & Lead Developer |

CASPER TECH is a Kenyan tech initiative focused on building free, accessible developer tools and APIs for African and global developers. Sportify API is part of the CASPER TECH API Hub platform — home to 150+ free API endpoints.

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | API health check and uptime |
| GET | `/api/token` | Get current Spotify access token |
| GET | `/api/search` | Search tracks, albums, artists, playlists |
| GET | `/api/track/:id` | Track details by Spotify ID |
| GET | `/api/album/:id` | Album details and track listing |
| GET | `/api/playlist/:id` | Playlist info and all tracks |
| GET | `/api/artist/:id` | Artist profile and metadata |
| GET | `/api/artist/:id/top-tracks` | Artist top tracks by market |

---

## Quick Start

No setup needed. Hit the API directly:

```bash
# Search for a track
curl "https://sportify.xcasper.space/api/search?q=Faded&type=track&limit=5"

# Get a track by ID
curl "https://sportify.xcasper.space/api/track/3n3Ppam7vgaVa1iaRUIOKE"

# Get Drake's top tracks in Kenya
curl "https://sportify.xcasper.space/api/artist/3TVXtAsR1Inumwj472S9r4/top-tracks?market=KE"

# Get current access token
curl "https://sportify.xcasper.space/api/token"
```

---

## Search Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query |
| `type` | string | Yes | `track`, `album`, `artist`, `playlist`, `episode`, `show` |
| `limit` | number | No | Results count. Default 10, max 50 |
| `offset` | number | No | Pagination offset. Default 0 |

---

## Response Format

All responses follow this standard structure:

```json
{
  "provider": "CASPER TECH",
  "creator": "TRABY CASPER",
  "success": true,
  ...data
}
```

Error responses:

```json
{
  "provider": "CASPER TECH",
  "creator": "TRABY CASPER",
  "success": false,
  "error": "Description of the error"
}
```

---

## Token Info

The `/api/token` endpoint returns an anonymous Spotify web-player token. These tokens:
- Are valid for ~1 hour
- Are automatically refreshed every 30 minutes in the background
- Require no user authentication
- Can be used directly with Spotify's public API

### Using the token directly with Spotify

```bash
curl -H "Authorization: Bearer BQD..." \
  "https://api.spotify.com/v1/search?q=Faded&type=track&limit=5"
```

---

## Self-Hosting

### Requirements
- Node.js 18+
- npm 8+

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Port to listen on |
| `REFRESH_INTERVAL_MINUTES` | `30` | Token refresh interval |

### Run Locally

```bash
git clone https://github.com/Casper-Tech-ke/sportify-api.git
cd sportify-api
npm install
npm start
```

### Deploy with PM2

```bash
pm2 start src/index.js --name sportify-api
pm2 save
```

### Nginx Reverse Proxy

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

```bash
docker build -t sportify-api .
docker run -p 3001:3001 sportify-api
```

---

## Project Structure

```
sportify-api/
├── src/
│   ├── index.js          — Express server entry point
│   ├── totp.js           — Spotify TOTP token generation
│   ├── token-manager.js  — Token cache and scheduler
│   └── response.js       — Response helpers
├── public/
│   ├── index.html        — Interactive API documentation
│   ├── terms.html        — Terms & Conditions
│   ├── disclaimer.html   — Disclaimer
│   ├── favicon.svg       — Site favicon
│   └── og.png            — Social media preview image
├── scripts/
│   └── refresh.js        — Manual token refresh
├── CONTRIBUTING.md
├── DISCLAIMER.md
├── LICENSE
├── SECURITY.md
└── README.md
```

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a pull request.

## Security

Found a vulnerability? Please read our [Security Policy](SECURITY.md) for responsible disclosure guidelines.

## Disclaimer

This is an independent project not affiliated with Spotify AB. Read the full [DISCLAIMER.md](DISCLAIMER.md).

## License

[MIT](LICENSE) © 2025 TRABY CASPER · CASPER TECH

---

<div align="center">
  <strong>Built with passion in Kenya 🇰🇪 by <a href="https://xcasper.space">TRABY CASPER</a> · CASPER TECH</strong>
</div>
