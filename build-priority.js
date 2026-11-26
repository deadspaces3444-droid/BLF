// ===== BLF — приоритетная игра для сборок =====
// Пользователь выбирает игру (или набор игр) — и сайт начинает оценивать,
// сортировать и рекомендовать сборки именно под неё: FPS, вердикт относительно
// целевого FPS, цена за 1 FPS, «узкое место» и самая выгодная замена комплектующей.

const PRIORITY_KEY = 'blf.buildPriority.v1';
const PRIORITY_TARGETS = [60, 120, 144, 240];
const PRIORITY_PRESETS = [
  { id: 'esports', name: 'Киберспорт', icon: '⚡', games: ['cs2', 'dota2', 'valorant', 'fortnite', 'apex'], desc: 'шутеры и MOBA: важны высокие кадры и низкая задержка' },
  { id: 'aaa', name: 'AAA-одиночки', icon: '🎬', games: ['cyberpunk', 'witcher3', 'rdr2', 'hogwarts', 'alanwake2', 'stalker2', 'bg3', 'eldenring'], desc: 'тяжёлая графика: почти всё решает видеокарта' },
  { id: 'coop', name: 'Выживание и кооп', icon: '🏕️', games: ['rust', 'palworld', 'minecraft', 'helldivers2'], desc: 'большие миры: важны и процессор, и видеокарта' },
  { id: 'br', name: 'Королевские битвы', icon: '🪂', games: ['pubg', 'warzone', 'apex', 'fortnite'], desc: 'много игроков на большой карте' },
];

function gameIcon(g) {
  if (!g) return '🎮';
  if (/Шутер/.test(g.genre)) return '🔫';
  if (/MOBA/.test(g.genre)) return '🧙';
  if (/Королевская/.test(g.genre)) return '🪂';
  if (/Souls/.test(g.genre)) return '⚔️';
  if (/Хоррор/.test(g.genre)) return '👻';
  if (/Открытый мир|Песочница|Выживание/.test(g.genre)) return '🌍';
  return '🎮';
}

// Разбор текущего выбора: все игры / набор игр / конкретная игра
function priorityResolve(val) {
  if (!val || val === 'all') {
    return { kind: 'all', id: 'all', name: 'Все 20 игр', icon: '🎲', games: GAMES, desc: 'средний FPS по всем играм каталога' };
  }
  if (String(val).indexOf('p:') === 0) {
    const p = PRIORITY_PRESETS.find(x => x.id === String(val).slice(2));
    if (p) {
      return { kind: 'preset', id: val, name: p.name, icon: p.icon, games: GAMES.filter(g => p.games.includes(g.id)), desc: p.desc };
    }
  }
  const g = GAMES.find(x => x.id === val);
  if (g) return { kind: 'game', id: g.id, name: g.name, icon: gameIcon(g), games: [g], desc: g.genre };
  return { kind: 'all', id: 'all', name: 'Все 20 игр', icon: '🎲', games: GAMES, desc: 'средний FPS по всем играм каталога' };
}
function priorityInfo() { return priorityResolve(state.priorityGame); }
function priorityTarget() { return Number(state.priorityTarget) || 60; }
function priorityRes() { return state.priorityRes || '1080p'; }
function priorityIsAll() { return priorityInfo().kind === 'all'; }

// ---------- Хранение выбора ----------
let PRIORITY_LOADED = false;
function initPriorityState() {
  if (PRIORITY_LOADED) return;
  PRIORITY_LOADED = true;
  try {
    const raw = localStorage.getItem(PRIORITY_KEY);
    if (raw) {
      const cfg = JSON.parse(raw);
      if (cfg && typeof cfg.game === 'string' && (cfg.game === 'all' || cfg.game.indexOf('p:') === 0 || GAMES.some(g => g.id === cfg.game))) {
        state.priorityGame = cfg.game;
      }
      if (cfg && ['1080p', '1440p', '4K'].includes(cfg.res)) state.priorityRes = cfg.res;
      if (cfg && PRIORITY_TARGETS.includes(Number(cfg.target))) state.priorityTarget = Number(cfg.target);
    }
  } catch (e) { /* приватный режим — работаем без сохранения */ }
}
function savePriority() {
  try { localStorage.setItem(PRIORITY_KEY, JSON.stringify({ game: state.priorityGame, res: state.priorityRes, target: state.priorityTarget })); } catch (e) {}
}

// ---------- Смена приоритета ----------
function setPriorityGame(v) {
  state.priorityGame = v || 'all';
  savePriority();
  const p = priorityResolve(state.priorityGame);
  toast(`Приоритет: ${p.name}`);
  render();
}
function setPriorityRes(r) { state.priorityRes = r; savePriority(); render(); }
function setPriorityTarget(t) { state.priorityTarget = Number(t) || 60; savePriority(); render(); }

