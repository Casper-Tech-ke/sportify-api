# Sportify API

**Free, unlimited Spotify search API — no API keys, no sign-ups, no rate limits.**

Built and maintained by **[CASPER TECH](https://github.com/Casper-Tech-ke)** · **TRABY CASPER**

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api` | API info and endpoint list |
| GET | `/api/health` | Health check |
| GET | `/api/token` | Get current access token |
| GET | `/api/search?q=QUERY&type=track&limit=10` | Search Spotify |
| GET | `/api/track/:id` | Track details |
| GET | `/api/album/:id` | Album details |
| GET | `/api/playlist/:id` | Playlist details |
| GET | `/api/artist/:id` | Artist profile |
| GET | `/api/artist/:id/top-tracks?market=US` | Artist top tracks |

**Search types:** `track`, `album`, `artist`, `playlist`, `episode`, `show`

---

## Response Format

Every response is pretty-printed JSON in this format:

```json
{
  "provider": "CASPER TECH",
  "creator": "TRABY CASPER",
  "success": true,
  ...data
}
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
PORT=3001
REFRESH_INTERVAL_MINUTES=30
GITHUB_TOKEN=optional
GITHUB_REPO=optional
GITHUB_FILE_PATH=tokens.json
```

`GITHUB_TOKEN` and `GITHUB_REPO` are optional. Without them the token is still saved locally to `tokens.json`.

---

## Deploy

### Render

1. Fork or push this repo to GitHub
2. Go to [render.com](https://render.com) → **New → Web Service**
3. Connect your repo
4. Set:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
5. Add env vars under **Environment** tab
6. Deploy

---

### Heroku

```bash
heroku create sportify-api
heroku config:set PORT=3001
git push heroku main
```

Or via Heroku Dashboard:
1. New → Create new app
2. Connect GitHub repo → Enable auto deploy
3. Set config vars under **Settings → Config Vars**

Heroku sets `PORT` automatically — the app reads it from `process.env.PORT`.

---

### Fly.io

```bash
npm install -g flyctl
fly auth login
fly launch --name sportify-api
fly secrets set REFRESH_INTERVAL_MINUTES=30
fly deploy
```

`fly launch` auto-detects Node.js and creates `fly.toml`. Fly sets `PORT` automatically.

---

### VPS (Ubuntu / Debian)

```bash
# 1. Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 2. Clone and install
git clone https://github.com/Casper-Tech-ke/sportify-api.git
cd sportify-api
npm install
cp .env.example .env
nano .env   # set PORT and optional GitHub values

# 3. Run with PM2 (keeps alive after reboot)
npm install -g pm2
pm2 start src/index.js --name sportify-api
pm2 startup
pm2 save
```

**Nginx reverse proxy (optional):**

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

### Railway

1. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub**
2. Select your repo
3. Railway auto-detects Node.js and sets `PORT`
4. Add env vars under **Variables** tab
5. Deploy

---

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
docker run -p 3001:3001 --env-file .env sportify-api
```

---

## How It Works

The API generates anonymous Spotify web-player tokens using a TOTP (Time-based One-Time Password) method reverse-engineered from Spotify's own web player. No Spotify developer account or credentials are needed. Tokens are refreshed automatically every 30 minutes.

---

## License

MIT — free to use, modify and deploy.

**CASPER TECH** · Built with by TRABY CASPER
