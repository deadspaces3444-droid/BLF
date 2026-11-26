// ===== BLF — логика сайта =====
const MAIN_CITY_IDS = ['nsk','msk','spb','ekb','kzn','nnov','chelyab','samara','omsk','rostov','ufa','krasnoyarsk','voronezh','perm','volgograd','krasnodar','saratov','tyumen'];
const REF_CPU = 'cpu-i5-12400f';
const REF_GPU = 'gpu-rtx4070';
const REF_RAM = 'ram-kingston32';

const state = {
  region: 'nsk',
  page: 'home',
  compCat: 'all',
  compQuery: '',
  compSort: 'perf',
  compYear: 'all',
  compBrand: 'all',
  compFpsGame: 'cs2',
  compFpsRes: '1080p',
  compareCat: 'gpu',
  compareComps: { cpu: ['cpu-i5-12400f', 'cpu-r7-7800x3d'], gpu: ['gpu-rtx4070', 'gpu-rx7800xt'], motherboard: [], ram: [], ssd: [], psu: [], case: [], cooling: [] },
  compareQuery: '',
  compareBuilds: ['build-mid', 'build-high'],
  priceQuery: '', priceCat: 'all', priceCond: 'all', priceSort: 'cheap', priceMin: '', priceMax: '',
  builder: { cpu:'cpu-i5-12400f', gpu:'gpu-rtx4070', motherboard:'mb-b660m', ram:'ram-kingston32', ssd:'ssd-nv2-1tb', psu:'psu-rm750', case:'case-matrexx', cooling:'cool-peerless' },
  builderFpsRes: '1080p',
  fps: { cpu: 'cpu-i5-12400f', gpu: 'gpu-rtx4070', ram: 'ram-kingston32', game: 'cyberpunk', res: '1080p', settings: 'ultra' },
  regionQuery: '',
};

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const pct = (v, max = 100) => Math.max(3, Math.min(100, Math.round(v / max * 100)));

function topCities(n = 12) {
  const list = MAIN_CITY_IDS.map(id => cityById(id)).filter(Boolean);
  if (!list.some(c => c.id === state.region) && cityById(state.region)) list.unshift(cityById(state.region));
  return list.filter((c, i) => list.findIndex(x => x.id === c.id) === i).slice(0, n);
}

function navigate(page) {
  state.page = page;
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.page === page));
  $$('section.page').forEach(s => s.classList.toggle('active', s.id === 'page-' + page));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  render();
}
function setRegion(id) {
  const c = cityById(id);
  if (!c) return;
  state.region = id;
  const label = $('#regionBtnLabel');
  if (label) label.textContent = c.name;
  closeRegionModal();
  render();
}

// ---------- Модальное окно выбора города ----------
function searchCities(q) {
  const query = normalize(q);
  if (!query) return [...CITIES].sort((a, b) => {
    const ai = MAIN_CITY_IDS.indexOf(a.id), bi = MAIN_CITY_IDS.indexOf(b.id);
    if (ai !== -1 || bi !== -1) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    return a.name.localeCompare(b.name, 'ru');
  });
  return CITIES.filter(c => normalize(c.name).includes(query) || normalize(c.subject).includes(query))
    .sort((a, b) => {
      const an = normalize(a.name), bn = normalize(b.name);
      const as = an.startsWith(query) ? 0 : 1, bs = bn.startsWith(query) ? 0 : 1;
      return as - bs || a.name.localeCompare(b.name, 'ru');
    });
}
function renderRegionList(q = state.regionQuery) {
  const list = searchCities(q);
  const box = $('#regionList');
  if (!box) return;
  $('#regionCount').textContent = q
    ? `Найдено городов: ${list.length}`
    : `Всего ${CITIES.length} городов и регионов — начните вводить название`;
  box.innerHTML = list.slice(0, 600).map(c => `
    <button class="region-item ${c.id === state.region ? 'active' : ''}" onclick="setRegion('${c.id}')">
      <span>${c.icon} <b>${esc(c.name)}</b></span>
      <small>${esc(c.subject)}</small>
    </button>`).join('') || '<div class="empty">Город не найден. Попробуйте другое название.</div>';
}
function openRegionModal() {
  const modal = $('#regionModal');
  if (!modal) return;
  modal.classList.add('open');
  const inp = $('#regionModalInput');
  if (inp) { inp.value = ''; inp.focus(); }
  state.regionQuery = '';
  renderRegionList('');
}
function closeRegionModal() { $('#regionModal')?.classList.remove('open'); }

// ---------- Мелкие элементы ----------
function specRows(c) { return Object.entries(c.specs).map(([k, v]) => `<div>${k}: <b>${v}</b></div>`).join(''); }
function fpsBadge(fps) {
  if (!fps) return '<span class="badge">—</span>';
  const v = fpsVerdict(fps);
  return `<span class="fps-badge ${v.cls}">${fps} FPS · ${v.label}</span>`;
}
function compFps(c, gameId = state.compFpsGame, res = state.compFpsRes) {
  if (!gameId || gameId === 'all') {
    const vals = GAMES.map(g => {
      if (c.cat === 'gpu') return estimateFps(REF_CPU, c.id, REF_RAM, g.id, res);
      if (c.cat === 'cpu') return estimateFps(c.id, REF_GPU, REF_RAM, g.id, res);
      return null;
    }).filter(Boolean);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  }
  if (c.cat === 'gpu') return estimateFps(REF_CPU, c.id, REF_RAM, gameId, res);
  if (c.cat === 'cpu') return estimateFps(c.id, REF_GPU, REF_RAM, gameId, res);
  return null;
}

