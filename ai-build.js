// ===== BLF — ИИ-подбор сборки =====
// Пользователь вводит три вещи: цена, город, во что хочет играть / для каких задач ПК.
// Дальше работает «ИИ-консультант»: подбирает комплектующие из каталога под бюджет
// и профиль игр (или задач), проверяет совместимость и объясняет каждый выбор.
// Плюс — ссылка на DeepSeek (chat.deepseek.com) с уже готовым запросом для свободного диалога.

const AI_KEY = 'blf.aiBuild.v1';
const AI_TASKS = {
  gaming: { name: 'Игры', icon: '🎮', work: 0.2 },
  'gaming-stream': { name: 'Игры + стрим', icon: '📡', work: 0.45 },
  work: { name: 'Работа и учёба', icon: '💼', work: 0.6 },
  render: { name: 'Монтаж и 3D', icon: '🎬', work: 0.9 },
  office: { name: 'Офис и браузер', icon: '📄', work: 0.35 },
  server: { name: 'Домашний сервер', icon: '🗄️', work: 0.7 },
};
const AI_RES = {
  default: { name: 'Как получится', target: 60, res: '1080p' },
  esports: { name: 'Киберспорт — много FPS', target: 144, res: '1080p' },
  fullhd: { name: 'Full HD, высокие настройки', target: 60, res: '1080p' },
  qhd: { name: '1440p, высокие настройки', target: 60, res: '1440p' },
  uhd: { name: '4K, высокие настройки', target: 60, res: '4K' },
};
const AI_DEFAULT = { budget: 80000, gameQuery: '', task: 'gaming', res: 'default', condition: 'new' };

let AI_LOADED = false;
function initAiState() {
  if (AI_LOADED) return;
  AI_LOADED = true;
  try {
    const raw = localStorage.getItem(AI_KEY);
    if (!raw) return;
    const cfg = JSON.parse(raw);
    if (!cfg || typeof cfg !== 'object') return;
    if (Number(cfg.budget) > 0) state.aiBudget = Math.round(Number(cfg.budget));
    if (typeof cfg.gameQuery === 'string') state.aiGameQuery = cfg.gameQuery.slice(0, 120);
    if (AI_TASKS[cfg.task]) state.aiTask = cfg.task;
    if (AI_RES[cfg.res]) state.aiRes = cfg.res;
    if (['new', 'used', 'any'].includes(cfg.condition)) state.aiCondition = cfg.condition;
    if (['auto', 'pc', 'laptop'].includes(cfg.device)) state.aiDevice = cfg.device;
    if (cfg.result && typeof cfg.result === 'object' && cfg.result.parts) state.aiResult = cfg.result;
    if (typeof cfg.key === 'string') state.aiKey = cfg.key.slice(0, 200);
    if (['deepseek-chat', 'deepseek-reasoner'].includes(cfg.model)) state.aiModel = cfg.model;
    if (typeof cfg.answer === 'string') state.aiAnswer = cfg.answer.slice(0, 12000);
    if (cfg.compare && typeof cfg.compare === 'object') state.aiCompare = cfg.compare;
    if (cfg.laptop && cfg.laptop.l && typeof cfg.laptop.l === 'object') state.aiLaptop = cfg.laptop;
  } catch (e) { /* приватный режим */ }
}
function saveAiConfig() {
  try {
    localStorage.setItem(AI_KEY, JSON.stringify({
      budget: state.aiBudget, gameQuery: state.aiGameQuery, task: state.aiTask,
      res: state.aiRes, condition: state.aiCondition, result: state.aiResult || null,
      device: state.aiDevice || 'auto',
      compare: state.aiCompare || null,
      laptop: state.aiLaptop || null,
      key: state.aiKey || '', model: state.aiModel || 'deepseek-chat', answer: state.aiAnswer || '',
    }));
  } catch (e) {}
}
function aiCfg() { initAiState(); return state; }

// ---------- Понимание запроса «во что играть» ----------
const AI_ALIASES = {
  cs2: ['кс2', 'кс 2', 'cs2', 'cs 2', 'counter', 'контра', 'контер', 'кски'],
  dota2: ['дота', 'доту', 'дотка', 'dota'],
  valorant: ['валорант', 'валик', 'valorant'],
  fortnite: ['фортнайт', 'фартнайт', 'fortnite'],
  apex: ['апекс', 'apex'],
  pubg: ['пабг', 'pubg', 'батлграунд'],
  warzone: ['варзон', 'warzone', 'call of duty', 'колда', 'cod'],
  gta5: ['гта', 'gta', 'гта5', 'гта 5'],
  minecraft: ['майнкрафт', 'майн', 'minecraft'],
  cyberpunk: ['киберпанк', 'cyberpunk'],
  witcher3: ['ведьмак', 'witcher'],
  eldenring: ['элден', 'elden', 'соулс'],
  bg3: ['бг3', 'baldur', 'балдур'],
  rdr2: ['rdr', 'рдр', 'red dead'],
  hogwarts: ['хогвартс', 'hogwarts'],
  alanwake2: ['алан вейк', 'alan wake'],
  stalker2: ['сталкер', 'stalker'],
  helldivers2: ['хеллдайверс', 'helldivers'],
  palworld: ['палворлд', 'palworld'],
  rust: ['раст', 'rust'],
};
const AI_WORK_ALIASES = [
  ['стрим', 0.25], ['stream', 0.25],
  ['монтаж', 0.5], ['видео', 0.35], ['рендер', 0.5], ['3d', 0.5], ['blender', 0.5], ['cad', 0.4],
  ['фотошоп', 0.25], ['photoshop', 0.25], ['дизайн', 0.25],
  ['учёб', 0.1], ['офис', 0.15], ['word', 0.1], ['excel', 0.15], ['1с', 0.15], ['бухгалт', 0.15],
  ['программ', 0.25], ['код', 0.2], ['python', 0.25], ['разработ', 0.3], ['нейросет', 0.4], ['ии', 0.2],
];

function aiNormalize(s) { return (s || '').toLowerCase().replace(/ё/g, 'е').trim(); }

function aiResolveGame(query) {
  const q = aiNormalize(query);
  if (!q) return { games: [], mode: 'any', label: 'универсально', work: AI_TASKS[aiCfg().aiTask]?.work ?? 0.2 };
  // прямые совпадения по названию игры и алиасам
  const hits = [];
  GAMES.forEach(g => {
    const name = aiNormalize(g.name);
    const nameOk = name.includes(q) || q.includes(name) || name.split(/[\s:—-]+/).some(w => w.length > 3 && q.includes(w));
    const aliasOk = (AI_ALIASES[g.id] || []).some(a => q.includes(a));
    if (nameOk || aliasOk) hits.push(g);
  });
  let work = AI_TASKS[aiCfg().aiTask]?.work ?? 0.2;
  AI_WORK_ALIASES.forEach(([w, val]) => { if (q.includes(w)) work = Math.max(work, val); });
  if (hits.length) {
    return { games: hits, mode: 'games', label: hits.map(g => g.name).join(', '), work };
  }
  // ничего не нашли — считаем, что нужен универсальный ПК с запасом
  return { games: [], mode: 'unknown', label: query.trim(), work: Math.max(work, 0.3) };
}

function aiProfile() {
  const cfg = aiCfg();
  const parsed = aiResolveGame(cfg.aiGameQuery);
  const resCfg = AI_RES[cfg.aiRes] || AI_RES.default;
  const target = resCfg.target;
  const games = parsed.mode === 'games' ? parsed.games : GAMES;
  // средний вес видеокарты: чем тяжелее игры — тем больше решает GPU
  const gpuWeight = games.length ? games.reduce((a, g) => a + g.gpuWeight, 0) / games.length : 0.6;
  const res = parsed.mode === 'games' ? resCfg.res : resCfg.res;
  return {
    games: parsed.mode === 'games' ? parsed.games : [],
    gameIds: parsed.mode === 'games' ? parsed.games.map(g => g.id) : [],
    mode: parsed.mode,
    label: parsed.label,
    res,
    target,
    gpuWeight,
    work: parsed.work,
    heavy: parsed.mode === 'games' && parsed.games.some(g => ['cyberpunk', 'alanwake2', 'rdr2', 'hogwarts', 'stalker2'].includes(g.id)),
  };
}

// ---------- Цены ----------
function aiPrice(id, condition = state.aiCondition) {
  initAiState();
  const city = state.region;
  if (!id || !byId(id)) return null;
  if (condition === 'new') return minPrice(id, city, 'new');
  if (condition === 'used') return minPrice(id, city, 'used');
  // «новое и БУ»: для старых комплектующих выгоднее БУ, для новых они часто равны
  const nw = minPrice(id, city, 'new'), us = minPrice(id, city, 'used');
  if (nw == null) return us;
  if (us == null) return nw;
  return Math.min(nw, us);
}
function aiTotal(build) {
  let total = 0;
  Object.values(build.parts || build).forEach(id => { const p = aiPrice(id); total += p ?? (byId(id)?.basePrice || 0); });
  return total;
}

// ---------- Подбор ядра: CPU + GPU под бюджет и профиль ----------
function aiScoreOf(c, profile) {
  const gaming = profile.mode !== 'work';
  const w = Math.min(0.85, Math.max(0, profile.work));
  const base = gaming
    ? (c.perf || 0) * (1 - w * 0.5) + (c.work || 0) * (w * 0.5)
    : (c.work || 0) * (1 - w * 0.3) + (c.perf || 0) * (w * 0.3);
  // небольшая поправка на актуальность: свежая платформа живёт дольше и лучше апгрейдится
  const age = Math.max(0, 2026 - (c.year || 2020));
  const fresh = Math.max(0.9, 1 - age * 0.015);
  return base * fresh;
}
const AI_PRICE_CACHE = new Map();
function aiPricedAll(cat) {
  const key = cat + '|' + state.region + '|' + state.aiCondition;
  if (AI_PRICE_CACHE.has(key)) return AI_PRICE_CACHE.get(key);
  const out = COMPONENTS.filter(c => c.cat === cat)
    .map(c => ({ c, price: aiPrice(c.id) }))
    .filter(x => x.price != null && x.price > 0 && isFinite(x.price));
  AI_PRICE_CACHE.set(key, out);
  return out;
}
function aiPriced(list) {
  return list.map(c => ({ c, price: aiPrice(c.id) })).filter(x => x.price != null && x.price > 0 && isFinite(x.price));
}
function aiPricedCat(cat) { return aiPricedAll(cat); }
// Прореживание длинного списка по цене — перебор остаётся быстрым, но покрывает весь диапазон
function aiThin(list, n) {
  if (list.length <= n) return list;
  const out = [];
  const max = list.length - 1;
  let last = -1;
  for (let i = 0; i < n; i++) {
    const idx = Math.round(i * max / (n - 1));
    if (idx !== last) { out.push(list[idx]); last = idx; }
  }
  return out;
}

