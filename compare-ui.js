// ===== BLF — подробное сравнение «как technical.city» =====
// VS-выбор сверху, совокупная оценка с процентами, блоки характеристик
// с подсветкой лучшего значения, плюсы/минусы и итоговая рекомендация.

// ---------- Форматирование ----------
const cmpNum = (v, unit = '') => {
  if (v === undefined || v === null || v === '' || v === '—') return '—';
  if (typeof v === 'number') return v.toLocaleString('ru-RU') + (unit ? ' ' + unit : '');
  return String(v);
};
const cmpNumOnly = v => {
  if (typeof v === 'number') return v;
  const m = String(v ?? '').replace(',', '.').match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
};

// Парсер частоты «3.9 ГГц» → 3900 (МГц)
const cmpFreq = v => {
  const n = cmpNumOnly(v);
  if (n === null) return null;
  return /ТГц/i.test(String(v)) ? n * 1e6 : /ГГц/i.test(String(v)) ? n * 1000 : /МГц/i.test(String(v)) ? n : n;
};

// ---------- Баллы ----------
// Совокупная оценка: та же логика, что в базе (perf/work), но нормализованная
// относительно лучшего компонента категории → 0…100, как «11.4 / 12.6» у technical.city
const CMP_SCORE_CACHE = new Map();
function cmpScore(comp) {
  if (!comp) return 0;
  if (CMP_SCORE_CACHE.has(comp.id)) return CMP_SCORE_CACHE.get(comp.id);
  const list = COMPONENTS.filter(c => c.cat === comp.cat);
  const maxPerf = Math.max(...list.map(c => c.perf), 1);
  const maxWork = Math.max(...list.map(c => c.work), 1);
  const fam = comp.cat === 'gpu' ? 0.65 : 0.45;
  const raw = c => c.perf / maxPerf * fam + c.work / maxWork * (1 - fam);
  // нормируем так, чтобы лучший компонент категории получал ровно 100
  const top = Math.max(...list.map(raw), 0.0001);
  const val = Math.round((raw(comp) / top) * 1000) / 10;
  CMP_SCORE_CACHE.set(comp.id, val);
  return val;
}
// «Место в рейтинге» — позиция среди всех компонентов категории по баллу
function cmpRank(comp) {
  const list = COMPONENTS.filter(c => c.cat === comp.cat)
    .map(c => ({ id: c.id, s: cmpScore(c) }))
    .sort((a, b) => b.s - a.s);
  return list.findIndex(x => x.id === comp.id) + 1;
}
// Цена-качество: балл на 1000 ₽ (чем выше, тем лучше)
function cmpValue(comp) {
  const price = minPrice(comp.id, state.region, 'new') ?? comp.basePrice;
  return price ? Math.round(cmpScore(comp) / price * 1000 * 100) / 100 : 0;
}
// Энергоэффективность: балл на ватт
function cmpEfficiency(comp) {
  const watts = comp.power || comp.specs?.tdp || 0;
  return watts ? Math.round(cmpScore(comp) / watts * 1000) / 100 : null;
}
// Провизорный балл: учёт года выпуска (как «новизна» на technical.city)
function cmpFreshness(comp) {
  return comp.year || null;
}

