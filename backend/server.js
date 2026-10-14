const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const FRONTEND_URL = process.env.FRONTEND_URL;
const sessions = new Set();
const orders = [];
app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || !FRONTEND_URL || origin === FRONTEND_URL || origin.endsWith('.github.io')) return callback(null, true);
    return callback(new Error('Origin not allowed'));
  },
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.get('/health', (_req, res) => res.json({ ok: true, service: 'jk-smm-api' }));
app.get('/api/services', (_req, res) => res.json({ services: [
  { id: 'ig-growth', platform: 'Instagram', name: 'Organic growth task', automatedDelivery: false },
  { id: 'tg-invite', platform: 'Telegram', name: 'Opt-in invite campaign', automatedDelivery: false },
  { id: 'engagement', platform: 'Social', name: 'Engagement review', automatedDelivery: false },
  { id: 'custom', platform: 'Custom', name: 'Personal task', automatedDelivery: false }
]}));
function auth(req, res, next) {
  const value = req.headers.authorization || '';
  const token = value.startsWith('Bearer ') ? value.slice(7) : '';
  if (!token || !sessions.has(token)) return res.status(401).json({ error: 'Please sign in again.' });
  next();
}
app.post('/api/login', (req, res) => {
  if (!ADMIN_PASSWORD) return res.status(503).json({ error: 'Set ADMIN_PASSWORD in Render environment variables first.' });
  const supplied = String(req.body?.password || '');
  const a = Buffer.from(supplied), b = Buffer.from(ADMIN_PASSWORD);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(401).json({ error: 'Incorrect password.' });
  const token = crypto.randomBytes(32).toString('hex');
  sessions.add(token);
  res.json({ token });
});
app.get('/api/orders', auth, (_req, res) => res.json({ orders }));
app.post('/api/orders', auth, (req, res) => {
  const { service, target, quantity, priority, notes } = req.body || {};
  const allowed = ['Instagram growth task', 'Telegram invite campaign', 'Engagement review', 'Custom task'];
  if (!allowed.includes(service)) return res.status(400).json({ error: 'Choose a valid service.' });
  let url;
  try { url = new URL(String(target)); } catch { return res.status(400).json({ error: 'Enter a valid target URL.' }); }
  if (!['http:', 'https:'].includes(url.protocol)) return res.status(400).json({ error: 'Only HTTP/HTTPS links are allowed.' });
  if (quantity !== null && quantity !== undefined && (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000000)) return res.status(400).json({ error: 'Quantity must be between 1 and 1,000,000.' });
  if (orders.length >= 1000) return res.status(429).json({ error: 'Order limit reached for this demo backend.' });
  const order = {
    id: crypto.randomBytes(4).toString('hex').toUpperCase(),
    service, target: url.toString(), quantity: quantity ?? null,
    priority: ['Low', 'Normal', 'High'].includes(priority) ? priority : 'Normal',
    notes: String(notes || '').slice(0, 1000),
    status: 'Pending', createdAt: new Date().toISOString()
  };
  orders.unshift(order);
  res.status(201).json({ order });
});
app.post('/api/telegram/invite', auth, async (_req, res) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return res.status(503).json({ error: 'Telegram invite setup is not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in Render.' });
  try {
    const response = await fetch('https://api.telegram.org/bot' + botToken + '/createChatInviteLink', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, name: 'JK SMM invite', creates_join_request: false })
    });
    const data = await response.json();
    if (!response.ok || !data.ok) return res.status(502).json({ error: data.description || 'Telegram could not create an invite link. Check bot admin permissions.' });
    res.json({ inviteLink: data.result.invite_link });
  } catch { res.status(502).json({ error: 'Could not reach Telegram. Try again later.' }); }
});
app.use((err, _req, res, _next) => {
  if (err.message === 'Origin not allowed') return res.status(403).json({ error: err.message });
  console.error(err.message);
  res.status(400).json({ error: 'Bad request.' });
});
app.listen(PORT, () => console.log('JK SMM API listening on ' + PORT));