// Главная идея: сначала быстро оцениваем, влезает ли пара «CPU+GPU» в бюджет
// (остальное железо стоит примерно известную долю), потом уже точно добираем обвязку.
function aiChooseCandidates(budget, profile, limit = 6) {
  const cpus = aiPricedAll('cpu').filter(x => (x.c.perf || 0) > 0).sort((a, b) => a.price - b.price);
  const gpus = aiPricedAll('gpu').filter(x => (x.c.perf || 0) > 0 && (x.c.specs.vramGb || 0) >= 2).sort((a, b) => a.price - b.price);
  if (!cpus.length || !gpus.length) return [];
  const cpuSteps = aiThin(cpus.filter(x => x.price <= budget * 0.65), 16);
  const gpuSteps = aiThin(gpus.filter(x => x.price <= budget * 0.78), 20);
  if (!cpuSteps.length || !gpuSteps.length) return [];
  const gw = Math.min(0.9, Math.max(0.4, 0.35 + profile.gpuWeight * 0.55));
  const restMin = Math.max(6000, budget * 0.14);           // минимум на обвязку
  const approxRest = (cpu, gpu) => {
    const power = (cpu.power || 65) + (gpu.power || 150) + 90;
    return Math.max(restMin,
      2500 +                                   // плата
      (power * 1.35 / 100) * 90 +              // БП: ~90 ₽ за каждые 100 Вт с запасом
      Math.max(1800, budget * 0.045) +         // память
      Math.max(2500, budget * 0.05) +          // накопитель
      Math.max(2200, budget * 0.035) +         // корпус
      Math.max(1200, budget * 0.02));          // охлаждение
  };
  const cands = [];
  gpuSteps.forEach(g => {
    if (g.price > budget * 0.7) return;
    cpuSteps.forEach(cp => {
      if (cp.price > budget * 0.5) return;
      const corePrice = cp.price + g.price;
      const rest16 = aiCheapTotal({ cpu: cp.c, gpu: g.c }, profile, 16);
      const exactRest = rest16 != null && corePrice + rest16 <= budget ? rest16 : aiCheapTotal({ cpu: cp.c, gpu: g.c }, profile, 8);
      const rest = exactRest != null ? exactRest : approxRest(cp.c, g.c);
      const total = corePrice + rest;
      if (total > budget) return;
      // насколько сильно ядро «недобирает» бюджет — штраф за переплату впустую
      const util = corePrice / Math.max(budget - rest, 1);
      const combined = aiScoreOf(g.c, profile) * gw + aiScoreOf(cp.c, profile) * (1 - gw);
      const fps = aiEstimateFps(cp.c.id, g.c.id, profile);
      const fpsPenalty = fps < profile.target * 0.5 ? 0.65 : fps < profile.target * 0.75 ? 0.85 : 1;
      // немного поощряем «почти весь бюджет в дело», но не в ущерб качеству
      const utilBonus = 1 + Math.min(util, 1.05) * 0.35;
      cands.push({ cpu: cp.c, gpu: g.c, cpuPrice: cp.price, gpuPrice: g.price, fps, corePrice, rest, score: combined * fpsPenalty * utilBonus, core: combined });
    });
  });
  if (!cands.length) {
    // очень тесный бюджет: пробуем пары без проверки запаса, обвязку выберет сборщик
    gpuSteps.forEach(g => cpuSteps.forEach(cp => {
      const corePrice = cp.price + g.price;
      if (corePrice > budget * 0.95) return;
      const fps = aiEstimateFps(cp.c.id, g.c.id, profile);
      const combined = aiScoreOf(g.c, profile) * gw + aiScoreOf(cp.c, profile) * (1 - gw);
      cands.push({ cpu: cp.c, gpu: g.c, cpuPrice: cp.price, gpuPrice: g.price, fps, corePrice, rest: 0, score: combined, core: combined });
    }));
  }
  if (!cands.length) return [];
  // отбираем лучшие по качеству, но с разными видеокартами/процессорами — чтобы обвязка могла не влезть
  const seen = new Set();
  const uniq = [];
  cands.sort((a, b) => b.score - a.score).forEach(x => {
    const key = x.cpu.id + '|' + x.gpu.id;
    if (seen.has(key)) return;
    seen.add(key);
    uniq.push(x);
  });
  return uniq.slice(0, limit);
}
const AI_FPS_CACHE = new Map();
function aiEstimateFps(cpuId, gpuId, profile, sample = 6) {
  const all = profile.gameIds.length ? profile.gameIds : GAMES.map(g => g.id);
  // для перебора достаточно выборки игр — итоговый FPS считаем по всем
  const step = Math.max(1, Math.floor(all.length / sample));
  const games = all.filter((_, i) => i % step === 0).slice(0, sample);
  const key = [cpuId, gpuId, games.join(','), profile.res].join('|');
  if (AI_FPS_CACHE.has(key)) return AI_FPS_CACHE.get(key);
  const vals = games.map(id => estimateFps(cpuId, gpuId, null, id, profile.res));
  const out = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  AI_FPS_CACHE.set(key, out);
  return out;
}

// ---------- Обвязка под ядро ----------
// Сначала считаем самый дешёвый годный вариант (так мы гарантированно знаем,
// влезает ли платформа в бюджет), затем «докручиваем» остатком денег.
const AI_REST_CACHE = new Map();
function aiRestPool(core, profile) {
  const cpu = core.cpu, gpu = core.gpu;
  const sockets = String(cpu.specs.socket || '').split(/[,/]/).map(x => x.trim()).filter(Boolean);
  const socket = sockets[0] || '';
  const ramTypeOf = t => (/DDR5/.test(t) ? 'DDR5' : /DDR4/.test(t) ? 'DDR4' : /DDR3/.test(t) ? 'DDR3' : /DDR2/.test(t) ? 'DDR2' : '');
  const needRam = ramTypeOf(cpu.specs.ramType || '');
  const cpuTdp = cpu.specs.tdp || cpu.power || 65;
  const gpuLen = gpu.specs.lengthMm || 300;
  const power = (cpu.power || cpuTdp) + (gpu.power || gpu.specs.tdp || 150) + 90;
  const recoPsu = gpu.specs.recommendedPsu || 0;
  const needW = Math.ceil(Math.max(power * 1.3, recoPsu) / 50) * 50;
  const needPcie5 = (gpu.specs.tdp || gpu.power || 150) >= 300;
  const warn = [];

  // плата
  const cpuYear = cpu.year || 2020;
  let boards = aiPricedAll('motherboard').slice()
    .filter(x => !socket || String(x.c.specs.socket || '').includes(socket));
  // не берём плату сильно другого поколения (H110 под 9-е поколение и т.п.), если есть адекватные
  const closeBoards = boards.filter(x => Math.abs((x.c.year || 2020) - cpuYear) <= 4);
  if (closeBoards.length) boards = closeBoards;
  boards = boards.sort((a, b) => {
    const am = needRam && ramTypeOf(a.c.specs.ramType || '') === needRam ? 0 : 1;
    const bm = needRam && ramTypeOf(b.c.specs.ramType || '') === needRam ? 0 : 1;
    return am - bm || Math.abs((a.c.year || 2020) - cpuYear) - Math.abs((b.c.year || 2020) - cpuYear) || a.price - b.price;
  });
  if (!boards.length) { boards = aiPricedAll('motherboard').slice().sort((a, b) => a.price - b.price); warn.push('плата выбрана без привязки к сокету — проверьте совместимость'); }

  // память
  const boardRamTypes = new Set(boards.map(x => ramTypeOf(x.c.specs.ramType || '')).filter(Boolean));
  const wantType = needRam && boardRamTypes.has(needRam) ? needRam : (boards[0] ? ramTypeOf(boards[0].c.specs.ramType || '') : needRam);
  const serverBoard = /ECC|REG/.test(boards[0] ? String(boards[0].c.specs.ramType || '') : '');
  let rams = aiPricedAll('ram').filter(c => {
    const x = c.c; return (!wantType || ramTypeOf(x.specs.type || '') === wantType)
      && (serverBoard || !/ECC|REG|RDIMM|LRDIMM|REG ECC/i.test(String(x.specs.type || '') + ' ' + x.name + ' ' + (x.specs.ecc || '')));
  });
  if (!rams.length) rams = aiPricedAll('ram').filter(x => !wantType || ramTypeOf(x.c.specs.type || '') === wantType);
  if (!rams.length) { rams = aiPricedAll('ram').slice(); warn.push('тип памяти подобран без привязки к плате'); }
  rams.sort((a, b) => a.price - b.price);

  // накопитель
  let ssds = aiPricedAll('ssd').filter(x => /SSD|NVMe/i.test(x.c.specs.type || '') && (x.c.year || 0) >= 2014);
  if (!ssds.length) ssds = aiPricedAll('ssd').slice();
  ssds.sort((a, b) => a.price - b.price);

  // БП
  const psuFits = strict => aiPricedAll('psu').filter(x => (x.c.specs.wattage || 0) >= needW
    && (!strict || !needPcie5 || !String(x.c.specs.pcie5 || '').startsWith('Нет')));
  let psus = psuFits(true);
  if (!psus.length) { psus = psuFits(false); if (psus.length) warn.push(`БП с PCIe 5.0 на ${needW} Вт не нашёлся — проверьте разъём видеокарты`); }
  if (!psus.length) {
    psus = aiPricedAll('psu').filter(x => (x.c.specs.wattage || 0) >= Math.max(450, needW * 0.8));
    if (psus.length) warn.push(`БП на ${needW} Вт не нашёлся — выбран максимально мощный из доступных, проверьте питание`);
  }
  psus.sort((a, b) => a.price - b.price);

  // корпус
  let cases = aiPricedAll('case').filter(x => (x.c.specs.maxGpuLengthMm || 999) >= gpuLen
    && !/сервер|4U|Rack/i.test(x.c.name + ' ' + (x.c.specs.formFactor || '')));
  if (!cases.length) cases = aiPricedAll('case').filter(x => (x.c.specs.maxGpuLengthMm || 999) >= gpuLen);
  cases.sort((a, b) => a.price - b.price);

  // охлаждение
  const coolFits = (minTdp, strict) => aiPricedAll('cooling').filter(x => (x.c.specs.tdpSupport || 0) >= minTdp
    && (!strict || !socket || !x.c.specs.sockets || String(x.c.specs.sockets).includes(socket)));
  let cools = coolFits(Math.ceil(cpuTdp * 1.3), true);
  if (!cools.length) cools = coolFits(cpuTdp, true);
  if (!cools.length) { cools = coolFits(Math.ceil(cpuTdp * 1.3), false); if (cools.length) warn.push('кулер подобран без проверки сокета — проверьте совместимость'); }
  if (!cools.length) { cools = coolFits(cpuTdp, false); if (cools.length) warn.push('кулер подобран по мощности без проверки сокета — проверьте совместимость'); }
  if (!cools.length) cools = aiPricedAll('cooling').slice().sort((a, b) => b.c.specs.tdpSupport - a.c.specs.tdpSupport);
  cools.sort((a, b) => a.price - b.price);

  return {
    sockets, socket, needRam, wantType, cpuTdp, gpuLen, needW, needPcie5, warn,
    pools: { motherboard: boards, ram: rams, ssd: ssds, psu: psus, case: cases, cooling: cools },
  };
}
function aiRamPick(pool, minGb) {
  return pool.find(x => (x.c.specs.capacityGb || 0) >= minGb) || pool[0];
}
// Базовый комплект обвязки: самый дешёвый, но с нормальным объёмом памяти и накопителя
function aiBaseRest(pools, profile, minRamGb) {
  const cheap = {};
  ['motherboard', 'psu', 'case', 'cooling'].forEach(cat => { const x = pools[cat][0]; if (x) cheap[cat] = x; });
  const want = profile.work >= 0.5 || profile.heavy ? 1000 : 480;
  const ssd = pools.ssd.find(x => (x.c.specs.capacityGb || 0) >= Math.min(480, want) && x.price <= pools.ssd[0].price * 2.6 + 1500) || pools.ssd[0];
  if (ssd) cheap.ssd = ssd;
  const ram = aiRamPick(pools.ram, minRamGb);
  if (ram) cheap.ram = ram;
  if (Object.keys(cheap).length < 6) return null;
  let sum = 0;
  Object.values(cheap).forEach(x => { sum += x.price; });
  return { choice: cheap, sum };
}
function aiCheapTotal(core, profile, minRamGb = 16) {
  const key = [core.cpu.id, core.gpu.id, profile.work >= 0.5 ? 1 : 0, minRamGb].join('|');
  if (AI_REST_CACHE.has(key)) return AI_REST_CACHE.get(key);
  const r = aiRestPool(core, profile);
  const b = aiBaseRest(r.pools, profile, minRamGb);
  AI_REST_CACHE.set(key, b ? b.sum : null);
  return b ? b.sum : null;
}

