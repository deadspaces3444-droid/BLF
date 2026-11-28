// ===== BLF — прокси живых цен (необязательный, Node.js без зависимостей) =====
//
// Зачем: сайт BLF — статический (GitHub Pages). Браузер не может сам запросить
// Авито, Юлу или магазины: CORS + антибот. Этот маленький сервер делает запросы
// за браузер и отдаёт нормализованный JSON:
//
//   GET /api/prices?q=rtx%204070&city=Новосибирск&limit=30
//   → { offers: [ { title, price, source, condition, city, url, published } ], sources: {...} }
//
// Запуск:   node server/prices-proxy.js          (порт 8787 по умолчанию)
//           PORT=9000 node server/prices-proxy.js
// В сайте:  страница «Цены» → блок «📡 Живые объявления» → вписать адрес прокси
//           (например https://prices.example.ru — нужен HTTPS, иначе браузер заблокирует
//           запрос как mixed content со страницы https://…github.io).
//
// Каждый источник изолирован: если сайт поменял разметку/API, отдаётся то, что успело
// собраться, а в ответе появляется предупреждение. Без прокси сайт работает как раньше —
// с расчётными оценками и кнопками проверки на Авито/Юле/магазинах.

const http = require('http');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 8787);
const CACHE_TTL = 5 * 60 * 1000;                    // 5 минут на пару «запрос+город»
const cache = new Map();

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

function headers(extra = {}) {
  return {
    'user-agent': UA,
    'accept': 'application/json, text/html;q=0.9,*/*;q=0.8',
    'accept-language': 'ru-RU,ru;q=0.9',
    'cache-control': 'no-cache',
    ...extra,
  };
}

async function getJson(url, { timeout = 12000, headers: h } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { headers: headers(h), signal: ctrl.signal, redirect: 'follow' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } finally { clearTimeout(t); }
}
async function getText(url, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opts.timeout || 12000);
  try {
    const res = await fetch(url, { headers: headers(opts.headers), signal: ctrl.signal, redirect: 'follow' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.text();
  } finally { clearTimeout(t); }
}

const digits = v => Number(String(v == null ? '' : v).replace(/[^\d]/g, '')) || 0;

// ---------- Юла: открытый web-api поиска ----------
async function sourceYoula(q, city) {
  const url = `https://youla.ru/web-api/search?query=${encodeURIComponent(q)}&page=1&limit=30&sort=price-asc`;
  const data = await getJson(url);
  const rows = [];
  const items = data?.products?.data || data?.data || data?.items || [];
  items.forEach(p => {
    const price = digits(p.price ?? p.priceValue ?? p.attributes?.price);
    if (!price) return;
    rows.push({
      title: p.name || p.title || 'Объявление',
      price,
      source: 'Юла',
      condition: /нов/i.test(String(p.condition || p.state || '')) ? 'new' : 'used',
      city: p.city?.name || p.region?.name || city,
      url: p.url ? (p.url.startsWith('http') ? p.url : 'https://youla.ru' + p.url) : `https://youla.ru/search?q=${encodeURIComponent(q)}`,
      published: p.published_at || p.date || '',
    });
  });
  return rows;
}

// ---------- Авито: мобильный API (публичный ключ веб-приложения) ----------
async function sourceAvito(q, city) {
  const key = 'af0deccbgcgidddjgnvljitntccdduijhivnodduijhw';
  const url = `https://m.avito.ru/api/11/items?key=${key}&query=${encodeURIComponent(q)}&limit=30&sort=priceAsc`;
  const data = await getJson(url, { headers: { 'x-source': 'm' } });
  const items = data?.result?.items || data?.items || [];
  return items.map(i => {
    const price = digits(i.priceDetailed?.value ?? i.price?.value ?? i.price);
    if (!price) return null;
    const title = i.title || i.name || 'Объявление';
    return {
      title,
      price,
      source: 'Авито',
      condition: /Нов/i.test(String(i.condition || i.state || '')) ? 'new' : 'used',
      city: i.location?.name || city,
      url: i.url ? (String(i.url).startsWith('http') ? i.url : 'https://www.avito.ru' + i.url) : `https://www.avito.ru/all?q=${encodeURIComponent(q)}`,
      published: i.time || '',
    };
  }).filter(Boolean);
}

// ---------- DNS: REST-поиск ----------
async function sourceDns(q, city) {
  const slug = String(city || '').toLowerCase().replace(/[^a-zа-я0-9]+/gi, '-');
  const url = `https://restapi.dns-shop.ru/v1/search?q=${encodeURIComponent(q)}&city=${encodeURIComponent(slug)}&limit=30`;
  const data = await getJson(url);
  const items = data?.data?.items || data?.items || data?.products || [];
  return items.map(i => {
    const price = digits(i.price?.current ?? i.price ?? i.minPrice);
    if (!price) return null;
    return {
      title: i.name || i.title || 'Товар DNS',
      price,
      source: 'DNS',
      condition: 'new',
      city,
      url: i.url ? (String(i.url).startsWith('http') ? i.url : 'https://www.dns-shop.ru' + i.url) : `https://www.dns-shop.ru/search/?q=${encodeURIComponent(q)}`,
      published: '',
    };
  }).filter(Boolean);
}

// ---------- Citilink: HTML-разметка страницы поиска ----------
async function sourceCitilink(q, city) {
  const html = await getText(`https://www.citilink.ru/search/?text=${encodeURIComponent(q)}`);
  const rows = [];
  const re = /"name"\s*:\s*"([^"]{3,120})"[\s\S]{0,400}?"price"\s*:\s*"?(\d{3,7})"?/g;
  let m;
  while ((m = re.exec(html)) && rows.length < 30) {
    rows.push({
      title: m[1], price: Number(m[2]), source: 'Citilink', condition: 'new',
      city, url: `https://www.citilink.ru/search/?text=${encodeURIComponent(q)}`, published: '',
    });
  }
  return rows;
}

