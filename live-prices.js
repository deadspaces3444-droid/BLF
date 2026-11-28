// ===== BLF — проверка цен по живым сайтам =====
// Цены каталога — расчётные (витрина-оценка), их нельзя выдавать за реальные.
// Здесь: честная маркировка, кнопки живого поиска по каждому магазину и Авито/Юле,
// ручной ввод факта с проверкой «похоже / выше рынка / ниже рынка» и сравнение с оценкой.
// Плюс необязательный серверный прокси (см. server/prices-proxy.js) — когда он поднят,
// сайт автоматически подтягивает реальные объявления (Авито, Юла, DNS, Citilink) в радиусе города.

const LIVE_MARKETS = [
  { id: 'avito', name: 'Авито', icon: '♻️', cond: 'used', kind: 'market',
    url: (q, city) => avitoUrl(q, city),
    note: 'б/у и новые объявления, ваш город' },
  { id: 'youla', name: 'Юла', icon: '♻️', cond: 'used', kind: 'market',
    url: (q, city) => `https://youla.ru/search?q=${encodeURIComponent(q)}`,
    note: 'частные объявления' },
  { id: 'dns', name: 'DNS', icon: '🛒', cond: 'new', kind: 'shop',
    url: q => `https://www.dns-shop.ru/search/?q=${encodeURIComponent(q)}`,
    cityUrl: (q, city) => `https://www.dns-shop.ru/search/?q=${encodeURIComponent(q)}&city=${cityToSlug(city)}`,
    note: 'новое, самовывоз в городе' },
  { id: 'citilink', name: 'Citilink', icon: '🛒', cond: 'new', kind: 'shop',
    url: q => `https://www.citilink.ru/search/?text=${encodeURIComponent(q)}`,
    note: 'новое, часто лучшая цена' },
  { id: 'ozon', name: 'Ozon', icon: '📦', cond: 'new', kind: 'shop',
    url: q => `https://www.ozon.ru/search/?text=${encodeURIComponent(q)}`,
    note: 'новое с доставкой' },
  { id: 'wb', name: 'Wildberries', icon: '📦', cond: 'new', kind: 'shop',
    url: q => `https://www.wildberries.ru/catalog/0/search.aspx?search=${encodeURIComponent(q)}`,
    note: 'новое с доставкой' },
  { id: 'yandex', name: 'Яндекс Маркет', icon: '🔎', cond: 'new', kind: 'shop',
    url: q => `https://market.yandex.ru/search?text=${encodeURIComponent(q)}`,
    note: 'агрегатор новых предложений' },
  { id: 'regard', name: 'Regard', icon: '🛒', cond: 'new', kind: 'shop',
    url: q => `https://www.regard.ru/catalog?search=${encodeURIComponent(q)}`,
    note: 'новое, комплектующие' },
  { id: 'xcom', name: 'XCOM', icon: '🛒', cond: 'new', kind: 'shop',
    url: q => `https://www.xcom-shop.ru/search/?q=${encodeURIComponent(q)}`,
    note: 'новое, комплектующие' },
];

function cityToSlug(cityId) {
  const c = cityById(cityId);
  const map = AVITO_CITY[cityId];
  if (map) return map;
  return (c ? c.name : 'moskva').toLowerCase().replace(/[^a-zа-я0-9]+/gi, '-');
}

// ---------- Проверка цены: сравнение факта с нашей оценкой ----------
const PRICE_CHECK_KEY = 'blf.pricecheck.v1';
function saveLiveHistory(q) {
  try {
    const h = JSON.parse(localStorage.getItem('blf.livehistory') || '[]');
    const next = [q, ...h.filter(x => x.toLowerCase() !== q.toLowerCase())].slice(0, 8);
    localStorage.setItem('blf.livehistory', JSON.stringify(next));
    state.liveHistory = next;
  } catch (e) {}
}
function liveInit() {
  loadLiveProxy();
  loadLiveHistory();
  try {
    const off = JSON.parse(localStorage.getItem('blf.liveoff') || '[]');
    if (Array.isArray(off) && off.length) state.liveOff = off;
  } catch (e) {}
  try {
    const gw = localStorage.getItem('blf.livegateway');
    if (gw) state.liveGateway = gw;
  } catch (e) {}
}
function loadLiveHistory() { try { state.liveHistory = JSON.parse(localStorage.getItem('blf.livehistory') || '[]'); } catch (e) { state.liveHistory = []; } }

function loadPriceChecks() { try { return JSON.parse(localStorage.getItem(PRICE_CHECK_KEY) || '{}') || {}; } catch (e) { return {}; } }
function savePriceChecks(m) { try { localStorage.setItem(PRICE_CHECK_KEY, JSON.stringify(m)); } catch (e) {} }
function priceCheckFor(id) { return loadPriceChecks()[id] || null; }

function submitPriceCheck(componentId, rawPrice, market, condition) {
  const c = byId(componentId);
  const price = Math.round(Number(String(rawPrice).replace(/[^\d]/g, '')));
  if (!c || !price || price < 100) { toast('Введите цену числом — например 54990'); return; }
  const est = minPrice(componentId, state.region, condition || 'new') ?? c.basePrice;
  const diff = Math.round((price - est) / Math.max(est, 1) * 1000) / 10;   // % к оценке
  const m = loadPriceChecks();
  m[c.id] = { price, est, diff, market: market || 'вручную', condition: condition || 'new', at: new Date().toISOString().slice(0, 10) };
  savePriceChecks(m);
  toast(priceVerdict(m[c.id]).short);
  render();
}