// Сборка обвязки: сначала самый дешёвый годный вариант, потом «докрутка» остатком бюджета
function aiFitRest(core, budget, profile, minRamGb = 16) {
  const left = budget - core.cpuPrice - core.gpuPrice;
  if (left < 2000) return null;
  const info = aiRestPool(core, profile);
  const pools = info.pools;
  const warn = [...info.warn];

  // 1) минимально годный комплект (тот же, что использовался при выборе кандидата)
  const baseRest = aiBaseRest(pools, profile, minRamGb);
  if (!baseRest) return null;
  const chosen = { ...baseRest.choice };
  const base = baseRest.sum;
  if (base > left) return null;                       // даже самый дешёвый вариант не влезает

  // 2) остаток бюджета распределяем по важности: берём лучший вариант, который влезает в лимит
  const pcieRank = s2 => { const m = String(s2 || '').match(/(\d)\.(\d)/); return m ? Number(m[1]) * 10 + Number(m[2]) : 0; };
  const certRank2 = s2 => { s2 = String(s2 || ''); if (/Titanium/i.test(s2)) return 5; if (/Platinum/i.test(s2)) return 4; if (/Gold|80\+/i.test(s2)) return 3; if (/Bronze/i.test(s2)) return 2; return 0; };
  const wantSsd = profile.work >= 0.5 || profile.heavy ? 1000 : 500;
  const cpuYear = core.cpu.year || 2020;
  const weakChip = /^(A320|A520|H410|H510|H310|H110|A620)$/i;
  const gates = {
    ram: x => (x.c.specs.capacityGb || 0) >= 16,
    ssd: x => (x.c.specs.capacityGb || 0) >= Math.min(480, wantSsd),
    cooling: x => (x.c.specs.tdpSupport || 0) >= info.cpuTdp,
    motherboard: x => !(info.cpuTdp > 95 && weakChip.test(String(x.c.specs.chipset || ''))),
    case: x => (x.c.specs.maxGpuLengthMm || 0) >= info.gpuLen,
    psu: x => (x.c.specs.wattage || 0) >= info.needW,
  };
  const better = {
    ram: (a, b) => (b.c.specs.capacityGb || 0) - (a.c.specs.capacityGb || 0)
      || parseInt(b.c.specs.freq) - parseInt(a.c.specs.freq) || b.price - a.price,
    ssd: (a, b) => (/NVMe/i.test(b.c.specs.interface || '') ? 1 : 0) - (/NVMe/i.test(a.c.specs.interface || '') ? 1 : 0)
      || (b.c.specs.capacityGb || 0) - (a.c.specs.capacityGb || 0) || b.price - a.price,
    cooling: (a, b) => (b.c.specs.tdpSupport || 0) - (a.c.specs.tdpSupport || 0) || b.price - a.price,
    motherboard: (a, b) => pcieRank(b.c.specs.pcie) - pcieRank(a.c.specs.pcie)
      || Math.abs((a.c.year || 2020) - cpuYear) - Math.abs((b.c.year || 2020) - cpuYear) || b.price - a.price,
    case: (a, b) => (b.c.year || 0) - (a.c.year || 0) || b.price - a.price,
    psu: (a, b) => certRank2(b.c.specs.certification) - certRank2(a.c.specs.certification)
      || (b.c.specs.wattage || 0) - (a.c.specs.wattage || 0) || b.price - a.price,
  };
  const order = [['ram', 0.30], ['ssd', 0.24], ['cooling', 0.12], ['motherboard', 0.26], ['case', 0.12], ['psu', 0.16]];
  let rest = left - base;
  order.forEach(([cat, share]) => {
    if (rest <= 300) return;
    const limit = chosen[cat].price + Math.min(rest * share * 1.8, rest);
    const cand = pools[cat]
      .filter(x => x.price <= limit && x.price > chosen[cat].price && gates[cat](x))
      .sort(better[cat])[0];
    if (cand) {
      rest -= cand.price - chosen[cat].price;
      chosen[cat] = cand;
    }
  });
  // память: если в лимит влезает 32 ГБ — берём 32 (для игр и работы это заметно лучше)
  const ram32 = pools.ram.filter(x => (x.c.specs.capacityGb || 0) >= 32 && x.price <= chosen.ram.price + Math.max(0, rest)).sort(better.ram)[0];
  if (ram32 && (profile.work >= 0.4 || profile.heavy || budget >= 90000)) {
    rest -= ram32.price - chosen.ram.price;
    chosen.ram = ram32;
  }

  const partsMap = {
    cpu: core.cpu.id, gpu: core.gpu.id,
    motherboard: chosen.motherboard.c.id, ram: chosen.ram.c.id, ssd: chosen.ssd.c.id,
    psu: chosen.psu.c.id, case: chosen.case.c.id, cooling: chosen.cooling.c.id,
  };
  const items = { cpu: core.cpu, gpu: core.gpu };
  ['motherboard', 'ram', 'ssd', 'psu', 'case', 'cooling'].forEach(cat => { items[cat] = chosen[cat].c; });
  let total = 0;
  CATEGORIES.forEach(c => { total += aiPrice(partsMap[c.id]) ?? items[c.id].basePrice ?? 0; });
  if ((byId(chosen.ram.c.id)?.specs?.capacityGb || 0) < 16) warn.push('память 8 ГБ — хватит для киберспорта и офиса, но для тяжёлых игр лучше добавить ещё планку');
  const fixed = aiRepair({ parts: partsMap, items, warn, total }, pools);
  return fixed;
}