// ---------- Описание параметров по категориям ----------
// [ключ, подпись, единица, «больше = лучше» (true/false/null), форматтер]
const CMP_ROWS = {
  cpu: [
    ['cores', 'Ядер', '', true, v => v],
    ['threads', 'Потоков', '', true, v => v],
    ['baseFreq', 'Базовая частота', '', true, v => v, 'freq'],
    ['boostFreq', 'Максимальная частота', '', true, v => v, 'freq'],
    ['socket', 'Сокет', '', null],
    ['tdp', 'Энергопотребление (TDP)', 'Вт', false],
    ['ramType', 'Типы оперативной памяти', '', null],
    ['pcie', 'Ревизия PCI Express', '', null],
    ['gen', 'Поколение / архитектура', '', null],
  ],
  gpu: [
    ['vramGb', 'Объём видеопамяти', 'ГБ', true],
    ['tdp', 'Энергопотребление (TDP)', 'Вт', false],
    ['lengthMm', 'Длина', 'мм', null],
    ['recommendedPsu', 'Рекомендуемый БП', 'Вт', null],
    ['pcie', 'Ревизия PCI Express', '', null],
  ],
  motherboard: [
    ['socket', 'Сокет', '', null],
    ['chipset', 'Чипсет', '', null],
    ['formFactor', 'Форм-фактор', '', null],
    ['ramType', 'Тип памяти', '', null],
    ['ramSlots', 'Слотов памяти', '', true],
    ['maxRam', 'Максимальный объём памяти', '', null],
    ['m2Slots', 'Слотов M.2', '', true],
    ['sataPorts', 'Портов SATA', '', true],
    ['pcie', 'Ревизия PCI Express', '', null],
  ],
  ram: [
    ['type', 'Тип памяти', '', null],
    ['capacityGb', 'Объём комплекта', 'ГБ', true],
    ['modules', 'Модулей в комплекте', '', true],
    ['freq', 'Частота', '', true, v => v, 'freq'],
    ['latency', 'Тайминги (CAS)', '', false],
    ['voltage', 'Напряжение', '', null],
  ],
  ssd: [
    ['type', 'Тип', '', null],
    ['capacityGb', 'Объём', 'ГБ', true],
    ['interface', 'Интерфейс', '', null],
    ['readSpeed', 'Скорость чтения', '', true, v => v, 'speed'],
    ['writeSpeed', 'Скорость записи', '', true, v => v, 'speed'],
  ],
  psu: [
    ['wattage', 'Мощность', 'Вт', true],
    ['certification', 'Сертификат 80 PLUS', '', null],
    ['modular', 'Модульный', '', null],
    ['pcie5', 'Разъём 12VHPWR (PCIe 5.0)', '', null],
    ['formFactor', 'Форм-фактор', '', null],
  ],
  case: [
    ['motherboardSupport', 'Поддержка плат', '', null],
    ['maxGpuLengthMm', 'Макс. длина видеокарты', 'мм', true],
    ['maxCpuCoolerHeightMm', 'Макс. высота кулера', 'мм', true],
    ['psuSupport', 'Блок питания', '', null],
    ['fans', 'Вентиляторы в комплекте', '', null],
    ['glass', 'Боковая панель', '', null],
  ],
  cooling: [
    ['type', 'Тип', '', null],
    ['tdpSupport', 'Рассеиваемая мощность', 'Вт', true],
    ['heightMm', 'Высота', 'мм', null],
    ['sockets', 'Поддерживаемые сокеты', '', null],
    ['fans', 'Вентиляторы', '', null],
  ],
};