const SOURCES = {
  youla: sourceYoula,
  avito: sourceAvito,
  dns: sourceDns,
  citilink: sourceCitilink,
};

async function collect(q, city, limit, only) {
  const names = only ? only.split(',').map(s => s.trim()).filter(n => SOURCES[n]) : Object.keys(SOURCES);
  const result = { offers: [], sources: {} };
  await Promise.all(names.map(async name => {
    const started = Date.now();
    try {
      const rows = await SOURCES[name](q, city);
      result.sources[name] = { ok: true, count: rows.length, ms: Date.now() - started };
      result.offers.push(...rows);
    } catch (e) {
      result.sources[name] = { ok: false, error: e.message, ms: Date.now() - started };
    }
  }));
  // убираем дубли по «название+цена», сортируем по цене
  const seen = new Set();
  result.offers = result.offers
    .filter(o => {
      const k = o.title.toLowerCase().slice(0, 60) + '|' + o.price;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .sort((a, b) => a.price - b.price)
    .slice(0, limit);
  return result;
}

const server = http.createServer(async (req, res) => {
  const cors = {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'content-type',
    'access-control-allow-methods': 'GET, OPTIONS',
  };
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }

  const u = new URL(req.url, `http://localhost:${PORT}`);
  const json = (code, obj) => {
    res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', ...cors, 'cache-control': 'no-store' });
    res.end(JSON.stringify(obj));
  };

  if (u.pathname === '/health') return json(200, { ok: true, sources: Object.keys(SOURCES) });

  if (u.pathname === '/api/prices') {
    const q = String(u.searchParams.get('q') || '').trim();
    const city = String(u.searchParams.get('city') || '').trim();
    const limit = Math.min(100, Number(u.searchParams.get('limit') || 30));
    const only = u.searchParams.get('sources') || '';
    if (!q) return json(400, { error: 'Укажите q — что искать' });

    const key = [q.toLowerCase(), city.toLowerCase(), limit, only].join('|');
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL) return json(200, { ...hit.data, cached: true });

    try {
      const data = await collect(q, city, limit, only);
      cache.set(key, { at: Date.now(), data });
      return json(200, { ...data, cached: false, query: q, city, at: new Date().toISOString() });
    } catch (e) {
      return json(502, { error: e.message, offers: [] });
    }
  }

  return json(404, { error: 'Неизвестный путь. Используйте /api/prices?q=...&city=...' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`BLF prices proxy: http://0.0.0.0:${PORT}/api/prices?q=rtx%204070&city=Новосибирск`);
  console.log('Источники:', Object.keys(SOURCES).join(', '), '· кэш', CACHE_TTL / 60000, 'мин');
});
