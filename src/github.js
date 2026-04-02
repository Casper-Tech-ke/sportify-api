require('dotenv').config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_FILE_PATH = process.env.GITHUB_FILE_PATH || 'tokens.json';

async function pushTokenToGitHub(accessToken) {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    console.log('[GitHub] Skipping commit — GITHUB_TOKEN or GITHUB_REPO not set.');
    return;
  }

  const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`;
  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'User-Agent': 'spotify-api-bot',
  };

  let sha = null;
  try {
    const existing = await fetch(apiUrl, { headers });
    if (existing.ok) {
      const data = await existing.json();
      sha = data.sha;
    }
  } catch {}

  const content = {
    tokens: [
      {
        access_token: accessToken,
        generated_at: new Date().toISOString(),
        expires_in: 3600,
        source: 'totp',
      },
    ],
  };

  const encoded = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');
  const body = {
    message: `chore: refresh Spotify token [${new Date().toISOString()}]`,
    content: encoded,
    ...(sha ? { sha } : {}),
  };

  const res = await fetch(apiUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });

  if (res.ok) {
    console.log(`[GitHub] Token committed to ${GITHUB_REPO}/${GITHUB_FILE_PATH}`);
  } else {
    const err = await res.text();
    console.error('[GitHub] Commit failed:', res.status, err);
  }
}

module.exports = { pushTokenToGitHub };
