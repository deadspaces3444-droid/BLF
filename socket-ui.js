// ===== BLF — выбор по сокету =====
// Пользователь выбирает сокет (LGA1700, AM4, X99/LGA2011-3, SP3…) — и каталог комплектующих,
// конструктор и ИИ показывают только то, что подходит под эту платформу.
// Для каждого сокета заранее известны платы, память, кулеры, процессоры и годы выпуска.

const SOCKET_META = {
  'LGA1700': { name: 'LGA1700', label: 'Intel 12/13/14 поколение', icon: '🔵', family: 'Intel', ram: 'DDR4/DDR5', years: '2021–2025', perf: 4, note: 'современный массовый Intel; DDR4 и DDR5 (зависит от платы)' },
  'LGA1851': { name: 'LGA1851', label: 'Intel Core Ultra 200', icon: '🔵', family: 'Intel', ram: 'DDR5', years: '2024+', perf: 3, note: 'новейший Intel, только DDR5 и новые платы Z890/B860' },
  'LGA1200': { name: 'LGA1200', label: 'Intel 10/11 поколение', icon: '🔵', family: 'Intel', ram: 'DDR4', years: '2020–2021', perf: 3, note: 'выгодный б/у Intel: i5-10400F и i7-11700' },
  'LGA1151': { name: 'LGA1151', label: 'Intel 6–9 поколение', icon: '🔵', family: 'Intel', ram: 'DDR4', years: '2015–2019', perf: 2, note: 'дешёвые i5-8400/i7-9700, память DDR4' },
  'LGA1150': { name: 'LGA1150', label: 'Intel 4 поколение (Haswell)', icon: '🔵', family: 'Intel', ram: 'DDR3', years: '2013–2014', perf: 1, note: 'очень дешёвые платформы под DDR3, для офиса и лёгких игр' },
  'LGA1155': { name: 'LGA1155', label: 'Intel 2/3 поколение', icon: '🔵', family: 'Intel', ram: 'DDR3', years: '2011–2013', perf: 1, note: 'самый бюджетный Intel, Xeon E3-1230 v2 за копейки' },
  'LGA2011': { name: 'LGA2011', label: 'X79 · Xeon E5 v1/v2', icon: '🟠', family: 'Intel HEDT', ram: 'DDR3 ECC', years: '2011–2014', perf: 2, note: 'китайские X79, регистровая память, 4–8 ядер за небольшие деньги' },
  'LGA2011-3': { name: 'LGA2011-3', label: 'X99 · Xeon E5 v3/v4', icon: '🟠', family: 'Intel HEDT', ram: 'DDR4 ECC', years: '2014–2019', perf: 3, note: 'X99 и Xeon E5-2660 v3 — 10–20 ядер за 10–20 тыс. ₽' },
  'LGA2066': { name: 'LGA2066', label: 'X299 · Core X / Xeon W', icon: '🟠', family: 'Intel HEDT', ram: 'DDR4', years: '2017–2021', perf: 3, note: 'HEDT: много PCIe-линий, 4 канала памяти' },
  'LGA3647': { name: 'LGA3647', label: 'Xeon Scalable 1/2', icon: '🟣', family: 'Intel Server', ram: 'DDR4 ECC REG', years: '2017–2020', perf: 4, note: 'серверная платформа: Xeon Silver/Gold, REG-память' },
  'LGA1366': { name: 'LGA1366', label: 'X58 · Xeon 5500/5600', icon: '🟠', family: 'Intel HEDT', ram: 'DDR3 ECC', years: '2008–2011', perf: 1, note: 'легендарный X58: Xeon X5650, 6 ядер и 3 канала памяти' },
  'LGA775': { name: 'LGA775', label: 'Core 2 Duo/Quad', icon: '⚪', family: 'Intel Legacy', ram: 'DDR2/DDR3', years: '2004–2010', perf: 0, note: 'музейная платформа, для ретро и офиса' },
  'AM5': { name: 'AM5', label: 'AMD Ryzen 7000/8000/9000', icon: '🔴', family: 'AMD', ram: 'DDR5', years: '2022+', perf: 4, note: 'актуальная AMD: апгрейд до 9000X3D без смены платы' },
  'AM4': { name: 'AM4', label: 'AMD Ryzen 1000–5000', icon: '🔴', family: 'AMD', ram: 'DDR4', years: '2017–2024', perf: 3, note: 'самый выгодный игровой сокет: 5600/5700X3D + дешёвые платы' },
  'AM3+': { name: 'AM3+', label: 'AMD FX', icon: '⚪', family: 'AMD Legacy', ram: 'DDR3', years: '2011–2016', perf: 0, note: 'FX-8350: дёшево, горячо, для ретро' },
  'AM3': { name: 'AM3', label: 'Phenom II / Athlon II', icon: '⚪', family: 'AMD Legacy', ram: 'DDR3', years: '2009–2011', perf: 0, note: 'очень дешёвые сборки под DDR3' },
  'TR4': { name: 'TR4', label: 'Threadripper 1000/2000', icon: '🟠', family: 'AMD HEDT', ram: 'DDR4', years: '2017–2019', perf: 3, note: '16–32 ядра для рендера и виртуализации' },
  'sTRX4': { name: 'sTRX4', label: 'Threadripper 3000', icon: '🟠', family: 'AMD HEDT', ram: 'DDR4', years: '2019–2021', perf: 4, note: '24–64 ядра, 8 каналов? нет — 4 канала DDR4' },
  'sWRX8': { name: 'sWRX8', label: 'Threadripper Pro', icon: '🟠', family: 'AMD HEDT', ram: 'DDR4 ECC', years: '2020+', perf: 4, note: 'Pro-линейка: 8 каналов памяти, ECC, рабочая станция' },
  'sTR5': { name: 'sTR5', label: 'Threadripper 7000', icon: '🟠', family: 'AMD HEDT', ram: 'DDR5 ECC', years: '2023+', perf: 5, note: 'новейший HEDT: 96 ядер и 8 каналов DDR5' },
  'SP3': { name: 'SP3', label: 'EPYC Naples/Rome', icon: '🟣', family: 'AMD Server', ram: 'DDR4 ECC REG', years: '2017–2019', perf: 4, note: 'серверная AMD: 32–64 ядра, 8 каналов памяти' },
  'SP5': { name: 'SP5', label: 'EPYC Genoa/Turin', icon: '🟣', family: 'AMD Server', ram: 'DDR5 ECC REG', years: '2022+', perf: 5, note: 'топовые EPYC: 96–128 ядер, 12 каналов DDR5' },
  'G34': { name: 'G34', label: 'Opteron 6000', icon: '⚪', family: 'AMD Server', ram: 'DDR3 ECC', years: '2010–2012', perf: 0, note: 'старые Opteron: 12–16 ядер очень дешёво' },
};

