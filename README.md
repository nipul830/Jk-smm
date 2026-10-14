# JK SMM — Personal Panel

Personal-use social task dashboard. No payment, wallet, checkout, or paid-provider integration is included.

## Included
- Static responsive frontend at repository root for GitHub Pages
- Node.js + Express backend in `backend/` for Render
- Admin-password login, task/order tracking, and health endpoint
- Optional Telegram invite-link creation for a channel/group where your bot has admin permissions

**Important:** order records are stored in memory and reset when the Render service restarts. This initial version does not provide durable storage or automatically deliver Instagram followers/Telegram members. Use opt-in invites and legitimate growth methods.

## Deploy backend to Render
1. Create a new Web Service from this repository.
2. Set **Root Directory** to `backend`.
3. Build command: `npm install`; start command: `npm start`.
4. Add environment variables:
   - `ADMIN_PASSWORD`: a strong private password
   - `FRONTEND_URL`: exact GitHub Pages origin, e.g. `https://nipul830.github.io`
   - Optional Telegram setup: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
5. Copy the Render service URL, for example `https://your-service.onrender.com`.

## Connect frontend to backend
In `index.html`, replace the empty string in:
```js
const API=(window.JK_SMM_API||'').replace(/\/$/,'');
```
with your Render service URL, e.g. `const API=(window.JK_SMM_API||'https://your-service.onrender.com').replace(/\/$/,'');`.

This is a source edit that must be committed to GitHub before the static frontend can call the backend.

## Enable GitHub Pages
1. Repository Settings → Pages.
2. Set the source to **GitHub Actions**.
3. The included workflow deploys the root `index.html` on pushes to `main`.

## Telegram invite links
Create a bot using Telegram's official BotFather, add it as an administrator to the target channel/group with permission to invite users, then set the bot token and target chat ID in Render environment variables. Never place the token in frontend code or commit it to GitHub.

## Security and limitations
- Keep this repository and admin panel private if you do not want the frontend source public; the frontend is static and does not contain secrets.
- Use a strong admin password and HTTPS.
- Current sessions and orders are in-memory. A database and session expiry/rate limiting should be added before broader use.
- Instagram does not provide an official API to add arbitrary followers. This panel does not automate fake followers, spam, or forced membership.
