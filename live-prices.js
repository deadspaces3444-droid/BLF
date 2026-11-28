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

// ---------- Плашка «это оценка» для страниц с ценами ----------
function priceHonestyNote() {
  return `<div class="price-note">
    <b>ℹ️ Это расчётная оценка, а не данные магазинов.</b>
    Цены считаются по базовой цене позиции с коэффициентом города и магазина — они нужны для сравнения сборок между собой.
    Точную цену смотрите по кнопкам «Авито / Юла / DNS / Citilink…» и сохраняйте факт кнопкой «Я нашёл за…» — тогда карточка и сборка покажут вашу проверенную цену.
  </div>`;
}