// Нормализация: в каталоге встречаются «LGA2011-3», «LGA 2011-3», «X99», «LGA1151» и т.п.
function socketNorm(s) {
  const raw = String(s || '').toUpperCase().replace(/\s+/g, '').trim();
  if (!raw) return '';
  if (/^(X99|LGA2011-3|2011-3|LGA2011V3)$/.test(raw)) return 'LGA2011-3';
  if (/^(X79|LGA2011|2011|LGA2011V1)$/.test(raw)) return 'LGA2011';
  if (/^(X58|LGA1366|1366)$/.test(raw)) return 'LGA1366';
  if (/^(X299|LGA2066|2066)$/.test(raw)) return 'LGA2066';
  if (/^(TRX40|STRX4)$/.test(raw)) return 'sTRX4';
  if (/^(WRX80|SWRX8)$/.test(raw)) return 'sWRX8';
  if (/^(TRX50|STR5)$/.test(raw)) return 'sTR5';
  if (/^(TR4|TR4\w*)$/.test(raw)) return 'TR4';
  if (/^(AM4|AM4\+)$/.test(raw)) return 'AM4';
  if (/^(AM5)$/.test(raw)) return 'AM5';
  if (/^(AM3\+?)$/.test(raw)) return raw.startsWith('AM3') ? (raw.includes('+') ? 'AM3+' : 'AM3') : raw;
  if (/^(LGA1700|1700)$/.test(raw)) return 'LGA1700';
  if (/^(LGA1851|1851)$/.test(raw)) return 'LGA1851';
  if (/^(LGA1200|1200)$/.test(raw)) return 'LGA1200';
  if (/^(LGA1151|1151)$/.test(raw)) return 'LGA1151';
  if (/^(LGA1150|1150)$/.test(raw)) return 'LGA1150';
  if (/^(LGA1155|1155)$/.test(raw)) return 'LGA1155';
  if (/^(LGA775|775)$/.test(raw)) return 'LGA775';
  if (/^(LGA3647|3647)$/.test(raw)) return 'LGA3647';
  if (/^(SP3|SP5|G34)$/.test(raw)) return raw;
  return raw;
}