function priceVerdict(chk) {
  if (!chk) return { cls: 'none', label: 'не проверено', short: 'Цена не проверена' };
  const d = chk.diff;
  if (d <= -8) return { cls: 'good', label: `дешевле оценки на ${Math.abs(d)}%`, short: `✅ Дешевле оценки на ${Math.abs(d)}% — хорошая цена` };
  if (d >= 8) return { cls: 'bad', label: `дороже оценки на ${d}%`, short: `⚠️ Дороже оценки на ${d}% — переплата` };
  return { cls: 'ok', label: 'совпадает с оценкой', short: `✔️ Совпадает с оценкой (±${Math.abs(d)}%)` };
}

// Сводка доверия по сборке: сколько позиций проверено вручную
function buildPriceTrust(build) {
  const ids = Object.values(build.parts || {}).filter(Boolean);
  let checked = 0, sumChecked = 0, sumEst = 0;
  ids.forEach(id => {
    const chk = priceCheckFor(id);
    if (!chk) return;
    checked++;
    sumChecked += chk.price;
    sumEst += chk.est;
  });
  return {
    total: ids.length, checked,
    diff: sumEst ? Math.round((sumChecked - sumEst) / sumEst * 1000) / 10 : 0,
  };
}

// ---------- Блок ссылок на живой поиск ----------
function liveLinksHtml(query, { compact = false, city = state.region } = {}) {
  const q = String(query || '').trim();
  if (!q) return '';
  const cityName = (cityById(city) || {}).name || '';
  const btn = m => `<a class="live-link ${m.cond === 'used' ? 'used' : 'new'}" target="_blank" rel="noopener"
      href="${m.url(q, city)}" title="${esc(m.note)}">${m.icon} ${esc(m.name)} ↗</a>`;
  if (compact) return `<div class="live-links compact">${LIVE_MARKETS.slice(0, 4).map(btn).join('')}</div>`;
  return `<div class="live-links-box">
    <div class="live-links-head">
      <b>🔎 Проверить живую цену</b>
      <span class="small muted">«${esc(q)}» · ${esc(cityName)} · откроется поиск на сайте с актуальными ценами</span>
    </div>
    <div class="live-links">${LIVE_MARKETS.map(btn).join('')}</div>
    <div class="live-links-foot small muted">
      Цены в каталоге — <b>расчётная оценка</b> по городу, а не данные магазинов: сайт статический и не может сам опрашивать Авито, Юлу и магазины.
      Сверяйте по ссылкам и сохраняйте факт кнопкой «Я нашёл за…» — после этого карточка показывает вашу проверенную цену.
    </div>
  </div>`;
}

