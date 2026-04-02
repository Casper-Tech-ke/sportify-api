# Spotify Search API

Standalone Node.js API that provides Spotify search and lookup endpoints using TOTP-based token generation — no credentials required.

## Setup

1. Install dependencies:
   ```
   cd spotify-api
   npm install
   ```

2. Copy the env file and fill in your values:
   ```
   cp .env.example .env
   ```

3. Start the server:
   ```
   npm start
   ```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Port to run on (default: 3001) |
| `GITHUB_TOKEN` | Yes (for commits) | GitHub Personal Access Token |
| `GITHUB_REPO` | Yes (for commits) | e.g. `your-username/spotify-tokens` |
| `GITHUB_FILE_PATH` | No | File to write tokens to (default: `tokens.json`) |
| `REFRESH_INTERVAL_MINUTES` | No | How often to refresh (default: 30) |

## Endpoints

| Endpoint | Description |
|---|---|
| `GET /` | API info |
| `GET /health` | Health check |
| `GET /token` | Get current access token |
| `GET /search?q=Faded&type=track` | Search Spotify |
| `GET /track/:id` | Get track by ID |
| `GET /album/:id` | Get album by ID |
| `GET /playlist/:id` | Get playlist by ID |

## One-time Token Refresh

Run manually without starting the server:
```
npm run refresh
```