// ---------- Карточки ----------
function compCard(c) {
  const mp = minPrice(c.id, state.region, 'new');
  const mpUsed = minPrice(c.id, state.region, 'used');
  const base = mp ?? c.basePrice;
  const fps = compFps(c);
  const gameName = state.compFpsGame === 'all' ? 'средний по 20 играм' : (GAMES.find(g => g.id === state.compFpsGame)?.name || '');
  const pair = c.cat === 'gpu' ? 'с i5-12400F' : c.cat === 'cpu' ? 'с RTX 4070' : '';
  return `<article class="card">
    <div class="tag">${catById(c.cat).name} · ${esc(c.brand)} · ${c.year}</div>
    <h3>${esc(c.name)}</h3>
    <div class="specs-mini">${specRows(c)}</div>
    <div class="meter-label"><span>Игровой индекс</span><b>${c.perf}/100</b></div>
    <div class="bar"><i style="width:${c.perf}%"></i></div>
    ${fps ? `<div class="fps-inline">🎯 ${fps} FPS <span class="muted small">· ${gameName} ${state.compFpsRes} ${pair}</span></div>` : ''}
    <div class="row">
      <div><span class="price">${fmt(base)}</span> <span class="muted small">мин. в регионе</span><br>
      ${mpUsed ? `<span class="small" style="color:#fda4af">БУ от ${fmt(mpUsed)}</span>` : '<span class="small muted">БУ нет в регионе</span>'}</div>
      <button class="btn small ghost" onclick="goPriceId('${c.id}')">Цены →</button>
    </div>
  </article>`;
}

function buildCard(b) {
  const { total } = buildPrice(b, state.region, 'new');
  const used = buildPrice(b, state.region, 'used').total;
  const perf = buildPerf(b), power = buildPower(b);
  const fps = estimateBuildFps(b.parts, state.compFpsGame === 'all' ? 'cyberpunk' : state.compFpsGame, state.compFpsRes);
  return `<article class="card">
    <div class="tag">${b.tag}</div>
    <h3>${esc(b.name)}</h3>
    <p>${esc(b.desc)}</p>
    <div class="specs-mini">
      <div>CPU: <b>${esc(byId(b.parts.cpu).name)}</b></div>
      <div>GPU: <b>${esc(byId(b.parts.gpu).name)}</b></div>
      <div>Плата: <b>${esc(byId(b.parts.motherboard).name)}</b></div>
      <div>Память: <b>${esc(byId(b.parts.ram).name)}</b></div>
    </div>
    <div class="meter-label"><span>Игровой индекс</span><b>${perf}/100</b></div>
    <div class="bar"><i style="width:${perf}%"></i></div>
    <div class="fps-inline">🎯 <b>${fps} FPS</b> <span class="muted small">· ${state.compFpsGame === 'all' ? 'Cyberpunk 2077' : esc(GAMES.find(g => g.id === state.compFpsGame)?.name || '')} ${state.compFpsRes}</span></div>
    <div class="row">
      <div><span class="price" style="font-size:1.2rem">${fmt(total)}</span> <span class="muted small">новые · ${esc(regionById(state.region).name)}</span><br>
      <span class="small" style="color:#fda4af">БУ ≈ ${fmt(used)}</span> <span class="muted small">· ${power} Вт</span></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn small ghost" onclick="loadBuilder('${b.id}')">В конструктор</button>
        <button class="btn small" onclick="addCompareBuild('${b.id}')">Сравнить</button>
      </div>
    </div>
  </article>`;
}

function addCompareBuild(id) {
  if (!state.compareBuilds.includes(id)) {
    if (state.compareBuilds.length >= 3) state.compareBuilds.shift();
    state.compareBuilds.push(id);
  }
  navigate('compare-builds');
}
function loadBuilder(id) {
  const b = BUILDS.find(x => x.id === id);
  state.builder = { ...b.parts };
  navigate('builder');
}
function goPrice(q) {
  state.priceQuery = q;
  state.priceCat = 'all';
  const inp = $('#priceQueryInput'); if (inp) inp.value = q;
  navigate('prices');
}
function goPriceId(id) {
  const c = byId(id);
  state.priceCat = c.cat;
  goPrice(c.name);
}
function syncCompatFromBuilder() {
  CATEGORIES.forEach(c => { const el = $('#compat-' + c.id); if (el) el.value = state.builder[c.id]; });
  navigate('compat');
}
function applyBuildToCompat(id) {
  const b = BUILDS.find(x => x.id === id);
  if (!b) return;
  state.builder = { ...b.parts };
  CATEGORIES.forEach(c => { const el = $('#compat-' + c.id); if (el) el.value = b.parts[c.id]; });
  renderCompat();
}