// Все сокеты каталога с количеством позиций
function socketInventory() {
  const map = new Map();
  const cpus = (typeof COMPONENTS !== 'undefined' ? COMPONENTS : []).filter(c => c.cat === 'cpu');
  const mbs = (typeof COMPONENTS !== 'undefined' ? COMPONENTS : []).filter(c => c.cat === 'motherboard');
  const motherboards = (typeof SERVER_COMPONENTS !== 'undefined' ? SERVER_COMPONENTS.filter(c => c.cat === 'servermb') : []);
  cpus.forEach(c => {
    const s = socketNorm(c.specs.socket);
    if (!s) return;
    if (!map.has(s)) map.set(s, { socket: s, cpus: 0, boards: 0, years: [], minCpu: Infinity });
    const e = map.get(s);
    e.cpus++;
    const p = (typeof minPrice === 'function' ? minPrice(c.id, state.region, 'new') : null) ?? c.basePrice ?? 0;
    if (p) e.minCpu = Math.min(e.minCpu, p);
    e.years.push(c.year || 2020);
  });
  mbs.forEach(b => {
    const s = socketNorm(b.specs.socket);
    if (!s) return;
    if (!map.has(s)) map.set(s, { socket: s, cpus: 0, boards: 0, years: [] });
    map.get(s).boards++;
  });
  motherboards.forEach(b => {
    const s = socketNorm(String(b.specs.socket).split('×')[0]);
    if (!s) return;
    if (!map.has(s)) map.set(s, { socket: s, cpus: 0, boards: 0, years: [] });
    const e = map.get(s);
    e.boards++;
    e.serverBoards = (e.serverBoards || 0) + 1;
  });
  return [...map.values()].map(e => ({
    ...e,
    meta: SOCKET_META[e.socket] || { name: e.socket, label: 'прочие платформы', icon: '⚙️', family: 'Другое', ram: '—', years: '', perf: 1, note: '' },
    yearFrom: e.years.length ? Math.min(...e.years) : 0,
    yearTo: e.years.length ? Math.max(...e.years) : 0,
    minCpu: e.minCpu === Infinity ? null : e.minCpu,
  })).sort((a, b) => (b.meta.perf - a.meta.perf) || (b.cpus - a.cpus));
}

function socketMeta(s) { return SOCKET_META[socketNorm(s)] || null; }