// Сгруппированные блоки «как на technical.city»
const CMP_SECTIONS = {
  cpu: [
    { title: 'Базовая информация', desc: 'Место в рейтинге среди процессоров каталога, цена-качество и энергоэффективность.', custom: 'base' },
    { title: 'Подробные характеристики', desc: 'Ядра, потоки, частоты и архитектура — косвенно говорят о производительности. Точную картину дают тесты и FPS.', rows: ['cores', 'threads', 'baseFreq', 'boostFreq', 'gen'] },
    { title: 'Совместимость', desc: 'Параметры, от которых зависит, встанет ли процессор в вашу плату и какой нужен блок питания.', rows: ['socket', 'tdp', 'pcie'] },
    { title: 'Память', desc: 'Поддерживаемые типы и поколения оперативной памяти.', rows: ['ramType'] },
    { title: 'Возможности для игр', desc: 'Игровой и рабочий индексы и средний FPS по 20 популярным играм.', custom: 'gaming' },
    { title: 'Цена и доступность', desc: 'Минимальная цена в вашем городе: новые комплектующие и БУ с Avito.', custom: 'price' },
  ],
  gpu: [
    { title: 'Базовая информация', desc: 'Место в рейтинге среди моделей этой категории, цена-качество и энергоэффективность.', custom: 'base' },
    { title: 'Подробные характеристики', desc: 'Объём памяти, энергопотребление и габариты.', rows: ['vramGb', 'tdp', 'lengthMm', 'pcie'] },
    { title: 'Совместимость', desc: 'Хватит ли блока питания и влезет ли карта в корпус.', rows: ['recommendedPsu', 'lengthMm'] },
    { title: 'Возможности для игр', desc: 'Игровой и рабочий индексы и средний FPS по 20 играм.', custom: 'gaming' },
    { title: 'Цена и доступность', desc: 'Минимальная цена в вашем городе: новые и БУ.', custom: 'price' },
  ],
  motherboard: [
    { title: 'Базовая информация', desc: 'Место в рейтинге среди моделей этой категории, цена-качество и энергоэффективность.', custom: 'base' },
    { title: 'Подробные характеристики', desc: 'Чипсет, форм-фактор и набор слотов.', rows: ['chipset', 'formFactor', 'm2Slots', 'sataPorts'] },
    { title: 'Совместимость', desc: 'Сокет процессора, тип памяти и версия PCIe.', rows: ['socket', 'ramType', 'pcie'] },
    { title: 'Память', desc: 'Количество слотов и максимальный объём.', rows: ['ramSlots', 'maxRam'] },
    { title: 'Цена и доступность', desc: 'Минимальная цена в вашем городе: новые и БУ.', custom: 'price' },
  ],
  ram: [
    { title: 'Базовая информация', desc: 'Место в рейтинге среди моделей этой категории, цена-качество и энергоэффективность.', custom: 'base' },
    { title: 'Подробные характеристики', desc: 'Объём, частоты и тайминги комплекта.', rows: ['type', 'capacityGb', 'modules', 'freq', 'latency', 'voltage'] },
    { title: 'Цена и доступность', desc: 'Минимальная цена в вашем городе: новые и БУ.', custom: 'price' },
  ],
  ssd: [
    { title: 'Базовая информация', desc: 'Место в рейтинге среди моделей этой категории, цена-качество и энергоэффективность.', custom: 'base' },
    { title: 'Подробные характеристики', desc: 'Тип, объём и скорость.', rows: ['type', 'capacityGb', 'interface', 'readSpeed', 'writeSpeed'] },
    { title: 'Цена и доступность', desc: 'Минимальная цена в вашем городе: новые и БУ.', custom: 'price' },
  ],
  psu: [
    { title: 'Базовая информация', desc: 'Место в рейтинге среди моделей этой категории, цена-качество и энергоэффективность.', custom: 'base' },
    { title: 'Подробные характеристики', desc: 'Мощность, сертификат и разъёмы.', rows: ['wattage', 'certification', 'modular', 'pcie5', 'formFactor'] },
    { title: 'Цена и доступность', desc: 'Минимальная цена в вашем городе: новые и БУ.', custom: 'price' },
  ],
  case: [
    { title: 'Базовая информация', desc: 'Место в рейтинге среди моделей этой категории, цена-качество и энергоэффективность.', custom: 'base' },
    { title: 'Подробные характеристики', desc: 'Что помещается в корпус.', rows: ['motherboardSupport', 'maxGpuLengthMm', 'maxCpuCoolerHeightMm', 'psuSupport', 'fans', 'glass'] },
    { title: 'Цена и доступность', desc: 'Минимальная цена в вашем городе: новые и БУ.', custom: 'price' },
  ],
  cooling: [
    { title: 'Базовая информация', desc: 'Место в рейтинге среди моделей этой категории, цена-качество и энергоэффективность.', custom: 'base' },
    { title: 'Подробные характеристики', desc: 'Тип, рассеиваемая мощность и высота.', rows: ['type', 'tdpSupport', 'heightMm', 'sockets', 'fans'] },
    { title: 'Цена и доступность', desc: 'Минимальная цена в вашем городе: новые и БУ.', custom: 'price' },
  ],
};

// ---------- Вспомогательные ----------
function cmpAll(cat) { return COMPONENTS.filter(c => c.cat === cat); }

// Лучшее значение среди сравниваемых (с учётом направления)
function cmpBestIndex(values, higherIsBetter) {
  if (higherIsBetter === null) return -1;
  let best = -1, bestVal = null;
  values.forEach((v, i) => {
    const n = cmpNumOnly(v);
    if (n === null) return;
    if (bestVal === null || (higherIsBetter ? n > bestVal : n < bestVal)) { bestVal = n; best = i; }
  });
  return best;
}

function cmpPct(a, b) {
  // на сколько процентов b больше a
  if (!a) return null;
  return Math.round((b - a) / a * 1000) / 10;
}

// ---------- Друзья: похожие компоненты ----------
// Похожие по баллу модели + альтернативы в том же ценовом диапазоне
function cmpSimilar(comp, limit = 4) {
  const base = cmpScore(comp);
  const price = minPrice(comp.id, state.region, 'new') ?? comp.basePrice;
  return cmpAll(comp.cat)
    .filter(c => c.id !== comp.id)
    .map(c => {
      const cp = minPrice(c.id, state.region, 'new') ?? c.basePrice;
      return { c, d: Math.abs(cmpScore(c) - base) / 10 + Math.abs(cp - price) / Math.max(price, 1) };
    })
    .sort((x, y) => x.d - y.d)
    .slice(0, limit)
    .map(x => x.c);
}

