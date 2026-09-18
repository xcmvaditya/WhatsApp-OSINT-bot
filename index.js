// ============================================================
// 🔍 VERONICA OSINT — WhatsApp Bot
// 👑 Developed by Adibhai
// ============================================================

require('dotenv').config();

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const http = require('http');

// ── CONFIG ──
const API_URL = process.env.API_URL || "https://leak-api-databreach-adibhai.vercel.app/api/number";
const API_KEY = process.env.API_KEY || "";
const SESSION_DIR = process.env.SESSION_DIR || "./session";
const YT_LINK = process.env.YOUTUBE_URL || "https://youtube.com/@geniushacker29";
const PORT = process.env.PORT || 3000;

['tmp', 'temp', 'lookup_files'].forEach(d =>
    fs.mkdirSync(path.join(__dirname, d), { recursive: true })
);

let sock = null;
let latestQR = null;

// ── API LOOKUP ──
async function lookupNumber(mobile) {
    try {
        let url = `${API_URL}?number=${mobile}`;
        if (API_KEY) url += `&key=${API_KEY}`;
        console.log(`📡 API: ${url}`);
        const r = await axios.get(url, { timeout: 15000 });
        return r.data;
    } catch (e) {
        console.error('API Error:', e.message);
        return null;
    }
}

// ── FORMAT ──
function formatResults(data) {
    if (!data) return { text: '{"status":"error","message":"No data found"}', count: 0 };

    let records = [];
    if (Array.isArray(data)) records = data;
    else if (Array.isArray(data.data)) records = data.data;
    else if (Array.isArray(data.results)) records = data.results;
    else if (Array.isArray(data.records)) records = data.records;
    else if (data.result && Array.isArray(data.result.data)) records = data.result.data;
    else if (data.result && typeof data.result === 'object') records = [data.result];
    else if (data.data && typeof data.data === 'object') records = [data.data];
    else if (typeof data === 'object') records = [data];

    const pick = (o, keys) => {
        for (const k of keys) {
            if (o[k] !== undefined && o[k] !== null && o[k] !== '') return o[k];
        }
        return null;
    };

    const cleaned = records.map(r => {
        const out = {};
        const add = (l, v) => { if (v !== null && v !== undefined && v !== '') out[l] = v; };
        add('name',        pick(r, ['name','full_name','Name','fullname']));
        add('father_name', pick(r, ['father_name','father','FatherName','Father']));
        add('mobile',      pick(r, ['mobile','phone','number','Mobile']));
        add('alt_mobile',  pick(r, ['alt_mobile','alt_number','alternate','alt']));
        add('email',       pick(r, ['email','Email','mail']));
        add('address',     pick(r, ['address','Address','addr','full_address']));
        add('circle',      pick(r, ['circle','Circle','operator','telecom']));
        add('aadhaar',     pick(r, ['aadhaar','aadhar','aadhaar_number']));
        add('dob',         pick(r, ['dob','DOB','date_of_birth']));
        if (Object.keys(out).length === 0) {
            Object.keys(r).forEach(k => {
                if (r[k] !== null && r[k] !== undefined && r[k] !== '') out[k] = r[k];
            });
        }
        return out;
    }).filter(o => Object.keys(o).length > 0);

    const clean = {
        status: 'success',
        number: data.number || data.mobile || null,
        total_records: data.total_records || data.total || data.count ||
                      (data.result && data.result.total_records) || cleaned.length,
        data: cleaned,
        developer: 'Adibhai',
        youtube: YT_LINK,
        timestamp: new Date().toISOString()
    };

    return { text: JSON.stringify(clean, null, 2), count: cleaned.length };
}