// Чиним ошибки совместимости, которые могла дать «докрутка» (кулер не влезает в корпус и т.п.)
function aiRepair(res, pools) {
  const parts = { ...res.parts };
  const items = { ...res.items };
  const warn = [...(res.warn || [])];
  const priceOf = id => aiPrice(id) ?? (byId(id)?.basePrice ?? 0);
  for (let attempt = 0; attempt < 6; attempt++) {
    const c = checkCompatibility(parts);
    const errs = c.issues.filter(i => i.level === 'error');
    if (!errs.length) break;
    let fixedAny = false;
    errs.forEach(err => {
      const title = err.title || '';
      if (/Кулер не помещается|Охлаждение/i.test(title)) {
        // 1) более низкий кулер с нужным TDP
        const cpu = byId(parts.cpu);
        const cs = byId(parts.case);
        const maxH = cs?.specs?.maxCpuCoolerHeightMm || 999;
        const tdp = cpu?.specs?.tdp || 65;
        const alt = pools.cooling
          .filter(x => (x.c.specs.heightMm || 0) <= maxH && (x.c.specs.tdpSupport || 0) >= tdp)
          .filter(x => x.c.id !== parts.cooling)
          .sort((a, b) => b.c.specs.tdpSupport - a.c.specs.tdpSupport || a.price - b.price)[0];
        if (alt) { parts.cooling = alt.c.id; items.cooling = alt.c; fixedAny = true; return; }
        // 2) корпус повыше
        const needH = byId(parts.cooling)?.specs?.heightMm || 160;
        const taller = pools.case
          .filter(x => (x.c.specs.maxCpuCoolerHeightMm || 0) >= needH && (x.c.specs.maxGpuLengthMm || 0) >= (byId(parts.gpu)?.specs?.lengthMm || 300))
          .filter(x => x.c.id !== parts.case)
          .sort((a, b) => a.price - b.price)[0];
        if (taller) { parts.case = taller.c.id; items.case = taller.c; fixedAny = true; }
      } else if (/БП|блок питания|мощност/i.test(title)) {
        const alt = pools.psu.slice().sort((a, b) => (b.c.specs.wattage || 0) - (a.c.specs.wattage || 0))[0];
        if (alt && alt.c.id !== parts.psu) { parts.psu = alt.c.id; items.psu = alt.c; fixedAny = true; }
      } else if (/Тип памяти/i.test(title)) {
        const mb = byId(parts.motherboard);
        const want = String(mb?.specs?.ramType || '').replace(/\s*(ECC|REG)\b/g, '').trim();
        const alt = pools.ram.find(x => String(x.c.specs.type || '').startsWith(want) && x.c.id !== parts.ram);
        if (alt) { parts.ram = alt.c.id; items.ram = alt.c; fixedAny = true; }
      } else if (/Длина видеокарты|видеокарта не влезает/i.test(title)) {
        const needL = byId(parts.gpu)?.specs?.lengthMm || 300;
        const alt = pools.case.find(x => (x.c.specs.maxGpuLengthMm || 0) >= needL && x.c.id !== parts.case);
        if (alt) { parts.case = alt.c.id; items.case = alt.c; fixedAny = true; }
      } else if (/Сокет|сокет/i.test(title)) {
        const sock = byId(parts.cpu)?.specs?.socket || '';
        const alt = pools.motherboard.find(x => String(x.c.specs.socket || '').includes(sock) && x.c.id !== parts.motherboard);
        if (alt) { parts.motherboard = alt.c.id; items.motherboard = alt.c; fixedAny = true; }
      }
    });
    if (!fixedAny) break;
  }
  let total = 0;
  CATEGORIES.forEach(ct => { if (parts[ct.id]) total += priceOf(parts[ct.id]); });
  if (!checkCompatibility(parts).issues.some(i => i.level === 'error') === false) warn.push('остались замечания по совместимости — проверьте на странице «Совместимость»');
  return { parts, items, warn, total };
}
// «Разумная середина» — не самое дешёвое, но в рамках лимита
function aiPickNice(list, limit) {
  if (!list || !list.length) return null;
  const ok = list.filter(x => x.price <= limit);
  if (!ok.length) return null;
  return ok[Math.min(ok.length - 1, Math.floor(ok.length * 0.55))];
}

// ---------- Главный вход: подобрать сборку ----------
function aiBuildBuild() {
  initAiState();
  const budget = Math.max(5000, Math.min(3000000, Number(state.aiBudget) || 80000));
  const profile = aiProfile();
  const cands = aiChooseCandidates(budget, profile, 8);
  if (!cands.length) {
    return { ok: false, error: `Под такой бюджет (${fmt(budget)}) подобрать комплектующие не получилось. Увеличьте бюджет или выберите «только БУ» — старые платформы выходят заметно дешевле.`, profile, budget };
  }
  let best = null;
  const rejected = [];
  const ramTiers = [16, 8];
  for (const cand of cands) {
    let fitted = null, usedRam = 16;
    for (const minRam of ramTiers) {
      const f = aiFitRest(cand, budget, profile, minRam);
      if (f) { fitted = f; usedRam = minRam; break; }
    }
    if (!fitted) { rejected.push(cand); continue; }
    if (!fitted) { rejected.push(cand); continue; }
    const over = fitted.total / budget;
    if (over > 1.06) { rejected.push(cand); continue; }     // перебор — только если ничего не влезло
    const score = cand.score * (1 - Math.max(0, over - 1) * 4);
    const ramPenalty = usedRam >= 16 ? 1 : 0.88;      // 8 ГБ — вынужденный вариант
    const finalScore = score * ramPenalty;
    if (!best || finalScore > best.score) best = { ...cand, ...fitted, score: finalScore, usedRam };
  }
  if (!best) {
    // Ни один вариант не уложился — берём тот, что ближе всего к бюджету
    let fallback = null;
    rejected.forEach(cand => {
      const f = aiFitRest(cand, budget, profile);
      if (!f) return;
      if (!fallback || f.total < fallback.total) fallback = { ...cand, ...f };
    });
    if (fallback) best = { ...fallback, score: 0, warn: [...(fallback.warn || []), 'бюджет впритык — часть позиций минимальная, проверьте список'] };
  }
  if (!best) {
    return { ok: false, error: `Не хватило бюджета: даже самый доступный вариант обвязки не влезает в ${fmt(budget)}. Попробуйте «только БУ» или увеличьте бюджет на 3–5 тысяч.`, profile, budget };
  }
  const parts = best.parts;
  const compat = checkCompatibility(parts);
  const total = best.total;
  const fpsAvg = aiEstimateFps(parts.cpu, parts.gpu, profile);
  const perGame = (profile.gameIds.length ? profile.gameIds : GAMES.map(g => g.id)).map(id => ({ id, fps: estimateFps(parts.cpu, parts.gpu, parts.ram, id, profile.res) }));
  const power = (byId(parts.cpu)?.power || 0) + (byId(parts.gpu)?.power || 0) + 90;
  const usedCount = CATEGORIES.filter(c => (minPrice(parts[c.id], state.region, 'used') ?? Infinity) < (minPrice(parts[c.id], state.region, 'new') ?? Infinity)).length;
  return {
    ok: true, budget, profile, parts, items: best.items, warn: best.warn,
    total, compat, fpsAvg, perGame, power,
    over: total > budget, overBy: Math.max(0, total - budget),
    usedCount,
    title: aiBuildTitle(profile, total),
  };
}
function laptopsReady() { return typeof LAPTOPS !== 'undefined' && Array.isArray(LAPTOPS) && LAPTOPS.length > 0; }

// ---------- Сравнение: ПК или ноутбук ----------
// Считаем и сборку ПК, и ноутбук под те же условия, и показываем, что выгоднее.
function aiCompareDevices(budget, profile) {
  const pc = aiBuildBuild();
  const laptop = (typeof aiPickLaptop === 'function') ? aiPickLaptop(budget, profile) : null;
  if (!pc.ok && !laptop) return null;
  const pcFps = pc.ok ? pc.fpsAvg : 0;
  const lapFps = laptop ? laptop.fps : 0;
  const pcPrice = pc.ok ? pc.total : Infinity;
  const lapPrice = laptop ? laptop.price : Infinity;
  const pcValue = pcFps ? pcPrice / pcFps : Infinity;      // ₽ за 1 FPS
  const lapValue = lapFps ? lapPrice / lapFps : Infinity;
  let winner = 'none';
  if (pc.ok && laptop) {
    const pcBetter = (pcFps >= profile.target && lapFps < profile.target) ? true
      : (lapFps >= profile.target && pcFps < profile.target) ? false
      : pcValue <= lapValue * 0.95 ? true : lapValue <= pcValue * 0.95 ? false : pcPrice <= lapPrice;
    winner = pcBetter ? 'pc' : 'laptop';
  } else if (pc.ok) winner = 'pc';
  else if (laptop) winner = 'laptop';

  // Честное сравнение: самый дешёвый ПК, который добивает тот же FPS (и наоборот)
  const target = Math.max(Math.round(Math.min(pcFps || Infinity, lapFps || Infinity)), 1) || profile.target;
  const cheapPc = (pc.ok && laptop && typeof aiCheapestPc === 'function') ? aiCheapestPc(profile, Math.max(lapFps, 1), budget * 2) : null;
  const cheapLap = (typeof aiCheapestLaptop === 'function' && pcFps) ? aiCheapestLaptop(profile, Math.max(pcFps, 1), budget * 2) : null;
  const lapNew = laptop ? laptop.priceNew : null;
  const sameFps = (() => {
    if (cheapPc && cheapLap) {
      return cheapPc.total <= cheapLap.price ? 'pc' : 'laptop';
    }
    if (cheapPc) return 'pc';
    if (cheapLap) return 'laptop';
    return null;
  })();
  const saving = (() => {
    if (cheapPc && cheapLap) return Math.abs(cheapPc.total - cheapLap.price);
    return 0;
  })();
  return { pc, laptop, pcFps, lapFps, pcPrice, lapPrice, pcValue, lapValue, winner, cheapPc, cheapLap, sameFps, saving, lapNew };
}

