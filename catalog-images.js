// ===== BLF — реальные фотографии комплектующих =====
// Все фото лежат локально в img/parts/*.jpg (никаких CDN и внешних ссылок:
// сайт работает офлайн и на GitHub Pages без CORS-проблем).
// Подбор идёт в три шага:
//   1) частные правила по id (например, RTX 4070 → gpu-nvidia.jpg);
//   2) правила по семейству/сокету внутри категории (Xeon → cpu-xeon.jpg);
//   3) фото категории по умолчанию — оно есть абсолютно у всех 841 позиции.

const PART_IMG_DIR = 'img/parts/';

// Какие фото есть на диске (используется в тестах и для проверки путей)
const PART_IMAGES = {
  'gpu-nvidia': 'Видеокарта NVIDIA (ASUS Dual, белая)',
  'gpu-amd': 'Видеокарта AMD (PowerColor Hellhound, белая)',
  'cpu-intel': 'Процессор Intel Core (бокс, синяя коробка)',
  'cpu-amd': 'Процессор AMD Ryzen (крышка AMD Ryzen)',
  'cpu-xeon': 'Процессор Intel Xeon LGA2011 (серверный)',
  'motherboard': 'Материнская плата ATX (белая, B650)',
  'motherboard-server': 'Серверная плата Supermicro, 2 сокета',
  'ram': 'Память DDR5 (Kingston Fury Beast, белая)',
  'ram-ddr4': 'Память DDR4 (Corsair Vengeance LPX, белая)',
  'ram-ddr3': 'Память DDR3 (планка 240-pin)',
  'psu': 'Блок питания ATX 750 Вт (Corsair RM750e, белый)',
  'psu-server': 'Серверный блок питания 1U, резервируемый',
  'cooling': 'Башенный кулер (Thermalright, белый)',
  'cooling-aio': 'СЖО 240 мм (Cooler Master, белая)',
  'cooling-low': 'Низкопрофильный кулер (Thermalright AXP90, белый)',
  'ssd-nvme': 'SSD M.2 NVMe',
  'ssd-sata': 'SSD 2.5" SATA',
  'hdd': 'Жёсткий диск 3.5" (Seagate Exos)',
  'case': 'Корпус ATX (тёмный, стекло)',
  'case-itx': 'Корпус Mini-ITX (Fractal Design Ridge, белый)',
  'server-chassis': 'Корпус серверный 1U (InWin)',
  'server-nic': 'Сетевая карта 10G SFP+',
  'server-ram': 'Серверная память DDR4 ECC RDIMM',
  'laptop': 'Ноутбук'
};

// Частные исключения: конкретная модель выглядит иначе, чем типовая для категории
const PART_IMG_RULES = [
  // --- видеокарты: бренд ---
  [/^(gpu|gpu-)/i, c => /nvidia|geforce|rtx/i.test(c.brand + ' ' + c.name) ? 'gpu-nvidia' : 'gpu-amd'],
  [/^(cpu|servercpu)/i, c => {
    const s = `${c.brand} ${c.name}`;
    if (/xeon/i.test(s)) return 'cpu-xeon';
    return /intel/i.test(s) ? 'cpu-intel' : 'cpu-amd';
  }],
  [/^(motherboard|servermb)/i, c => {
    if (/servermb/i.test(c.cat) || /supermicro|asrock rack|tyan|gigabyte mz/i.test(c.name)) return 'motherboard-server';
    return 'motherboard';
  }],
  [/^ram/i, c => {
    const t = c.specs?.ramType || c.specs?.type || c.specs?.memType || c.name;
    if (/ddr3|ddr2/i.test(t)) return 'ram-ddr3';
    return /ddr5/i.test(t) ? 'ram' : 'ram-ddr4';
  }],
  [/^serverram/i, () => 'server-ram'],
  [/^psu/i, c => (/serverpsu/i.test(c.cat) || /1U|резерв|redundant/i.test(`${c.name} ${c.specs?.redundancy || ''}`)) ? 'psu-server' : 'psu'],
  [/^cooling|^cool-/i, c => {
    const s = `${c.name} ${c.specs?.type || ''} ${c.specs?.radiatorSize || ''} ${c.specs?.radiatorMm || ''}`;
    if (/liquid|aio|сжо|водян|freezer ii|kraken|h150i|lt720|ryuo|240|360/i.test(s)) return 'cooling-aio';
    if (/low|низкопроф|itx|axp|nh-l12|2U/i.test(s)) return 'cooling-low';
    return 'cooling';
  }],
  [/^ssd|^sst-|^serverstorage/i, c => {
    const s = `${c.name} ${c.specs?.type || ''} ${c.specs?.interface || ''}`;
    if (/hdd|жёстк|barracuda|exos|wd blue|seagate|toshiba/i.test(s)) return 'hdd';
    if (/sata|2\.5/i.test(s) && !/m\.2|nvme/i.test(s)) return 'ssd-sata';
    return 'ssd-nvme';
  }],
  [/^case/i, c => /mini-?itx|itx|sff/i.test(`${c.specs?.formFactor || ''} ${c.name}`) ? 'case-itx' : 'case'],
  [/^serverchassis/i, () => 'server-chassis'],
  [/^servernic/i, () => 'server-nic'],
  [/^laptop/i, () => 'laptop'],
];