// ---------- Фильтрация по выбранному сокету ----------
function socketMatchesCategory(comp, socket) {
  const s = socketNorm(socket);
  if (!s) return true;
  const specs = comp.specs || {};
  switch (comp.cat) {
    case 'cpu':
      return socketNorm(specs.socket) === s;
    case 'motherboard':
      return socketNorm(specs.socket) === s;
    case 'ram': {
      const meta = SOCKET_META[s];
      const want = meta ? String(meta.ram).replace(/\s*(ECC|REG)\b/g, '').trim() : '';
      const t = String(specs.type || '');
      if (!want || want === '—') return true;
      const base = t.replace(/\s*(ECC|REG)\b/g, '').trim();
      return want.split('/').some(w => base.startsWith(w.trim()));
    }
    case 'cooling': {
      if (!specs.sockets) return true;
      if (typeof socketListMatches === 'function') return socketListMatches(specs.sockets, s);
      return String(specs.sockets).toUpperCase().includes(s);
    }
    case 'psu':
    case 'case':
    case 'ssd':
    case 'gpu':
      return true;   // эти комплектующие от сокета не зависят
    default:
      return true;
  }
}

// Сколько позиций останется в каждой категории при выбранном сокете
function socketCounts(socket) {
  if (!socket) return null;
  const out = {};
  (typeof COMPONENTS !== 'undefined' ? COMPONENTS : []).forEach(c => {
    out[c.cat] = out[c.cat] || { all: 0, fit: 0 };
    out[c.cat].all++;
    if (socketMatchesCategory(c, socket)) out[c.cat].fit++;
  });
  return out;
}

// Кулер с самым большим TDP под сокет — для подсказки
function socketBestCooler(socket) {
  return (COMPONENTS || []).filter(c => c.cat === 'cooling' && socketMatchesCategory(c, socket))
    .sort((a, b) => (b.specs.tdpSupport || 0) - (a.specs.tdpSupport || 0))[0] || null;
}

// ---------- Применение сокета к конструктору ----------
function applySocket(socket) {
  const s = socketNorm(socket);
  state.socket = s || '';
  if (!s) { saveSocket(); render(); return; }
  // 1) процессор под сокет (берём самый производительный в разумной цене)
  const cpus = (COMPONENTS || []).filter(c => c.cat === 'cpu' && socketNorm(c.specs.socket) === s);
  if (!cpus.length) { toast(`Для сокета ${s} в каталоге нет процессоров`); render(); return; }
  const priced = cpus.map(c => ({ c, price: minPrice(c.id, state.region, 'new') ?? c.basePrice ?? 0 }))
    .sort((a, b) => (b.c.perf / Math.max(b.price, 1)) - (a.c.perf / Math.max(a.price, 1)));
  // не берём самый дорогой флагман: ищем баланс
  const cpu = (priced.find(x => x.price <= 40000) || priced[0]).c;
  state.builder = { ...state.builder, cpu: cpu.id };
  // 2) плата под сокет — самая дешёвая подходящая
  const board = (COMPONENTS || []).filter(c => c.cat === 'motherboard' && socketNorm(c.specs.socket) === s)
    .map(c => ({ c, price: minPrice(c.id, state.region, 'new') ?? c.basePrice ?? 0 }))
    .sort((a, b) => a.price - b.price)[0];
  if (board) state.builder = { ...state.builder, motherboard: board.c.id };
  // 3) память под тип платы
  if (typeof compatibleOptions === 'function') {
    ['ram', 'cooling'].forEach(cat => {
      const opts = compatibleOptions(cat, state.builder);
      if (opts.length) state.builder[cat] = opts[0].id;
    });
  }
  saveSocket();
  if (typeof autoFixBuild === 'function') state.builder = autoFixBuild(state.builder).build;
  render();
  toast(`Сокет ${s}: ${cpu.name}${board ? ' + ' + board.c.name : ''}`);
  return { cpu, board };
}
function setSocket(socket) { state.socket = socketNorm(socket); saveSocket(); render(); }
function clearSocket() { state.socket = ''; saveSocket(); render(); }
function saveSocket() { try { localStorage.setItem('blf.socket.v1', state.socket || ''); } catch (e) {} }
function loadSocket() { try { const v = localStorage.getItem('blf.socket.v1'); if (v) state.socket = v; } catch (e) {} }