// Блок «ПК или ноутбук» в результате
// В ИИ-результате: кнопки «сделать дешевле / быстрее» прямо на месте
function aiSwapSuggestHtml() {
  const res = state.aiResult;
  if (!res || !res.parts) return '';
  const build = { parts: res.parts };
  const total = buildPrice(build, state.region, 'new').total;
  const fps = res.fpsAvg || 0;
  const sameCheaper = typeof aiBuildBuild === 'function' ? null : null;
  const rows = [];
  // дешевле: пробуем срезать 15% бюджета и пересобрать
  const cheapBudget = Math.round(res.budget * 0.85);
  const cheap = aiBuildBuildFor(cheapBudget, res.profile);
  if (cheap && cheap.total < total - 1500) rows.push({ kind: 'cheaper', budget: cheapBudget, r: cheap, delta: cheap.total - total, fps: cheap.fpsAvg });
  // быстрее: +20% бюджета
  const fastBudget = Math.round(res.budget * 1.2);
  const fast = aiBuildBuildFor(fastBudget, res.profile);
  if (fast && fast.fpsAvg > fps + 2) rows.push({ kind: 'faster', budget: fastBudget, r: fast, delta: fast.total - total, fps: fast.fpsAvg });
  if (!rows.length) return '';
  return `<div class="swap-box mini">
    <div class="swap-head"><b>🔁 Одним кликом: дешевле или быстрее</b>
      <div class="small muted">Пересобираем под другой бюджет, сохраняя профиль (игры, разрешение, город).</div></div>
    <div class="swap-cols">
      ${rows.map(x => `<div class="swap-col ${x.kind === 'cheaper' ? 'cheap' : 'fast'}">
        <div class="swap-col-head">${x.kind === 'cheaper' ? '💸 Удешевить' : '🚀 Ускорить'} <span class="small muted">· бюджет ${fmt(x.budget)}</span></div>
        <div class="swap-card">
          <div class="swap-deltas">
            <span class="swap-badge ${x.delta < 0 ? 'pos' : 'neutral'}">${x.delta < 0 ? '−' : '+'}${fmt(Math.abs(x.delta))}</span>
            <span class="swap-badge ${x.fps > fps ? 'pos' : 'neg'}">${x.fps > fps ? '+' : ''}${x.fps - fps} FPS</span>
            <span class="swap-badge neutral">итого ${fmt(x.r.total)}</span>
          </div>
          <div class="small muted">${esc(byId(x.r.parts.cpu)?.name || '')} + ${esc(byId(x.r.parts.gpu)?.name || '')}</div>
          <button class="btn small ${x.kind === 'cheaper' ? 'ghost' : 'lime'}" style="margin-top:8px" onclick="aiApplyBudget(${x.budget})">Пересобрать за ${fmt(x.budget)}</button>
        </div>
      </div>`).join('')}
    </div>
  </div>`;
}
// Пересборка под другой бюджет без изменения профиля
function aiBuildBuildFor(budget, profile) {
  const saveBudget = state.aiBudget;
  state.aiBudget = budget;
  try {
    const r = aiBuildBuild();
    return r && r.ok ? r : null;
  } catch (e) { return null; }
  finally { state.aiBudget = saveBudget; }
}
function aiApplyBudget(budget) {
  state.aiBudget = budget;
  saveAiConfig();
  aiGenerate();
  toast(`Пересобрано под ${fmt(budget)}`);
}

function aiDeviceDuelHtml(cmp) {
  if (!cmp) return '';
  const p = priorityInfoSafe();
  const row = (title, icon, price, fps, value, extra, isWin) => `<div class="duel-card ${isWin ? 'win' : ''}">
    <div class="duel-card-head">${icon} <b>${esc(title)}</b>${isWin ? ' <span class="win-badge">🏆 выгоднее</span>' : ''}</div>
    <div class="duel-card-price">${isFinite(price) ? fmt(price) : '—'}</div>
    <div class="small muted">${fps ? `${fps} FPS · ${Math.round(value)} ₽ за 1 FPS` : 'нет варианта'}</div>
    ${extra ? `<div class="duel-card-extra">${extra}</div>` : ''}
  </div>`;
  const pcExtra = cmp.pc.ok ? `Сборка на ${byId(cmp.pc.parts.cpu)?.name || ''} + ${byId(cmp.pc.parts.gpu)?.name || ''}` : '';
  const lapExtra = cmp.laptop ? `${esc(cmp.laptop.l.name)} · ${esc(cmp.laptop.l.cpu)} + ${esc(cmp.laptop.l.gpu)}` : '';
  const diffText = (cmp.pc.ok && cmp.laptop)
    ? (cmp.winner === 'pc'
      ? `ПК дешевле на ${fmt(Math.max(0, cmp.lapPrice - cmp.pcPrice))} при ${cmp.pcFps} FPS против ${cmp.lapFps} FPS — и его можно апгрейдить по частям.`
      : `Ноутбук выгоднее: ${fmt(cmp.lapPrice)} против ${fmt(cmp.pcPrice)} за тот же уровень (${cmp.lapFps} против ${cmp.pcFps} FPS) — и его можно носить с собой.`)
    : '';
  return `<div class="duel-block">
    <div class="duel-block-head">🖥️ ПК или 💻 ноутбук — что дешевле под ваши задачи</div>
    <div class="duel-cards">
      ${row('Собрать ПК', '🧩', cmp.pcPrice, cmp.pcFps, cmp.pcValue, pcExtra, cmp.winner === 'pc')}
      ${row('Купить ноутбук', '💻', cmp.lapPrice, cmp.lapFps, cmp.lapValue, lapExtra, cmp.winner === 'laptop')}
    </div>
    ${diffText ? `<div class="duel-note small">${diffText}</div>` : ''}
    ${(cmp.cheapPc || cmp.cheapLap) ? `<div class="duel-note small">
      ${(cmp.cheapPc && cmp.cheapLap) ? `<b>Честно, за тот же FPS:</b> чтобы получить столько же кадров, ПК обойдётся в ${fmt(cmp.cheapPc.total)} (${cmp.cheapPc.fps} FPS), а ноутбук — в ${fmt(cmp.cheapLap.price)} (${cmp.cheapLap.fps} FPS).
        ${cmp.sameFps === 'pc'
          ? `ПК дешевле на ${fmt(cmp.saving)} — но ноутбук можно носить с собой.`
          : `Ноутбук дешевле на ${fmt(cmp.saving)} — сборка ПК под этот FPS выходит дороже.`}`
      : cmp.cheapPc
        ? `<b>Честно, за тот же FPS:</b> столько же кадров на ПК даёт сборка за ${fmt(cmp.cheapPc.total)} (${cmp.cheapPc.fps} FPS). Ноутбука такой производительности в продаже нет — это верхняя граница для мобильных чипов.`
        : `<b>Честно, за тот же FPS:</b> ${fmt(cmp.cheapLap.price)} — самый дешёвый ноутбук, который вытягивает ${cmp.cheapLap.fps} FPS.`}
    </div>` : ''}
    ${cmp.laptop && cmp.laptop.altCheaper ? `<div class="small muted">Дешевле под цель: ${esc(cmp.laptop.altCheaper.l.name)} за ${fmt(cmp.laptop.altCheaper.price)} (${cmp.laptop.altCheaper.fps} FPS).</div>` : ''}
    ${cmp.cheapPc ? `<div class="cheap-pc">
      <div class="cheap-pc-head">💸 Самый дешёвый ПК под ваш FPS: <b>${fmt(cmp.cheapPc.total)}</b> <span class="small muted">· ${cmp.cheapPc.fps} FPS</span></div>
      <div class="small muted">${byId(cmp.cheapPc.parts.cpu)?.name || ''} + ${byId(cmp.cheapPc.parts.gpu)?.name || ''} · плата ${byId(cmp.cheapPc.parts.motherboard)?.name || ''} · ${byId(cmp.cheapPc.parts.ram)?.specs?.capacityGb || ''} ГБ ${byId(cmp.cheapPc.parts.ram)?.specs?.type || ''}</div>
      <button class="btn small lime" style="margin-top:8px" onclick="loadCheapPc()">🧩 Открыть этот ПК в конструкторе</button>
    </div>` : ''}
    ${cmp.laptop ? `<div class="ai-actions" style="margin-top:10px">
      <button class="btn small" onclick="loadLaptopToBuilder('${cmp.laptop.l.id}')">💻 Открыть ноутбук</button>
      <button class="btn small ghost" onclick="navigate('laptops');openLaptop('${cmp.laptop.l.id}')">Все характеристики</button>
    </div>` : ''}
  </div>`;
}
function priorityInfoSafe() { return typeof priorityInfo === 'function' ? priorityInfo() : null; }

// Карточка рекомендованного ноутбука
function aiLaptopResultHtml(lap, profile) {
  if (!lap) return '';
  const p = priorityInfoSafe();
  return `<div class="ai-laptop">
    <div class="ai-laptop-head">💻 Рекомендуемый ноутбук</div>
    <div class="ai-laptop-main">
      <div>
        <b>${esc(lap.l.name)}</b> <span class="muted small">· ${esc(lap.l.brand)} · ${lap.l.year} · ${laptopBadge(lap.l)}</span>
        <div class="small muted">${esc(lap.l.cpu)} · ${esc(lap.l.gpu)}${lap.l.vramGb ? ' ' + lap.l.vramGb + ' ГБ' : ''} · ${lap.l.ramGb} ГБ ${esc(lap.l.ramType)} · ${lap.l.storageGb >= 1000 ? (lap.l.storageGb / 1000) + ' ТБ' : lap.l.storageGb + ' ГБ'} ${esc(lap.l.storageType)} · ${lap.l.screen}" ${esc(lap.l.resolution)} ${lap.l.hz} Гц · ${lap.l.weight} кг</div>
        <div class="small">${lap.fps} FPS в среднем ${p && p.kind !== 'all' ? 'в «' + esc(p.name) + '»' : 'по играм'} (${esc((p && p.res) || '1080p')}) · ${Math.round(lap.price / Math.max(lap.fps, 1))} ₽ за 1 FPS · ${lap.enough ? '<span class="pos">цель по FPS достигнута</span>' : '<span class="neg">цель по FPS не достигнута</span>'}</div>
      </div>
      <div class="ai-laptop-price">${fmt(lap.price)}<div class="small muted">${lap.priceNew && lap.price < lap.priceNew ? 'БУ, новый ' + fmt(lap.priceNew) : 'новый'}</div></div>
    </div>
    <div class="ai-actions" style="margin-top:10px">
      <button class="btn small" onclick="navigate('laptops');openLaptop('${lap.l.id}')">Подробнее</button>
      <button class="btn small ghost" onclick="compareLaptopWithPc('${lap.l.id}')">Сравнить с ПК за эти деньги</button>
    </div>
  </div>`;
}
function loadCheapPc() {
  const cmp = state.aiCompare;
  if (!cmp || !cmp.cheapPc || !cmp.cheapPc.parts) { toast('Сначала подберите сборку'); return; }
  state.builder = { ...cmp.cheapPc.parts };
  navigate('builder');
  toast(`В конструкторе — ПК за ${fmt(cmp.cheapPc.total)}`);
}
function loadLaptopToBuilder(id) { if (typeof openLaptop === 'function') { navigate('laptops'); openLaptop(id); } }

