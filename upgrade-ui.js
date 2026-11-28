// ===== BLF — удобные замены комплектующих =====
// Для любой сборки (ПК, сервер, ноутбук) предлагаем два сценария:
//   💸 «Удешевить» — та же производительность, но дешевле;
//   🚀 «Ускорить»  — за небольшой доплатный шаг получить заметно больше производительности.
// Каждая замена показывает дельту цены, дельту FPS/ядер и проверку совместимости,
// применяется одной кнопкой — прямо в конструкторе.

const SWAP_SEEN_KEY = 'blf.swaps.v1';
const SWAP_MODES = {
  cheaper: { name: 'Удешевить', icon: '💸', hint: 'сохранить производительность и снизить цену', cls: 'cheap' },
  faster: { name: 'Ускорить', icon: '🚀', hint: 'получить больше кадров за разумную доплату', cls: 'fast' },
};

function swapPriceOf(id) { return (typeof minPrice === 'function' ? minPrice(id, state.region, 'new') : null) ?? byId(id)?.basePrice ?? 0; }

// Оценка «итогового результата» сборки: FPS в приоритетной игре (или по играм) + рабочий индекс
function swapBuildMetrics(parts) {
  const build = { parts };
  const fps = (typeof priorityFps === 'function' && typeof priorityIsAll === 'function' && !priorityIsAll())
    ? priorityFps(build)
    : (typeof compFps === 'function' ? null : null);
  const avg = typeof avgFps === 'function' ? avgFps(parts, (typeof priorityRes === 'function' ? priorityRes() : '1080p')) : null;
  const perf = typeof buildPerf === 'function' ? buildPerf(build) : 0;
  const work = typeof buildWorkPerf === 'function' ? buildWorkPerf(build) : 0;
  const price = typeof buildPrice === 'function' ? buildPrice(build, state.region, 'new').total : 0;
  return { fps: fps ?? avg, avg, perf, work, price };
}

// Совместимость конкретной замены: собираем виртуальную сборку и смотрим, нет ли НОВЫХ ошибок
function swapCompatOk(parts, cat, id) {
  if (typeof checkCompatibility !== 'function') return { ok: true, issues: [] };
  const before = checkCompatibility(parts).issues.filter(i => i.level === 'error').length;
  const test = { ...parts, [cat]: id };
  const res = checkCompatibility(test);
  const errs = res.issues.filter(i => i.level === 'error');
  return { ok: errs.length <= before, issues: errs, status: res.status };
}

// Кандидаты на замену в категории
function swapCandidates(cat, currentId, mode, limit = 3) {
  const cur = byId(currentId);
  if (!cur) return [];
  const base = swapBuildMetrics(state.builder);
  const curPrice = swapPriceOf(currentId);
  const pool = (typeof compatibleOptions === 'function')
    ? compatibleOptions(cat, state.builder).map(x => byId(x.id)).filter(Boolean)
    : COMPONENTS.filter(c => c.cat === cat);
  const list = [];
  pool.forEach(c => {
    if (c.id === currentId) return;
    const price = swapPriceOf(c.id);
    const delta = price - curPrice;
    if (mode === 'cheaper' && delta >= -300) return;             // должно реально дешеветь
    if (mode === 'faster' && delta <= 500) return;               // должно быть чуть дороже
    if (mode === 'faster' && delta > base.price * 0.45 + 25000) return; // без безумных доплат
    const metrics = swapBuildMetrics({ ...state.builder, [cat]: c.id });
    const fpsDelta = (metrics.fps || 0) - (base.fps || 0);
    const workDelta = metrics.work - base.work;
    if (mode === 'cheaper' && (fpsDelta < -3 || workDelta < -3)) return;   // не теряем производительность
    if (mode === 'faster' && fpsDelta < 2 && workDelta < 2) return;        // должен быть прирост
    const compat = swapCompatOk(state.builder, cat, c.id);
    if (!compat.ok) return;
    // выгода: FPS за каждый потраченный/сэкономленный рубль
    const gain = Math.max(fpsDelta, workDelta);
    const value = mode === 'cheaper'
      ? (-delta) / Math.max(1, Math.abs(Math.min(fpsDelta, 0)) + 1) + gain * 2
      : gain / Math.max(delta / 1000, 0.4);
    list.push({ c, price, delta, fpsDelta, workDelta, metrics, value, gain, status: compat.status });
  });
  return list
    .sort((a, b) => mode === 'cheaper' ? b.value - a.value : b.value - a.value)
    .slice(0, limit);
}