// ---------- UI: полоса выбора сокета ----------
function socketFilterBar() {
  const inv = socketInventory();
  const cur = state.socket || '';
  const counts = cur ? socketCounts(cur) : null;
  const groups = {};
  inv.forEach(x => { (groups[x.meta.family] = groups[x.meta.family] || []).push(x); });
  return `<div class="socket-bar">
    <div class="socket-bar-head">
      <b>🔌 Платформа по сокету</b>
      <span class="small muted">выберите сокет — в каталоге и конструкторе останутся только подходящие процессоры, платы, память и охлаждение</span>
    </div>
    <div class="socket-row">
      <select onchange="setSocket(this.value)">
        <option value="">Все сокеты</option>
        ${Object.entries(groups).map(([fam, list]) => `<optgroup label="${esc(fam)}">
          ${list.map(x => `<option value="${x.socket}" ${cur === x.socket ? 'selected' : ''}>${x.meta.icon} ${esc(x.meta.name)} · ${esc(x.meta.label)} · CPU ${x.cpus} / плат ${x.boards}</option>`).join('')}
        </optgroup>`).join('')}
      </select>
      ${cur && SOCKET_META[cur] ? `<button class="btn small lime" onclick="applySocket('${cur}')">🧩 Собрать на ${esc(SOCKET_META[cur].name)}</button>
        <button class="btn small ghost" onclick="clearSocket()">✕ Сбросить</button>` : ''}
    </div>
    ${[...Object.entries(groups)].map(([fam, list]) => `<div class="socket-family">
      <span class="socket-fam-name">${esc(fam)}</span>
      <div class="socket-chips">
        ${list.map(x => `<button class="chip socket-chip ${cur === x.socket ? 'active' : ''}" title="${esc(x.meta.note)}" onclick="setSocket('${x.socket}')">
          ${x.meta.icon} ${esc(x.meta.name)} <span class="small muted">${x.cpus} CPU · ${x.boards} плат${x.minCpu ? ' · от ' + fmt(x.minCpu) : ''}</span>
        </button>`).join('')}
      </div>
    </div>`).join('')}
    ${cur ? socketKitHtml() : ''}
    ${cur && SOCKET_META[cur] ? `<div class="socket-info">
      <div class="socket-info-main">
        <b>${SOCKET_META[cur].icon} ${esc(SOCKET_META[cur].name)}</b> — ${esc(SOCKET_META[cur].label)}
        <span class="small muted">· ${esc(SOCKET_META[cur].years)} · память ${esc(SOCKET_META[cur].ram)}</span>
        <div class="small muted">${esc(SOCKET_META[cur].note)}</div>
      </div>
      ${counts ? `<div class="socket-counts">
        ${Object.entries(counts).map(([cat, v]) => v.fit === 0 ? '' : `<span class="socket-count ${v.fit < v.all ? 'filtered' : ''}">${catById(cat).icon} ${catById(cat).name}: <b>${v.fit}</b>${v.fit < v.all ? ` <span class="muted">из ${v.all}</span>` : ''}</span>`).join('')}
      </div>` : ''}
    </div>` : ''}
  </div>`;
}

function renderSocketBars() {
  loadSocket();
  const targets = [['#socketBarComponents'], ['#socketBarBuilder'], ['#socketBarAi']];
  targets.forEach(([sel]) => {
    const el = document.querySelector(sel);
    if (el) el.innerHTML = socketFilterBar();
  });
}