function aiBuildTitle(profile, total) {
  const task = AI_TASKS[aiCfg().aiTask] || AI_TASKS.gaming;
  if (profile.mode === 'games') return `${task.icon} ${profile.games[0].name}${profile.games.length > 1 ? ' и др.' : ''} · ${fmt(total)}`;
  if (profile.mode === 'unknown') return `${task.icon} Под «${profile.label}» · ${fmt(total)}`;
  return `${task.icon} ${task.name} · ${fmt(total)}`;
}

// ---------- Объяснение выбора (как «ответ ИИ») ----------
function aiExplain(res) {
  const cfg = aiCfg();
  const p = res.profile;
  const city = regionById(cfg.region).name;
  const condName = cfg.aiCondition === 'new' ? 'новые' : cfg.aiCondition === 'used' ? 'БУ (Avito и др.)' : 'новые и БУ';
  const lines = [];
  lines.push(`Собрал конфигурацию под бюджет ${fmt(res.budget)} для города ${city} (цены: ${condName}).`);
  if (p.mode === 'games') lines.push(`Игры: ${p.games.map(g => g.name).join(', ')}. Разрешение ${p.res}, целевые ${p.target} FPS.`);
  else if (p.mode === 'unknown') lines.push(`Запрос «${p.label}» — подобрал универсальную конфигурацию с запасом по производительности.`);
  else lines.push(`Задача: ${(AI_TASKS[cfg.aiTask] || AI_TASKS.gaming).name.toLowerCase()}, разрешение ${p.res}.`);
  lines.push(`Итог: ${fmt(res.total)} — ${res.over ? `на ${fmt(res.total - res.budget)} выше бюджета` : `осталось ${fmt(res.budget - res.total)} в запасе`}.`);
  const cmp = state.aiCompare;
  if (cmp && cmp.laptop) {
    lines.push(cmp.winner === 'laptop'
      ? `Ноутбук выгоднее: ${esc(cmp.laptop.l.name)} за ${fmt(cmp.lapPrice)} даёт ${cmp.lapFps} FPS против ${cmp.pcFps} у сборки.`
      : `Сборка ПК выгоднее: ${cmp.pcFps} FPS за ${fmt(cmp.pcPrice)} против ${cmp.lapFps} FPS у ноутбука ${esc(cmp.laptop.l.name)} за ${fmt(cmp.lapPrice)}.`);
    if (cmp.cheapPc) lines.push(`Если нужен только результат по кадрам — самый дешёвый ПК под эти задачи стоит ${fmt(cmp.cheapPc.total)}.`);
  }
  return lines;
}
function aiPartWhy(cat, part, res) {
  const p = res.profile;
  const s = part.specs || {};
  switch (cat) {
    case 'cpu':
      if (cat === 'cpu' && (p.mode === 'games')) return `${s.cores} ядер / ${s.threads} потоков — хватает, чтобы не тормозить в ${p.games[0] ? p.games[0].name : 'играх'} и спокойно работать в фоне.`;
      return `${s.cores} ядер / ${s.threads} потоков — основной упор на рабочие задачи.`;
    case 'gpu':
      return `${s.vram || s.vramGb + ' ГБ'} памяти, ~${res.fpsAvg} FPS в среднем по выбранным играм (${p.res}).`;
    case 'motherboard':
      return `Сокет ${s.socket}, чипсет ${s.chipset}, ${s.formFactor} — встаёт процессор и хватает слотов.`;
    case 'ram':
      return `${s.capacityGb} ГБ ${s.type} ${s.freq || ''} — ${s.capacityGb >= 32 ? 'с запасом для игр и работы' : 'достаточно для игр и повседневных задач'}.`;
    case 'ssd':
      return `${s.type} ${s.capacityGb} ГБ, ${s.interface} — система и игры грузятся быстро.`;
    case 'psu':
      return `${s.wattage} Вт (${s.certification}) — с запасом под пик ${res.power} Вт.`;
    case 'case':
      return `${s.motherboardSupport}; вмещает видеокарту до ${s.maxGpuLengthMm} мм.`;
    case 'cooling':
      return `${s.type}, до ${s.tdpSupport} Вт — тише и холоднее стокового кулера.`;
    default:
      return '';
  }
}

// ---------- Действия ----------
function aiSet(field, value) { state[field] = value; saveAiConfig(); }
function aiSetBudget(v) { const n = Math.max(0, Math.min(3000000, Math.round(Number(v) || 0))); state.aiBudget = n; saveAiConfig(); }
function aiSetTask(v) { state.aiTask = AI_TASKS[v] ? v : 'gaming'; saveAiConfig(); render(); }
function aiSetRes(v) { state.aiRes = AI_RES[v] ? v : 'default'; saveAiConfig(); render(); }
function aiSetDevice(v) { state.aiDevice = ['auto', 'pc', 'laptop'].includes(v) ? v : 'auto'; saveAiConfig(); render(); }
function aiSetCondition(v) { state.aiCondition = ['new', 'used', 'any'].includes(v) ? v : 'new'; saveAiConfig(); render(); }
function aiSetGameQuery(v) { state.aiGameQuery = String(v || '').slice(0, 120); saveAiConfig(); }
function aiSetCity(id) { if (!cityById(id)) return; state.region = id; saveAiConfig(); render(); }

function aiGenerate() {
  initAiState();
  if (!state.aiBudget || state.aiBudget < 8000) { toast('Укажите бюджет — хотя бы 8 000 ₽'); return; }
  // режим «ноутбук»: ПК не собираем, только подбираем ноутбук
  if (state.aiDevice === 'laptop') {
    const profile = aiProfile();
    const laptop = (typeof aiPickLaptop === 'function') ? aiPickLaptop(Math.max(8000, Number(state.aiBudget)), profile) : null;
    state.aiResult = null;
    state.aiCompare = null;
    state.aiLaptop = laptop;
    state.aiError = laptop ? '' : `Под бюджет ${fmt(state.aiBudget)} ноутбук не нашёлся — увеличьте бюджет или выберите «только БУ».`;
    state.aiPrompt = '';
    saveAiConfig();
    render();
    if (laptop) toast(`Ноутбук найден: ${fmt(laptop.price)}`);
    return;
  }
  const res = aiBuildBuild();
  state.aiResult = res.ok ? res : null;
  state.aiError = res.ok ? '' : res.error;
  // сравнение ПК и ноутбука
  if (res.ok) {
    state.aiCompare = (state.aiDevice === 'auto' && typeof laptopsReady === 'function' && laptopsReady())
      ? aiCompareDevices(res.budget, res.profile) : null;
    state.aiLaptop = state.aiCompare && state.aiCompare.laptop ? state.aiCompare.laptop : null;
  } else {
    state.aiCompare = null;
    state.aiLaptop = null;
  }
  // приоритетная игра на сайте подстраивается под запрос (сборки/конструктор будут считать то же самое)
  if (res.ok && res.profile.mode === 'games' && res.profile.games.length === 1 && typeof savePriority === 'function') {
    state.priorityGame = res.profile.games[0].id;
    state.priorityRes = res.profile.res;
    state.priorityTarget = res.profile.target;
    savePriority();
  }
  saveAiConfig();
  render();
  if (res.ok) toast(`Сборка готова: ${fmt(res.total)}`);
}

function aiToBuilder() {
  initAiState();
  if (!state.aiResult || !state.aiResult.parts) return;
  state.builder = { ...state.aiResult.parts };
  navigate('builder');
  toast('Сборка открыта в конструкторе');
}
function aiSave() {
  initAiState();
  const res = state.aiResult;
  if (!res || !res.parts) return;
  const item = {
    id: 'ai' + Date.now().toString(36), kind: 'pc',
    name: state.aiName || res.title.replace(/^[^\w]+\s*/, ''),
    note: `ИИ-подбор: ${res.profile.mode === 'games' ? res.profile.games.map(g => g.name).join(', ') : (AI_TASKS[state.aiTask] || AI_TASKS.gaming).name} · бюджет ${fmt(res.budget)} · ${regionById(state.region).name}`,
    created: new Date().toISOString(), parts: { ...res.parts }, pcOs: '',
  };
  const list = loadSavedBuilds();
  list.unshift(item);
  if (writeSavedBuilds(list)) {
    state.savedFilter = 'pc';
    toast(`Сборка сохранена в «Мои сборки»`);
    navigate('saved');
  }
}
function aiPromptText() {
  initAiState();
  const res = state.aiResult;
  const p = aiProfile();
  const city = regionById(state.region).name;
  const cond = state.aiCondition === 'new' ? 'новые' : state.aiCondition === 'used' ? 'б/у' : 'новые и б/у';
  const what = p.mode === 'games' ? `игры: ${p.games.map(g => g.name).join(', ')}` : p.mode === 'unknown' ? `задачи: ${p.label}` : `задачи: ${(AI_TASKS[state.aiTask] || AI_TASKS.gaming).name}`;
  const lines = [
    `Ты — эксперт по сборке ПК в России. Город: ${city}. Бюджет: ${res ? fmt(res.budget) : fmt(state.aiBudget)} (${cond}).`,
    `Использование: ${what}. Разрешение ${p.res}, ориентир ${p.target} FPS.`,
  ];
  if (res && res.parts) {
    lines.push('Мой вариант сборки (подобранный на сайте BLF по минимальным ценам города):');
    CATEGORIES.forEach(c => {
      const part = byId(res.parts[c.id]);
      if (part) lines.push(`- ${c.name}: ${part.name} — ${fmt(aiPrice(part.id) ?? part.basePrice)}`);
    });
    lines.push(`Итого: ${fmt(res.total)}.`);
    const issues = (res.compat.issues || []).filter(i => i.level !== 'ok').map(i => i.title);
    if (issues.length) lines.push(`Замечания по совместимости: ${issues.join('; ')}.`);
    if (state.aiCompare && state.aiCompare.laptop) {
      const c = state.aiCompare;
      lines.push(`Альтернатива: ноутбук ${c.laptop.l.name} за ${fmt(c.lapPrice)} — ${c.lapFps} FPS; ПК — ${c.pcFps} FPS за ${fmt(c.pcPrice)}.`);
    }
    lines.push('Проверь совместимость и узкие места. Скажи, что улучшить в рамках бюджета, на чём сэкономить без потери FPS и стоит ли брать ноутбук вместо этой сборки.');
  } else {
    lines.push('Предложи 2–3 варианта сборки под эти условия с ценами на комплектующие в России и объясни выбор.');
  }
  return lines.join('\n');
}