// ---------- FPS-таблица ----------
function fpsTable(parts, res = '1080p', settings = 'ultra', limit = GAMES.length) {
  const rows = GAMES.slice(0, limit).map(g => {
    const fps = estimateBuildFps(parts, g.id, res, settings);
    const v = fpsVerdict(fps);
    return `<div class="fps-line">
      <div class="fps-line-head"><b>${esc(g.name)}</b><span class="muted small">${esc(g.genre)}</span></div>
      <div class="fps-track"><i class="${v.cls}" style="width:${pct(fps, 240)}%"></i></div>
      <div class="fps-line-val"><b>${fps}</b> <span class="muted small">FPS</span><br><span class="fps-badge ${v.cls}">${v.label}</span></div>
    </div>`;
  }).join('');
  return `<div class="fps-table">${rows}</div>`;
}

// ---------- Страницы ----------
function renderHome() {
  const mid = BUILDS.find(b => b.id === 'build-mid');
  const fps = estimateBuildFps(mid.parts, 'cyberpunk', '1080p');
  $('#homeStats').innerHTML = `
    <div class="stat"><b>${CITIES.length}</b><span>городов и регионов России</span></div>
    <div class="stat"><b>${COMPONENTS.length}</b><span>комплектующих, включая старые модели</span></div>
    <div class="stat"><b>${GAMES.length}</b><span>игр с расчётом FPS</span></div>
    <div class="stat"><b>${BUILDS.length}</b><span>готовых сборок</span></div>`;
  $('#homeBuilds').innerHTML = BUILDS.map(buildCard).join('');

  const cities = topCities(12);
  $('#regionIndex').innerHTML = cities.map(r => {
    const t = buildPrice(mid, r.id, 'new').total;
    return `<div class="rp"><span>${r.icon} ${esc(r.name)}</span><b>${fmt(t)}</b></div>`;
  }).join('') + `<div class="rp"><span>🌍 Все города</span><b><button class="btn small ghost" onclick="openRegionModal()">Выбрать · ${CITIES.length}</button></b></div>`;

  $('#homeFps').innerHTML = `
    <div class="fps-hero">
      <div>
        <div class="muted small">Сборка «${esc(mid.name)}» · Cyberpunk 2077 · 1080p Ultra</div>
        <div class="fps-hero-val">${fps} <span>FPS</span></div>
        <div class="small muted">${fpsVerdict(fps).label} · расчёт по 20 популярным играм на вкладке «FPS в играх»</div>
      </div>
      <button class="btn lime" onclick="navigate('fps')">Рассчитать FPS →</button>
    </div>`;
}

function renderBuilds() { $('#buildsGrid').innerHTML = BUILDS.map(buildCard).join(''); }

function renderCompareBuilds() {
  const picks = $('#compareBuildPicks');
  picks.innerHTML = state.compareBuilds.map((id, i) => `
    <div class="pick"><label class="small muted">Сборка ${i + 1}</label>
      <select onchange="state.compareBuilds[${i}]=this.value;render()">
        ${BUILDS.map(b => `<option value="${b.id}" ${b.id === id ? 'selected' : ''}>${esc(b.name)} — ${esc(b.tag)}</option>`).join('')}
      </select>
      <div class="small muted" style="margin-top:8px">${esc(BUILDS.find(b => b.id === id).desc)}</div>
    </div>`).join('') +
    (state.compareBuilds.length < 3 ? `<div class="pick"><label class="small muted">Добавить сборку</label>
      <select onchange="addCompareBuild(this.value)"><option value="">— выберите —</option>
      ${BUILDS.filter(b => !state.compareBuilds.includes(b.id)).map(b => `<option value="${b.id}">${esc(b.name)}</option>`).join('')}
      </select></div>` : '');

  const builds = state.compareBuilds.map(id => BUILDS.find(b => b.id === id));
  const game = GAMES.find(g => g.id === 'cyberpunk');
  const rows = [
    ['Цена (новые)', b => fmt(buildPrice(b, state.region, 'new').total), b => buildPrice(b, state.region, 'new').total, true],
    ['Цена (БУ)', b => fmt(buildPrice(b, state.region, 'used').total), b => buildPrice(b, state.region, 'used').total, true],
    ['Игровой индекс', b => buildPerf(b) + ' / 100', b => buildPerf(b), false],
    ['Рабочий индекс', b => buildWorkPerf(b) + ' / 100', b => buildWorkPerf(b), false],
    ['Потребление', b => buildPower(b) + ' Вт', b => buildPower(b), false],
    [`FPS · ${game.name} 1080p`, b => estimateBuildFps(b.parts, game.id, '1080p') + '', b => estimateBuildFps(b.parts, game.id, '1080p'), false],
    [`FPS · ${game.name} 1440p`, b => estimateBuildFps(b.parts, game.id, '1440p') + '', b => estimateBuildFps(b.parts, game.id, '1440p'), false],
    [`FPS · Counter-Strike 2 1080p`, b => estimateBuildFps(b.parts, 'cs2', '1080p') + '', b => estimateBuildFps(b.parts, 'cs2', '1080p'), false],
    ['Процессор', b => esc(byId(b.parts.cpu).name), null, null],
    ['Видеокарта', b => esc(byId(b.parts.gpu).name), null, null],
    ['Материнская плата', b => esc(byId(b.parts.motherboard).name), null, null],
    ['Память', b => esc(byId(b.parts.ram).name), null, null],
    ['Накопитель', b => esc(byId(b.parts.ssd).name), null, null],
    ['Блок питания', b => esc(byId(b.parts.psu).name), null, null],
    ['Корпус', b => esc(byId(b.parts.case).name), null, null],
    ['Охлаждение', b => esc(byId(b.parts.cooling).name), null, null],
  ];
  let html = `<div class="table-wrap"><table><tr><th>Параметр</th>${builds.map(b => `<th>${esc(b.name)}</th>`).join('')}</tr>`;
  rows.forEach(([label, fn, numFn, lowerBetter]) => {
    let bestIdx = -1;
    if (numFn) {
      const vals = builds.map(numFn);
      bestIdx = lowerBetter ? vals.indexOf(Math.min(...vals)) : vals.indexOf(Math.max(...vals));
    }
    html += `<tr><td class="muted">${label}</td>${builds.map((b, i) => `<td class="${i === bestIdx ? 'best' : ''}">${fn(b)}</td>`).join('')}</tr>`;
  });
  html += '</table></div>';

  const cities = topCities(14);
  html += `<h3 style="margin-top:26px">💰 Цена сборки по городам (новые)</h3>
    <p class="sub">Показаны крупнейшие города. Выберите свой город в шапке — расчёт в остальных разделах тоже обновится.</p>
    <div class="table-wrap"><table><tr><th>Город</th>${builds.map(b => `<th>${esc(b.name)}</th>`).join('')}</tr>`;
  cities.forEach(r => {
    html += `<tr><td>${r.icon} ${esc(r.name)}</td>${builds.map(b => `<td>${fmt(buildPrice(b, r.id, 'new').total)}</td>`).join('')}</tr>`;
  });
  html += '</table></div>';

  html += `<h3 style="margin-top:26px">✅ Совместимость</h3>`;
  builds.forEach(b => {
    const res = checkCompatibility(b.parts);
    const icon = res.status === 'ok' ? '✅' : res.status === 'warn' ? '⚠️' : '❌';
    const errs = res.issues.filter(i => i.level === 'error').length;
    const warns = res.issues.filter(i => i.level === 'warn').length;
    html += `<div class="verdict ${res.status}"><b>${icon} ${esc(b.name)}</b> — ${res.status === 'ok' ? 'всё совместимо' : errs ? `ошибок: ${errs}` : `предупреждений: ${warns}`}
      <div class="small muted">${res.issues.filter(i => i.level !== 'ok').map(i => esc(i.title)).join(' · ') || 'Проблем не найдено.'}</div></div>`;
  });
  $('#compareBuildsBody').innerHTML = html;
}

