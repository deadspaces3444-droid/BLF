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
function loadLiveProxy() { try { state.liveProxy = localStorage.getItem('blf.liveproxy') || ''; } catch (e) {} }

async function liveFetchPrices(query) {
  const base = liveProxyUrl();
  if (!base) { toast('Укажите адрес прокси цен — инструкция в README (server/prices-proxy.js)'); return null; }
  state.liveBusy = true;
  state.liveError = '';
  render();
  try {
    const city = (cityById(state.region) || {}).name || '';
    const res = await fetch(`${base}/api/prices?q=${encodeURIComponent(query)}&city=${encodeURIComponent(city)}&limit=30`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    state.liveOffers = Array.isArray(data.offers) ? data.offers : [];
    state.liveQuery = query;
    state.liveAt = new Date().toLocaleString('ru-RU');
    if (!state.liveOffers.length) state.liveError = 'Прокси ответил, но объявлений не нашлось';
  } catch (e) {
    state.liveError = 'Не удалось получить живые цены: ' + e.message;
    state.liveOffers = [];
  }
  state.liveBusy = false;
  render();
  return state.liveOffers;
}

function liveOffersHtml(query) {
  const rows = state.liveOffers || [];
  const base = liveProxyUrl();
  return `<div class="live-block">
    <div class="live-block-head">
      <b>📡 Живые объявления</b>
      <span class="small muted">${base ? (state.liveAt ? 'обновлено ' + esc(state.liveAt) : 'прокси подключён') : 'прокси не подключён — ниже ссылки на ручную проверку'}</span>
    </div>
    <div class="live-proxy-row">
      <input class="modal-input" placeholder="Адрес прокси цен, например https://prices.example.ru" value="${esc(base)}"
        onchange="setLiveProxy(this.value)">
      <button class="btn small" onclick="liveFetchPrices(state.priceQuery || '${esc(String(query || '').replace(/'/g, ''))}')" ${state.liveBusy ? 'disabled' : ''}>
        ${state.liveBusy ? 'Ищу…' : 'Подтянуть живые цены'}
      </button>
    </div>
    ${state.liveError ? `<div class="small bad">${esc(state.liveError)}</div>` : ''}
    ${rows.length ? `<div class="live-rows">${rows.map(r => `<div class="offer">
        <div class="grow">
          <b>${esc(r.title || '')}</b> <span class="badge ${r.condition === 'used' ? 'used' : 'new'}">${r.condition === 'used' ? 'Б/У' : 'Новое'}</span>
          <div class="small muted">${esc(r.source || '')}${r.city ? ' · ' + esc(r.city) : ''}${r.published ? ' · ' + esc(r.published) : ''}</div>
        </div>
        <div style="text-align:right">
          <div class="price-big">${fmt(r.price)}</div>
          ${r.url ? `<a class="btn small ghost" href="${esc(r.url)}" target="_blank" rel="noopener">Открыть ↗</a>` : ''}
        </div>
      </div>`).join('')}</div>` : ''}
    <div class="small muted">Прокси — маленький Node.js-сервер (файл <b>server/prices-proxy.js</b>), который запрашивает Авито/Юлу/магазины и отдаёт нормализованный JSON. Сайт статический, поэтому без прокси живые цены недоступны: браузер не может напрямую обратиться к этим сайтам (CORS, антибот).</div>
  </div>`;
}

// ---------- Плашка «это оценка» для страниц с ценами ----------
function priceHonestyNote() {
  return `<div class="price-note">
    <b>ℹ️ Это расчётная оценка, а не данные магазинов.</b>
    Цены считаются по базовой цене позиции с коэффициентом города и магазина — они нужны для сравнения сборок между собой.
    Точную цену смотрите по кнопкам «Авито / Юла / DNS / Citilink…» и сохраняйте факт кнопкой «Я нашёл за…» — тогда карточка и сборка покажут вашу проверенную цену.
  </div>`;
}