function aiAskDeepSeek() {
  const prompt = aiPromptText();
  state.aiPrompt = prompt;
  try { navigator.clipboard.writeText(prompt); toast('Запрос скопирован — вставьте его в чат DeepSeek'); } catch (e) { toast('Запрос готов — скопируйте его вручную'); }
  if (typeof window !== 'undefined' && window.open) window.open('https://chat.deepseek.com/', '_blank', 'noopener');
  render();
  return prompt;
}

// ---------- Прямой запрос к DeepSeek API (если пользователь вставил свой ключ) ----------
function aiSetKey(v) { state.aiKey = String(v || '').trim().slice(0, 200); saveAiConfig(); }
function aiSetModel(v) { state.aiModel = ['deepseek-chat', 'deepseek-reasoner'].includes(v) ? v : 'deepseek-chat'; saveAiConfig(); }
async function aiDeepSeekAsk() {
  initAiState();
  const key = (state.aiKey || '').trim();
  const prompt = aiPromptText();
  state.aiPrompt = prompt;
  if (!key) {
    state.aiAnswerErr = 'Нужен ключ DeepSeek API: получите его на platform.deepseek.com → API keys и вставьте в поле выше. Без ключа можно скопировать готовый запрос и открыть чат.';
    render();
    return;
  }
  if (typeof fetch !== 'function') { state.aiAnswerErr = 'Браузер не поддерживает сетевые запросы — скопируйте запрос и откройте чат DeepSeek.'; render(); return; }
  state.aiBusy = true; state.aiAnswer = ''; state.aiAnswerErr = '';
  render();
  try {
    const resp = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
      body: JSON.stringify({
        model: state.aiModel || 'deepseek-chat',
        messages: [
          { role: 'system', content: 'Ты — инженер-консультант по сборке ПК для российского рынка. Отвечай по-русски, кратко и по делу: совместимость, узкие места, что менять в рамках бюджета.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1400,
      }),
    });
    if (!resp.ok) throw new Error('HTTP ' + resp.status + (resp.status === 401 ? ' — проверьте ключ' : ''));
    const data = await resp.json();
    const answer = data?.choices?.[0]?.message?.content || '';
    if (!answer) throw new Error('пустой ответ');
    state.aiAnswer = answer;
  } catch (e) {
    state.aiAnswerErr = `Не удалось получить ответ от DeepSeek (${e.message}). Если браузер блокирует запрос (CORS) — скопируйте запрос и откройте chat.deepseek.com: там тот же текст.
Запрос уже подготовлен кнопкой «Скопировать запрос и открыть чат».`;
  }
  state.aiBusy = false;
  saveAiConfig();
  render();
}