// ── WHATSAPP BOT ──
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }),
        browser: ['Ubuntu', 'Chrome', '20.0.04']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            latestQR = qr;
            console.log('\n📱 QR ready — website se pair karo');
            console.log(`   http://localhost:${PORT}\n`);
        }

        if (connection === 'open') {
            latestQR = null;
            console.log('\n✅ WhatsApp connected!');
            console.log('👑 Developed by Adibhai\n');
        }

        if (connection === 'close') {
            const code = lastDisconnect?.error?.output?.statusCode;
            const loggedOut = code === DisconnectReason.loggedOut;
            if (!loggedOut) {
                console.log('🔄 Reconnecting...');
                setTimeout(startBot, 5000);
            } else {
                console.log('❌ Logged out — session delete');
                fs.rmSync(SESSION_DIR, { recursive: true, force: true });
            }
        }
    });

    // ── MESSAGES ──
    sock.ev.on('messages.upsert', async ({ messages }) => {
        for (const msg of messages) {
            try {
                if (!msg.message) continue;
                const from = msg.key.remoteJid;
                if (!from) continue;

                const text = msg.message?.conversation ||
                    msg.message?.extendedTextMessage?.text || '';
                const cmd = text.trim();
                const cmdL = cmd.toLowerCase();

                // ── .lookup ──
                if (cmdL.startsWith('.lookup')) {
                    const parts = cmd.split(' ');
                    if (parts.length < 2) {
                        await sock.sendMessage(from, {
                            text: '❌ Usage: .lookup 9876543210\n\n🔍 Number details\n👑 Adibhai'
                        }, { quoted: msg });
                        continue;
                    }
                    const number = parts[1].replace(/[^0-9]/g, '');
                    if (!/^\d{10,15}$/.test(number)) {
                        await sock.sendMessage(from, {
                            text: '❌ Invalid number — 10-15 digits only'
                        }, { quoted: msg });
                        continue;
                    }

                    await sock.sendMessage(from, {
                        text: `⏳ Searching ${number}...`
                    }, { quoted: msg });

                    const data = await lookupNumber(number);
                    const result = formatResults(data);

                    if (result.text.length > 3000) {
                        const filename = `osint_${number}_${Date.now()}.json`;
                        const filepath = path.join(__dirname, 'lookup_files', filename);
                        fs.writeFileSync(filepath, result.text);

                        await sock.sendMessage(from, {
                            text: `📁 ${number} — ${result.count} record(s)\n📎 File bhej raha hoon...`
                        }, { quoted: msg });

                        await sock.sendMessage(from, {
                            document: fs.readFileSync(filepath),
                            mimetype: 'application/json',
                            fileName: filename,
                            caption: `🔍 ${number}\n📊 ${result.count} records\n👑 Adibhai`
                        }, { quoted: msg });

                        try { fs.unlinkSync(filepath); } catch(e) {}
                    } else {
                        await sock.sendMessage(from, {
                            text: `\`\`\`json\n${result.text}\n\`\`\``
                        }, { quoted: msg });
                    }
                    continue;
                }

                // ── .help ──
                if (cmdL === '.help' || cmdL === '.menu') {
                    await sock.sendMessage(from, {
                        text: `🔍 *VERONICA OSINT*\n👑 Developed by Adibhai\n📺 ${YT_LINK}\n\n📌 *Commands:*\n.lookup <number> — Number info\n.help — Ye menu\n\n📞 Example: .lookup 9876543210\n\n✅ Group + Private\n✅ JSON output\n✅ Clean data`
                    }, { quoted: msg });
                    continue;
                }

            } catch (e) {
                console.log('Msg error:', e.message);
            }
        }
    });
}

startBot().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
});

// ── WEB SERVER (Render ke liye — health check + pairing) ──
const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

    // health check (Render ke liye)
    if (req.url === '/health' || req.url === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
        return;
    }

    // website
    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
        try {
            const html = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html);
        } catch (e) {
            res.writeHead(500); res.end('index.html missing');
        }
        return;
    }

    // status
    if (req.url === '/api/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            connected: sock?.user ? true : false,
            user: sock?.user?.id || null,
            name: sock?.user?.name || null
        }));
        return;
    }

    // pairing code
    if (req.url === '/api/pair' && req.method === 'POST') {
        let body = '';
        req.on('data', c => body += c);
        req.on('end', async () => {
            try {
                const { phone } = JSON.parse(body);
                const clean = (phone || '').replace(/[^0-9]/g, '');
                if (clean.length < 10) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid phone' }));
                    return;
                }
                if (!sock) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Socket not ready' }));
                    return;
                }
                if (sock.authState.creds.registered) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Already paired' }));
                    return;
                }
                const code = await sock.requestPairingCode(clean);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ code, phone: clean }));
            } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // QR
    if (req.url === '/api/qr') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ qr: latestQR }));
        return;
    }

    res.writeHead(404); res.end('Not found');
});

server.listen(PORT, () => {
    console.log(`🌐 Web panel: http://localhost:${PORT}`);
});
