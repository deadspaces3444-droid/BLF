// ===== BLF — фильтрация совместимых комплектующих =====
// Используется конструктором и страницей проверки совместимости:
// при выборе процессора списки плат, памяти, охлаждения, накопителей,
// БП и корпусов показывают только реально подходящие варианты.
// Правила те же, что в checkCompatibility() (compat.js).

// ---------- Сокеты ----------
// Кулеры указывают поддержку списком или семейством (LGA115x = 1155/1150/1151/1200)
const SOCKET_FAMILY = {
  'LGA1155': ['LGA1155', 'LGA115x'],
  'LGA1150': ['LGA1150', 'LGA115x'],
  'LGA1151': ['LGA1151', 'LGA115x'],
  'LGA1200': ['LGA1200', 'LGA115x'],
  'LGA1700': ['LGA1700', 'LGA115x'],
  'LGA1851': ['LGA1851', 'LGA1700'],
  'LGA2011': ['LGA2011'],
  'LGA2011-3': ['LGA2011-3', 'LGA2011', 'LGA2066'],
  'LGA2066': ['LGA2066', 'LGA2011', 'LGA2011-3'],
  'LGA1366': ['LGA1366'],
  'LGA775': ['LGA775'],
  'LGA771': ['LGA771'],
  'LGA3647': ['LGA3647'],
  'LGA1567': ['LGA1567'],
  'AM3': ['AM3', 'AM3+', 'AM2+'],
  'AM3+': ['AM3+', 'AM3'],
  'AM2+': ['AM2+', 'AM3'],
  'FM2+': ['FM2+'],
  'AM4': ['AM4'],
  'AM5': ['AM5'],
  'TR4': ['TR4'],
  'sTRX4': ['sTRX4', 'TR4'],
  'sWRX8': ['sWRX8'],
  'sTR5': ['sTR5'],
  'SP3': ['SP3'],
  'SP5': ['SP5'],
  'G34': ['G34'],
};

// Подходит ли кулер (строка поддержки сокетов) к сокету процессора
function socketListMatches(list, socket) {
  if (!list) return true;
  const mine = SOCKET_FAMILY[socket] || [socket];
  const parts = String(list).split(/[,;]/).map(s => s.trim()).filter(Boolean);
  return parts.some(p => {
    const variants = [p, ...p.split('/')];
    return variants.some(v => mine.includes(v.trim()));
  });
}

// ---------- Память ----------
const ramBase = t => String(t || '').replace(/\s*(ECC|REG)\b/g, '').replace(/\s+/g, ' ').trim();
const ramIsEcc = t => /ECC|REG/i.test(String(t || ''));

function ramFitsMb(ram, mb) {
  if (!ram || !mb) return true;
  if (ramBase(ram.specs.type) !== ramBase(mb.specs.ramType)) return false;
  if (ramIsEcc(mb.specs.ramType) && !ramIsEcc(ram.specs.type)) return false;
  const cap = parseInt(String(mb.specs.maxRam).replace(/\D/g, ''), 10);
  if (cap && ram.specs.capacityGb > cap) return false;
  if (mb.specs.ramSlots && ram.specs.modules > mb.specs.ramSlots) return false;
  return true;
}

function ramFitsCpuType(ram, cpu) {
  if (!ram || !cpu) return true;
  const types = ramBase(cpu.specs.ramType).split('/').map(s => s.trim()).filter(Boolean);
  return types.includes(ramBase(ram.specs.type));
}

// ---------- Прочее ----------
const mbFitsCpu = (mb, cpu) => !mb || !cpu || mb.specs.socket === cpu.specs.socket;

function ssdFitsMb(ssd, mb) {
  if (!ssd || !mb) return true;
  const t = String(ssd.specs.type || '');
  if (t === 'NVMe') return (mb.specs.m2Slots || 0) > 0;
  if (/SATA|SSD/.test(t)) return (mb.specs.sataPorts || 0) > 0;
  return true;
}

function psuFitsPower(psu, { cpu, gpu } = {}) {
  if (!psu) return true;
  const need = (cpu?.specs.tdp || 0) + (gpu?.specs.tdp || 0) + 90;
  return (psu.specs.wattage || 0) >= need;
}