// Мини-разметка ответа: **жирный**, `код`, списки и переводы строк
function aiFormatAnswer(text) {
  const safe = esc(text);
  return safe
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .split(/\n{2,}/)
    .map(par => `<p>${par.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function aiDeepSeekBlock(home) {
  const key = state.aiKey || '';
  return `<div class="ai-ds">
    <div class="ai-ds-head">
      <b>💬 DeepSeek</b>
      <span class="small muted">чат-помощник: проверит сборку и предложит альтернативы</span>
    </div>
    <div class="ai-ds-row">
      <button class="btn small" onclick="aiAskDeepSeek()">Скопировать запрос и открыть чат</button>
      <a class="btn small ghost" href="https://chat.deepseek.com/" target="_blank" rel="noopener">Открыть chat.deepseek.com ↗</a>
      <button class="btn small ghost" onclick="aiDeepSeekAsk()" ${state.aiBusy ? 'disabled' : ''}>${state.aiBusy ? 'DeepSeek думает…' : 'Спросить напрямую (по API-ключу)'}</button>
    </div>
    ${home ? '' : `<details class="ai-ds-key" ${key ? 'open' : ''}>
      <summary class="small muted">Подключить DeepSeek API — ответ появится прямо на странице</summary>
      <div class="ai-ds-key-row">
        <input type="password" placeholder="sk-… ключ DeepSeek API" value="${esc(key)}" oninput="aiSetKey(this.value)" autocomplete="off">
        <select onchange="aiSetModel(this.value)">
          <option value="deepseek-chat" ${(state.aiModel || 'deepseek-chat') === 'deepseek-chat' ? 'selected' : ''}>deepseek-chat</option>
          <option value="deepseek-reasoner" ${state.aiModel === 'deepseek-reasoner' ? 'selected' : ''}>deepseek-reasoner</option>
        </select>
        <button class="btn small" onclick="aiDeepSeekAsk()">Спросить</button>
      </div>
      <div class="small muted">Ключ хранится только в вашем браузере и отправляется напрямую на api.deepseek.com. Получить ключ: <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener">platform.deepseek.com</a>. Если браузер заблокирует запрос (CORS), используйте кнопку «скопировать запрос и открыть чат».</div>
    </details>`}
    ${state.aiAnswerErr ? `<div class="ai-warn">${esc(state.aiAnswerErr)}</div>` : ''}
    ${state.aiAnswer ? `<div class="ai-answer"><div class="ai-answer-head small muted">Ответ DeepSeek</div>${aiFormatAnswer(state.aiAnswer)}</div>` : ''}
    ${state.aiPrompt && !state.aiAnswer ? `<details class="ai-prompt"><summary class="small muted">Показать запрос, который уйдёт в DeepSeek</summary><pre>${esc(state.aiPrompt)}</pre></details>` : ''}
  </div>`;
}

// ---------- Рендер страницы ----------
function aiControlsHtml() {
  initAiState();
  const cfg = state;
  return `<div class="ai-form">
    <div class="ai-field">
      <label>💰 Бюджет, ₽</label>
      <input type="number" min="8000" step="1000" value="${cfg.aiBudget || ''}" oninput="aiSetBudget(this.value)" placeholder="80000">
      <div class="ai-presets">${[30000, 50000, 80000, 120000, 200000].map(v => `<button class="chip ${Number(cfg.aiBudget) === v ? 'active' : ''}" onclick="aiSetBudget(${v});render()">${v.toLocaleString('ru-RU')}</button>`).join('')}</div>
    </div>
    <div class="ai-field">
      <label>📍 Город</label>
      <select onchange="aiSetCity(this.value)">
        ${MAIN_CITY_IDS.map(id => cityById(id)).filter(Boolean).map(c => `<option value="${c.id}" ${cfg.region === c.id ? 'selected' : ''}>${c.icon} ${esc(c.name)}</option>`).join('')}
        <option value="${cfg.region}" ${MAIN_CITY_IDS.includes(cfg.region) ? '' : 'selected'}>${esc(regionById(cfg.region).name)}</option>
      </select>
      <button class="btn small ghost" onclick="openRegionModal()">Все ${CITIES.length} городов</button>
      <div class="small muted">цены пересчитываются под выбранный город</div>
    </div>
    <div class="ai-field wide">
      <label>🎮 Во что хотите играть / для каких задач ПК</label>
      <input value="${esc(cfg.aiGameQuery || '')}" oninput="aiSetGameQuery(this.value)" placeholder="например: Cyberpunk 2077 и Dota 2, монтаж видео 4K, учёба, стрим">
      <div class="ai-chips">
        ${['cs2', 'dota2', 'valorant', 'fortnite', 'cyberpunk', 'gta5', 'rust'].map(id => { const g = GAMES.find(x => x.id === id); return g ? `<button class="chip" onclick="aiSetGameQuery('${esc(g.name)}');render()">${gameIcon(g)} ${esc(g.name)}</button>` : ''; }).join('')}
        ${['монтаж видео', '3D и рендер', 'стрим', 'учёба и офис', 'программирование', 'нейросети'].map(t => `<button class="chip" onclick="aiSetGameQuery('${esc(t)}');render()">${esc(t)}</button>`).join('')}
      </div>
    </div>
    <div class="ai-field">
      <label>🖥️ Разрешение и цель</label>
      <select onchange="aiSetRes(this.value)">
        ${Object.entries(AI_RES).map(([id, r]) => `<option value="${id}" ${cfg.aiRes === id ? 'selected' : ''}>${esc(r.name)}</option>`).join('')}
      </select>
    </div>
    <div class="ai-field">
      <label>🧰 Что собираем</label>
      <select onchange="aiSetDevice(this.value)">
        <option value="auto" ${cfg.aiDevice === 'auto' ? 'selected' : ''}>Сравнить ПК и ноутбук — что дешевле</option>
        <option value="pc" ${cfg.aiDevice === 'pc' ? 'selected' : ''}>Только ПК (сборка)</option>
        <option value="laptop" ${cfg.aiDevice === 'laptop' ? 'selected' : ''}>Только ноутбук</option>
      </select>
    </div>
    <div class="ai-field">
      <label>🛒 Что покупать</label>
      <select onchange="aiSetCondition(this.value)">
        <option value="new" ${cfg.aiCondition === 'new' ? 'selected' : ''}>Только новое</option>
        <option value="used" ${cfg.aiCondition === 'used' ? 'selected' : ''}>Только БУ (Avito, Юла)</option>
        <option value="any" ${cfg.aiCondition === 'any' ? 'selected' : ''}>Выбирать выгоднее (новое + БУ)</option>
      </select>
    </div>
    <div class="ai-actions">
      <button class="btn lime" onclick="aiGenerate()">🤖 Подобрать сборку</button>
      <button class="btn ghost" onclick="navigate('home');setTimeout(openRegionModal,120)">📍 Сменить город</button>
    </div>
  </div>`;
}

function aiResultHtml() {
  initAiState();
  const res = state.aiResult;
  if (state.aiError) {
    return `<div class="empty">⚠️ ${esc(state.aiError)}</div>`;
  }
  if (!res || !res.parts) {
    return `<div class="empty">Заполните бюджет, город и во что хотите играть — нажмите «Подобрать сборку».<br>
      <span class="small muted">Подбор идёт по всему каталогу (${COMPONENTS.length} комплектующих), с проверкой совместимости и расчётом FPS.</span>
      ${aiDeepSeekBlock(false)}</div>`;
  }
  const p = res.profile;
  const city = regionById(state.region).name;
  const compatIcon = res.compat.status === 'ok' ? '✅' : res.compat.status === 'warn' ? '⚠️' : '❌';
  const compatText = res.compat.status === 'ok' ? 'всё совместимо' : res.compat.issues.filter(i => i.level !== 'ok').map(i => i.title).join(' · ');
  const explain = aiExplain(res);
  return `<div class="ai-result">
    <div class="ai-head">
      <div>
        <div class="ai-title">${esc(res.title)}</div>
        <div class="small muted">${esc(city)} · ${esc(p.res)} · ${p.mode === 'games' ? 'цель ' + p.target + ' FPS' : 'универсальный профиль'}</div>
      </div>
      <div class="ai-score">
        <div><b>${res.fpsAvg}</b> <span class="small muted">FPS в среднем</span></div>
        <div><b>${Math.round(res.total / Math.max(res.fpsAvg, 1))}</b> <span class="small muted">₽ за 1 FPS</span></div>
        <div><b>${res.power}</b> <span class="small muted">Вт потребление</span></div>
      </div>
    </div>
    <div class="ai-chat">
      <div class="ai-msg"><span class="ai-avatar">🤖</span><div>
        ${explain.map(l => `<div>${esc(l)}</div>`).join('')}
        <div class="${res.compat.status} small" style="margin-top:6px">${compatIcon} Совместимость: ${esc(compatText)}</div>
      </div></div>
    </div>
    <div class="ai-parts">
      ${CATEGORIES.map(c => {
        const part = res.items[c.id];
        if (!part) return '';
        const price = aiPrice(part.id) ?? part.basePrice;
        const usedP = minPrice(part.id, state.region, 'used');
        return `<div class="ai-part">
          <div class="ai-part-icon">${c.icon}</div>
          <div class="ai-part-main">
            <div class="small muted">${c.name}</div>
            <b>${esc(part.name)}</b>
            <div class="small muted">${esc(aiPartWhy(c.id, part, res))}</div>
          </div>
          <div class="ai-part-price">${fmt(price)}${state.aiCondition !== 'new' && usedP && usedP < price ? `<div class="small" style="color:#fda4af">БУ от ${fmt(usedP)}</div>` : ''}
            <div><button class="btn small ghost" onclick="goPriceId('${part.id}')">Цены →</button></div>
          </div>
        </div>`;
      }).join('')}
    </div>
    <div class="ai-total ${res.over ? 'over' : ''}">
      <span>Итого по минимальным ценам ${esc(city)}</span>
      <b>${fmt(res.total)}</b>
      <span class="small muted">${res.over ? `выше бюджета на ${fmt(res.total - res.budget)} — можно снизить бюджетные позиции или взять БУ` : `в бюджете ${fmt(res.budget)} — запас ${fmt(res.budget - res.total)}`}</span>
    </div>
    ${res.warn && res.warn.length ? `<div class="ai-warn">⚠️ ${res.warn.map(w => esc(w)).join(' · ')}</div>` : ''}
    <div class="ai-fps">
      <h4 style="margin:0 0 8px">🎯 Ожидаемый FPS ${esc(p.res)}</h4>
      <div class="ai-fps-grid">
        ${res.perGame.slice(0, 12).map(x => {
          const g = GAMES.find(y => y.id === x.id);
          const v = fpsVerdict(x.fps);
          return `<div class="ai-fps-item"><span>${gameIcon(g)} ${esc(g.name)}</span><b class="${v.cls}">${x.fps}</b><span class="small muted">${v.label}</span></div>`;
        }).join('')}
      </div>
    </div>
    ${aiSwapSuggestHtml()}
    ${aiDeviceDuelHtml(state.aiCompare)}
    ${aiLaptopResultHtml(state.aiLaptop)}
    ${(() => {
      const matches = aiMatchingBuilds(3);
      if (!matches.length) return '';
      return `<div class="ai-matches">
        <h4 style="margin:0 0 8px">🧩 Готовые сборки под эти условия</h4>
        <div class="ai-match-list">
          ${matches.map(m => `<div class="ai-match">
            <span class="ai-match-name">${esc(m.b.name)}<span class="muted small"> · ${esc(m.b.tag)}</span></span>
            <span><b>${m.fps}</b> <span class="small muted">FPS</span></span>
            <span class="small muted">${fmt(m.price)}</span>
            <button class="btn small ghost" onclick="loadBuilder('${m.b.id}')">В конструктор</button>
            <button class="btn small ghost" onclick="addCompareBuild('${m.b.id}')">Сравнить</button>
          </div>`).join('')}
        </div>
      </div>`;
    })()}
    <div class="ai-actions bottom">
      <button class="btn lime" onclick="aiToBuilder()">🧩 Открыть в конструкторе</button>
      <button class="btn" onclick="aiSave()">💾 Сохранить в «Мои сборки»</button>
      <button class="btn ghost" onclick="aiAskDeepSeek()">💬 Запрос в DeepSeek</button>
      <button class="btn ghost" onclick="aiGenerate()">🔄 Подобрать заново</button>
    </div>
    ${aiDeepSeekBlock(false)}
    <div class="ai-note small muted">
      Подбор делает встроенный ИИ-консультант BLF: он перебирает варианты процессора и видеокарты по всему каталогу, добирает совместимую обвязку, считает FPS и проверяет совместимость.
      Кнопка «Спросить у DeepSeek» открывает <a href="https://chat.deepseek.com/" target="_blank" rel="noopener">chat.deepseek.com</a> и копирует готовый запрос — там можно продолжить диалог и попросить альтернативы.
      <a href="https://chat.deepseek.com/" target="_blank" rel="noopener">Открыть DeepSeek ↗</a>
    </div>
  </div>`;
}

function aiLaptopOnlyHtml() {
  const lap = state.aiLaptop;
  const profile = aiProfile();
  if (state.aiError) return `<div class="empty">⚠️ ${esc(state.aiError)}</div>`;
  if (!lap) return `<div class="empty">Укажите бюджет и во что играете — ИИ подберёт ноутбук под эти условия.</div>`;
  const p = priorityInfoSafe();
  const list = (lap.list || []).slice(1, 5);
  return `<div class="ai-result">
    <div class="ai-head">
      <div>
        <div class="ai-title">💻 ${esc(lap.l.name)}</div>
        <div class="small muted">${esc(regionById(state.region).name)} · ${esc(profile.res)} · ${p && p.kind !== 'all' ? 'цель ' + profile.target + ' FPS в «' + esc(p.name) + '»' : 'универсальный профиль'}</div>
      </div>
      <div class="ai-score">
        <div><b>${lap.fps}</b> <span class="small muted">FPS</span></div>
        <div><b>${fmt(lap.price)}</b> <span class="small muted">цена</span></div>
        <div><b>${Math.round(lap.price / Math.max(lap.fps, 1))}</b> <span class="small muted">₽ за 1 FPS</span></div>
      </div>
    </div>
    <div class="ai-chat"><div class="ai-msg"><span class="ai-avatar">🤖</span><div>
      <div>Подобрал ноутбук под бюджет ${fmt(state.aiBudget)} и задачи: ${esc(profile.label)}.</div>
      <div>${esc(lap.l.cpu)} + ${esc(lap.l.gpu)}${lap.l.vramGb ? ' ' + lap.l.vramGb + ' ГБ' : ''}, ${lap.l.ramGb} ГБ ${esc(lap.l.ramType)}, ${lap.l.storageGb >= 1000 ? (lap.l.storageGb / 1000) + ' ТБ' : lap.l.storageGb + ' ГБ'} ${esc(lap.l.storageType)}, экран ${lap.l.screen}" ${esc(lap.l.resolution)} ${lap.l.hz} Гц.</div>
      <div>${lap.enough ? 'Цель по FPS достигается с запасом — можно играть на высоких настройках.' : 'Цель по FPS не достигается: ноутбуки этой цены слабее ПК. Ниже — что дешевле.'}</div>
    </div></div></div>
    ${aiDeviceDuelHtml(state.aiCompare)}
    ${list.length ? `<div class="ai-matches"><h4 style="margin:0 0 8px">Другие варианты под бюджет</h4><div class="ai-match-list">
      ${list.map(x => `<div class="ai-match">
        <span class="ai-match-name">${esc(x.l.name)}<span class="muted small"> · ${esc(x.l.cpu)}</span></span>
        <span><b>${x.fps}</b> <span class="small muted">FPS</span></span>
        <span class="small muted">${fmt(x.price)}</span>
        <button class="btn small ghost" onclick="navigate('laptops');openLaptop('${x.l.id}')">Подробнее</button>
      </div>`).join('')}
    </div></div>` : ''}
    ${aiDeepSeekBlock(false)}
  </div>`;
}

function renderAi() {
  initAiState();
  const formEl = $('#aiForm'), resEl = $('#aiResult');
  const laptopMode = state.aiDevice === 'laptop';
  const resHtml = laptopMode ? aiLaptopOnlyHtml() : aiResultHtml();
  if (formEl) formEl.innerHTML = aiControlsHtml();
  if (resEl) resEl.innerHTML = resHtml;
  // зеркалим на главной
  const homeForm = $('#homeAiForm'), homeRes = $('#homeAiResult');
  if (homeForm) homeForm.innerHTML = aiControlsHtml();
  if (homeRes) homeRes.innerHTML = resHtml;
}

// ---------- Готовые сборки, подходящие под запрос ----------
function aiMatchingBuilds(limit = 3) {
  initAiState();
  if (!state.aiResult || !state.aiResult.parts) return [];
  const res = state.aiResult;
  return BUILDS
    .map(b => ({ b, price: buildPrice(b, state.region, 'new').total, fps: buildFpsSet(b, res.profile.games, res.profile.res) || 0 }))
    .filter(x => x.price <= res.budget * 1.08 && x.fps >= res.profile.target * 0.9)
    .sort((a, b) => b.fps - a.fps)
    .slice(0, limit);
}