// ---------- Рендер блока замен в конструкторе ----------
function renderSwaps() {
  const box = document.getElementById('builderSwaps');
  if (!box) return;
  const modes = [['cheaper', '💸'], ['faster', '🚀']];
  box.innerHTML = `<div class="swap-box">
    <div class="swap-head">
      <h3 style="margin:0">🔁 Замены: дешевле или быстрее</h3>
      <div class="small muted">Подбираем совместимые варианты и показываем, что даст замена — с ценой и FPS. Применяется одной кнопкой.</div>
    </div>
    <div class="swap-cols">
      ${modes.map(([mode, icon]) => {
        const m = SWAP_MODES[mode];
        const cards = ['gpu', 'cpu', 'ram', 'ssd', 'psu', 'cooling', 'case', 'motherboard'].flatMap(cat => {
          const list = swapCandidates(cat, state.builder[cat], mode, 2);
          return list.map(x => ({ cat, ...x }));
        })
          .sort((a, b) => mode === 'cheaper' ? (-a.delta) - (-b.delta) : b.value - a.value)
          .slice(0, 6);
        return `<div class="swap-col ${m.cls}">
          <div class="swap-col-head">${icon} ${m.name} <span class="small muted">· ${m.hint}</span></div>
          ${cards.length ? cards.map(x => swapCardHtml(x, mode)).join('') : `<div class="small muted">Вариантов нет: комплектующие уже оптимальны по цене/мощности.</div>`}
        </div>`;
      }).join('')}
    </div>
    <div class="small muted swap-foot">Замены проверены на совместимость с остальными комплектующими. Если ничего не подходит — попробуйте изменить бюджетные позиции или выключите режим «только совместимые».</div>
  </div>`;
}

function swapCardHtml(x, mode) {
  const catName = (CATEGORIES.find(c => c.id === x.cat) || {}).name || x.cat;
  const sign = x.delta > 0 ? '+' : '−';
  const fpsTxt = Math.abs(x.fpsDelta) >= 1 ? `${x.fpsDelta > 0 ? '+' : '−'}${Math.abs(x.fpsDelta)} FPS` : '';
  const workTxt = Math.abs(x.workDelta) >= 1 ? `${x.workDelta > 0 ? '+' : '−'}${Math.abs(x.workDelta)} инд.` : '';
  return `<div class="swap-card">
    ${partImg(x.c, { size: 'sm' })}
    <div class="swap-card-body">
      <div class="swap-card-top">
        <span class="swap-cat">${catName}</span>
        <span class="swap-price ${x.delta < 0 ? 'down' : 'up'}">${sign}${fmt(Math.abs(x.delta))}</span>
      </div>
      <div class="swap-name">${esc(x.c.name)}</div>
      <div class="swap-deltas">
        ${fpsTxt ? `<span class="swap-badge ${x.fpsDelta > 0 ? 'pos' : 'neg'}">${fpsTxt}</span>` : ''}
        ${workTxt ? `<span class="swap-badge ${x.workDelta > 0 ? 'pos' : 'neg'}">${workTxt}</span>` : ''}
        <span class="swap-badge neutral">${fmt(x.price)}</span>
        ${x.status === 'warn' ? '<span class="swap-badge warn">есть замечания</span>' : ''}
      </div>
      <button class="btn small ${mode === 'cheaper' ? 'ghost' : 'lime'}" onclick="applySwap('${x.cat}','${x.c.id}')">Заменить</button>
    </div>
  </div>`;
}

function applySwap(cat, id) {
  if (typeof setBuilderPart === 'function') {
    setBuilderPart(cat, id);
    toast(`Заменено: ${(CATEGORIES.find(c => c.id === cat) || {}).name} → ${byId(id)?.name || ''}`);
  }
}

// ---------- Короткая подсказка «одна замена» для страницы комплектующих ----------
function swapHintForCard(id) {
  const c = byId(id);
  if (!c) return '';
  const cur = state.builder[c.cat];
  if (cur === id) return '';
  const priceNow = swapPriceOf(cur), priceNew = swapPriceOf(id);
  if (!priceNow || !priceNew) return '';
  const delta = priceNow - priceNew;
  return delta > 500 ? `💸 в вашей сборке дешевле на ${fmt(delta)}` : '';
}