// Форма ручной проверки цены (одна на страницу, вставляется в модалку)
function openPriceCheck(componentId) {
  const c = byId(componentId);
  if (!c) return;
  const chk = priceCheckFor(componentId);
  const est = minPrice(componentId, state.region, 'new') ?? c.basePrice;
  const estUsed = minPrice(componentId, state.region, 'used');
  let m = $('#priceCheckModal');
  if (!m) {
    m = document.createElement('div');
    m.className = 'modal';
    m.id = 'priceCheckModal';
    document.body.appendChild(m);
  }
  m.innerHTML = `<div class="modal-box" style="max-width:720px">
    <div class="modal-head">
      <div>
        <h3 style="margin:0">🔎 Проверка цены · ${esc(c.name)}</h3>
        <div class="small muted">${catById(c.cat).name} · ${esc(c.brand)} · ${c.year}${chk ? ' · проверено ' + chk.at + ' (' + esc(chk.market) + ')' : ''}</div>
      </div>
      <button class="btn small ghost" onclick="closePriceCheck()">✕</button>
    </div>
    <div class="check-est">
      <div><span class="small muted">Оценка сайта (новое, ${esc((cityById(state.region) || {}).name || '')})</span><b>${fmt(est)}</b></div>
      ${estUsed ? `<div><span class="small muted">Оценка БУ</span><b>${fmt(estUsed)}</b></div>` : ''}
      ${chk ? `<div><span class="small muted">Ваша проверка</span><b class="${priceVerdict(chk).cls}">${fmt(chk.price)}</b><span class="small muted">${priceVerdict(chk).label}</span></div>` : ''}
    </div>
    ${liveLinksHtml(c.name)}
    <div class="check-form">
      <div class="small muted" style="margin-bottom:6px">Нашли цену на сайте? Введите её — сайт сравнит с оценкой и запомнит проверку в браузере.</div>
      <div class="check-row">
        <input id="checkPriceInput" class="modal-input" inputmode="numeric" placeholder="Цена, ₽ — например 54 990" value="${chk ? chk.price : ''}">
        <select id="checkMarketSelect" class="modal-input" style="max-width:200px">
          ${LIVE_MARKETS.map(x => `<option value="${esc(x.name)}" ${chk && chk.market === x.name ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}
          <option value="вручную" ${chk && chk.market === 'вручную' ? 'selected' : ''}>Другое / вручную</option>
        </select>
        <select id="checkCondSelect" class="modal-input" style="max-width:170px">
          <option value="new" ${!chk || chk.condition === 'new' ? 'selected' : ''}>Новое</option>
          <option value="used" ${chk && chk.condition === 'used' ? 'selected' : ''}>Б/У</option>
        </select>
        <button class="btn lime" onclick="applyPriceCheckFromForm('${componentId}')">Сохранить проверку</button>
      </div>
      ${chk ? `<button class="btn small ghost" onclick="clearPriceCheck('${componentId}')">Удалить проверку</button>` : ''}
    </div>
  </div>`;
  m.classList.add('open');
}
function closePriceCheck() { $('#priceCheckModal')?.classList.remove('open'); }
function applyPriceCheckFromForm(id) {
  const p = $('#checkPriceInput')?.value || '';
  const market = $('#checkMarketSelect')?.value || 'вручную';
  const cond = $('#checkCondSelect')?.value || 'new';
  submitPriceCheck(id, p, market, cond);
  const chk = priceCheckFor(id);
  if (chk) { closePriceCheck(); toast(priceVerdict(chk).short); }
}
function clearPriceCheck(id) {
  const m = loadPriceChecks();
  delete m[id];
  savePriceChecks(m);
  closePriceCheck();
  toast('Проверка удалена');
  render();
}


// ---------- Поиск внутри сайта: браузер сам забирает данные через публичные CORS-шлюзы ----------
// Прямые запросы к Авито/Юле/DNS из браузера блокирует CORS, поэтому идём через шлюзы,
// которые добавляют заголовки доступа (их можно поменять в настройках ниже).

const LIVE_GATEWAYS = [
  { id: 'corsproxy', name: 'corsproxy.io', wrap: u => 'https://corsproxy.io/?url=' + encodeURIComponent(u) },
  { id: 'allorigins', name: 'allorigins', wrap: u => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u) },
  { id: 'codetabs', name: 'codetabs', wrap: u => 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(u) },
];

function liveGatewayUrl(target) {
  const g = LIVE_GATEWAYS.find(x => x.id === (state.liveGateway || 'corsproxy')) || LIVE_GATEWAYS[0];
  return g.wrap(target);
}

async function liveGet(url, { timeout = 15000, json = true } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(liveGatewayUrl(url), { signal: ctrl.signal, headers: { accept: 'application/json,text/html;q=0.9,*/*' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = await res.text();
    if (!json) return text;
    try { return JSON.parse(text); } catch (e) { throw new Error('ответ не JSON (шлюз вернул страницу, а не данные)'); }
  } finally { clearTimeout(timer); }
}

// Достаём массив из любого формата ответа, не падая на неожиданном типе
function liveArr(...cands) {
  for (const c of cands) {
    if (Array.isArray(c)) return c;
    if (c && Array.isArray(c.data)) return c.data;
    if (c && Array.isArray(c.items)) return c.items;
  }
  return [];
}
const liveNum = v => Number(String(v == null ? '' : v).replace(/[^\d]/g, '')) || 0;

// Юла: web-api поиска, сортировка по возрастанию цены
async function liveSourceYoula(q, cityName) {
  const u = `https://youla.ru/web-api/search?query=${encodeURIComponent(q)}&page=1&limit=40&sort=price-asc`;
  const data = await liveGet(u);
  const items = liveArr(data && data.products, data && data.data, data && data.items, data);
  return items.map(p => {
    const price = liveNum(p.price ?? p.priceValue ?? p.attributes?.price);
    if (!price) return null;
    const href = p.url || p.link || '';
    return {
      title: p.name || p.title || 'Объявление',
      price, source: 'Юла',
      condition: /нов/i.test(String(p.condition || p.state || '')) ? 'new' : 'used',
      city: p.city?.name || cityName,
      url: href ? (String(href).startsWith('http') ? href : 'https://youla.ru' + href) : `https://youla.ru/search?q=${encodeURIComponent(q)}`,
      published: p.published_at || p.date || '',
    };
  }).filter(Boolean);
}

// Авито: публичный поисковый API веб-версии (ключ зашит в самом сайте Авито)
async function liveSourceAvito(q, cityName, cityId) {
  const slug = AVITO_CITY[cityId] || 'all';
  const key = 'af0deccbgcgidddjgnvljitntccdduijhivnodduijhw';
  const variants = [
    `https://www.avito.ru/web/1/main/items?key=${key}&query=${encodeURIComponent(q)}&sort=priceAsc&location=${encodeURIComponent(cityName || 'Россия')}`,
    `https://m.avito.ru/api/11/items?key=${key}&query=${encodeURIComponent(q)}&sort=priceAsc`,
  ];
  let lastErr = null;
  for (const u of variants) {
    try {
      const data = await liveGet(u);
      const items = liveArr(data && data.result && data.result.items, data && data.items, data && data.result, data);
      const rows = items.map(i => {
        const price = liveNum(i.priceDetailed?.value ?? i.price?.value ?? i.price);
        if (!price) return null;
        const href = i.url || i.urlPath || '';
        return {
          title: i.title || i.name || 'Объявление',
          price, source: 'Авито',
          condition: /Нов/i.test(String(i.condition || i.state || '')) ? 'new' : 'used',
          city: i.location?.name || i.geo?.name || cityName,
          url: href ? (String(href).startsWith('http') ? href : 'https://www.avito.ru' + href) : `https://www.avito.ru/${slug}?q=${encodeURIComponent(q)}&s=1`,
          published: i.time || i.sortTime || '',
        };
      }).filter(Boolean);
      if (rows.length) return rows;
    } catch (e) { lastErr = e; }
  }
  if (lastErr) throw lastErr;
  return [];
}

// DNS: REST-поиск магазина
async function liveSourceDns(q, cityName) {
  const u = `https://restapi.dns-shop.ru/v1/search?q=${encodeURIComponent(q)}&limit=40`;
  const data = await liveGet(u);
  const items = liveArr(data && data.data && data.data.items, data && data.items, data && data.products, data && data.data, data);
  return items.map(i => {
    const price = liveNum(i.price?.current ?? i.price ?? i.minPrice);
    if (!price) return null;
    const href = i.url || '';
    return {
      title: i.name || i.title || 'Товар DNS',
      price, source: 'DNS', condition: 'new', city: cityName,
      url: href ? (String(href).startsWith('http') ? href : 'https://www.dns-shop.ru' + href) : `https://www.dns-shop.ru/search/?q=${encodeURIComponent(q)}`,
      published: '',
    };
  }).filter(Boolean);
}