function renderComponents() {
  $('#compChips').innerHTML = [{ id: 'all', name: 'Все', icon: '🗂️' }, ...CATEGORIES].map(c =>
    `<button class="chip ${state.compCat === c.id ? 'active' : ''}" onclick="state.compCat='${c.id}';state.compBrand='all';render()">${c.icon} ${c.name}</button>`).join('');

  const brands = [...new Set(COMPONENTS.filter(c => state.compCat === 'all' || c.cat === state.compCat).map(c => c.brand))].sort((a, b) => a.localeCompare(b, 'ru'));
  const brandsEl = $('#compBrand');
  brandsEl.innerHTML = `<option value="all">Все бренды</option>` + brands.map(b => `<option value="${esc(b)}" ${b === state.compBrand ? 'selected' : ''}>${esc(b)}</option>`).join('');

  const gameSel = $('#compFpsGame');
  gameSel.innerHTML = `<option value="all" ${state.compFpsGame === 'all' ? 'selected' : ''}>Средний FPS по всем играм</option>` +
    GAMES.map(g => `<option value="${g.id}" ${state.compFpsGame === g.id ? 'selected' : ''}>${esc(g.name)}</option>`).join('');

  let list = searchComponents(state.compQuery, { cat: state.compCat, brand: state.compBrand, yearFilter: state.compYear, cityId: state.region });
  if (state.compSort === 'cheap') list = list.sort((a, b) => (minPrice(a.id, state.region) ?? a.basePrice) - (minPrice(b.id, state.region) ?? b.basePrice));
  else if (state.compSort === 'expensive') list = list.sort((a, b) => (minPrice(b.id, state.region) ?? b.basePrice) - (minPrice(a.id, state.region) ?? a.basePrice));
  else if (state.compSort === 'fps') list = list.sort((a, b) => (compFps(b) || 0) - (compFps(a) || 0));
  else if (state.compSort === 'year') list = list.sort((a, b) => b.year - a.year);
  else list = list.sort((a, b) => b.perf - a.perf);

  $('#compCount').textContent = `Найдено: ${list.length} из ${COMPONENTS.length} · в каталоге старых моделей (до 2020): ${COMPONENTS.filter(c => c.year < 2020).length}`;
  $('#compGrid').innerHTML = list.length ? list.map(compCard).join('') : '<div class="empty">Ничего не найдено. Попробуйте проще: «4060», «ddr3», «бп 750», «видяха», «ssd 1tb».</div>';
}