// ---------- FPS в приоритетных играх ----------
const PRIORITY_CACHE = new Map();
function buildFpsSet(build, games, res) {
  const parts = build && build.parts ? build.parts : build;
  if (!parts || !parts.cpu || !parts.gpu) return null;
  const ids = (games || []).map(g => g.id);
  if (!ids.length) return null;
  const key = [parts.cpu, parts.gpu, parts.ram || '-', ids.join('|'), res].join('§');
  if (PRIORITY_CACHE.has(key)) return PRIORITY_CACHE.get(key);
  const vals = ids.map(id => estimateFps(parts.cpu, parts.gpu, parts.ram, id, res)).filter(v => v != null && !isNaN(v));
  const out = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  PRIORITY_CACHE.set(key, out);
  return out;
}
function priorityFps(build, res = priorityRes()) {
  return buildFpsSet(build, priorityInfo().games, res);
}

// Вердикт относительно цели (60/120/144/240 FPS)
function priorityVerdict(fps, target = priorityTarget()) {
  if (fps == null) return { label: '—', cls: 'warn', delta: '', txt: 'не рассчитать' };
  const ratio = fps / target;
  const diff = Math.round((ratio - 1) * 100);
  const delta = diff === 0 ? 'ровно в цель' : (diff > 0 ? `+${diff}% к цели` : `${diff}% к цели`);
  if (ratio >= 1.15) return { label: 'Отлично', cls: 'ok', delta, txt: 'цель перекрыта с запасом — можно поднять настройки или разрешение', diff };
  if (ratio >= 1) return { label: 'Комфортно', cls: 'ok', delta, txt: 'цель достигнута', diff };
  if (ratio >= 0.8) return { label: 'Почти', cls: 'warn', delta, txt: `не хватает ${Math.max(1, target - fps)} FPS до цели`, diff };
  return { label: 'Слабо', cls: 'err', delta, txt: `не хватает ${target - fps} FPS до цели`, diff };
}
function priorityVerdictText(build) {
  const fps = priorityFps(build);
  return fps == null ? null : priorityVerdict(fps);
}
function priorityPricePerFps(build) {
  const fps = priorityFps(build);
  if (!fps) return null;
  const price = buildPrice(build, state.region, 'new').total;
  return Math.round(price / fps);
}
// Узкое место именно в приоритетной игре
function priorityBalance(build) {
  const parts = build.parts || build;
  const cpu = byId(parts.cpu), gpu = byId(parts.gpu);
  const p = priorityInfo();
  if (!cpu || !gpu) return null;
  const w = p.games.reduce((a, g) => a + g.gpuWeight, 0) / p.games.length;
  const cpuF = Math.pow(Math.max(cpu.perf, 5) / REF_CPU_PERF, 1 - w);
  const gpuF = Math.pow(Math.max(gpu.perf, 5) / REF_GPU_PERF, w);
  if (gpuF < cpuF * 0.92) return { who: 'Видеокарта', part: gpu, txt: `${gpu.name} — слабое звено здесь; апгрейд GPU даст больше всего FPS`, cls: 'warn', cat: 'gpu' };
  if (cpuF < gpuF * 0.92) return { who: 'Процессор', part: cpu, txt: `${cpu.name} — слабое звено здесь; апгрейд CPU уберёт просадки`, cls: 'warn', cat: 'cpu' };
  return { who: 'Баланс', part: null, txt: 'процессор и видеокарта подходят друг другу для этой игры', cls: 'ok', cat: null };
}

// ---------- Самая выгодная замена комплектующей ----------
function priorityUpgrade(build) {
  const parts = build.parts || build;
  const p = priorityInfo();
  const res = priorityRes();
  const base = buildFpsSet(build, p.games, res);
  if (base == null) return [];
  const out = [];
  ['gpu', 'cpu'].forEach(cat => {
    const curId = parts[cat];
    const cur = byId(curId);
    if (!cur) return;
    const curPrice = minPrice(curId, state.region, 'new') ?? cur.basePrice ?? 0;
    let pool = COMPONENTS.filter(c => c.cat === cat && c.id !== curId);
    if (cat === 'cpu' && typeof compatibleOptions === 'function') {
      const compat = compatibleOptions('cpu', parts) || [];
      if (compat.length > 1) pool = compat.map(x => byId(x.id)).filter(Boolean);
    }
    const cands = pool
      .map(c => ({ c, price: minPrice(c.id, state.region, 'new') ?? c.basePrice ?? 0 }))
      .filter(x => x.price > curPrice * 1.05)
      .sort((a, b) => a.price - b.price)
      .slice(0, 34);
    cands.forEach(({ c, price }) => {
      const fps = cat === 'gpu'
        ? buildFpsSet({ parts: { ...parts, gpu: c.id } }, p.games, res)
        : buildFpsSet({ parts: { ...parts, cpu: c.id } }, p.games, res);
      const gain = (fps || 0) - base;
      const cost = price - curPrice;
      if (gain < 3 || cost <= 0) return;
      out.push({ cat, part: c, price, cost, gain, fps, value: gain / (cost / 1000) });
    });
  });
  return out.sort((a, b) => b.value - a.value).slice(0, 3);
}