function caseFitsMb(kase, mb) {
  if (!kase || !mb) return true;
  const supported = String(kase.specs.motherboardSupport).split(',').map(s => s.trim());
  const ff = mb.specs.formFactor;
  return supported.includes(ff)
    || (ff === 'mATX' && supported.includes('ATX'))
    || (ff === 'ITX' && (supported.includes('mATX') || supported.includes('ATX')));
}
const caseFitsGpu = (kase, gpu) => !kase || !gpu || (gpu.specs.lengthMm || 0) <= (kase.specs.maxGpuLengthMm || 0);
const coolerFitsCpu = (cool, cpu) => !cool || !cpu || socketListMatches(cool.specs.sockets, cpu.specs.socket);
const coolerFitsPower = (cool, cpu) => !cool || !cpu || (cool.specs.tdpSupport || 0) >= (cpu.specs.tdp || 0);
function coolerFitsCase(cool, kase) {
  if (!cool || !kase) return true;
  const isAir = !/СЖО|Liquid|AIO/i.test(String(cool.specs.type || ''));
  if (!isAir) return true;
  return (cool.specs.heightMm || 0) <= (kase.specs.maxCpuCoolerHeightMm || 0);
}

// ---------- Отбор вариантов для категории ----------
// Ограничения сгруппированы: если при полном наборе список оказался пустым
// (например, в сборке осталась память от старой платформы), ограничение
// ослабляется, чтобы список никогда не пропадал целиком.
function compatibleOptions(cat, build) {
  const b = build || {};
  const cpu = b.cpu ? byId(b.cpu) : null;
  const mb = b.motherboard ? byId(b.motherboard) : null;
  const gpu = b.gpu ? byId(b.gpu) : null;
  const ram = b.ram ? byId(b.ram) : null;
  const ssd = b.ssd ? byId(b.ssd) : null;
  const psu = b.psu ? byId(b.psu) : null;
  const kase = b.case ? byId(b.case) : null;
  const cool = b.cooling ? byId(b.cooling) : null;

  const all = COMPONENTS.filter(c => c.cat === cat);
  const priceOf = c => minPrice(c.id, state.region, 'new') ?? c.basePrice;
  const done = list => list.sort((x, y) => priceOf(x) - priceOf(y));

  // Наборы правил: последний в массиве — самый «мягкий»
  let rules;
  switch (cat) {
    case 'cpu':
      rules = [
        c => (!mb || mbFitsCpu(mb, c)) && (!ram || ramFitsCpuType(ram, c)),
        c => !mb || mbFitsCpu(mb, c),
        () => true,
      ]; break;
    case 'motherboard':
      // Сокет — жёсткое требование; память/диск/корпус сужают список, если вариантов хватает
      rules = [
        m => mbFitsCpu(m, cpu) && (!ram || ramFitsMb(ram, m)) && (!ssd || ssdFitsMb(ssd, m)) && (!kase || caseFitsMb(kase, m)),
        m => mbFitsCpu(m, cpu) && (!ssd || ssdFitsMb(ssd, m)) && (!kase || caseFitsMb(kase, m)),
        m => mbFitsCpu(m, cpu),
        () => true,
      ]; break;
    case 'ram':
      // Главный ориентир — плата (она определяет DDR2/DDR3/DDR4/DDR5 и ECC).
      // Для потребительских плат серверные ECC-модули не предлагаем.
      rules = [
        r => (mb ? ramFitsMb(r, mb) : ramFitsCpuType(r, cpu))
             && (ramIsEcc(mb?.specs.ramType) || !ramIsEcc(r.specs.type)),
        r => (mb ? ramFitsMb(r, mb) : ramFitsCpuType(r, cpu)),
        r => ramFitsCpuType(r, cpu),
        () => true,
      ]; break;
    case 'ssd':
      rules = [s => ssdFitsMb(s, mb), () => true]; break;
    case 'cooling':
      rules = [
        c => coolerFitsCpu(c, cpu) && coolerFitsPower(c, cpu) && coolerFitsCase(c, kase),
        c => coolerFitsCpu(c, cpu) && coolerFitsPower(c, cpu),
        c => coolerFitsCpu(c, cpu),
        () => true,
      ]; break;
    case 'psu':
      rules = [p => psuFitsPower(p, { cpu, gpu }), () => true]; break;
    case 'case':
      rules = [
        c => caseFitsMb(c, mb) && caseFitsGpu(c, gpu) && coolerFitsCase(cool, c),
        c => caseFitsMb(c, mb) && caseFitsGpu(c, gpu),
        c => !mb || caseFitsMb(c, mb),
        () => true,
      ]; break;
    default: // gpu — жёстких ограничений от CPU/платы нет
      rules = [() => true];
  }

  for (const rule of rules) {
    const list = all.filter(rule);
    if (list.length) return done(list);
  }
  return done(all.slice());
}

