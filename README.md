# 🔍 VERONICA OSINT — WhatsApp Bot
👑 Developed by Adibhai

WhatsApp OSINT bot — number lookup + JSON output + website pairing.

## Files

```
├── index.js           — bot + web server
├── package.json       — deps
├── render.yaml        — Render config
├── .env.example       — env template
├── .gitignore
├── README.md
└── public/
    └── index.html     — pairing website
```

## Local dev

```bash
npm install
cp .env.example .env
npm start
```

Website: `http://localhost:3000`

## Deploy to Render

### Method 1 — GitHub + Render dashboard

1. GitHub pe repo push karo
2. render.com → **New +** → **Web Service**
3. GitHub repo connect karo
4. Settings:
   - **Name**: veronica-osint-bot
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Plan**: Free
5. **Environment Variables** add karo:
   - `API_URL` = `https://leak-api-databreach-adibhai.vercel.app/api/number`
   - `API_KEY` = (khali)
   - `YOUTUBE_URL` = `https://youtube.com/@geniushacker29`
6. **Create Web Service**

### Method 2 — `render.yaml` (Blueprint)

1. Repo push karo (with `render.yaml`)
2. render.com → **New +** → **Blueprint**
3. Repo select → Render khud settings padhega
4. Deploy

## Pair WhatsApp

1. Render deploy ke baad URL milega: `https://veronica-osint-bot.onrender.com`
2. Website kholo
3. WhatsApp number daalo (`919876543210` — country code ke saath)
4. **GET PAIRING CODE** dabao
5. 8-digit code aayega
6. WhatsApp → Settings → Linked Devices → **Link with phone number** → code daalo
7. Done — status website pe **✅ Connected** dikhega

## Commands

- `.lookup 9876543210` — Number info
- `.help` — Menu

## Environment Variables

| Key | Value |
|---|---|
| `API_URL` | `https://leak-api-databreach-adibhai.vercel.app/api/number` |
| `API_KEY` | (khali) |
| `YOUTUBE_URL` | `https://youtube.com/@geniushacker29` |
| `SESSION_DIR` | `./session` |

## Notes

- **Free tier** — Render 15 min inactivity pe sleep karta hai. Bot uthne me 30 sec lagenge.
- **Session** — `./session/` folder me save hoti hai. Free tier pe restart pe session ja sakti hai. Persistent disk ke liye paid plan.
- **Uptime robot** — free uptime robot laga do (uptimerobot.com) taaki sleep na kare.
- **Health check** — Render `/health` endpoint hit karta hai.

**Developed by Adibhai**