// ---------- Сортировка и «топ под игру» ----------
function buildPrioritySort(list) {
  if (priorityIsAll()) return list;
  return [...list].sort((a, b) => (priorityFps(b) || 0) - (priorityFps(a) || 0));
}
function priorityTopHtml(builds, n = 5) {
  const p = priorityInfo();
  if (p.kind === 'all') return '';
  const top = [...builds]
    .map(b => ({ b, fps: priorityFps(b) || 0 }))
    .sort((a, b) => b.fps - a.fps)
    .slice(0, n);
  const t = priorityTarget();
  return `<div class="priority-top">
    <div class="pt-head">🏆 Лучшие сборки под «${esc(p.name)}» <span class="muted small">· ${esc(priorityRes())} · цель ${t} FPS</span></div>
    <div class="pt-list">
      ${top.map((x, i) => {
        const v = priorityVerdict(x.fps, t);
        const price = buildPrice(x.b, state.region, 'new').total;
        return `<div class="pt-item">
          <span class="pt-rank">${i + 1}</span>
          <span class="pt-name">${esc(x.b.name)}<span class="muted small"> · ${esc(x.b.tag)}</span></span>
          <span class="pt-fps"><b>${x.fps}</b> <span class="small muted">FPS</span></span>
          <span class="pt-badge ${v.cls}">${v.label}</span>
          <span class="pt-price">${fmt(price)}${x.fps ? ` <span class="muted small">· ${Math.round(price / x.fps)} ₽/FPS</span>` : ''}</span>
          <button class="btn small ghost" onclick="loadBuilder('${x.b.id}')">В конструктор</button>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

// ---------- Блоки управления ----------
function priorityControlsHtml(compact) {
  const p = priorityInfo();
  const t = priorityTarget();
  return `<div class="priority-bar${compact ? ' compact' : ''}">
    <div class="pb-head">
      <span class="pb-title">🎯 Приоритетная игра</span>
      <span class="pb-current">${p.icon} ${esc(p.name)} · ${esc(priorityRes())} · цель ${t} FPS</span>
    </div>
    <div class="pb-row">
      <select onchange="setPriorityGame(this.value)">
        <option value="all"${p.id === 'all' ? ' selected' : ''}>🎲 Все 20 игр — средний FPS</option>
        <optgroup label="Наборы игр">
          ${PRIORITY_PRESETS.map(x => `<option value="p:${x.id}"${p.id === 'p:' + x.id ? ' selected' : ''}>${x.icon} ${esc(x.name)} — ${x.games.length} игр</option>`).join('')}
        </optgroup>
        <optgroup label="Конкретная игра">
          ${GAMES.map(g => `<option value="${g.id}"${p.id === g.id ? ' selected' : ''}>${gameIcon(g)} ${esc(g.name)} · ${esc(g.genre)}</option>`).join('')}
        </optgroup>
      </select>
      <select onchange="setPriorityRes(this.value)">
        ${['1080p', '1440p', '4K'].map(r => `<option value="${r}"${priorityRes() === r ? ' selected' : ''}>${r}</option>`).join('')}
      </select>
      <select onchange="setPriorityTarget(this.value)">
        ${PRIORITY_TARGETS.map(x => `<option value="${x}"${t === x ? ' selected' : ''}>цель ${x} FPS</option>`).join('')}
      </select>
    </div>
    ${compact ? '' : `<div class="pb-chips">
      <button class="chip ${p.id === 'all' ? 'active' : ''}" onclick="setPriorityGame('all')">🎲 Все игры</button>
      ${PRIORITY_PRESETS.map(x => `<button class="chip ${p.id === 'p:' + x.id ? 'active' : ''}" onclick="setPriorityGame('p:${x.id}')">${x.icon} ${esc(x.name)}</button>`).join('')}
      ${['cs2', 'dota2', 'valorant', 'fortnite', 'cyberpunk', 'gta5', 'rust', 'helldivers2'].map(id => {
        const g = GAMES.find(x => x.id === id);
        return g ? `<button class="chip ${p.id === g.id ? 'active' : ''}" onclick="setPriorityGame('${g.id}')">${gameIcon(g)} ${esc(g.name)}</button>` : '';
      }).join('')}
    </div>`}
    <div class="pb-note small muted">${esc(p.desc)}. Сборки сортируются по FPS в этой игре, у каждой карточки — вердикт относительно цели и цена за 1 FPS.</div>
  </div>`;
}

function renderPriorityBars() {
  initPriorityState();
  [['#buildsPriority', false], ['#homePriority', true], ['#compareBuildsPriority', true], ['#builderPriority', true]].forEach(([sel, compact]) => {
    const el = $(sel);
    if (el) el.innerHTML = priorityControlsHtml(compact);
  });
  const top = $('#buildsPriorityTop');
  if (top) top.innerHTML = priorityTopHtml(BUILDS, 5);
}

// Строка приоритета в карточке сборки
function priorityCardLine(b) {
  const p = priorityInfo();
  if (p.kind === 'all') return '';
  const fps = priorityFps(b);
  if (fps == null) return '';
  const t = priorityTarget();
  const v = priorityVerdict(fps, t);
  const price = buildPrice(b, state.region, 'new').total;
  return `<div class="priority-line ${v.cls}">
    <div class="pl-head">${p.icon} <b>${esc(p.name)}</b> <span class="muted small">· ${esc(priorityRes())} · цель ${t} FPS</span><span class="pl-badge ${v.cls}">${v.label}</span></div>
    <div class="pl-row"><b class="pl-fps">${fps}</b> <span class="small muted">FPS</span><span class="pl-delta ${v.cls}">${v.delta}</span><span class="small muted">· ${Math.round(price / fps)} ₽ за 1 FPS</span></div>
    <div class="bar"><i class="${v.cls}" style="width:${pct(fps, Math.max(t * 1.5, fps))}%"></i></div>
    <div class="small muted">${esc(v.txt)}</div>
  </div>`;
}

// Панель в конструкторе: как сборка играет в приоритетной игре и что заменить
function priorityBuilderPanel() {
  const p = priorityInfo();
  if (p.kind === 'all') return '';
  const build = { parts: state.builder };
  const fps = priorityFps(build);
  if (fps == null) return '';
  const t = priorityTarget();
  const v = priorityVerdict(fps, t);
  const bal = priorityBalance(build);
  const up = priorityUpgrade(build);
  return `<div class="priority-panel">
    <div class="row" style="justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
      <h3 style="margin:0">${p.icon} Приоритет: ${esc(p.name)} <span class="muted small">· ${esc(priorityRes())} · цель ${t} FPS</span></h3>
      <button class="btn small ghost" onclick="navigate('builds')">Смотреть сборки под эту игру →</button>
    </div>
    <div class="pp-grid">
      <div class="pp-cell"><span class="muted small">FPS в приоритетной игре</span><b class="pp-fps ${v.cls}">${fps}</b><span class="pl-badge ${v.cls}">${v.label}</span><div class="small muted">${esc(v.delta)} · ${esc(v.txt)}</div></div>
      <div class="pp-cell"><span class="muted small">Цена за 1 FPS</span><b>${Math.round(buildPrice(build, state.region, 'new').total / fps)} ₽</b><div class="small muted">дешевле — выгоднее сборка</div></div>
      <div class="pp-cell"><span class="muted small">Узкое место</span><b>${bal.who}</b><div class="small muted">${esc(bal.txt)}</div></div>
    </div>
    ${up.length ? `<div class="pp-up">
      <div class="small muted" style="margin-bottom:6px">Что заменить, чтобы поднять FPS в «${esc(p.name)}» (по выгоде: FPS за рубль):</div>
      ${up.map(u => `<div class="pp-up-item">
        <span>${u.cat === 'gpu' ? '🎮' : '🧠'} ${esc(u.part.name)}</span>
        <span class="pos">+${u.gain} FPS</span>
        <span class="muted small">+${fmt(u.cost)}</span>
        <span class="small muted">${u.value.toFixed(2)} FPS за 1000 ₽</span>
        <button class="btn small" onclick="setBuilderPart('${u.cat}','${u.part.id}')">Поставить</button>
      </div>`).join('')}
    </div>` : `<div class="small muted" style="margin-top:10px">Апгрейд не нужен или уже стоит топовая комплектующая — сборка сбалансирована под эту игру.</div>`}
  </div>`;
}