// ---------- Автоподбор ----------
// Приводит сборку в согласованное состояние. lock — категория, которую
// пользователь только что выбрал: её не меняем, подгоняем остальные слоты.
// Замены выбираются «ближайшими по цене», чтобы не провалиться в дешёвый хлам.
function autoFixBuild(build, lock = null) {
  const b = { ...build };
  const changed = [];
  const priceOf = id => { const c = byId(id); return c ? (minPrice(c.id, state.region, 'new') ?? c.basePrice) : 0; };
  const best = (cat, current, preferId) => {
    const opts = compatibleOptions(cat, b);
    const pool = opts.length ? opts : COMPONENTS.filter(c => c.cat === cat);
    if (!pool.length) return current;
    const prefer = preferId ? byId(preferId) : (current ? byId(current) : null);
    if (prefer && pool.some(o => o.id === prefer.id)) return prefer.id;   // текущая подходит
    const target = prefer ? (priceOf(prefer.id) || prefer.basePrice) : 0;
    const scored = pool.map(o => ({ id: o.id, d: Math.abs((priceOf(o.id) || o.basePrice) - target) }))
      .sort((x, y) => x.d - y.d);
    return scored[0].id;
  };
  const setIf = (cat, id, name) => {
    if (!id || b[cat] === id) return;
    const was = b[cat];
    b[cat] = id;
    if (was && !changed.some(n => n === name)) changed.push(name);
  };
  const catName = id => (CATEGORIES.find(c => c.id === id) || {}).name || id;

  // 1. Процессор — основа сборки
  if (lock !== 'cpu') {
    const cpuId = b.cpu ? (compatibleOptions('cpu', b).some(o => o.id === b.cpu) ? b.cpu : best('cpu', b.cpu)) : best('cpu', null);
    if (cpuId) b.cpu = cpuId;
  }
  // 2. Плата под процессор
  if (lock !== 'motherboard') setIf('motherboard', best('motherboard', b.motherboard), catName('motherboard'));
  // 3. Память под процессор и плату
  if (lock !== 'ram') setIf('ram', best('ram', b.ram), catName('ram'));
  // 4. Охлаждение под процессор и корпус
  if (lock !== 'cooling') setIf('cooling', best('cooling', b.cooling), catName('cooling'));
  // 5. Накопитель под плату
  if (lock !== 'ssd') setIf('ssd', best('ssd', b.ssd), catName('ssd'));
  // 6. БП под процессор и видеокарту
  if (lock !== 'psu') setIf('psu', best('psu', b.psu), catName('psu'));
  // 7. Корпус под плату, видеокарту и кулер
  if (lock !== 'case') setIf('case', best('case', b.case), catName('case'));

  // Финальная проверка: если что-то ещё не сходится — поправить без блокировки
  let guard = 0;
  const order = ['cpu', 'motherboard', 'ram', 'ssd', 'cooling', 'psu', 'case'];
  while (guard++ < 3) {
    let fixed = false;
    order.forEach(cat => {
      if (cat === lock) return;
      const opts = compatibleOptions(cat, b);
      if (opts.length && b[cat] && !opts.some(o => o.id === b[cat])) {
        b[cat] = best(cat, b[cat]);
        fixed = true;
      }
    });
    if (!fixed) break;
  }
  return { build: b, changed };
}