// ---------- Готовый комплект под сокет ----------
function socketKit(socket) {
  const s = socketNorm(socket);
  if (!s) return null;
  const price = c => (typeof minPrice === 'function' ? minPrice(c.id, state.region, 'new') : null) ?? c.basePrice ?? 0;   // только новые, официальные магазины
  const byCat = cat => (COMPONENTS || []).filter(c => c.cat === cat && socketMatchesCategory(c, s))
    .map(c => ({ c, price: price(c) }));
  const cpus = byCat('cpu').sort((a, b) => (b.c.perf / Math.max(b.price, 1)) - (a.c.perf / Math.max(a.price, 1)));
  const boards = byCat('motherboard').sort((a, b) => a.price - b.price);
  const rams = byCat('ram').sort((a, b) => a.price - b.price);
  const coolers = byCat('cooling').sort((a, b) => a.price - b.price);
  // ядро платформы: не самый дешёвый «камень», а лучший баланс цена/производительность
  const cpu = cpus.find(x => x.price <= 40000) || cpus[0] || null;
  const corePrice = new Map();
  if (cpu) {
    const pool = cpus.filter(x => x.price >= cpu.price * 0.6 && x.price <= cpu.price * 2.6);
    corePrice.set('cpu', (pool.length ? pool : cpus).sort((a, b) => (b.c.perf / Math.max(b.price, 1)) - (a.c.perf / Math.max(a.price, 1)))[0]);
  }
  const cpuPick = corePrice.get('cpu') || cpu;
  // плата — самая дешёвая, которая умеет память выбранного процессора
  const needRam = String((cpuPick && cpuPick.c.specs.ramType) || '');
  const ramWord = /DDR5/.test(needRam) ? 'DDR5' : /DDR4/.test(needRam) ? 'DDR4' : /DDR3/.test(needRam) ? 'DDR3' : '';
  const boardOk = ramWord ? boards.filter(b => String(b.c.specs.ramType || '').includes(ramWord)) : [];
  const board = (boardOk.length ? boardOk : boards)[0] || null;
  const ramNeedEcc = /ECC|REG/.test(String(board && board.c.specs.ramType || needRam));
  const ramOk = rams.filter(r => !ramWord || String(r.c.specs.type || '').includes(ramWord))
    .filter(r => ramNeedEcc ? /ECC|REG/.test(String(r.c.specs.type || '')) : !/ECC|REG/.test(String(r.c.specs.type || '')));
  const ram = (ramOk.length ? ramOk : rams)[0] || null;
  // порядок как в конструкторе: процессор → плата → память → охлаждение
  const it = [
    cpuPick && { cat: 'cpu', title: 'Процессор', x: cpuPick },
    board && { cat: 'motherboard', title: 'Плата', x: board },
    ram && { cat: 'ram', title: 'Память', x: ram },
    coolers[0] && { cat: 'cooling', title: 'Охлаждение', x: coolers[0] },
  ].filter(Boolean);
  const sum = it.reduce((a, b) => a + b.x.price, 0);
  return { socket: s, items: it, sum, cpuCount: cpus.length, boardCount: boards.length };
}

function socketKitHtml() {
  const kit = socketKit(state.socket);
  if (!kit || !kit.items.length) return '';
  const meta = SOCKET_META[kit.socket] || {};
  return `<div class="socket-kit">
    <div class="socket-kit-head">
      <b>🧩 Комплект под ${esc(meta.name || kit.socket)}</b>
      <span class="small muted">самое выгодное из каталога · ядро платформы ${fmt(kit.sum)}</span>
    </div>
    <div class="socket-kit-grid">
      ${kit.items.map(it => `<div class="socket-kit-card">
        <div class="small muted">${esc(it.title)}</div>
        <div class="socket-kit-name">${esc(it.x.c.name)}</div>
        <div class="socket-kit-price">${fmt(it.x.price)}</div>
        <div class="small muted">${esc(it.x.c.specs.socket || it.x.c.specs.type || it.x.c.specs.sockets || '')}</div>
        <button class="btn small ghost" onclick="state.compCat='${it.cat}';state.compQuery='${esc(it.x.c.id)}';render()">Показать</button>
      </div>`).join('')}
    </div>
    <div class="socket-kit-actions">
      <button class="btn small lime" onclick="applySocket('${kit.socket}')">🧩 Собрать в конструкторе</button>
      <span class="small muted">в каталоге ${kit.cpuCount} процессоров и ${kit.boardCount} плат под этот сокет</span>
    </div>
  </div>`;
}