// ================= Серверные замены =================
function serverSnapshotState() {
  return { parts: state.serverBuild, drives: state.serverDrives, ramModules: state.serverRamModules, cpus: state.serverCpus || 1 };
}
// Полная сборка в формате servers.js: parts + drives/ramModules/cpus
function serverFull(parts) {
  return { parts: parts.parts, drives: parts.drives || 1, ramModules: parts.ramModules || 1, cpus: parts.cpus || 1 };
}
function serverFlatParts(parts) {
  // для checkServerCompatibility нужен «плоский» объект категорий с drives/ramModules/cpus
  return { ...parts.parts, drives: parts.drives || 1, ramModules: parts.ramModules || 1, cpus: parts.cpus || 1 };
}
function serverMetrics(parts) {
  // serverBuildParts раскрывает drives/ramModules/cpus, но ждёт объект с parts
  const full = serverFull(parts);
  const wl = serverWorkload(serverFlatParts(parts));   // serverWorkload ждёт плоский объект категорий
  return {
    price: serverBuildPrice(full, state.region),
    used: serverBuildPrice(full, state.region, 'used'),
    cores: (serverPartById(parts.parts.servercpu)?.specs.cores || 0) * (parts.cpus || 1),
    ramGb: (serverPartById(parts.parts.serverram)?.specs.capacityGb || 0) * (parts.ramModules || 1),
    vms: wl.vms, sites: wl.sites, containers: wl.containers, tps: wl.dbTps,
    power: serverBuildConsumption(full),
  };
}
function serverSwapCandidates(mode, limit = 3) {
  const cur = serverSnapshotState();
  const base = serverMetrics(cur);
  const out = [];
  SERVER_CATEGORIES.forEach(cat => {
    const pool = SERVER_COMPONENTS.filter(x => x.cat === cat.id);
    pool.forEach(p => {
      if (p.id === cur.parts[cat.id]) return;
      const test = { ...cur, parts: { ...cur.parts, [cat.id]: p.id } };
      const compat = checkServerCompatibility(serverFlatParts(test));
      if (compat.issues.some(i => i.level === 'error')) return;
      const m = serverMetrics(test);
      const delta = m.price - base.price;
      const workloadGain = (m.vms - base.vms) * 2 + (m.sites - base.sites) * 0.6 + (m.containers - base.containers) + (m.tps - base.tps) / 400;
      if (mode === 'cheaper' && delta >= -300) return;
      if (mode === 'faster' && delta <= 300) return;
      if (mode === 'cheaper' && workloadGain < -2) return;
      if (mode === 'faster' && workloadGain < 1) return;
      if (mode === 'faster' && delta > base.price * 0.8 + 30000) return;
      out.push({ cat: cat.id, catName: cat.name, icon: cat.icon, p, price: m.price, delta, m, workloadGain, status: compat.status });
    });
  });
  return out
    .map(x => ({ ...x, value: mode === 'cheaper' ? (-x.delta) * (1 + Math.max(0, x.workloadGain) * 0.05) : x.workloadGain / Math.max(x.delta / 1000, 0.5) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}
function renderServerSwaps() {
  const box = document.getElementById('serverSwaps');
  if (!box) return;
  const base = serverMetrics(serverSnapshotState());
  box.innerHTML = `<div class="swap-box">
    <div class="swap-head">
      <h3 style="margin:0">🔁 Что изменить в сервере</h3>
      <div class="small muted">Ваш сервер: ${fmt(base.price)} · ${base.cores} ядер · ${base.ramGb} ГБ · ~${base.vms} ВМ · ${base.power} Вт. Ниже — проверенные на совместимость замены.</div>
    </div>
    <div class="swap-cols">
      ${[['cheaper', '💸'], ['faster', '🚀']].map(([mode, icon]) => {
        const m = SWAP_MODES[mode];
        const cards = serverSwapCandidates(mode, 4);
        return `<div class="swap-col ${m.cls}">
          <div class="swap-col-head">${icon} ${m.name} <span class="small muted">· ${m.hint}</span></div>
          ${cards.length ? cards.map(x => `<div class="swap-card">
            ${partImg(x.p, { size: 'sm' })}
            <div class="swap-card-body">
            <div class="swap-card-top"><span class="swap-cat">${x.icon} ${esc(x.catName)}</span><span class="swap-price ${x.delta < 0 ? 'down' : 'up'}">${x.delta > 0 ? '+' : '−'}${fmt(Math.abs(x.delta))}</span></div>
            <div class="swap-name">${esc(x.p.name)}</div>
            <div class="swap-deltas">
              ${x.m.vms !== base.vms ? `<span class="swap-badge ${x.m.vms > base.vms ? 'pos' : 'neg'}">ВМ: ${x.m.vms > base.vms ? '+' : ''}${x.m.vms - base.vms}</span>` : ''}
              ${x.m.ramGb !== base.ramGb ? `<span class="swap-badge ${x.m.ramGb > base.ramGb ? 'pos' : 'neg'}">RAM: ${x.m.ramGb > base.ramGb ? '+' : ''}${x.m.ramGb - base.ramGb} ГБ</span>` : ''}
              ${x.m.cores !== base.cores ? `<span class="swap-badge ${x.m.cores > base.cores ? 'pos' : 'neg'}">ядер: ${x.m.cores > base.cores ? '+' : ''}${x.m.cores - base.cores}</span>` : ''}
              ${x.m.power !== base.power ? `<span class="swap-badge neutral">${x.m.power > base.power ? '+' : ''}${x.m.power - base.power} Вт</span>` : ''}
              <span class="swap-badge neutral">итого ${fmt(x.price)}</span>
            </div>
            <button class="btn small ${mode === 'cheaper' ? 'ghost' : 'lime'}" onclick="applyServerSwap('${x.cat}','${x.p.id}')">Заменить</button>
            </div>
          </div>`).join('') : `<div class="small muted">Вариантов нет — конфигурация уже оптимальна.</div>`}
        </div>`;
      }).join('')}
    </div>
  </div>`;
}
function applyServerSwap(cat, id) {
  state.serverBuild = { ...state.serverBuild, [cat]: id };
  render();
  toast(`Заменено: ${serverPartById(id)?.name || ''}`);
}

// ================= Ноутбучные замены (альтернативы) =================
function laptopSwapsHtml(l) {
  if (!l || typeof LAPTOPS === 'undefined') return '';
  const price = laptopPrice(l);
  const cheaper = LAPTOPS.filter(x => x.id !== l.id && x.type === l.type && (laptopPrice(x) ?? 0) < price - 1000)
    .map(x => ({ x, price: laptopPrice(x), fps: laptopFpsAvg(x, null, '1080p') }))
    .filter(o => o.fps >= laptopFpsAvg(l, null, '1080p') * 0.92)
    .sort((a, b) => b.fps - a.fps)[0];
  const faster = LAPTOPS.filter(x => x.id !== l.id && (laptopPrice(x) ?? 0) > price + 1000 && (laptopPrice(x) ?? 0) < price * 1.45)
    .map(x => ({ x, price: laptopPrice(x), fps: laptopFpsAvg(x, null, '1080p') }))
    .filter(o => o.fps >= laptopFpsAvg(l, null, '1080p') * 1.08)
    .sort((a, b) => b.fps - a.fps)[0];
  if (!cheaper && !faster) return '';
  return `<div class="swap-box mini">
    <div class="swap-head"><b>🔁 Альтернативы</b></div>
    <div class="swap-cols">
      ${cheaper ? `<div class="swap-col cheap"><div class="swap-col-head">💸 Удешевить</div>
        <div class="swap-card">${partImg(cheaper.x, { alt: cheaper.x.name })}
        <div class="swap-card-body"><div class="swap-name">${esc(cheaper.x.name)}</div>
        <div class="swap-deltas"><span class="swap-badge neg">−${fmt(price - cheaper.price)}</span><span class="swap-badge neutral">${cheaper.fps} FPS</span></div>
        <button class="btn small ghost" onclick="openLaptop('${cheaper.x.id}')">Посмотреть</button></div></div></div>` : ''}
      ${faster ? `<div class="swap-col fast"><div class="swap-col-head">🚀 Ускорить</div>
        <div class="swap-card">${partImg(faster.x, { alt: faster.x.name })}
        <div class="swap-card-body"><div class="swap-name">${esc(faster.x.name)}</div>
        <div class="swap-deltas"><span class="swap-badge pos">+${fmt(faster.price - price)}</span><span class="swap-badge pos">${faster.fps} FPS</span></div>
        <button class="btn small lime" onclick="openLaptop('${faster.x.id}')">Посмотреть</button></div></div></div>` : ''}
    </div>
  </div>`;
}