// Citilink: разметка страницы поиска
async function liveSourceCitilink(q, cityName) {
  const html = await liveGet(`https://www.citilink.ru/search/?text=${encodeURIComponent(q)}`, { json: false });
  const rows = [];
  const re = /"name"\s*:\s*"([^"]{3,120})"[\s\S]{0,400}?"price"\s*:\s*"?(\d{3,7})"?/g;
  let m;
  while ((m = re.exec(html)) && rows.length < 40) {
    rows.push({ title: m[1], price: Number(m[2]), source: 'Citilink', condition: 'new', city: cityName,
      url: `https://www.citilink.ru/search/?text=${encodeURIComponent(q)}`, published: '' });
  }
  return rows;
}

const LIVE_SOURCE_FNS = { youla: liveSourceYoula, avito: liveSourceAvito, dns: liveSourceDns, citilink: liveSourceCitilink };

function liveActiveSources() {
  const all = Object.keys(LIVE_SOURCE_FNS);
  const off = state.liveOff || [];
  return all.filter(s => !off.includes(s));
}

// Главный поиск: асинхронно, с прогрессом по источникам, результат сразу отсортирован по цене
async function liveSearch(query) {
  const q = String(query || '').trim();
  if (!q) { toast('Введите запрос: например RTX 4070'); return null; }
  const city = cityById(state.region) || { name: '', id: 'all' };
  const sources = liveActiveSources();
  state.liveBusy = true;
  state.liveError = '';
  state.liveErrorHtml = '';
  state.liveQuery = q;
  state.liveOffers = [];
  state.liveProgress = {};
  sources.forEach(s => { state.liveProgress[s] = 'wait'; });
  render();
  const t0 = Date.now();

  const tasks = sources.map(async src => {
    state.liveProgress[src] = 'run';
    render();
    try {
      const rows = await LIVE_SOURCE_FNS[src](q, city.name, city.id);
      state.liveProgress[src] = rows.length ? 'ok' : 'empty';
      state.liveOffers = state.liveOffers.concat(rows.map(r => ({ ...r, sourceId: src })));
      state.liveOffers.sort((a, b) => a.price - b.price);
      render();
      return rows;
    } catch (e) {
      state.liveProgress[src] = 'fail';
      state.liveErrors = { ...(state.liveErrors || {}), [src]: String(e.message || e) };
      render();
      return [];
    }
  });
  await Promise.all(tasks);

  // убрать дубли «название+цена» и отсортировать от дешёвого
  const seen = new Set();
  state.liveOffers = state.liveOffers.filter(o => {
    const k = String(o.title).toLowerCase().slice(0, 50) + '|' + o.price;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).sort((a, b) => a.price - b.price);
  state.liveCity = city.name;
  state.liveAt = new Date().toLocaleString('ru-RU');
  state.liveTook = Date.now() - t0;
  state.liveBusy = false;

  const okCount = sources.filter(s => state.liveProgress[s] === 'ok').length;
  if (!state.liveOffers.length) {
    const errs = Object.entries(state.liveErrors || {}).map(([k, v]) => k + ': ' + v);
    state.liveError = okCount
      ? 'Источники ответили, но объявлений по запросу нет'
      : 'Ни один источник не ответил' + (errs.length ? ' — ' + errs.join('; ') : '');
  } else {
    state.liveError = '';
    saveLiveHistory(q);
    // подтянуть проверку цены: самый дешёвый факт по позиции
    const best = state.liveOffers[0];
    state.liveBest = best;
  }
  render();
  return state.liveOffers;
}

// ---------- Серверный прокси с реальными ценами (необязательный) ----------
function liveProxyUrl() { return state.liveProxy || ''; }
function setLiveProxy(url) {
  state.liveProxy = String(url || '').trim().replace(/\/$/, '');
  try { localStorage.setItem('blf.liveproxy', state.liveProxy); } catch (e) {}
  render();
}
function loadLiveProxy() {
  try { state.liveProxy = localStorage.getItem('blf.liveproxy') || ''; } catch (e) {}
  // если сайт открыт с самого прокси — используем текущий origin автоматически
  if (!state.liveProxy && liveSameOrigin()) state.liveProxy = location.origin;
}

// Разбор причины «Failed to fetch» — 90% случаев это mixed content или прокси не запущен
function liveProxyDiagnose(url) {
  const u = String(url || '').trim();
  if (!u) return { ok: false, code: 'empty', msg: 'Адрес прокси не указан.' };
  if (!/^https?:\/\//i.test(u)) return { ok: false, code: 'schema', msg: 'Адрес должен начинаться с https:// или http:// (например https://prices.example.ru).' };
  if (location.protocol === 'https:' && /^http:\/\//i.test(u)) {
    return { ok: false, code: 'mixed', msg: 'Страница открыта по https, а прокси — по http: браузер блокирует такие запросы (mixed content). Нужен https-адрес прокси или локальный вариант: сохранить JSON в файл и вставить его в блок ниже.' };
  }
  return { ok: true, code: 'ok', msg: 'Адрес выглядит корректно.' };
}

// Сайт открыт с прокси (тот же адрес) — тогда запросы разрешены автоматически, CORS не нужен
function liveSameOrigin() {
  return /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(location.host);
}

function liveErrorHelp(err) {
  const raw = String((err && (err.message || err)) || '');
  const base = liveProxyUrl();
  const diag = liveProxyDiagnose(base);
  const tips = [];
  if (liveSameOrigin() && /fetch|Mixed|Failed/i.test(raw)) {
    tips.push('Похоже, прокси остановлен. Перезапустите его в терминале: <code>node server/prices-proxy.js</code> и обновите страницу.');
    tips.push('Или вставьте JSON вручную в блоке ниже — это работает без сервера.');
    return `<div class="live-error-box"><b>Не удалось получить живые цены.</b>
      <div class="small">Причина: <code>${esc(raw)}</code></div>
      <ol class="small">${tips.map(t => `<li>${t}</li>`).join('')}</ol></div>`;
  }
  tips.push('Проверьте, что прокси запущен: в терминале <code>node server/prices-proxy.js</code>, в браузере откройте <code>' + esc(base || 'http://localhost:8787') + '/health</code> — должно быть <code>{"ok":true}</code>.');
  if (/Failed to fetch|NetworkError|Load failed/i.test(raw)) {
    tips.push('Если прокси на вашем компьютере — откройте сайт локально (<code>python3 -m http.server</code> в папке сайта) или туннелем с https (cloudflared/ngrok) и укажите этот адрес.');
    tips.push('Если прокси не запущен совсем — используйте режим «Вставить JSON» ниже: он работает без сервера.');
  }
  if (!diag.ok) tips.unshift(diag.msg);
  return `<div class="live-error-box">
    <b>Не удалось получить живые цены.</b>
    <div class="small">Причина: <code>${esc(raw)}</code></div>
    <ol class="small">${tips.map(t => `<li>${t}</li>`).join('')}</ol>
    <div class="small muted">Сайт — статика (GitHub Pages): без прокси живые цены физически недоступны, поэтому есть кнопки проверки на Авито/Юле и режим вставки JSON.</div>
  </div>`;
}

async function liveFetchPrices(query) {
  const base = liveProxyUrl();
  const diag = liveProxyDiagnose(base);
  state.liveError = '';
  state.liveErrorHtml = '';
  state.liveBusy = true;
  render();
  if (!diag.ok) {
    state.liveBusy = false;
    state.liveError = diag.msg;
    state.liveErrorHtml = liveErrorHelp(new Error(diag.code === 'mixed' ? 'Mixed Content' : 'Некорректный адрес'));
    render();
    return null;
  }
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    const city = (cityById(state.region) || {}).name || '';
    const res = await fetch(`${base}/api/prices?q=${encodeURIComponent(query)}&city=${encodeURIComponent(city)}&limit=30`, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    state.liveOffers = Array.isArray(data.offers) ? data.offers : [];
    state.liveSources = data.sources || null;
    state.liveQuery = query;
    state.liveAt = new Date().toLocaleString('ru-RU');
    if (!state.liveOffers.length) {
      const failed = Object.entries(data.sources || {}).filter(([, v]) => !v.ok).map(([k, v]) => k + ': ' + v.error);
      state.liveError = failed.length
        ? 'Прокси доступен, но сайты не ответили — ' + failed.join(', ')
        : 'Прокси ответил, но объявлений не нашлось';
    }
  } catch (e) {
    state.liveError = String(e.message || e);
    state.liveErrorHtml = liveErrorHelp(e);
    state.liveOffers = [];
  }
  state.liveBusy = false;
  render();
  return state.liveOffers;
}

// Быстрая проверка прокси: /health + задержка
async function liveProxyPing() {
  const base = liveProxyUrl();
  const diag = liveProxyDiagnose(base);
  if (!diag.ok) { toast(diag.msg); state.liveError = diag.msg; state.liveErrorHtml = liveErrorHelp(new Error('check')); render(); return; }
  state.liveBusy = true; state.livePing = null; render();
  const t0 = Date.now();
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(base + '/health', { signal: ctrl.signal });
    clearTimeout(timer);
    const data = await res.json();
    state.livePing = { ok: !!data.ok, ms: Date.now() - t0, sources: data.sources || [] };
    state.liveError = ''; state.liveErrorHtml = '';
  } catch (e) {
    state.livePing = { ok: false, ms: Date.now() - t0, error: String(e.message || e) };
    state.liveErrorHtml = liveErrorHelp(e);
  }
  state.liveBusy = false;
  render();
}

// Режим без CORS: вставить JSON от прокси (или свой список объявлений)
function livePasteJson(raw) {
  state.livePasteRaw = String(raw || '');
  render();
}
function liveApplyPasted() {
  const raw = String(state.livePasteRaw || '').trim();
  if (!raw) { toast('Вставьте JSON из ответа прокси'); return; }
  try {
    const data = JSON.parse(raw);
    const offers = Array.isArray(data) ? data : (data.offers || []);
    state.liveOffers = offers
      .map(o => ({ ...o, price: Number(String(o.price).replace(/[^\d]/g, '')) }))
      .filter(o => o.price > 0)
      .sort((a, b) => a.price - b.price);
    state.liveAt = new Date().toLocaleString('ru-RU') + ' (из файла)';
    state.liveError = ''; state.liveErrorHtml = ''; state.livePasteOpen = false;
    toast(`Загружено объявлений: ${state.liveOffers.length}`);
  } catch (e) {
    toast('Это не JSON: ' + e.message);
  }
  render();
}
function liveClearPasted() { state.liveOffers = []; state.livePasteRaw = ''; render(); }

function liveOffersHtml(query) {
  const rows = state.liveOffers || [];
  const base = liveProxyUrl();
  const ping = state.livePing;
  return `<div class="live-block">
    <div class="live-block-head">
      <b>📡 Живые объявления</b>
      <span class="small muted">${base ? (state.liveAt ? 'данные от ' + esc(state.liveAt) : 'прокси указан') : 'прокси не подключён — ниже кнопки ручной проверки и режим вставки JSON'}</span>
    </div>
    <div class="live-proxy-row">
      <input class="modal-input" placeholder="Адрес прокси цен, например https://prices.example.ru" value="${esc(base)}"
        onchange="setLiveProxy(this.value)">
      <button class="btn small ghost" onclick="liveProxyPing()" ${state.liveBusy ? 'disabled' : ''}>Проверить прокси</button>
      <button class="btn small" onclick="liveFetchPrices(state.priceQuery || '')" ${state.liveBusy ? 'disabled' : ''}>
        ${state.liveBusy ? 'Ищу…' : 'Подтянуть живые цены'}
      </button>
    </div>
    ${liveSameOrigin() ? `<div class="small good">✅ Сайт открыт с прокси — живые цены доступны без CORS.</div>`
      : `<div class="small muted">💡 <b>Проще всего:</b> запустите <code>node server/prices-proxy.js</code> и откройте сайт по адресу <a href="http://localhost:8787/" target="_blank" rel="noopener">http://localhost:8787/</a> — прокси отдаёт и сайт, и цены с одного адреса, никакого CORS. GitHub Pages остаётся публичной версией с оценками и кнопками проверки.</div>`}
    ${ping ? `<div class="small ${ping.ok ? 'good' : 'bad'}">${ping.ok
      ? `✅ Прокси отвечает за ${ping.ms} мс${ping.sources.length ? ' · источники: ' + esc(ping.sources.join(', ')) : ''}`
      : `❌ Прокси не отвечает (${ping.ms} мс): ${esc(ping.error || 'нет ответа')}`}</div>` : ''}
    ${state.liveError && !state.liveErrorHtml ? `<div class="small bad">${esc(state.liveError)}</div>` : ''}
    ${state.liveErrorHtml ? state.liveErrorHtml : ''}
    ${rows.length ? `<div class="live-rows">${rows.map(r => `<div class="offer">
        <div class="grow">
          <b>${esc(r.title || '')}</b> <span class="badge ${r.condition === 'used' ? 'used' : 'new'}">${r.condition === 'used' ? 'Б/У' : 'Новое'}</span>
          <div class="small muted">${esc(r.source || '')}${r.city ? ' · ' + esc(r.city) : ''}${r.published ? ' · ' + esc(r.published) : ''}</div>
        </div>
        <div style="text-align:right">
          <div class="price-big">${fmt(r.price)}</div>
          ${r.url ? `<a class="btn small ghost" href="${esc(r.url)}" target="_blank" rel="noopener">Открыть ↗</a>` : ''}
        </div>
      </div>`).join('')}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn small ghost" onclick="liveClearPasted()">Очистить объявления</button>
        <button class="btn small ghost" onclick="liveExportPrices()">Сохранить JSON файлом</button>
      </div>` : ''}
    <div class="live-paste">
      <button class="btn small ghost" onclick="state.livePasteOpen=!state.livePasteOpen;render()">
        ${state.livePasteOpen ? '▾' : '▸'} Работает без сервера: вставить JSON от прокси
      </button>
      ${state.livePasteOpen ? `<div class="live-paste-body">
        <div class="small muted">Запустите прокси локально и откройте в браузере
          <code>http://localhost:8787/api/prices?q=${encodeURIComponent(String(query || state.priceQuery || 'rtx 4070'))}&city=${encodeURIComponent((cityById(state.region) || {}).name || 'Москва')}</code>
          — скопируйте ответ и вставьте сюда. Так CORS и mixed content не мешают.</div>
        <textarea class="live-paste-area" oninput="livePasteJson(this.value)" placeholder='{"offers":[{"title":"RTX 4070","price":52990,"source":"Авито","condition":"used","city":"Новосибирск","url":"https://..."}]}'>${esc(state.livePasteRaw || '')}</textarea>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
          <button class="btn small lime" onclick="liveApplyPasted()">Применить JSON</button>
          <button class="btn small ghost" onclick="state.livePasteRaw='';state.livePasteOpen=false;render()">Отмена</button>
        </div>
      </div>` : ''}
    </div>
    <div class="small muted">Прокси — файл <b>server/prices-proxy.js</b> (Node.js, без зависимостей). Запуск: <code>node server/prices-proxy.js</code>.
      Для сайта на GitHub Pages нужен https-адрес (или локальный запуск сайта). Правила Авито/Юлы ограничивают парсинг — используйте для личной проверки.</div>
  </div>`;
}

function liveExportPrices() {
  const data = { offers: state.liveOffers || [], at: state.liveAt || '', query: state.liveQuery || '' };
  const text = JSON.stringify(data, null, 2);
  if (typeof downloadText === 'function') { downloadText('blf-live-prices.json', text); return; }
  const a = document.createElement('a');
  a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(text);
  a.download = 'blf-live-prices.json';
  a.click();
}


// Переход к живому поиску с главной/шапки: сразу открываем «Цены» и запускаем запрос
function liveGoSearch(query) {
  const q = String(query || '').trim();
  state.priceQuery = q;
  navigate('prices');
  if (q && typeof liveSearch === 'function') liveSearch(q);
}

// ---------- Встроенный поиск на странице «Цены» (без прокси) ----------
const LIVE_CITY_IDS = ['nsk','msk','spb','ekb','kzn','nnov','chelyab','samara','omsk','rostov','ufa','krasnoyarsk','voronezh','perm','volgograd','krasnodar','saratov','tyumen'];

function liveSearchHtml() {
  const q = state.priceQuery || '';
  const city = cityById(state.region) || { name: '', icon: '📍' };
  const sort = state.liveSort || 'cheap';
  const cond = state.liveCond || 'all';
  let offers = (state.liveOffers || []).filter(o => cond === 'all' || o.condition === cond);
  if (sort === 'expensive') offers = offers.slice().sort((a, b) => b.price - a.price);
  else if (sort === 'new') offers = offers.slice().sort((a, b) => (a.condition === 'new' ? 0 : 1) - (b.condition === 'new' ? 0 : 1) || a.price - b.price);
  else offers = offers.slice().sort((a, b) => a.price - b.price);
  const srcName = { youla: 'Юла', avito: 'Авито', dns: 'DNS', citilink: 'Citilink' };
  const badge = st => st === 'run' ? '<span class="live-dot run"></span>ищу…'
    : st === 'ok' ? '<span class="live-dot ok"></span>есть'
    : st === 'empty' ? '<span class="live-dot mid"></span>пусто'
    : st === 'fail' ? '<span class="live-dot fail"></span>ошибка'
    : '<span class="live-dot mid"></span>в очереди';
  const cheapest = offers.length ? offers[0] : null;
  const avg = offers.length ? Math.round(offers.reduce((a, b) => a + b.price, 0) / offers.length) : 0;

  return `<div class="live-search">
    <div class="live-search-head">
      <b>🔎 Живой поиск цен по сайтам</b>
      <span class="small muted">браузер сам забирает объявления с Авито, Юлы, DNS и Citilink через CORS-шлюз — без установки программ</span>
    </div>
    <div class="live-search-row">
      <input class="modal-input" id="liveQueryInput" placeholder="Что искать: RTX 4070, Ryzen 5 5600, DDR4 16 ГБ…"
        value="${esc(q)}" oninput="state.priceQuery=this.value"
        onkeydown="if(event.key==='Enter'){liveSearch(this.value)}">
      <button class="btn lime" onclick="liveSearch(document.getElementById('liveQueryInput').value)" ${state.liveBusy ? 'disabled' : ''}>
        ${state.liveBusy ? 'Ищу на сайтах…' : 'Найти цены'}
      </button>
    </div>
    <div class="live-search-row small">
      <label class="small muted">Город:</label>
      <select class="modal-input" style="max-width:230px" onchange="state.region=this.value;if(state.liveQuery)liveSearch(state.liveQuery);else render()">
        ${LIVE_CITY_IDS.map(id => cityById(id)).filter(Boolean).map(c => `<option value="${c.id}" ${state.region === c.id ? 'selected' : ''}>${c.icon} ${esc(c.name)}</option>`).join('')}
        ${LIVE_CITY_IDS.includes(state.region) ? '' : `<option value="${state.region}" selected>${esc((regionById(state.region) || {}).name || '')}</option>`}
      </select>
      <button class="btn small ghost" onclick="openRegionModal()">Все ${CITIES.length} городов</button>
      <label class="small muted" style="margin-left:8px">Сортировка:</label>
      <select class="modal-input" style="max-width:210px" onchange="state.liveSort=this.value;render()">
        <option value="cheap" ${sort === 'cheap' ? 'selected' : ''}>Сначала самые дешёвые</option>
        <option value="expensive" ${sort === 'expensive' ? 'selected' : ''}>Сначала дорогие</option>
        <option value="new" ${sort === 'new' ? 'selected' : ''}>Только новые сверху</option>
      </select>
      <select class="modal-input" style="max-width:180px" onchange="state.liveCond=this.value;render()">
        <option value="all" ${cond === 'all' ? 'selected' : ''}>Новые и БУ</option>
        <option value="new" ${cond === 'new' ? 'selected' : ''}>Только новые</option>
        <option value="used" ${cond === 'used' ? 'selected' : ''}>Только БУ</option>
      </select>
    </div>
    ${(state.liveHistory || []).length ? `<div class="live-history small muted">Последние запросы:
      ${state.liveHistory.map(h => `<button class="chip" onclick="state.priceQuery='${esc(h).replace(/'/g, '')}';liveSearch('${esc(h).replace(/'/g, '')}')">${esc(h)}</button>`).join('')}
    </div>` : ''}

    <div class="live-sources">
      ${Object.keys(LIVE_SOURCE_FNS).map(src => `<span class="live-src">
        ${badge(state.liveProgress?.[src])} ${srcName[src]}
        ${(state.liveErrors || {})[src] ? `<span class="small bad" title="${esc(state.liveErrors[src])}">— ${esc(String(state.liveErrors[src]).slice(0, 40))}</span>` : ''}
      </span>`).join('')}
      ${state.liveAt ? `<span class="small muted">· обновлено ${esc(state.liveAt)}${state.liveTook ? ' за ' + (state.liveTook / 1000).toFixed(1) + ' с' : ''}</span>` : ''}
    </div>

    ${state.liveError ? `<div class="live-error-box">${esc(state.liveError)}</div>` : ''}

    ${offers.length ? `<div class="live-summary">
      <span>Найдено: <b>${offers.length}</b> в ${esc(state.liveCity || city.name)}</span>
      <span>Самый дешёвый: <b class="good">${fmt(cheapest.price)}</b> · ${esc(cheapest.source)}</span>
      <span>Средняя: <b>${fmt(avg)}</b></span>
      <button class="btn small ghost" onclick="liveExportPrices()">⬇ JSON</button>
      <button class="btn small ghost" onclick="liveClearPasted()">Сбросить</button>
    </div>
    <div class="live-rows">
      ${offers.map((r, i) => `<div class="offer live-offer ${i === 0 ? 'best' : ''}">
        <div class="grow">
          <b>${esc(r.title)}</b>
          <span class="badge ${r.condition === 'used' ? 'used' : 'new'}">${r.condition === 'used' ? 'Б/У' : 'Новое'}</span>
          <span class="badge region">${esc(r.source)}</span>
          ${i === 0 ? '<span class="badge best">💸 самый дешёвый</span>' : ''}
          <div class="small muted">${r.city ? esc(r.city) + ' · ' : ''}${r.published ? esc(r.published) + ' · ' : ''}${avg ? Math.round((r.price - avg) / avg * 100) + '% к средней' : ''}</div>
        </div>
        <div style="text-align:right">
          <div class="price-big">${fmt(r.price)}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">
            ${r.url ? `<a class="btn small ghost" href="${esc(r.url)}" target="_blank" rel="noopener">Открыть ↗</a>` : ''}
            <button class="btn small" onclick="openLiveCheck(${i})">Это моя цена</button>
          </div>
        </div>
      </div>`).join('')}
    </div>` : (state.liveBusy ? '<div class="empty">Ищу на Авито, Юле, DNS и Citilink… первые результаты появятся через пару секунд.</div>'
      : `<div class="empty">Введите запрос и нажмите «Найти цены» — покажу объявления по городу ${esc(city.name)} от самого дешёвого.<br>
        <span class="small muted">Если шлюз заблокирован — откройте раздел «Настройки шлюза» ниже и выберите другой.</span></div>`)}

    ${!offers.length && !state.liveBusy ? `<div class="live-manual">
      <div class="small muted" style="margin-bottom:6px">Шлюзы не отвечают? Проверьте пару сайтов вручную и вбейте цену — она сохранится для позиции каталога.</div>
      <div class="live-search-row">
        <input class="modal-input" id="liveManualPrice" inputmode="numeric" placeholder="Цена, ₽ — например 52 990" style="max-width:220px">
        <button class="btn small" onclick="liveManualSave()">Сохранить как факт</button>
      </div>
    </div>` : ''}

    <details class="live-settings">
      <summary class="small muted">⚙️ Настройки шлюза и источников</summary>
      <div class="small muted" style="margin:8px 0">Прямые запросы к магазинам браузер блокирует (CORS), поэтому используется публичный прокси-шлюз. Если один не работает — переключите.</div>
      <div class="live-search-row">
        <select class="modal-input" style="max-width:280px" onchange="state.liveGateway=this.value;render()">
          ${LIVE_GATEWAYS.map(g => `<option value="${g.id}" ${(state.liveGateway || 'corsproxy') === g.id ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}
        </select>
        ${Object.keys(LIVE_SOURCE_FNS).map(src => `<label class="small"><input type="checkbox" ${(state.liveOff || []).includes(src) ? '' : 'checked'}
          onchange="toggleLiveSource('${src}', this.checked)"> ${srcName[src]}</label>`).join('')}
      </div>
      <div class="small muted">Без шлюза остаются кнопки проверки на Авито/Юле (откроется поиск на сайте) и режим прокси-сервера ниже.</div>
    </details>
  </div>`;
}

function toggleLiveSource(src, on) {
  const off = new Set(state.liveOff || []);
  if (on) off.delete(src); else off.add(src);
  state.liveOff = [...off];
  try { localStorage.setItem('blf.liveoff', JSON.stringify(state.liveOff)); } catch (e) {}
  render();
}

// Ручной факт, когда шлюзы не отвечают: цена из формы + запрос из поля поиска
function liveManualSave() {
  const raw = ($('#liveManualPrice') || {}).value || '';
  const q = state.priceQuery || '';
  if (!q) { toast('Сначала введите запрос в поле поиска'); return; }
  const hit = COMPONENTS.find(c => liveScoreMatch(c, q, q) > 0.4) || COMPONENTS.find(c => liveScoreMatch(c, q + ' ' + q, q) > 0.25);
  if (!hit) { toast('Не нашёл позицию каталога по запросу — уточните модель (например «RTX 4070» или «Ryzen 5 5600»'); return; }
  submitPriceCheck(hit.id, raw, 'вручную', 'new');
}

// «Это моя цена» — берём найденное объявление и сохраняем как проверку для позиции каталога
function openLiveCheck(idx) {
  const o = (state.liveOffers || [])[idx];
  if (!o) return;
  const hit = COMPONENTS.find(c => liveScoreMatch(c, o.title, state.liveQuery) > 0.4);
  if (!hit) { toast('Не понял, к какой позиции каталога это относится — уточните запрос'); return; }
  submitPriceCheck(hit.id, o.price, o.source, o.condition);
  toast(`${hit.name}: факт ${fmt(o.price)} (${o.source}) сохранён`);
}
function liveScoreMatch(c, title, query) {
  const t = String(title || '').toLowerCase();
  const q = String(query || '').toLowerCase();
  const name = String(c.name || '').toLowerCase();
  const num = (name.match(/\d{3,4}/g) || []).filter(n => n.length >= 3);
  let score = 0;
  if (q && name.includes(q)) score += 0.6;
  num.forEach(n => { if (t.includes(n)) score += 0.3; });
  const brand = String(c.brand || '').toLowerCase().split(' ')[0];
  if (brand && t.includes(brand)) score += 0.2;
  return Math.min(1, score);
}

// ---------- Плашка «это оценка» для страниц с ценами ----------
function priceHonestyNote() {
  return `<div class="price-note">
    <b>ℹ️ Это расчётная оценка, а не данные магазинов.</b>
    Цены считаются по базовой цене позиции с коэффициентом города и магазина — они нужны для сравнения сборок между собой.
    Точную цену смотрите по кнопкам «Авито / Юла / DNS / Citilink…» и сохраняйте факт кнопкой «Я нашёл за…» — тогда карточка и сборка покажут вашу проверенную цену.
  </div>`;
}