// ---------- Плюсы и минусы ----------
function cmpProsCons(comp, rival) {
  const pros = [], cons = [];
  const score = cmpScore(comp), rivalScore = cmpScore(rival);
  const price = minPrice(comp.id, state.region, 'new') ?? comp.basePrice;
  const rivalPrice = minPrice(rival.id, state.region, 'new') ?? rival.basePrice;

  if (score > rivalScore) pros.push(`производительность выше на ${Math.abs(cmpPct(rivalScore, score))}%`);
  else if (score < rivalScore) cons.push(`производительность ниже на ${Math.abs(cmpPct(score, rivalScore))}%`);

  if (price < rivalPrice) pros.push(`дешевле на ${fmt(rivalPrice - price)}`);
  else if (price > rivalPrice) cons.push(`дороже на ${fmt(price - rivalPrice)}`);

  if ((comp.year || 0) > (rival.year || 0)) pros.push(`новее на ${comp.year - rival.year} г.`);
  else if ((comp.year || 0) < (rival.year || 0)) cons.push(`старее на ${rival.year - comp.year} г.`);

  if (comp.cat === 'cpu') {
    if (comp.specs.cores > rival.specs.cores) pros.push(`${comp.specs.cores} ядер против ${rival.specs.cores}`);
    if (comp.specs.tdp < rival.specs.tdp) pros.push(`меньше греется: ${comp.specs.tdp} Вт против ${rival.specs.tdp} Вт`);
    if (comp.specs.tdp > rival.specs.tdp) cons.push(`горячее: ${comp.specs.tdp} Вт против ${rival.specs.tdp} Вт`);
  }
  if (comp.cat === 'gpu') {
    if (comp.specs.vramGb > rival.specs.vramGb) pros.push(`больше видеопамяти: ${comp.specs.vramGb} ГБ против ${rival.specs.vramGb} ГБ`);
    if (comp.specs.tdp > rival.specs.tdp) cons.push(`требует БП мощнее: ${comp.specs.tdp} Вт против ${rival.specs.tdp} Вт`);
  }
  if (comp.cat === 'ssd' && comp.specs.capacityGb > rival.specs.capacityGb) pros.push(`объём больше: ${comp.specs.capacityGb} ГБ`);
  if (comp.cat === 'psu' && comp.specs.wattage > rival.specs.wattage) pros.push(`мощнее: ${comp.specs.wattage} Вт`);
  if (comp.cat === 'ram' && comp.specs.capacityGb > rival.specs.capacityGb) pros.push(`больше объём: ${comp.specs.capacityGb} ГБ`);

  const valueSelf = cmpValue(comp), valueRival = cmpValue(rival);
  if (valueSelf > valueRival) pros.push(`лучше цена-качество: ${valueSelf} против ${valueRival}`);
  else if (valueSelf < valueRival) cons.push(`хуже цена-качество: ${valueSelf} против ${valueRival}`);

  return { pros: pros.slice(0, 5), cons: cons.slice(0, 5) };
}

