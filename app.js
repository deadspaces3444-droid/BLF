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
  // сохранение пользовательских сборок
  saveKind: 'pc',
  saveName: '',
  saveNote: '',
  savedFilter: 'all',
  // серверы
  serverCat: 'all',
  serverQuery: '',
  serverSort: 'price',
  serverBuild: { servercpu:'sc-xeon-silver4310', servermb:'smb-x12spl', serverram:'sram-ddr4ecc64', serverstorage:'sst-pm9a3m2', servernic:'snic-x710', serverpsu:'spsu-800wredundant', serverchassis:'sch-2u' },
  serverDrives: 4,
  serverRamModules: 2,
  serverCompare: ['srv-web', 'srv-db'],
  osQuery: '',
  osFamily: 'all',
  osSort: 'name',
  osFitBuild: '',
  osOpen: 'ubuntu-server',
  osPickFor: '', // для какой сборки подбираем ОС
  serverOs: '', // выбранная ОС для серверной сборки
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

// ---------- Сохранение пользовательских сборок ----------
const LS_KEY = 'blf.savedBuilds.v1';
const uid = () => 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

function loadSavedBuilds() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (e) { return []; }
}
function writeSavedBuilds(list) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(list)); return true; }
  catch (e) { toast('Не удалось сохранить: хранилище браузера недоступно'); return false; }
}
function toast(text) {
  const box = $('#toast');
  if (!box) return;
  box.textContent = text;
  box.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => box.classList.remove('show'), 3200);
}
function pcBuildSnapshot() {
  return { parts: { ...state.builder } };
}
function serverSnapshot() {
  return { parts: { ...state.serverBuild }, drives: state.serverDrives, ramModules: state.serverRamModules, os: state.serverOs || '' };
}
function estimateSnapshotPrice(item, cityId = state.region) {
  if (item.kind === 'server') return serverBuildPrice(item, cityId, 'new');
  return buildPrice({ parts: item.parts }, cityId, 'new').total;
}
function saveCurrentBuild(kind = state.saveKind) {
  const name = (state.saveName || '').trim() || (kind === 'server' ? 'Моя серверная сборка' : 'Моя сборка ПК');
  const item = kind === 'server'
    ? { id: uid(), kind: 'server', name, note: (state.saveNote || '').trim(), created: new Date().toISOString(), ...serverSnapshot() }
    : { id: uid(), kind: 'pc', name, note: (state.saveNote || '').trim(), created: new Date().toISOString(), ...pcBuildSnapshot() };
  const list = loadSavedBuilds();
  list.unshift(item);
  if (writeSavedBuilds(list)) {
    state.saveName = ''; state.saveNote = '';
    renderSaved();
    toast(`Сборка «${name}» сохранена в этом браузере`);
  }
}
function deleteSavedBuild(id) {
  const list = loadSavedBuilds().filter(x => x.id !== id);
  writeSavedBuilds(list);
  renderSaved();
  toast('Сборка удалена');
}
function renameSavedBuild(id, name) {
  const list = loadSavedBuilds();
  const item = list.find(x => x.id === id);
  if (!item) return;
  item.name = name || item.name;
  writeSavedBuilds(list);
  renderSaved();
}
function duplicateSavedBuild(id) {
  const list = loadSavedBuilds();
  const item = list.find(x => x.id === id);
  if (!item) return;
  const copy = { ...item, id: uid(), name: item.name + ' (копия)', created: new Date().toISOString() };
  list.unshift(copy);
  writeSavedBuilds(list);
  renderSaved();
  toast('Создана копия сборки');
}
function exportSavedBuilds() {
  const data = { app: 'BLF BuildLab', type: 'saved-builds', version: 1, exportedAt: new Date().toISOString(), items: loadSavedBuilds() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `blf-builds-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast('Файл со сборками скачан');
}
function importSavedBuilds(ev) {
  const file = ev.target.files && ev.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const items = Array.isArray(parsed) ? parsed : parsed.items;
      if (!Array.isArray(items)) throw new Error('bad format');
      const clean = items.filter(x => x && (x.kind === 'server' || x.kind === 'pc') && x.parts).map(x => ({
        id: uid(), kind: x.kind, name: String(x.name || 'Импортированная сборка').slice(0, 80),
        note: String(x.note || '').slice(0, 300), created: x.created || new Date().toISOString(),
        parts: x.parts, drives: x.drives, ramModules: x.ramModules,
      }));
      if (!clean.length) throw new Error('empty');
      writeSavedBuilds([...clean, ...loadSavedBuilds()]);
      renderSaved();
      toast(`Импортировано сборок: ${clean.length}`);
    } catch (e) {
      toast('Не удалось прочитать файл: нужен JSON, выгруженный с этого сайта');
    }
    ev.target.value = '';
  };
  reader.readAsText(file);
}
function openSavedBuild(id) {
  const item = loadSavedBuilds().find(x => x.id === id);
  if (!item) return;
  if (item.kind === 'server') {
    state.serverBuild = { ...item.parts };
    state.serverDrives = item.drives || 2;
    state.serverRamModules = item.ramModules || 1;
    state.serverOs = item.os || '';
    navigate('servers');
    toast(`Загружена серверная сборка «${item.name}»`);
  } else {
    state.builder = { ...item.parts };
    navigate('builder');
    toast(`Загружена сборка «${item.name}»`);
  }
}
function compareSavedBuilds(id) {
  const item = loadSavedBuilds().find(x => x.id === id);
  if (!item) return;
  if (item.kind === 'server') { toast('Серверные сборки сравниваются на странице «Серверы» — добавьте её в сравнение там'); navigate('servers'); return; }
  state.compareBuilds = [id, 'build-mid'].slice(0, 3);
  state.customCompare = item;
  navigate('compare-builds');
}
function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  catch (e) { return ''; }
}
function savedBuildCard(item) {
  const price = estimateSnapshotPrice(item);
  const isServer = item.kind === 'server';
  let summary = '';
  if (isServer) {
    const cpu = serverPartById(item.parts.servercpu), ram = serverPartById(item.parts.serverram);
    const os = SERVER_OS.find(o => o.id === item.os);
    summary = `<div class="specs-mini">
      <div>CPU: <b>${esc(cpu?.name || '—')}</b></div>
      <div>RAM: <b>${ram ? ram.specs.capacityGb * (item.ramModules || 1) + ' ГБ ECC' : '—'}</b></div>
      <div>Диски: <b>${item.drives || 1} шт.</b></div>
      <div>ОС: <b>${esc(os?.name || 'не выбрана')}</b></div>
    </div>`;
  } else {
    summary = `<div class="specs-mini">
      <div>CPU: <b>${esc(byId(item.parts.cpu)?.name || '—')}</b></div>
      <div>GPU: <b>${esc(byId(item.parts.gpu)?.name || '—')}</b></div>
      <div>RAM: <b>${esc(byId(item.parts.ram)?.name || '—')}</b></div>
      <div>Диск: <b>${esc(byId(item.parts.ssd)?.name || '—')}</b></div>
    </div>`;
  }
  return `<article class="card saved-card">
    <div class="tag">${isServer ? '🗄️ Серверная сборка' : '🖥️ Сборка ПК'} · ${fmtDate(item.created)}</div>
    <h3>${esc(item.name)}</h3>
    ${item.note ? `<p>${esc(item.note)}</p>` : ''}
    ${summary}
    <div class="row">
      <div><span class="price">${fmt(price)}</span> <span class="muted small">в ${esc(regionById(state.region).name)}</span></div>
      <div class="saved-actions">
        <button class="btn small" onclick="openSavedBuild('${item.id}')">Открыть</button>
        <button class="btn small ghost" onclick="duplicateSavedBuild('${item.id}')">Копия</button>
        <button class="btn small ghost" onclick="promptRename('${item.id}', ${JSON.stringify(item.name).replace(/"/g, '&quot;')})">✏️</button>
        <button class="btn small ghost danger" onclick="if(confirm('Удалить сборку «${esc(item.name)}»?'))deleteSavedBuild('${item.id}')">🗑️</button>
      </div>
    </div>
  </article>`;
}
function promptRename(id, oldName) {
  const name = prompt('Новое название сборки:', oldName);
  if (name && name.trim()) renameSavedBuild(id, name.trim().slice(0, 60));
}
function renderSaved() {
  const all = loadSavedBuilds();
  const list = state.savedFilter === 'all' ? all : all.filter(x => x.kind === state.savedFilter);
  const pcCount = all.filter(x => x.kind === 'pc').length, srvCount = all.filter(x => x.kind === 'server').length;
  const filterEl = $('#savedFilter');
  if (filterEl) filterEl.innerHTML = `
    <button class="chip ${state.savedFilter === 'all' ? 'active' : ''}" onclick="state.savedFilter='all';render()">Все · ${all.length}</button>
    <button class="chip ${state.savedFilter === 'pc' ? 'active' : ''}" onclick="state.savedFilter='pc';render()">ПК · ${pcCount}</button>
    <button class="chip ${state.savedFilter === 'server' ? 'active' : ''}" onclick="state.savedFilter='server';render()">Серверы · ${srvCount}</button>`;
  const grid = $('#savedGrid');
  if (grid) grid.innerHTML = list.length
    ? list.map(savedBuildCard).join('')
    : `<div class="empty">Пока пусто. Соберите конфигурацию в <b>Конструкторе</b> или на странице <b>Серверы</b> и нажмите «Сохранить сборку» — она останется в этом браузере.</div>`;
  const countEl = $('#savedCount');
  if (countEl) countEl.textContent = all.length ? `Сохранено сборок: ${all.length} · ПК: ${pcCount} · серверных: ${srvCount}` : 'Сохранённых сборок пока нет';
  const kindSel = $('#saveKind');
  if (kindSel) kindSel.innerHTML = `<option value="pc" ${state.saveKind === 'pc' ? 'selected' : ''}>🖥️ ПК (из конструктора)</option>
    <option value="server" ${state.saveKind === 'server' ? 'selected' : ''}>🗄️ Сервер (со страницы серверов)</option>`;
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

  const savedAll = loadSavedBuilds();
  $('#homeQuick').innerHTML = `
    <a class="quick-card" onclick="navigate('builder')"><b>🧩 Конструктор</b><span>Собрать ПК и сохранить конфигурацию</span></a>
    <a class="quick-card" onclick="navigate('servers')"><b>🗄️ Серверы</b><span>NAS, веб, БД, виртуализация, ИИ</span></a>
    <a class="quick-card" onclick="navigate('server-os')"><b>🖥️ ОС для серверов</b><span>14 систем с подробным описанием</span></a>
    <a class="quick-card" onclick="navigate('saved')"><b>💾 Мои сборки</b><span>${savedAll.length ? 'Сохранено: ' + savedAll.length : 'Пока пусто — сохраните первую'}</span></a>`;
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

function allPcBuilds() {
  const saved = loadSavedBuilds().filter(x => x.kind === 'pc').map(x => ({
    id: x.id, name: '⭐ ' + x.name, tag: 'Моя сборка · ' + fmtDate(x.created), desc: x.note || 'Сохранённая вами конфигурация.', parts: x.parts, custom: true,
  }));
  return [...BUILDS, ...saved];
}
function resolveBuild(id) { return allPcBuilds().find(b => b.id === id); }

function renderCompareBuilds() {
  const picks = $('#compareBuildPicks');
  const pool = allPcBuilds();
  picks.innerHTML = state.compareBuilds.map((id, i) => {
    const cur = resolveBuild(id) || pool[0];
    return `
    <div class="pick"><label class="small muted">Сборка ${i + 1}</label>
      <select onchange="state.compareBuilds[${i}]=this.value;render()">
        ${pool.map(b => `<option value="${b.id}" ${b.id === cur.id ? 'selected' : ''}>${esc(b.name)} — ${esc(b.tag)}</option>`).join('')}
      </select>
      <div class="small muted" style="margin-top:8px">${esc(cur.desc || '')}</div>
    </div>`;
  }).join('') +
    (state.compareBuilds.length < 3 ? `<div class="pick"><label class="small muted">Добавить сборку</label>
      <select onchange="addCompareBuild(this.value)"><option value="">— выберите —</option>
      ${pool.filter(b => !state.compareBuilds.includes(b.id)).map(b => `<option value="${b.id}">${esc(b.name)}</option>`).join('')}
      </select><div class="small muted" style="margin-top:8px">Свои сборки со звёздочкой ⭐ сохраняются в разделе «Мои сборки».</div></div>` : '');

  const builds = state.compareBuilds.map(resolveBuild).filter(Boolean);
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
    <div class="save-box">
      <label class="small muted">💾 Сохранить эту сборку</label>
      <input id="saveNameInput" placeholder="Название: «Моя игровая 1440p»" value="${esc(state.saveName)}" oninput="state.saveName=this.value">
      <input id="saveNoteInput" placeholder="Заметка (необязательно): для чего собираю" value="${esc(state.saveNote)}" oninput="state.saveNote=this.value">
      <div style="display:flex;gap:8px">
        <button class="btn" style="flex:1" onclick="saveCurrentBuild('pc')">Сохранить</button>
        <button class="btn ghost" onclick="navigate('saved')">Мои сборки</button>
      </div>
    </div>
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


// ---------- Мои сборки ----------
function renderSavedPage() {
  renderSaved();
}

// ---------- Серверы ----------
function serverPartPriceLine(part) {
  if (!part) return '—';
  const now = serverPrice(part, state.region, 'new');
  const used = serverPrice(part, state.region, 'used');
  return `<b>${fmt(now)}</b>${part.year < 2020 ? ` <span class="small muted">Б/У ≈ ${fmt(used)}</span>` : ''}`;
}
function serverCompCard(part) {
  const cat = serverCatById(part.cat);
  const wl = serverWorkload({ servercpu: part.cat === 'servercpu' ? part.id : 'sc-xeon-silver4310', serverram: part.cat === 'serverram' ? part.id : 'sram-ddr4ecc64', serverstorage: part.cat === 'serverstorage' ? part.id : 'sst-cd6', ramModules: 2 });
  return `<article class="card">
    <div class="tag">${cat.icon} ${cat.name} · ${esc(part.brand)} · ${part.year}</div>
    <h3>${esc(part.name)}</h3>
    <div class="specs-mini">${Object.entries(part.specs).map(([k, v]) => `<div>${k}: <b>${esc(v)}</b></div>`).join('')}</div>
    <div class="row">
      <div>${serverPartPriceLine(part)} <span class="muted small">· ${esc(regionById(state.region).name)}</span></div>
      <div class="saved-actions">
        <button class="btn small" onclick="useServerPart('${part.id}')">В сборку</button>
      </div>
    </div>
  </article>`;
}
function useServerPart(id) {
  const part = serverPartById(id);
  if (!part) return;
  state.serverBuild[part.cat] = id;
  navigate('servers');
  toast(`${part.name} добавлен в серверную сборку`);
}
function renderServers() {
  const cats = [{ id: 'all', name: 'Все', icon: '🗂️' }, ...SERVER_CATEGORIES];
  $('#serverChips').innerHTML = cats.map(c =>
    `<button class="chip ${state.serverCat === c.id ? 'active' : ''}" onclick="state.serverCat='${c.id}';render()">${c.icon} ${c.name}</button>`).join('');

  // ----- готовая сборка-конфигуратор -----
  $('#serverSlots').innerHTML = SERVER_CATEGORIES.map(c => {
    const cur = state.serverBuild[c.id];
    const pool = SERVER_COMPONENTS.filter(x => x.cat === c.id);
    const curPart = serverPartById(cur);
    return `<div class="slot"><div class="icon">${c.icon}</div>
      <div style="flex:1"><label class="small muted">${c.name}</label>
      <select onchange="state.serverBuild['${c.id}']=this.value;render()">
        ${pool.map(x => `<option value="${x.id}" ${x.id === cur ? 'selected' : ''}>${esc(x.name)} — ${fmt(serverPrice(x, state.region))}${x.year < 2020 ? ' · Б/У' : ''}</option>`).join('')}
      </select></div>
      <div class="p"><span class="price">${curPart ? fmt(serverPrice(curPart, state.region)) : '—'}</span></div>
    </div>`;
  }).join('') + `
    <div class="slot"><div class="icon">💿</div>
      <div style="flex:1"><label class="small muted">Количество дисков (RAID)</label>
        <input type="number" min="1" max="24" value="${state.serverDrives}" oninput="state.serverDrives=Math.max(1,Math.min(24,+this.value||1));render()">
      </div><div class="p small muted">в цене учтено</div></div>
    <div class="slot"><div class="icon">💾</div>
      <div style="flex:1"><label class="small muted">Количество модулей памяти</label>
        <input type="number" min="1" max="16" value="${state.serverRamModules}" oninput="state.serverRamModules=Math.max(1,Math.min(16,+this.value||1));render()">
      </div><div class="p small muted">шт.</div></div>`;

  const parts = serverBuildParts({ parts: state.serverBuild, drives: state.serverDrives, ramModules: state.serverRamModules });
  const total = serverBuildPrice({ parts: state.serverBuild, drives: state.serverDrives, ramModules: state.serverRamModules }, state.region);
  const used = serverBuildPrice({ parts: state.serverBuild, drives: state.serverDrives, ramModules: state.serverRamModules }, state.region, 'used');
  const compat = checkServerCompatibility(parts);
  const wl = serverWorkload(parts);
  const cores = serverPartById(state.serverBuild.servercpu)?.specs.cores || 0;
  const ramGb = (serverPartById(state.serverBuild.serverram)?.specs.capacityGb || 0) * state.serverRamModules;
  const diskGb = (serverPartById(state.serverBuild.serverstorage)?.specs.capacityGb || 0) * state.serverDrives;
  const consumption = serverBuildConsumption({ parts: state.serverBuild, drives: state.serverDrives });

  $('#serverSummary').innerHTML = `
    <h3 style="margin-top:0">🗄️ Ваш сервер</h3>
    <div class="total">${fmt(total)}</div>
    <div class="small muted">новое · ${esc(regionById(state.region).name)} · Б/У ≈ ${fmt(used)}</div>
    <div class="srv-grid">
      <div><b>${cores}</b><span>ядер / ${serverPartById(state.serverBuild.servercpu)?.specs.threads || 0} потоков</span></div>
      <div><b>${ramGb} ГБ</b><span>ECC-память</span></div>
      <div><b>${(diskGb / 1000).toFixed(1)} ТБ</b><span>${state.serverDrives}× ${esc(serverPartById(state.serverBuild.serverstorage)?.specs.type || '')}</span></div>
      <div><b>${consumption} Вт</b><span>потребление</span></div>
    </div>
    <div class="specs-mini srv-parts">
      <div>CPU: <b>${esc(serverPartById(state.serverBuild.servercpu)?.name || '—')}</b></div>
      <div>Плата: <b>${esc(serverPartById(state.serverBuild.servermb)?.name || '—')}</b></div>
      <div>Память: <b>${esc(serverPartById(state.serverBuild.serverram)?.name || '—')}</b></div>
      <div>Диск: <b>${esc(serverPartById(state.serverBuild.serverstorage)?.name || '—')}</b></div>
      <div>Сеть: <b>${esc(serverPartById(state.serverBuild.servernic)?.name || '—')}</b></div>
      <div>Шасси: <b>${esc(serverPartById(state.serverBuild.serverchassis)?.name || '—')}</b></div>
    </div>
    <div class="srv-load">
      <div>👥 ВМ: <b>~${wl.vms}</b></div>
      <div>🌐 сайтов: <b>~${wl.sites}</b></div>
      <div>🐳 контейнеров: <b>~${wl.containers}</b></div>
      <div>🗃️ TPS БД: <b>~${wl.dbTps.toLocaleString('ru-RU')}</b></div>
    </div>
    <div class="verdict ${compat.status}" style="margin-top:14px;padding:12px">
      <b>${compat.status === 'ok' ? '✅ Совместимо' : compat.status === 'warn' ? '⚠️ Есть замечания' : '❌ Несовместимо'}</b>
      <div class="small">${compat.issues.filter(i => i.level !== 'ok').map(i => '• ' + esc(i.title)).join('<br>') || 'Все проверки пройдены.'}</div>
    </div>
    <div class="save-box">
      <label class="small muted">💾 Сохранить серверную сборку</label>
      <input placeholder="Название: «NAS на 12 ТБ»" value="${esc(state.saveName)}" oninput="state.saveName=this.value">
      <textarea placeholder="Заметка: например, что храню и кто пользуется" rows="2" oninput="state.saveNote=this.value">${esc(state.saveNote)}</textarea>
      <div style="display:flex;gap:8px">
        <button class="btn" style="flex:1" onclick="saveCurrentBuild('server')">Сохранить</button>
        <button class="btn ghost" onclick="navigate('saved')">Мои сборки</button>
      </div>
    </div>
    <div class="fps-inline" style="margin-top:12px">🖥️ ОС: <b>${esc(SERVER_OS.find(o => o.id === state.serverOs)?.name || 'не выбрана')}</b></div>
    <button class="btn lime" style="width:100%;margin-top:10px" onclick="state.osPickFor='custom';navigate('server-os')">Подобрать ОС под сервер →</button>
    <button class="btn ghost" style="width:100%;margin-top:8px" onclick="navigate('server-compat')">Детальная проверка совместимости →</button>`;

  // ----- готовые серверные сборки -----
  const game = null;
  $('#serverBuilds').innerHTML = SERVER_BUILDS.map(b => {
    const bp = serverBuildParts(b);
    const st = checkServerCompatibility(bp);
    const os = SERVER_OS.find(o => o.id === b.os);
    const price = serverBuildPrice(b, state.region);
    const wlb = serverWorkload(bp);
    return `<article class="card">
      <div class="tag">${esc(b.tag)} · ${b.parts ? serverPartById(b.parts.servercpu)?.specs.socket : ''}</div>
      <h3>${esc(b.name)}</h3>
      <p>${esc(b.desc)}</p>
      <div class="specs-mini">
        <div>CPU: <b>${esc(serverPartById(b.parts.servercpu)?.name || '—')}</b></div>
        <div>RAM: <b>${serverBuildRamGb(b)} ГБ ECC</b></div>
        <div>Диски: <b>${b.drives}× ${esc(serverPartById(b.parts.serverstorage)?.specs.type || '')}</b></div>
        <div>Шасси: <b>${esc(serverPartById(b.parts.serverchassis)?.specs.formFactor || '—')}</b></div>
      </div>
      <div class="small muted">Для чего: ${esc(b.purpose)}</div>
      <div class="fps-inline">🖥️ ОС: <b>${esc(os?.name || '—')}</b> <span class="muted small">· ${wlb.vms} ВМ / ${wlb.sites} сайтов</span></div>
      <div class="row">
        <div><span class="price">${fmt(price)}</span> <span class="muted small">· бюджет ${fmt(b.budget)}</span><br>
          <span class="small ${st.status === 'ok' ? 'muted' : ''}">${st.status === 'ok' ? '✅ совместимо' : st.status === 'warn' ? '⚠️ ' + st.issues.filter(i => i.level === 'warn').length + ' замечания' : '❌ несовместимо'}</span></div>
        <div class="saved-actions">
          <button class="btn small ghost" onclick="loadServerBuild('${b.id}')">Открыть в конструкторе</button>
          <button class="btn small" onclick="savePresetServerBuild('${b.id}')">Сохранить</button>
        </div>
      </div>
    </article>`;
  }).join('');

  // ----- каталог серверных комплектующих -----
  let list = SERVER_COMPONENTS.filter(p => state.serverCat === 'all' || p.cat === state.serverCat);
  if (state.serverQuery) list = list.filter(p => matchesQuery(p, state.serverQuery) || Object.values(p.specs).join(' ').toLowerCase().includes(state.serverQuery.toLowerCase()));
  if (state.serverSort === 'price') list = list.sort((a, b) => serverPrice(a, state.region) - serverPrice(b, state.region));
  else if (state.serverSort === 'priceDesc') list = list.sort((a, b) => serverPrice(b, state.region) - serverPrice(a, state.region));
  else if (state.serverSort === 'year') list = list.sort((a, b) => b.year - a.year);
  else list = list.sort((a, b) => b.perf - a.perf);
  $('#serverGrid').innerHTML = list.length ? list.map(serverCompCard).join('') : '<div class="empty">Ничего не найдено. Попробуйте «EPYC», «DDR5», «U.2», «10GbE».</div>';

  // ----- сравнение серверных сборок -----
  $('#serverComparePicks').innerHTML = [0, 1].map(i => {
    const id = state.serverCompare[i];
    return `<div class="pick"><label class="small muted">Сервер ${i + 1}</label>
      <select onchange="state.serverCompare[${i}]=this.value;render()">
        ${SERVER_BUILDS.map(b => `<option value="${b.id}" ${b.id === id ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}
        <option value="custom" ${id === 'custom' ? 'selected' : ''}>⭐ Ваша текущая сборка</option>
      </select></div>`;
  }).join('');
  const listCompare = state.serverCompare.map(id => id === 'custom'
    ? { id: 'custom', name: 'Ваша сборка', parts: state.serverBuild, drives: state.serverDrives, ramModules: state.serverRamModules, os: null }
    : SERVER_BUILDS.find(b => b.id === id)).filter(Boolean);
  const rows = [
    ['Цена', b => fmt(serverBuildPrice(b, state.region)), b => serverBuildPrice(b, state.region)],
    ['Ядер / потоков', b => `${serverBuildCores(b)} / ${serverPartById(b.parts.servercpu)?.specs.threads || 0}`, b => serverBuildCores(b)],
    ['Память', b => `${serverBuildRamGb(b)} ГБ ECC`, b => serverBuildRamGb(b)],
    ['Диски', b => `${b.drives}× ${serverPartById(b.parts.serverstorage)?.specs.type}`, null, null],
    ['Ёмкость', b => `${(serverBuildDiskGb(b) / 1000).toFixed(1)} ТБ`, b => serverBuildDiskGb(b)],
    ['ВМ (оценка)', b => '~' + serverWorkload(serverBuildParts(b)).vms, b => serverWorkload(serverBuildParts(b)).vms],
    ['Сайтов', b => '~' + serverWorkload(serverBuildParts(b)).sites, b => serverWorkload(serverBuildParts(b)).sites],
    ['Потребление', b => serverBuildConsumption(b) + ' Вт', b => serverBuildConsumption(b)],
    ['Шасси', b => esc(serverPartById(b.parts.serverchassis)?.specs.formFactor || '—'), null, null],
    ['Сеть', b => esc(serverPartById(b.parts.servernic)?.specs.ports || '—'), null, null],
    ['ОС', b => b.os ? esc(SERVER_OS.find(o => o.id === b.os)?.name) : 'подбирается', null, null],
  ];
  let html = `<div class="table-wrap"><table><tr><th>Параметр</th>${listCompare.map(b => `<th>${esc(b.name)}</th>`).join('')}</tr>`;
  rows.forEach(([label, fn, numFn]) => {
    let best = -1;
    if (numFn) { const vals = listCompare.map(numFn); if (label === 'Цена' || label === 'Потребление') best = vals.indexOf(Math.min(...vals)); else best = vals.indexOf(Math.max(...vals)); }
    html += `<tr><td class="muted">${label}</td>${listCompare.map((b, i) => `<td class="${i === best ? 'best' : ''}">${fn(b)}</td>`).join('')}</tr>`;
  });
  html += '</table></div>';
  $('#serverCompareBody').innerHTML = html;
}
function loadServerBuild(id) {
  const b = SERVER_BUILDS.find(x => x.id === id);
  if (!b) return;
  state.serverBuild = { ...b.parts };
  state.serverDrives = b.drives || 2;
  state.serverRamModules = b.ramModules || 1;
  render();
  toast(`Загружена сборка «${b.name}»`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function savePresetServerBuild(id) {
  const b = SERVER_BUILDS.find(x => x.id === id);
  if (!b) return;
  state.serverBuild = { ...b.parts };
  state.serverDrives = b.drives || 2;
  state.serverRamModules = b.ramModules || 1;
  state.serverOs = b.os || '';
  state.saveName = b.name;
  saveCurrentBuild('server');
}

// ---------- ОС для серверов ----------
function osCard(os, build) {
  const fit = build ? osFitsBuild(os, build) : null;
  const open = state.osOpen === os.id;
  const fitBadge = fit
    ? (fit.ok ? `<span class="fps-badge ok">подходит</span>` : `<span class="fps-badge err">не подходит</span>`)
    : '';
  return `<article class="card os-card ${open ? 'open' : ''}">
    <div class="tag">${os.familyIcon} ${os.family} · ${esc(os.vendor)}</div>
    <h3>${esc(os.name)} ${fitBadge}</h3>
    <div class="os-price">${os.price ? fmt(os.price) : 'Бесплатно'} <span class="muted small">· ${esc(os.license)}</span></div>
    <div class="specs-mini">
      <div>Мин. CPU: <b>${os.minCores} ядра</b></div>
      <div>Мин. RAM: <b>${os.minRamGb} ГБ</b></div>
      <div>Мин. диск: <b>${os.minDiskGb} ГБ</b></div>
      <div>Рекомендуется: <b>${esc(os.recommends)}</b></div>
      <div>Пакеты: <b>${esc(os.packageManager)}</b></div>
      <div>Поддержка: <b>${esc(os.support)}</b></div>
    </div>
    <p class="os-desc ${open ? '' : 'clamped'}">${esc(os.desc)}</p>
    ${open ? `
      <div class="os-block">
        <h4>✅ Плюсы</h4>
        <ul>${os.pros.map(p => `<li>${esc(p)}</li>`).join('')}</ul>
        <h4>⚠️ Минусы</h4>
        <ul>${os.cons.map(p => `<li>${esc(p)}</li>`).join('')}</ul>
        <h4>🎯 Кому подходит</h4>
        <div class="chips">${os.bestFor.map(b => `<span class="chip">${esc(b)}</span>`).join('')}</div>
        <h4>💿 Виртуализация</h4>
        <div class="small">${esc(os.virtualization)}</div>
        <h4>🚀 Установка</h4>
        <div class="small">${esc(os.install)}</div>
        ${fit && !fit.ok ? `<div class="verdict error small" style="margin-top:10px">Не хватает ресурсов: ${fit.problems.map(esc).join(', ')}</div>` : ''}
        ${fit && fit.ok && fit.tight ? `<div class="verdict warn small" style="margin-top:10px">Подходит, но RAM впритык — лучше увеличить.</div>` : ''}
      </div>` : ''}
    <div class="row">
      <button class="btn small ghost" onclick="state.osOpen = state.osOpen === '${os.id}' ? '' : '${os.id}';render()">${open ? 'Свернуть' : 'Подробнее'}</button>
      <button class="btn small" onclick="applyOsToServer('${os.id}')">Выбрать для сервера</button>
    </div>
  </article>`;
}
function applyOsToServer(osId) {
  const os = SERVER_OS.find(o => o.id === osId);
  if (!os) return;
  state.serverOs = osId;
  toast(`ОС «${os.name}» выбрана для вашей серверной сборки`);
  render();
  const box = $('#osSelected');
  if (box) renderOsSelected();
}
function renderOsSelected() {
  const os = SERVER_OS.find(o => o.id === state.serverOs);
  const box = $('#osSelected');
  if (!box) return;
  if (!os) { box.innerHTML = '<span class="muted small">ОС пока не выбрана — нажмите «Выбрать для сервера» на любой карточке.</span>'; return; }
  const currentBuild = state.osPickFor === 'custom'
    ? { parts: state.serverBuild, drives: state.serverDrives, ramModules: state.serverRamModules }
    : SERVER_BUILDS.find(b => b.id === state.osPickFor);
  const fit = currentBuild ? osFitsBuild(os, currentBuild) : null;
  box.innerHTML = `<div class="os-picked">
    <div><span class="small muted">Выбранная ОС</span><br><b>${os.familyIcon} ${esc(os.name)}</b> <span class="muted small">· ${os.price ? fmt(os.price) : 'бесплатно'}</span></div>
    <div class="small">${fit ? (fit.ok ? '✅ Ресурсов достаточно для этой сборки' : '❌ Не хватает: ' + fit.problems.join(', ')) : 'Выберите сборку, чтобы проверить ресурсы'}</div>
    <button class="btn small ghost" onclick="state.osOpen='${os.id}';render()">Описание ОС</button>
  </div>`;
}
function renderServerOs() {
  const families = ['all', ...new Set(SERVER_OS.map(o => o.family))];
  $('#osFamilyChips').innerHTML = families.map(f =>
    `<button class="chip ${state.osFamily === f ? 'active' : ''}" onclick="state.osFamily='${f}';render()">${f === 'all' ? '🗂️ Все' : f}</button>`).join('');

  const buildSel = $('#osBuildPick');
  if (buildSel) {
    buildSel.innerHTML = `<option value="">— проверять под сборку —</option>
      <option value="custom" ${state.osPickFor === 'custom' ? 'selected' : ''}>⭐ Ваша текущая серверная сборка</option>
      ${SERVER_BUILDS.map(b => `<option value="${b.id}" ${state.osPickFor === b.id ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}`;
  }
  const contextBuild = state.osPickFor === 'custom'
    ? { parts: state.serverBuild, drives: state.serverDrives, ramModules: state.serverRamModules }
    : (SERVER_BUILDS.find(b => b.id === state.osPickFor) || null);

  let list = SERVER_OS.filter(o => state.osFamily === 'all' || o.family === state.osFamily);
  if (state.osQuery) {
    const q = normalize(state.osQuery);
    list = list.filter(o => normalize([o.name, o.vendor, o.family, o.desc, o.bestFor.join(' '), o.pros.join(' ')].join(' ')).includes(q));
  }
  if (state.osSort === 'price') list = list.sort((a, b) => a.price - b.price);
  else if (state.osSort === 'ram') list = list.sort((a, b) => a.minRamGb - b.minRamGb);
  else if (state.osSort === 'fit' && contextBuild) list = list.sort((a, b) => {
    const fa = osFitsBuild(a, contextBuild), fb = osFitsBuild(b, contextBuild);
    return (fb.ok ? 1 : 0) - (fa.ok ? 1 : 0);
  });
  else list = list.sort((a, b) => a.name.localeCompare(b.name, 'ru'));

  $('#osGrid').innerHTML = list.map(o => osCard(o, contextBuild)).join('') || '<div class="empty">Ничего не найдено. Попробуйте «NAS», «гипервизор», «сертифицированная», «Windows».</div>';
  renderOsSelected();

  // сравнение ОС
  const table = [
    ['Семейство', o => o.family, null],
    ['Цена', o => o.price ? fmt(o.price) : 'Бесплатно', o => o.price],
    ['Поддержка', o => esc(o.support), null],
    ['Мин. CPU', o => o.minCores + ' ядра', o => o.minCores],
    ['Мин. RAM', o => o.minRamGb + ' ГБ', o => o.minRamGb],
    ['Мин. диск', o => o.minDiskGb + ' ГБ', o => o.minDiskGb],
    ['Пакеты', o => esc(o.packageManager), null],
    ['Виртуализация', o => esc(o.virtualization), null],
    ['Для чего', o => o.bestFor.slice(0, 2).map(esc).join(', '), null],
  ];
  $('#osTable').innerHTML = `<div class="table-wrap"><table><tr><th>Параметр</th>${list.map(o => `<th>${esc(o.name)}</th>`).join('')}</tr>` +
    table.map(([label, fn]) => `<tr><td class="muted">${label}</td>${list.map(o => `<td>${fn(o)}</td>`).join('')}</tr>`).join('') + '</table></div>';
}

// ---------- Проверка совместимости серверов ----------
function renderServerCompat() {
  $('#serverCompatForm').innerHTML = SERVER_CATEGORIES.map(c => {
    const cur = state.serverBuild[c.id];
    const pool = SERVER_COMPONENTS.filter(x => x.cat === c.id);
    return `<div class="slot"><div class="icon">${c.icon}</div>
      <div style="flex:1"><label class="small muted">${c.name}</label>
      <select onchange="state.serverBuild['${c.id}']=this.value;render()">
        ${pool.map(x => `<option value="${x.id}" ${x.id === cur ? 'selected' : ''}>${esc(x.name)}${x.year < 2020 ? ' · Б/У' : ''}</option>`).join('')}
      </select></div></div>`;
  }).join('') + `
    <div class="slot"><div class="icon">💿</div><div style="flex:1"><label class="small muted">Дисков</label>
      <input type="number" min="1" max="24" value="${state.serverDrives}" oninput="state.serverDrives=Math.max(1,Math.min(24,+this.value||1));render()"></div></div>
    <div class="slot"><div class="icon">💾</div><div style="flex:1"><label class="small muted">Модулей памяти</label>
      <input type="number" min="1" max="16" value="${state.serverRamModules}" oninput="state.serverRamModules=Math.max(1,Math.min(16,+this.value||1));render()"></div></div>`;

  const parts = serverBuildParts({ parts: state.serverBuild, drives: state.serverDrives, ramModules: state.serverRamModules });
  const res = checkServerCompatibility(parts);
  const icon = res.status === 'ok' ? '✅' : res.status === 'warn' ? '⚠️' : '❌';
  const title = res.status === 'ok' ? 'Сервер совместим!' : res.status === 'warn' ? 'Совместимо, но есть замечания' : 'Есть несовместимости';
  $('#serverCompatResult').innerHTML = `<div class="verdict ${res.status}">
    <b style="font-size:1.15rem">${icon} ${title}</b>
    ${res.issues.map(i => `<div class="issue"><div class="ico">${i.level === 'ok' ? '✅' : i.level === 'warn' ? '⚠️' : i.level === 'info' ? 'ℹ️' : '❌'}</div>
      <div><b>${esc(i.title)}</b><span>${esc(i.desc)}</span>${i.fix ? `<div class="fix">💡 ${esc(i.fix)}</div>` : ''}</div></div>`).join('')}
  </div>`;
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
  else if (state.page === 'saved') renderSavedPage();
  else if (state.page === 'servers') renderServers();
  else if (state.page === 'server-os') renderServerOs();
  else if (state.page === 'server-compat') renderServerCompat();
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