// Фото категории по умолчанию — гарантия, что картинка есть всегда
const CAT_IMG = {
  cpu: 'cpu-intel', gpu: 'gpu-nvidia', motherboard: 'motherboard', ram: 'ram',
  psu: 'psu', ssd: 'ssd-nvme', case: 'case', cooling: 'cooling',
  servercpu: 'cpu-xeon', servermb: 'motherboard-server', serverram: 'server-ram',
  serverpsu: 'psu-server', serverstorage: 'ssd-sata', serverchassis: 'server-chassis',
  servernic: 'server-nic', laptop: 'laptop'
};

// Кэш: id → ключ фото (считаем один раз на старте)
const PART_IMG_CACHE = new Map();

function imgKeyFor(part) {
  if (!part || !part.cat) return 'case';
  if (PART_IMG_CACHE.has(part.id)) return PART_IMG_CACHE.get(part.id);
  let key = CAT_IMG[part.cat] || 'case';
  for (const [re, pick] of PART_IMG_RULES) {
    if (re.test(part.cat)) { key = pick(part) || key; break; }
  }
  if (!PART_IMAGES[key]) key = CAT_IMG[part.cat] || 'case';
  PART_IMG_CACHE.set(part.id, key);
  return key;
}

function imgFor(part) {
  return PART_IMG_DIR + imgKeyFor(part) + '.jpg';
}

// Готовая картинка-плитка: белый фон, объект по центру, ленивая загрузка.
// alt — человеческое название модели: фото реальное, подпись честная.
function partImg(part, { size = 'md', cls = '', alt = '' } = {}) {
  if (!part) return '';
  const label = alt || part.name || '';
  return `<img class="part-img part-img-${size} ${cls}" src="${imgFor(part)}" alt="${escAttr(label)}" title="${escAttr(label)}" loading="lazy" decoding="async">`;
}

// Небольшая строка фото-превью для карточек сборок (CPU + GPU + …)
function buildImgStrip(parts, max = 4) {
  const list = (parts || []).filter(Boolean).slice(0, max);
  if (!list.length) return '';
  return `<div class="build-img-strip">${list.map(p => partImg(p, { size: 'sm' })).join('')}</div>`;
}

// Короткое имя для подписи под миниатюрой: «NVIDIA GeForce RTX 4070 12GB» → «RTX 4070»
function shortName(name) {
  return String(name || '')
    .replace(/^(NVIDIA|AMD|Intel|ASUS|MSI|Gigabyte|Palit|Sapphire|Kingston|Corsair|Seagate|WD|Samsung|Kingmax|Patriot|ADATA|Crucial)\s+/i, '')
    .replace(/(GeForce|Radeon|Core)\s+/i, '')
    .replace(/\s*\(\d+\s*шт\.?\)\s*$/i, '')
    .replace(/\s*\d+\s*(ГБ|ТБ).*$/i, '')
    .trim()
    .slice(0, 18);
}

function escAttr(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Поиск компонента по id во всех каталогах (ПК, сервер, ноутбук)
function partById(id) {
  if (!id) return null;
  if (typeof byId === 'function') { const p = byId(id); if (p) return p; }
  if (typeof serverPartById === 'function') { const p = serverPartById(id); if (p) return p; }
  if (typeof laptopById === 'function') { const p = laptopById(id); if (p) return p; }
  return null;
}