function renderCompareComps() {
  $('#compareCatChips').innerHTML = CATEGORIES.map(c =>
    `<button class="chip ${state.compareCat === c.id ? 'active' : ''}" onclick="state.compareCat='${c.id}';state.compareQuery='';render()">${c.icon} ${c.name}</button>`).join('');
  const cat = state.compareCat;
  const selected = state.compareComps[cat] || [];
  let pool = COMPONENTS.filter(c => c.cat === cat);
  if (state.compareQuery) pool = pool.filter(c => matchesQuery(c, state.compareQuery));
  $('#compareCompPicks').innerHTML = [0, 1, 2, 3].map(i => `
    <div class="pick"><label class="small muted">Компонент ${i + 1}</label>
      <select onchange="setCompareComp(${i}, this.value)">
        <option value="">— не выбран —</option>
        ${pool.map(c => `<option value="${c.id}" ${selected[i] === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
      </select>
    </div>`).join('');

  const comps = selected.filter(Boolean).map(byId).filter(Boolean);
  if (comps.length < 2) { $('#compareCompsBody').innerHTML = '<div class="empty">Выберите минимум 2 компонента. Удобно искать по подсказке: «4070», «ddr4», «b550», «750 вт».</div>'; return; }

  const keys = [...new Set(comps.flatMap(c => Object.keys(c.specs)))];
  let html = `<div class="table-wrap"><table><tr><th>Параметр</th>${comps.map(c => `<th>${esc(c.name)}</th>`).join('')}</tr>`;
  html += `<tr><td class="muted">Бренд</td>${comps.map(c => `<td>${esc(c.brand)}</td>`).join('')}</tr>`;
  html += `<tr><td class="muted">Год выпуска</td>${comps.map(c => `<td class="${c.year < 2020 ? 'muted' : ''}">${c.year}${c.year < 2020 ? ' · старее' : ''}</td>`).join('')}</tr>`;
  html += `<tr><td class="muted">Игровая производительность</td>${comps.map(c => `<td>${c.perf}/100</td>`).join('')}</tr>`;
  html += `<tr><td class="muted">Рабочая производительность</td>${comps.map(c => `<td>${c.work}/100</td>`).join('')}</tr>`;
  if (comps.some(c => c.cat === 'gpu' || c.cat === 'cpu')) {
    html += `<tr><td class="muted">FPS · Cyberpunk 2077 1080p</td>${comps.map(c => { const f = compFps(c, 'cyberpunk', '1080p'); return `<td>${f ? f + ' FPS' : '—'}</td>`; }).join('')}</tr>`;
    html += `<tr><td class="muted">FPS · CS2 1080p</td>${comps.map(c => { const f = compFps(c, 'cs2', '1080p'); return `<td>${f ? f + ' FPS' : '—'}</td>`; }).join('')}</tr>`;
  }
  if (comps.some(c => c.power > 0)) html += `<tr><td class="muted">Потребление</td>${comps.map(c => `<td>${c.power ? c.power + ' Вт' : '—'}</td>`).join('')}</tr>`;
  keys.forEach(k => { html += `<tr><td class="muted">${k}</td>${comps.map(c => `<td>${c.specs[k] ?? '—'}</td>`).join('')}</tr>`; });
  html += `<tr><td class="muted">Мин. цена, ${esc(regionById(state.region).name)} (новые)</td>${comps.map(c => `<td class="price">${fmt(minPrice(c.id, state.region, 'new') ?? c.basePrice)}</td>`).join('')}</tr>`;
  html += `<tr><td class="muted">Мин. цена БУ, ${esc(regionById(state.region).name)}</td>${comps.map(c => { const p = minPrice(c.id, state.region, 'used'); return `<td>${p ? fmt(p) : 'нет предложений'}</td>`; }).join('')}</tr>`;
  html += '</table></div>';

  const cities = topCities(10);
  html += `<h3 style="margin-top:24px">💰 Цены по городам (новые / БУ)</h3><div class="table-wrap"><table><tr><th>Город</th>${comps.map(c => `<th>${esc(c.name)}</th>`).join('')}</tr>`;
  cities.forEach(r => {
    html += `<tr><td>${r.icon} ${esc(r.name)}</td>${comps.map(c => {
      const n = minPrice(c.id, r.id, 'new'); const u = minPrice(c.id, r.id, 'used');
      return `<td>${n ? fmt(n) : '—'}${u ? ` <span class="small" style="color:#fda4af">/ БУ ${fmt(u)}</span>` : ''}</td>`;
    }).join('')}</tr>`;
  });
  html += '</table></div><p class="sub">Нужен другой город? Смените регион в шапке — таблица пересчитается.</p>';
  $('#compareCompsBody').innerHTML = html;
}
function setCompareComp(i, id) {
  const cat = state.compareCat;
  if (!state.compareComps[cat]) state.compareComps[cat] = [];
  state.compareComps[cat][i] = id || undefined;
  render();
}

function renderPrices() {
  const comps = searchComponents(state.priceQuery, { cat: state.priceCat, cityId: state.region });
  const mn = state.priceMin === '' || isNaN(Number(state.priceMin)) ? null : Number(state.priceMin);
  const mx = state.priceMax === '' || isNaN(Number(state.priceMax)) ? null : Number(state.priceMax);

  let offers = [];
  comps.forEach(c => {
    offersFor(c.id, { regionId: state.region, condition: state.priceCond === 'all' ? null : state.priceCond })
      .forEach(o => offers.push({ ...o, comp: c }));
  });
  // Фильтр по цене — на уровне конкретных предложений (новые и БУ стоят по-разному)
  if (mn !== null) offers = offers.filter(o => o.price >= mn);
  if (mx !== null) offers = offers.filter(o => o.price <= mx);
  if (state.priceSort === 'cheap') offers.sort((a, b) => a.price - b.price);
  else if (state.priceSort === 'expensive') offers.sort((a, b) => b.price - a.price);
  else if (state.priceSort === 'discount') offers.sort((a, b) => (b.oldPrice ? b.oldPrice - b.price : 0) - (a.oldPrice ? a.oldPrice - a.price : 0));
  else offers.sort((a, b) => a.comp.name.localeCompare(b.comp.name, 'ru'));

  $('#priceCount').textContent = offers.length
    ? `Найдено предложений: ${offers.length.toLocaleString('ru-RU')} · город: ${regionById(state.region).name} · новых и БУ`
    : `Предложений не найдено · город: ${regionById(state.region).name}`;

  // Внешние ссылки: открытый поиск по всем сайтам, включая Авито и Юлу
  const searchTerm = state.priceQuery.trim() || (comps[0]?.name || 'комплектующие ПК');
  const newStores = STORES.filter(s => s.type === 'new');
  const usedStores = STORES.filter(s => s.type === 'used');
  const link = s => {
    const url = (s.id === 'avito' || s.id === 'avito_new') ? avitoUrl(searchTerm, state.region) : s.searchUrl(searchTerm);
    return `<a href="${url}" target="_blank" rel="noopener">${s.type === 'used' ? '♻️' : '🛒'} ${esc(s.name)} ↗</a>`;
  };
  $('#storeLinks').innerHTML = `
    <div class="store-group"><div class="small muted">Новые</div>${newStores.map(link).join('')}</div>
    <div class="store-group"><div class="small muted">Б/У и объявления</div>${usedStores.map(link).join('')}</div>
    <div class="store-group"><div class="small muted">Сравнить сразу везде</div>
      <a class="strong-link" href="https://market.yandex.ru/search?text=${encodeURIComponent(searchTerm)}" target="_blank" rel="noopener">🔎 Яндекс Маркет — все предложения ↗</a>
    </div>`;

  if (!offers.length) {
    $('#priceResults').innerHTML = `<div class="empty">По запросу «${esc(state.priceQuery)}» в городе ${esc(regionById(state.region).name)} предложений нет.<br>
      Попробуйте другой город (кнопка в шапке), сбросьте фильтры или откройте живой поиск по ссылкам выше — на Авито, Юле, DNS, Ozon цены обновляются в реальном времени.</div>`;
    return;
  }
  const shown = offers.slice(0, 80);
  $('#priceResults').innerHTML = shown.map(o => {
    const store = storeById(o.storeId);
    const city = regionById(o.regionId);
    return `<div class="offer">
      <div class="grow">
        <b>${esc(o.comp.name)}</b> <span class="badge ${o.condition}">${o.condition === 'new' ? 'Новое' : 'Б/У'}</span>
        <span class="badge region">${city.icon} ${esc(city.name)}</span>
        <div class="small muted">${catById(o.comp.cat).name} · ${esc(store.name)} · обновлено ${o.updated} · ${o.deliveryDays === 0 ? 'самовывоз' : 'доставка ' + o.deliveryDays + ' дн.'}${o.deliveryPrice ? ' · ' + fmt(o.deliveryPrice) : ' · бесплатно'}</div>
      </div>
      <div style="text-align:right">
        <div class="price-big">${fmt(o.price)}</div>
        ${o.oldPrice ? `<div class="old">${fmt(o.oldPrice)}</div>` : ''}
        <a class="btn small ghost" href="${(store.id === 'avito' || store.id === 'avito_new') ? avitoUrl(o.comp.name, state.region) : store.searchUrl(o.comp.name)}" target="_blank" rel="noopener">${esc(store.name)} ↗</a>
      </div>
    </div>`;
  }).join('') + (offers.length > 80 ? `<p class="muted small">Показаны первые 80 из ${offers.length}. Уточните запрос или фильтры.</p>` : '');
}

function renderCompat() {
  const parts = {};
  CATEGORIES.forEach(c => { parts[c.id] = $('#compat-' + c.id)?.value || ''; });
  const res = checkCompatibility(parts);
  const icon = res.status === 'ok' ? '✅' : res.status === 'warn' ? '⚠️' : '❌';
  const title = res.status === 'ok' ? 'Всё совместимо!' : res.status === 'warn' ? 'Совместимо, но есть замечания' : 'Есть несовместимости — исправьте перед покупкой';
  const cpu = byId(parts.cpu), gpu = byId(parts.gpu);
  const fps = cpu && gpu ? estimateBuildFps(parts, 'cyberpunk', '1080p') : null;
  $('#compatResult').innerHTML = `<div class="verdict ${res.status}">
    <b style="font-size:1.15rem">${icon} ${title}</b>
    ${fps ? `<div class="fps-inline" style="margin:10px 0">🎯 Cyberpunk 2077, 1080p: <b>${fps} FPS</b> · ${fpsVerdict(fps).label}</div>` : ''}
    ${res.issues.map(i => `<div class="issue"><div class="ico">${i.level === 'ok' ? '✅' : i.level === 'warn' ? '⚠️' : '❌'}</div>
      <div><b>${esc(i.title)}</b><span>${esc(i.desc)}</span>${i.fix ? `<div class="fix">💡 ${esc(i.fix)}</div>` : ''}</div></div>`).join('')}
  </div>`;
}

function renderBuilder() {
  $('#builderSlots').innerHTML = CATEGORIES.map(c => {
    const cur = state.builder[c.id];
    const pool = COMPONENTS.filter(x => x.cat === c.id);
    const curObj = byId(cur);
    return `<div class="slot"><div class="icon">${c.icon}</div>
      <div style="flex:1"><label class="small muted">${c.name}</label>
      <select onchange="state.builder['${c.id}']=this.value;render()">
        ${pool.map(x => `<option value="${x.id}" ${x.id === cur ? 'selected' : ''}>${esc(x.name)} — от ${fmt(minPrice(x.id, state.region, 'new') ?? x.basePrice)}${x.year < 2020 ? ' · старая' : ''}</option>`).join('')}
      </select></div>
      <div class="p"><span class="price">${fmt(minPrice(cur, state.region, 'new') ?? curObj?.basePrice ?? 0)}</span><br>
      <span class="small" style="color:#fda4af">${minPrice(cur, state.region, 'used') ? 'БУ ' + fmt(minPrice(cur, state.region, 'used')) : ''}</span></div>
    </div>`;
  }).join('');

  const fakeBuild = { parts: state.builder };
  const totalNew = buildPrice(fakeBuild, state.region, 'new').total;
  const totalUsed = buildPrice(fakeBuild, state.region, 'used').total;
  const perf = buildPerf(fakeBuild), work = buildWorkPerf(fakeBuild), power = buildPower(fakeBuild);
  const compat = checkCompatibility(state.builder);
  const avg = avgFps(state.builder, state.builderFpsRes);

  $('#builderSummary').innerHTML = `
    <h3 style="margin-top:0">🧮 Ваша сборка</h3>
    <div class="total">${fmt(totalNew)}</div>
    <div class="small muted">новые · ${esc(regionById(state.region).name)} · БУ ≈ ${fmt(totalUsed)}</div>
    <div class="meter-label"><span>Игровой индекс</span><b>${perf}/100</b></div><div class="bar"><i style="width:${perf}%"></i></div>
    <div class="meter-label"><span>Рабочий индекс</span><b>${work}/100</b></div><div class="bar"><i style="width:${work}%"></i></div>
    <div class="small muted" style="margin-top:10px">Потребление ≈ ${power} Вт · БП: ${byId(state.builder.psu)?.specs.wattage ?? '—'} Вт</div>
    <div class="fps-inline" style="margin-top:12px">🎯 Средний FPS по 20 играм (${state.builderFpsRes}): <b>${avg}</b></div>
    <div class="verdict ${compat.status}" style="margin-top:14px;padding:12px">
      <b>${compat.status === 'ok' ? '✅ Совместимо' : compat.status === 'warn' ? '⚠️ Есть замечания' : '❌ Несовместимо'}</b>
      <div class="small">${compat.issues.filter(i => i.level !== 'ok').map(i => '• ' + esc(i.title)).join('<br>') || 'Все проверки пройдены.'}</div>
    </div>
    <h4 style="margin:16px 0 8px">Цена по городам</h4>
    <div class="region-prices">${topCities(8).map(r => `<div class="rp"><span>${r.icon} ${esc(r.name)}</span><b>${fmt(buildPrice(fakeBuild, r.id, 'new').total)}</b></div>`).join('')}</div>
    <button class="btn ghost" style="width:100%;margin-top:8px" onclick="openRegionModal()">Другой город (${CITIES.length})</button>
    <button class="btn lime" style="width:100%;margin-top:10px" onclick="syncCompatFromBuilder()">Проверить совместимость →</button>`;

  $('#builderFps').innerHTML = `
    <div class="row" style="justify-content:space-between;align-items:center;margin-bottom:8px">
      <h3 style="margin:0">🎮 FPS в популярных играх</h3>
      <select onchange="state.builderFpsRes=this.value;render()">
        ${['1080p','1440p','4K'].map(r => `<option value="${r}" ${state.builderFpsRes === r ? 'selected' : ''}>${r}</option>`).join('')}
      </select>
    </div>
    ${fpsTable(state.builder, state.builderFpsRes)}`;
}

function renderFps() {
  const f = state.fps;
  const cpuSel = $('#fpsCpu'), gpuSel = $('#fpsGpu'), ramSel = $('#fpsRam'), gameSel = $('#fpsGame');
  const resSel = $('#fpsRes'), setSel = $('#fpsSettings');
  if (resSel) resSel.value = f.res;
  if (setSel) setSel.value = f.settings;
  cpuSel.innerHTML = COMPONENTS.filter(c => c.cat === 'cpu').map(c => `<option value="${c.id}" ${c.id === f.cpu ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
  gpuSel.innerHTML = COMPONENTS.filter(c => c.cat === 'gpu').map(c => `<option value="${c.id}" ${c.id === f.gpu ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
  ramSel.innerHTML = COMPONENTS.filter(c => c.cat === 'ram').map(c => `<option value="${c.id}" ${c.id === f.ram ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
  gameSel.innerHTML = GAMES.map(g => `<option value="${g.id}" ${g.id === f.game ? 'selected' : ''}>${esc(g.name)}</option>`).join('');

  const game = GAMES.find(g => g.id === f.game);
  const fps = estimateFps(f.cpu, f.gpu, f.ram, f.game, f.res, f.settings);
  const v = fpsVerdict(fps);
  const cpu = byId(f.cpu), gpu = byId(f.gpu), ram = byId(f.ram);
  const bottleneck = (() => {
    const cpuF = Math.pow(Math.max(cpu.perf, 5) / REF_CPU_PERF, 1 - game.gpuWeight);
    const gpuF = Math.pow(Math.max(gpu.perf, 5) / REF_GPU_PERF, game.gpuWeight);
    if (gpuF < cpuF * 0.92) return { who: 'Видеокарта', txt: `${gpu.name} — слабое звено в этой игре`, cls: 'warn' };
    if (cpuF < gpuF * 0.92) return { who: 'Процессор', txt: `${cpu.name} — слабое звено в этой игре`, cls: 'warn' };
    return { who: 'Баланс', txt: 'Процессор и видеокарта сбалансированы', cls: 'ok' };
  })();
  $('#fpsResult').innerHTML = `
    <div class="fps-hero">
      <div>
        <div class="muted small">${esc(game.name)} · ${f.res} · ${esc(f.settings === 'medium' ? 'Средние' : 'Ультра')}${f.settings === 'medium' ? ' (расчёт)' : ''}</div>
        <div class="fps-hero-val">${fps} <span>FPS</span></div>
        <div class="fps-badge ${v.cls}">${v.label}</div>
      </div>
      <div class="small muted" style="max-width:240px">${esc(game.genre)}<br>Ориентир: ${game.refFps} FPS на RTX 4070 + i5-12400F</div>
    </div>
    <div class="verdict ${bottleneck.cls}" style="margin-top:12px"><b>${bottleneck.who === 'Баланс' ? '⚖️' : '⚠️'} ${bottleneck.who}</b><div class="small">${esc(bottleneck.txt)}</div></div>
    <div class="specs-mini" style="margin-top:12px">
      <div>Процессор: <b>${esc(cpu.name)}</b></div>
      <div>Видеокарта: <b>${esc(gpu.name)}</b></div>
      <div>Память: <b>${esc(ram.name)}</b></div>
    </div>`;

  // Таблица всех игр для выбранной конфигурации
  const parts = { cpu: f.cpu, gpu: f.gpu, ram: f.ram };
  $('#fpsTable').innerHTML = fpsTable(parts, f.res, f.settings);
  const avg = avgFps(parts, f.res);
  $('#fpsAvg').textContent = `Средний FPS по ${GAMES.length} играм: ${avg} · ${f.res}`;

  // Готовые сборки: FPS в выбранной игре
  $('#fpsBuilds').innerHTML = BUILDS.map(b => {
    const fpsB = estimateBuildFps(b.parts, f.game, f.res, f.settings);
    const vb = fpsVerdict(fpsB);
    return `<div class="rp"><span>${esc(b.name)}</span><b>${fpsB} FPS <span class="fps-badge ${vb.cls}">${vb.label}</span></b></div>`;
  }).join('');
}

function render() {
  const label = $('#regionBtnLabel');
  if (label) label.textContent = regionById(state.region).name;
  if (state.page === 'home') renderHome();
  else if (state.page === 'builds') renderBuilds();
  else if (state.page === 'compare-builds') renderCompareBuilds();
  else if (state.page === 'components') renderComponents();
  else if (state.page === 'compare-components') renderCompareComps();
  else if (state.page === 'prices') renderPrices();
  else if (state.page === 'compat') renderCompat();
  else if (state.page === 'builder') renderBuilder();
  else if (state.page === 'fps') renderFps();
}

// ---------- Инициализация ----------
document.addEventListener('DOMContentLoaded', () => {
  render();

  $('#regionModalInput')?.addEventListener('input', e => { state.regionQuery = e.target.value; renderRegionList(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeRegionModal(); });
  $('#regionModal')?.addEventListener('click', e => { if (e.target.id === 'regionModal') closeRegionModal(); });

  $('#compSearch')?.addEventListener('input', e => { state.compQuery = e.target.value; render(); });
  $('#compareSearch')?.addEventListener('input', e => { state.compareQuery = e.target.value; render(); });
  $('#priceQueryInput')?.addEventListener('input', e => { state.priceQuery = e.target.value; render(); });

  // Форма совместимости
  $('#compatForm').innerHTML = CATEGORIES.map(c => `
    <div class="slot"><div class="icon">${c.icon}</div>
      <div style="flex:1"><label class="small muted">${c.name}</label>
      <select id="compat-${c.id}" onchange="renderCompat()">
        ${COMPONENTS.filter(x => x.cat === c.id).map(x => `<option value="${x.id}">${esc(x.name)}${x.year < 2020 ? ' · старая' : ''}</option>`).join('')}
      </select></div></div>`).join('');
  $('#compatQuick').innerHTML = `<option value="">— подставить готовую сборку —</option>` +
    BUILDS.map(b => `<option value="${b.id}">${esc(b.name)}</option>`).join('');
  const first = BUILDS[0].parts;
  CATEGORIES.forEach(c => { const el = $('#compat-' + c.id); if (el) el.value = first[c.id]; });
  renderCompat();
});