// ---------- Рендер ----------
function renderCompareComps() {
  const cat = state.compareCat;
  const selected = (state.compareComps[cat] || []).filter(Boolean).map(byId).filter(Boolean);

  // ---- выбор категории ----
  $('#compareCatChips').innerHTML = CATEGORIES.map(c =>
    `<button class="chip ${cat === c.id ? 'active' : ''}" onclick="state.compareCat='${c.id}';state.compareQuery='';render()">${c.icon} ${c.name} <span class="muted small">${cmpAll(c.id).length}</span></button>`).join('');

  // ---- VS-выбор ----
  let pool = cmpAll(cat);
  if (state.compareQuery) pool = pool.filter(c => matchesQuery(c, state.compareQuery));
  $('#compareCompPicks').innerHTML = [0, 1, 2, 3].map(i => {
    const cur = selected[i];
    return `<div class="pick vs-pick${cur ? ' filled' : ''}">
      <label class="small muted">${i === 0 ? '① Компонент' : i === 1 ? '② Соперник' : `Дополнительно ${i + 1}`}</label>
      <select onchange="setCompareComp(${i}, this.value)">
        <option value="">— выберите ${catTitle(cat).toLowerCase()} —</option>
        ${pool.map(c => `<option value="${c.id}" ${cur && cur.id === c.id ? 'selected' : ''}>${esc(c.name)} · ${cmpScore(c)}</option>`).join('')}
      </select>
      ${cur ? `<div class="vs-card-head">
        <b>${esc(cur.name)}</b>
        <span class="small muted">${esc(cur.brand)} · ${cur.year}${minPrice(cur.id, state.region, 'new') ? ' · ' + fmt(minPrice(cur.id, state.region, 'new')) : ''}</span>
      </div>` : ''}
    </div>`;
  }).join('');

  if (selected.length < 2) {
    $('#compareCompsBody').innerHTML = `<div class="empty">Выберите два компонента — покажем подробное сравнение: совокупный балл, характеристики с подсветкой лучшего, плюсы и минусы, цены по городам.</div>`;
    return;
  }

  const a = selected[0], b = selected[1];
  const rest = selected.slice(2);
  const scoreA = cmpScore(a), scoreB = cmpScore(b);
  const winnerIdx = scoreB > scoreA ? 1 : 0;
  const diff = Math.abs(cmpPct(Math.min(scoreA, scoreB), Math.max(scoreA, scoreB)));

  let html = '';

  // ---- шапка-дуэль ----
  html += `<div class="duel">
    ${selected.map((c, i) => `
      <div class="duel-side ${i === winnerIdx && selected.length === 2 ? 'win' : ''}">
        <div class="duel-icon">${catIcon(c.cat)}</div>
        <div class="duel-name">${esc(c.name)}</div>
        <div class="small muted">${esc(c.brand)} · ${c.year}</div>
        <div class="duel-score">${cmpScore(c)}<span class="small muted">/100</span></div>
        <div class="small muted">${c.specs.cores ? c.specs.cores + ' ядер / ' + c.specs.threads + ' потоков · ' + c.specs.tdp + ' Вт' : ''}${c.specs.vramGb ? c.specs.vramGb + ' ГБ · ' + c.specs.tdp + ' Вт' : ''}</div>
      </div>`).join('<div class="duel-vs">VS</div>')}
  </div>`;

  // ---- вердикт ----
  const win = selected[winnerIdx];
  html += `<div class="verdict ok cmp-summary">
    <b>${esc(win.name)}</b> опережает <b>${esc(selected[winnerIdx === 0 ? 1 : 0].name)}</b> на ${diff}% в нашем суммарном рейтинге производительности.
    ${(() => {
      const p = minPrice(win.id, state.region, 'new') ?? win.basePrice;
      const o = selected[winnerIdx === 0 ? 1 : 0];
      const po = minPrice(o.id, state.region, 'new') ?? o.basePrice;
      return p > po ? ` Но он дороже на ${fmt(p - po)} — смотрите на цена-качество.` : ` И при этом дешевле на ${fmt(po - p)}.`;
    })()}
  </div>`;

  // ---- оглавление ----
  const secs = CMP_SECTIONS[cat] || CMP_SECTIONS.cpu;
  html += `<div class="cmp-toc">${secs.map((s, i) => `<a href="#cmp-sec-${i}" onclick="document.getElementById('cmp-sec-${i}')?.scrollIntoView({behavior:'smooth'});return false;">${i + 1}. ${s.title}</a>`).join('')}</div>`;

  // ---- блоки ----
  secs.forEach((sec, si) => {
    html += `<section class="cmp-section" id="cmp-sec-${si}">
      <h3>${si === 0 ? '' : ''}${sec.title}</h3>
      <p class="small muted">${sec.desc}</p>`;

    if (sec.custom === 'base') {
      const totalCat = cmpAll(cat).length;
      const bestOf = (vals, higher) => cmpBestIndex(vals, higher);
      // если сравнивать нечего (например, FPS у не-игровой категории) — прочерк
      const bestName = (vals, higher) => { const i = bestOf(vals, higher); return i >= 0 ? esc(selected[i].name) : '—'; };
      html += `<div class="table-wrap"><table class="cmp-table">
        <tr><th>Показатель</th>${selected.map(c => `<th>${esc(c.name)}</th>`).join('')}${selected.length === 2 ? '<th>Лучше</th>' : ''}</tr>
        <tr><td class="muted">Совокупный балл</td>${selected.map((c, i) => `<td class="${i === bestOf(selected.map(x => cmpScore(x)), true) ? 'win' : ''}"><b>${cmpScore(c)}</b> <span class="small muted">/ 100</span></td>`).join('')}${selected.length === 2 ? `<td class="small pos">${bestName(selected.map(x => cmpScore(x)), true)}</td>` : ''}</tr>
        <tr><td class="muted">Место в рейтинге категории</td>${selected.map((c, i) => `<td class="${i === bestOf(selected.map(x => cmpRank(x)), false) ? 'win' : ''}">${cmpRank(c)} из ${totalCat}</td>`).join('')}${selected.length === 2 ? `<td class="small pos">${bestName(selected.map(x => cmpRank(x)), false)}</td>` : ''}</tr>
        <tr><td class="muted">Бренд</td>${selected.map(c => `<td>${esc(c.brand)}</td>`).join('')}${selected.length === 2 ? '<td class="muted">—</td>' : ''}</tr>
        <tr><td class="muted">Год выпуска</td>${selected.map((c, i) => `<td class="${i === bestOf(selected.map(x => x.year), true) ? 'win' : ''}">${c.year}${c.year < 2020 ? ' <span class="small muted">· старее</span>' : ''}</td>`).join('')}${selected.length === 2 ? `<td class="small pos">${bestName(selected.map(x => x.year), true)}</td>` : ''}</tr>
        <tr><td class="muted">Игровой индекс</td>${selected.map((c, i) => `<td class="${i === bestOf(selected.map(x => x.perf), true) ? 'win' : ''}">${c.perf} / 100</td>`).join('')}${selected.length === 2 ? `<td class="small pos">${bestName(selected.map(x => x.perf), true)}</td>` : ''}</tr>
        <tr><td class="muted">Рабочий индекс</td>${selected.map((c, i) => `<td class="${i === bestOf(selected.map(x => x.work), true) ? 'win' : ''}">${c.work} / 100</td>`).join('')}${selected.length === 2 ? `<td class="small pos">${bestName(selected.map(x => x.work), true)}</td>` : ''}</tr>
        <tr><td class="muted">Соотношение цена-качество</td>${selected.map((c, i) => `<td class="${i === bestOf(selected.map(x => cmpValue(x)), true) ? 'win' : ''}">${cmpValue(c)} <span class="small muted">баллов на 1000 ₽</span></td>`).join('')}${selected.length === 2 ? `<td class="small pos">${bestName(selected.map(x => cmpValue(x)), true)}</td>` : ''}</tr>
        <tr><td class="muted">Энергоэффективность</td>${selected.map((c, i) => `<td class="${i === bestOf(selected.map(x => cmpEfficiency(x)), true) ? 'win' : ''}">${cmpEfficiency(c) ?? '—'}</td>`).join('')}${selected.length === 2 ? `<td class="small pos">${bestName(selected.map(x => cmpEfficiency(x)), true)}</td>` : ''}</tr>
        ${(() => {
          const fps = selected.map(x => compFps(x, 'all', '1080p'));
          if (!fps.some(v => v)) return '<tr><td class="muted">Средний FPS · 1080p (20 игр)</td>' + selected.map(() => '<td class="muted">—</td>').join('') + (selected.length === 2 ? '<td class="muted">—</td>' : '') + '</tr>';
          const bi = bestOf(fps, true);
          return `<tr><td class="muted">Средний FPS · 1080p (20 игр)</td>${selected.map((c, i) => `<td class="${i === bi ? 'win' : ''}">${fps[i] ? fps[i] + ' FPS' : '—'}</td>`).join('')}${selected.length === 2 ? `<td class="small pos">${bestName(fps, true)}</td>` : ''}</tr>`;
        })()}
      </table></div>`;
    } else if (sec.custom === 'gaming') {
      const games = GAMES.slice(0, 12);
      html += `<div class="table-wrap"><table class="cmp-table">
        <tr><th>Игра · 1080p Ultra</th>${selected.map(c => `<th>${esc(c.name)}</th>`).join('')}<th>Разница</th></tr>`;
      games.forEach(g => {
        const vals = selected.map(c => compFps(c, g.id, '1080p'));
        const bi = cmpBestIndex(vals, true);
        const d = vals.length > 1 && vals[0] && vals[1] ? cmpPct(Math.min(vals[0], vals[1]), Math.max(vals[0], vals[1])) : null;
        html += `<tr><td>${esc(g.name)}</td>${vals.map((v, i) => `<td class="${i === bi && vals.filter(x => x === v).length === 1 ? 'win' : ''}">${v ? v + ' FPS' : '—'}</td>`).join('')}<td class="small muted">${d !== null ? d + '%' : '—'}</td></tr>`;
      });
      html += `<tr class="cmp-avg"><td><b>Средний FPS по 20 играм</b></td>${selected.map(c => {
        const avg = GAMES.map(g => compFps(c, g.id, '1080p')).filter(Boolean);
        const v = Math.round(avg.reduce((x, y) => x + y, 0) / avg.length);
        return `<td><b>${v}</b></td>`;
      }).join('')}<td></td></tr></table></div>`;
      // индексы
      html += `<div class="cmp-bars">${selected.map(c => `
        <div class="cmp-bar-block">
          <div class="small"><b>${esc(c.name)}</b></div>
          <div class="meter-label"><span>Игровой индекс</span><b>${c.perf}/100</b></div><div class="bar"><i style="width:${c.perf}%"></i></div>
          <div class="meter-label"><span>Рабочий индекс</span><b>${c.work}/100</b></div><div class="bar"><i style="width:${c.work}%;background:linear-gradient(90deg,#a3e635,#22d3ee)"></i></div>
        </div>`).join('')}</div>`;
    } else if (sec.custom === 'price') {
      html += `<div class="table-wrap"><table class="cmp-table">
        <tr><th>Показатель</th>${selected.map(c => `<th>${esc(c.name)}</th>`).join('')}</tr>
        <tr><td>Мин. цена, ${esc(regionById(state.region).name)} (новые)</td>${selected.map(c => `<td class="price">${fmt(minPrice(c.id, state.region, 'new') ?? c.basePrice)}</td>`).join('')}</tr>
        <tr><td>Мин. цена БУ</td>${selected.map(c => { const p = minPrice(c.id, state.region, 'used'); return `<td>${p ? fmt(p) : '<span class="muted">нет предложений</span>'}</td>`; }).join('')}</tr>
        <tr><td>Цена-качество (баллов на 1000 ₽)</td>${selected.map(c => { const v = cmpValue(c); const bi = cmpBestIndex(selected.map(x => cmpValue(x)), true); return `<td class="${selected.indexOf(c) === bi ? 'win' : ''}">${v}</td>`; }).join('')}</tr>
        <tr><td>Энергоэффективность</td>${selected.map(c => `<td>${cmpEfficiency(c) ?? '—'}</td>`).join('')}</tr>
        <tr><td>Средний FPS / 100 ₽</td>${selected.map(c => { const f = compFps(c, 'all', '1080p'); const p = minPrice(c.id, state.region, 'new') ?? c.basePrice; return `<td>${f && p ? (Math.round(f / p * 10000) / 100) : '—'}</td>`; }).join('')}</tr>
      </table></div>`;
      // цены по городам
      const cities = topCities(8);
      html += `<div class="table-wrap" style="margin-top:14px"><table class="cmp-table">
        <tr><th>Город</th>${selected.map(c => `<th>${esc(c.name)}</th>`).join('')}</tr>`;
      cities.forEach(r => {
        html += `<tr><td>${r.icon} ${esc(r.name)}</td>${selected.map(c => {
          const n = minPrice(c.id, r.id, 'new'); const u = minPrice(c.id, r.id, 'used');
          return `<td>${n ? fmt(n) : '—'}${u ? ` <span class="small" style="color:#fda4af">/ БУ ${fmt(u)}</span>` : ''}</td>`;
        }).join('')}</tr>`;
      });
      html += `</table></div><p class="small muted" style="margin-top:8px">Другой город — кнопка региона в шапке, таблица пересчитается.</p>`;
      // ссылки на живые цены
      html += `<div class="cmp-links">${selected.map(c => `<a class="btn small ghost" href="${avitoUrl(c.name, state.region)}" target="_blank" rel="noopener">Avito: ${esc(c.name)} ↗</a>`).join('')}</div>`;
    } else {
      const rows = sec.rows.map(k => CMP_ROWS[cat]?.find(r => r[0] === k)).filter(Boolean);
      html += `<div class="table-wrap"><table class="cmp-table">
        <tr><th>Параметр</th>${selected.map(c => `<th>${esc(c.name)}</th>`).join('')}${selected.length === 2 ? '<th>Лучше</th>' : ''}</tr>`;
      rows.forEach(([key, label, unit, higher, fmtFn]) => {
        const vals = selected.map(c => c.specs[key]);
        const bi = cmpBestIndex(vals, higher === undefined ? null : higher);
        html += `<tr><td class="muted">${label}</td>${vals.map((v, i) => {
          const txt = typeof v === 'number' ? cmpNum(v, unit) : (v ?? '—');
          return `<td class="${i === bi ? 'win' : ''}">${typeof txt === 'string' && /[\u0400-\u04FF]/.test(txt) === false && typeof v === 'string' ? esc(txt) : esc(String(txt))}</td>`;
        }).join('')}${selected.length === 2 ? `<td class="small ${bi === 0 ? 'pos' : bi === 1 ? 'pos' : 'muted'}">${bi >= 0 ? esc(selected[bi].name) : '—'}</td>` : ''}</tr>`;
      });
      html += `</table></div>`;
    }
    html += `</section>`;
  });

  // ---- плюсы и минусы ----
  const pcA = cmpProsCons(a, b), pcB = cmpProsCons(b, a);
  html += `<section class="cmp-section"><h3>Обзор плюсов и минусов</h3>
    <div class="pc-grid">
      ${[[a, pcA], [b, pcB]].map(([c, pc]) => `
        <div class="pc-card">
          <b>${esc(c.name)}</b>
          <div class="pc-score">${cmpScore(c)}<span class="small muted">/100 · место ${cmpRank(c)} в категории</span></div>
          <div class="small" style="margin-top:8px">${pc.pros.length ? '<b class="pos">Плюсы</b>' : ''}</div>
          ${pc.pros.map(p => `<div class="pc-item plus">＋ ${esc(p)}</div>`).join('')}
          <div class="small" style="margin-top:8px">${pc.cons.length ? '<b class="neg">Минусы</b>' : ''}</div>
          ${pc.cons.map(p => `<div class="pc-item minus">− ${esc(p)}</div>`).join('')}
          ${!pc.pros.length && !pc.cons.length ? '<div class="small muted">Соперники почти равны.</div>' : ''}
        </div>`).join('')}
    </div>
    <div class="verdict ok" style="margin-top:16px">
      <b>Мы рекомендуем ${esc(win.name)}</b> — он выигрывает у ${esc(selected[winnerIdx === 0 ? 1 : 0].name)} в суммарном рейтинге производительности${(() => {
        const p = minPrice(win.id, state.region, 'new') ?? win.basePrice;
        const o = selected[winnerIdx === 0 ? 1 : 0];
        const po = minPrice(o.id, state.region, 'new') ?? o.basePrice;
        return p <= po ? ' и стоит не дороже.' : `, но стоит на ${fmt(p - po)} дороже — при ограниченном бюджете берите соперника.`;
      })()}
    </div>
  </section>`;

  // ---- другие сравнения ----
  const seen = new Set([a.id, b.id]);
  const others = [];
  [...cmpSimilar(a, 4), ...cmpSimilar(b, 4)].forEach(c => { if (!seen.has(c.id) && others.length < 6) { seen.add(c.id); others.push(c); } });
  if (others.length) {
    html += `<section class="cmp-section"><h3>Другие сравнения</h3><p class="small muted">Близкие по производительности модели — посмотрите их тоже.</p><div class="cmp-similar">
      ${others.map(c => `<button class="cmp-sim" onclick="setCompareComp(0,'${c.id}');setCompareComp(1,'${c.id === a.id ? b.id : a.id}')">
        <span>${catIcon(c.cat)} <b>${esc(c.name)}</b></span><span class="small muted">${cmpScore(c)} · ${fmt(minPrice(c.id, state.region, 'new') ?? c.basePrice)}</span>
      </button>`).join('')}
    </div></section>`;
  }

  // ---- если сравнивают больше двух ----
  if (rest.length) {
    html += `<section class="cmp-section"><h3>Также выбрано</h3><div class="table-wrap"><table class="cmp-table">
      <tr><th>Модель</th><th>Балл</th><th>Игровой</th><th>Рабочий</th><th>Цена</th><th></th></tr>
      ${rest.map(c => `<tr><td>${esc(c.name)}</td><td><b>${cmpScore(c)}</b></td><td>${c.perf}</td><td>${c.work}</td><td class="price">${fmt(minPrice(c.id, state.region, 'new') ?? c.basePrice)}</td><td><button class="btn small ghost" onclick="setCompareComp(1,'${c.id}')">Сравнить с ${esc(a.name)}</button></td></tr>`).join('')}
    </table></div></section>`;
  }

  $('#compareCompsBody').innerHTML = html;
}

const catTitle = id => (CATEGORIES.find(c => c.id === id) || {}).name || id;
const catIcon = id => (CATEGORIES.find(c => c.id === id) || {}).icon || '🔧';

// Быстрый переход к сравнению: из карточки компонента
function compareWith(cat, idA, idB) {
  state.compareCat = cat;
  state.compareComps[cat] = [idA, idB];
  state.compareQuery = '';
  navigate('compare-components');
}
