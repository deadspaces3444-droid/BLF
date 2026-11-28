// ===== BLF — 3D-сборка ПК =====
// Корпус с открытой боковой крышкой, все комплектующие — объёмные модели.
// Выбрали деталь (в списке или кликом по пустому слоту) — она встаёт на своё место
// с анимацией установки. Клик по установленной детали — заменить/снять.
//
// Файл разделён на две части:
//   1) PC3D_LAYOUT(build) — чистая геометрия (сантиметры), её можно тестировать без WebGL;
//   2) рендерер на three.js с орбитальной камерой, подсветкой, вентиляторами и анимацией.

// ---------- 1. Раскладка деталей в корпусе ----------
const PC3D_PARTS = {
  cpu:         { name: 'Процессор', icon: '🧠' },
  motherboard: { name: 'Плата', icon: '🔌' },
  cooling:     { name: 'Охлаждение', icon: '❄️' },
  ram:         { name: 'Память', icon: '💾' },
  gpu:         { name: 'Видеокарта', icon: '🎮' },
  psu:         { name: 'Блок питания', icon: '⚡' },
  ssd:         { name: 'Накопитель', icon: '💿' },
  case:        { name: 'Корпус', icon: '🗄️' },
};

function pc3dNum(v, def = 0) { const n = Number(String(v == null ? '' : v).replace(/[^\d.]/g, '')); return isFinite(n) && n > 0 ? n : def; }

// Размеры в сантиметрах: 1 единица three.js = 1 см
function pc3dBoardSize(formFactor) {
  const f = String(formFactor || 'ATX').toUpperCase();
  if (/E-?ATX/.test(f)) return { w: 27.7, h: 30.5, label: 'E-ATX' };
  if (/MICRO|M-?ATX|MATX/.test(f)) return { w: 24.4, h: 24.4, label: 'mATX' };
  if (/MINI-?ITX|ITX/.test(f)) return { w: 17, h: 17, label: 'ITX' };
  return { w: 24.4, h: 30.5, label: 'ATX' };
}
function pc3dCaseSize(caseComp) {
  const sup = String(caseComp?.specs?.motherboardSupport || '');
  const big = /E-?ATX/i.test(sup);
  return big ? { w: 23, h: 52, d: 48 } : { w: 21, h: 46, d: 45 };
}

// Главная функция: что где стоит. Возвращает детали + пустые слоты.
function PC3D_LAYOUT(build) {
  const b = build || {};
  const get = id => (typeof byId === 'function' ? byId(id) : null);
  const caseComp = get(b.case);
  const cs = pc3dCaseSize(caseComp);
  const board = get(b.motherboard);
  const cpu = get(b.cpu);
  const cooler = get(b.cooling);
  const ram = get(b.ram);
  const gpu = get(b.gpu);
  const psu = get(b.psu);
  const ssd = get(b.ssd);
  const bs = pc3dBoardSize(board?.specs?.formFactor);

  const boardX = cs.w / 2 - 2.2;                 // плата у правой стенки
  const parts = [];
  const slots = [];
  const push = (cat, comp, geom, extra = {}) => {
    if (!comp) { slots.push({ cat, ...geom.empty }); return; }
    parts.push({
      cat, id: comp.id, name: comp.name, color: geom.color,
      size: geom.size, pos: geom.pos, rot: geom.rot || [0, 0, 0], kind: geom.kind,
      price: (typeof minPrice === 'function' ? minPrice(comp.id, state.region, 'new') : null) ?? comp.basePrice ?? 0,
      meta: geom.meta || '', ...extra,
    });
  };

  // --- материнская плата (вертикально, у правой стенки) ---
  const boardY = 16 + bs.h / 2;
  const boardZ = -cs.d / 2 + 6 + bs.w / 2;
  push('motherboard', board, {
    kind: 'board', color: 0x1f5c3a,
    size: [0.5, bs.h, bs.w], pos: [boardX, boardY, boardZ],
    meta: `${bs.label} · ${board?.specs?.socket || ''}`,
    empty: { pos: [boardX, boardY, boardZ], size: [0.5, bs.h, bs.w], label: 'Материнская плата' },
  });

  // --- процессор (на сокете платы) ---
  const sockY = boardY + bs.h / 2 - 6;
  const sockZ = boardZ - bs.w / 4;
  push('cpu', cpu, {
    kind: 'cpu', color: 0xc9d3dd,
    size: [0.6, 5.2, 5.2], pos: [boardX - 0.6, sockY, sockZ],
    rot: [0, 0, Math.PI / 2],
    meta: cpu ? `${cpu.specs.cores} ядер · ${cpu.specs.tdp} Вт` : '',
    empty: { pos: [boardX - 0.6, sockY, sockZ], size: [0.7, 5.2, 5.2], label: 'Процессор' },
  });

  // --- охлаждение ---
  const isLiquid = /жидк|вод/i.test(String(cooler?.specs?.type || ''));
  const coolH = Math.min(pc3dNum(cooler?.specs?.heightMm, 155) / 10, cs.w - 6);
  if (isLiquid) {
    push('cooling', cooler, {
      kind: 'aio', color: 0x2b3440,
      size: [3.4, 5.6, 5.6], pos: [boardX - 3.4, sockY, sockZ],
      meta: `${cooler.specs.type} · ${cooler.specs.fans || ''}`,
      empty: { pos: [boardX - 3.4, sockY, sockZ], size: [3.4, 5.6, 5.6], label: 'Охлаждение' },
    });
  } else {
    push('cooling', cooler, {
      kind: 'tower', color: 0x9aa7b4,
      size: [coolH - 2.2, 12, 9], pos: [boardX - 0.8 - (coolH - 2.2) / 2, sockY, sockZ],
      meta: `${cooler ? cooler.specs.heightMm + ' мм' : ''} · ${cooler?.specs?.tdpSupport || ''} Вт`,
      empty: { pos: [boardX - 2, sockY, sockZ], size: [coolH - 2.2, 12, 9], label: 'Кулер' },
    });
  }

  // --- память: по модулям, вертикально между платой и открытой стенкой ---
  const sticks = Math.max(1, Math.min(4, Number(ram?.specs?.modules || 2)));
  for (let i = 0; i < 4; i++) {
    const y = boardY + bs.h / 2 - 15 - i * 1.4;
    const z = boardZ + bs.w / 2 - 4.2;
    if (i < sticks && ram) {
      parts.push({
        cat: 'ram', slotIndex: i, id: ram.id, name: ram.name + (sticks > 1 ? ` (${i + 1}/${sticks})` : ''),
        color: 0x3b82f6, kind: 'ram', size: [4.2, 1.1, 13.6], pos: [boardX - 2.6, y, z],
        price: 0, meta: ram.specs.type || '', stick: i + 1,
      });
    } else {
      slots.push({ cat: 'ram', pos: [boardX - 1.2, y, z], size: [1.2, 1.1, 13.6], label: `Слот памяти ${i + 1}`, stick: i + 1 });
    }
  }

  // --- видеокарта: из слота PCIe в сторону открытой стенки, длина по модели ---
  const gpuLen = Math.min(pc3dNum(gpu?.specs?.lengthMm, 280) / 10, cs.d - 8);
  const gpuY = boardY - bs.h / 2 + 8.5;
  const gpuZ = boardZ - bs.w / 2 + 2 + gpuLen / 2;
  push('gpu', gpu, {
    kind: 'gpu', color: 0x1e293b,
    size: [5.2, 12.4, gpuLen], pos: [boardX - 3.4, gpuY, gpuZ],
    meta: gpu ? `${gpu.specs.vramGb} ГБ · ${gpu.specs.tdp} Вт` : '',
    empty: { pos: [boardX - 2.6, gpuY, boardZ - bs.w / 2 + 14], size: [5.2, 12.4, 28], label: 'Видеокарта' },
  });

  // --- блок питания: нижний отсек ---
  const psuBig = !/SFX/i.test(String(psu?.specs?.formFactor || 'ATX'));
  const psuSize = psuBig ? [15, 8.6, 14] : [12.5, 6.4, 10];
  push('psu', psu, {
    kind: 'psu', color: 0x111827,
    size: psuSize, pos: [cs.w / 2 - psuSize[0] / 2 - 2, psuSize[1] / 2 + 0.6, -cs.d / 2 + psuSize[2] / 2 + 1],
    meta: psu ? `${psu.specs.wattage} Вт · ${psu.specs.certification || ''}` : '',
    empty: { pos: [cs.w / 2 - psuSize[0] / 2 - 2, psuSize[1] / 2 + 0.6, -cs.d / 2 + psuSize[2] / 2 + 1], size: psuSize, label: 'Блок питания' },
  });

  // --- накопитель: спереди, HDD/SSD/NVMe ---
  const isHdd = /HDD/i.test(String(ssd?.specs?.type || ''));
  const isNvme = /NVMe|M\.2/i.test(String(ssd?.specs?.type || '') + (ssd?.name || ''));
  const stSize = isHdd ? [10, 2.6, 14.6] : isNvme ? [0.3, 2.2, 8] : [7, 0.8, 10];
  const stPos = isNvme
    ? [boardX - 0.5, boardY - bs.h / 2 + 4, boardZ + 2]
    : [-cs.w / 2 + 5.5, isHdd ? 13 : 8.5, cs.d / 2 - 8];
  push('ssd', ssd, {
    kind: isHdd ? 'hdd' : isNvme ? 'nvme' : 'ssd', color: isHdd ? 0x6b7280 : 0x0ea5e9,
    size: stSize, pos: stPos,
    meta: ssd ? `${ssd.specs.capacityGb >= 1000 ? (ssd.specs.capacityGb / 1000) + ' ТБ' : ssd.specs.capacityGb + ' ГБ'} · ${ssd.specs.type}` : '',
    empty: { pos: stPos, size: isHdd ? [10, 2.6, 14.6] : [7, 0.8, 10], label: 'Накопитель' },
  });

  // --- корпус целиком (рисуется отдельно, но участвует в выборе) ---
  return {
    case: { comp: caseComp, size: cs, glass: /стекл/i.test(String(caseComp?.specs?.glass || '')), board: bs, boardX, boardY, boardZ },
    parts, slots,
    warnings: PC3D_FIT(build).warnings,
  };
}

// Проверка «влезет ли физически» — отдельно от совместимости по электрике
function PC3D_FIT(build) {
  const get = id => (typeof byId === 'function' ? byId(id) : null);
  const gpu = get(build?.gpu), cooler = get(build?.cooling), cs = get(build?.case);
  const warnings = [];
  if (gpu && cs) {
    const need = pc3dNum(gpu.specs.lengthMm, 0);
    const max = pc3dNum(cs.specs.maxGpuLengthMm, 0);
    if (need && max && need > max) warnings.push(`Видеокарта ${need} мм не влезет: в корпусе до ${max} мм`);
  }
  if (cooler && cs) {
    const need = pc3dNum(cooler.specs.heightMm, 0);
    const max = pc3dNum(cs.specs.maxCpuCoolerHeightMm, 0);
    if (need && max && need > max) warnings.push(`Кулер ${need} мм не влезет: в корпусе до ${max} мм`);
  }
  return { warnings, ok: warnings.length === 0 };
}

// ---------- 2. Рендерер на three.js ----------
const PC3D = window.PC3D = {
  ready: false, mode: 'none', scene: null, renderer: null, camera: null,
  parts: [], raf: 0, clock: 0, hovered: null, built: '', lid: 0, lidTarget: 0,
  autoRotate: false, rgb: 0, rgbTimer: 0, lastBuild: null,
};

function pc3dSupported() {
  try {
    if (typeof THREE === 'undefined') return false;
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
  } catch (e) { return false; }
}

function pc3dMount() {
  const host = document.getElementById('pc3d');
  if (!host) return;
  if (!pc3dSupported()) { pc3dFallback(host); return; }
  try { pc3dMount3d(host); } catch (e) {
    console.warn('3D недоступно:', e && e.message);
    PC3D.ready = false; PC3D.mode = 'none';
    pc3dFallback(host);
  }
}

function pc3dMount3d(host) {
  const w = host.clientWidth || 640, h = host.clientHeight || 480;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1016);
  scene.fog = new THREE.Fog(0x0b1016, 180, 380);

  const camera = new THREE.PerspectiveCamera(42, w / h, 0.5, 900);
  camera.position.set(-78, 66, 88);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.innerHTML = '';
  host.appendChild(renderer.domElement);

  // свет
  scene.add(new THREE.HemisphereLight(0xdfefff, 0x1b2330, 0.85));
  const key = new THREE.DirectionalLight(0xffffff, 1.15);
  key.position.set(-60, 90, 60);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -90; key.shadow.camera.right = 90;
  key.shadow.camera.top = 90; key.shadow.camera.bottom = -90;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x9fd4ff, 0.5); rim.position.set(60, 40, -70); scene.add(rim);
  const fill = new THREE.PointLight(0x7dd3fc, 0.7, 220); fill.position.set(-20, 34, 60); scene.add(fill);

  // пол
  const floor = new THREE.Mesh(new THREE.CircleGeometry(140, 48),
    new THREE.MeshStandardMaterial({ color: 0x0e1620, roughness: 0.95, metalness: 0 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.05;
  floor.receiveShadow = true;
  scene.add(floor);

  const root = new THREE.Group();
  scene.add(root);

  PC3D.scene = scene; PC3D.renderer = renderer; PC3D.camera = camera;
  PC3D.root = root; PC3D.mode = '3d'; PC3D.ready = true;

  pc3dOrbit(host, camera, renderer);
  pc3dLoop();
  pc3dSync(PC3D.lastBuild || state.builder);
  window.addEventListener('resize', pc3dResize);
}

function pc3dResize() {
  const host = document.getElementById('pc3d');
  if (!host || !PC3D.renderer) return;
  const w = host.clientWidth || 640, h = host.clientHeight || 480;
  PC3D.camera.aspect = w / h;
  PC3D.camera.updateProjectionMatrix();
  PC3D.renderer.setSize(w, h);
}

// Простая орбитальная камера: тянуть — вращение, колесо — зум, двойной клик — сброс
function pc3dOrbit(host, camera, renderer) {
  const target = PC3D.target = new THREE.Vector3(0, 24, 0);
  let radius = 130, theta = -0.75, phi = 1.12, drag = false, px = 0, py = 0;
  const apply = () => {
    phi = Math.max(0.25, Math.min(1.52, phi));
    radius = Math.max(55, Math.min(260, radius));
    camera.position.set(
      target.x + radius * Math.sin(phi) * Math.cos(theta),
      target.y + radius * Math.cos(phi),
      target.z + radius * Math.sin(phi) * Math.sin(theta),
    );
    camera.lookAt(target);
  };
  apply();
  const el = renderer.domElement;
  el.style.cursor = 'grab';
  el.addEventListener('pointerdown', e => { drag = true; px = e.clientX; py = e.clientY; el.style.cursor = 'grabbing'; });
  window.addEventListener('pointerup', () => { drag = false; el.style.cursor = 'grab'; });
  el.addEventListener('pointermove', e => {
    const dx = e.clientX - px, dy = e.clientY - py;
    if (!drag) { pc3dHover(e); return; }
    px = e.clientX; py = e.clientY;
    theta += dx * 0.006;
    phi -= dy * 0.005;
    apply();
  });
  el.addEventListener('wheel', e => {
    e.preventDefault();
    radius += e.deltaY * 0.06;
    apply();
  }, { passive: false });
  el.addEventListener('dblclick', () => { theta = -0.75; phi = 1.12; radius = 130; apply(); });
  PC3D.applyOrbit = apply;
  PC3D.orbitState = { get radius() { return radius; } };
}

// ---------- Построение геометрии сцены ----------
const PC3D_MAT = {};
function pc3dMaterial(color, opts = {}) {
  const key = color + '|' + JSON.stringify(opts);
  if (PC3D_MAT[key]) return PC3D_MAT[key];
  const m = new THREE.MeshStandardMaterial({
    color, metalness: opts.metalness ?? 0.45, roughness: opts.roughness ?? 0.5,
    emissive: opts.emissive ?? 0x000000, emissiveIntensity: opts.emissiveIntensity ?? 1,
    transparent: !!opts.transparent, opacity: opts.opacity ?? 1,
    side: opts.side || THREE.FrontSide,
  });
  PC3D_MAT[key] = m;
  return m;
}
function pc3dBox(size, pos, mat, opts = {}) {
  const g = new THREE.BoxGeometry(size[0], size[1], size[2]);
  const m = new THREE.Mesh(g, mat);
  m.position.set(pos[0], pos[1], pos[2]);
  if (opts.rot) m.rotation.set(opts.rot[0], opts.rot[1], opts.rot[2]);
  m.castShadow = opts.castShadow !== false;
  m.receiveShadow = true;
  if (opts.name) m.name = opts.name;
  return m;
}

// Текст на детали: маленькая надпись «RTX 4070», «750 Вт» и т.п.
function pc3dLabel(text, opts = {}) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const ctx = c.getContext && c.getContext('2d');
  if (!ctx) return new THREE.Group();          // без 2D-контекста просто пропускаем надпись
  ctx.fillStyle = opts.bg || '#0b1016'; ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = opts.color || '#d7ffe0';
  ctx.font = `bold ${opts.size || 44}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const t = String(text || '').slice(0, 34);
  ctx.fillText(t, c.width / 2, c.height / 2);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 2;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(opts.w || 9, opts.h || 2.2), mat);
  return mesh;
}

function pc3dClear() {
  if (!PC3D.root) return;
  while (PC3D.root.children.length) {
    const ch = PC3D.root.children.pop();
    ch.traverse?.(o => { if (o.geometry) o.geometry.dispose(); });
  }
  PC3D.parts = [];
}

// Корпус: каркас, три стенки, открытая боковая крышка на петле
function pc3dBuildCase(lay) {
  const { size, glass } = lay.case;
  const [w, h, d] = [size.w, size.h, size.d];
  const g = new THREE.Group();
  g.name = 'case';
  const metal = pc3dMaterial(0x2a323d, { metalness: 0.85, roughness: 0.28 });
  const dark = pc3dMaterial(0x151b23, { metalness: 0.7, roughness: 0.4 });
  const glassMat = pc3dMaterial(0x9fd8ff, { metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.18, side: THREE.DoubleSide });

  const t = 0.6;
  // правая стенка (глухая, сзади от открытой)
  g.add(pc3dBox([t, h, d], [w / 2, h / 2, 0], metal));
  // дно и верх
  g.add(pc3dBox([w, t, d], [0, t / 2, 0], dark));
  g.add(pc3dBox([w, 3, d], [0, h - 1.5, 0], metal));
  // задняя стенка с решёткой
  g.add(pc3dBox([w, h, t], [0, h / 2, -d / 2], metal));
  const grill = pc3dMaterial(0x0b1016, { metalness: 0.3, roughness: 0.9 });
  g.add(pc3dBox([8, 8, 0.2], [w / 2 - 6, 38, -d / 2 + 0.5], grill));
  // фронт: рамка + сетка + два вентилятора
  const front = new THREE.Group();
  front.position.set(0, 0, d / 2);
  front.add(pc3dBox([w, h, t], [0, h / 2, 0], dark));
  front.add(pc3dBox([w - 4, h - 8, 0.2], [0, h / 2, 0.5], grill));
  [0.42, 0.72].forEach((k, i) => {
    const fan = pc3dFan(6, 0x2f3946);
    fan.position.set(0, h * k, 1.4);
    fan.rotation.y = Math.PI;
    fan.userData.spin = 0.9 + i * 0.13;
    front.add(fan);
    PC3D.fans = PC3D.fans || [];
    PC3D.fans.push(fan);
  });
  g.add(front);

  // задний вытяжной вентилятор
  const rear = pc3dFan(6, 0x2f3946);
  rear.position.set(w / 2 - 6, 38, -d / 2 + 1);
  rear.userData.spin = 1.1;
  g.add(rear);
  (PC3D.fans = PC3D.fans || []).push(rear);

  // боковая крышка на петле: открывается наружу, стекло или металл
  const lidPivot = new THREE.Group();
  lidPivot.position.set(-w / 2, 0, -d / 2);
  const lid = pc3dBox([t, h, d], [0, h / 2, d / 2], glass ? glassMat : metal);
  lid.name = 'lid';
  lidPivot.add(lid);
  if (glass) {
    const edge = pc3dBox([t + 0.15, h, 0.8], [0, h / 2, d / 2 - d / 2 + 0.4], metal);
    lidPivot.add(edge);
    const edge2 = pc3dBox([t + 0.15, h, 0.8], [0, h / 2, d - 0.4], metal);
    lidPivot.add(edge2);
  }
  lidPivot.rotation.y = PC3D.lid;
  g.add(lidPivot);
  PC3D.lidPivot = lidPivot;

  // стойки под плату
  for (let i = 0; i < 4; i++) {
    const y = 18 + i * 6;
    g.add(pc3dBox([1.4, 1.4, 1.4], [lay.case.boardX - 1.6, y, lay.case.boardZ], metal));
  }

  // подсветка-полоска, цвет меняется кнопкой
  const strip = pc3dBox([w - 4, 0.5, 0.5], [0, h - 3.4, d / 2 - 1.6],
    pc3dMaterial(0x22d3ee, { emissive: 0x22d3ee, emissiveIntensity: 1.6, metalness: 0.2, roughness: 0.4 }));
  strip.name = 'rgb';
  g.add(strip);
  PC3D.rgbStrip = strip;

  return g;
}

function pc3dFan(r, color) {
  const grp = new THREE.Group();
  grp.add(pc3dBox([r * 2, r * 2, 1], [0, 0, 0], pc3dMaterial(color, { metalness: 0.3, roughness: 0.8 })));
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.32, r * 0.32, 0.8, 20), pc3dMaterial(0x0b1016, { roughness: 0.7 }));
  hub.rotation.x = Math.PI / 2;
  hub.position.z = 0.6;
  grp.add(hub);
  for (let i = 0; i < 7; i++) {
    const bl = new THREE.Mesh(new THREE.BoxGeometry(r * 0.9, r * 0.26, 0.25), pc3dMaterial(0x1f2937, { roughness: 0.6 }));
    bl.position.set(Math.cos(i / 7 * Math.PI * 2) * r * 0.5, Math.sin(i / 7 * Math.PI * 2) * r * 0.5, 0.7);
    bl.rotation.z = i / 7 * Math.PI * 2 + 0.5;
    grp.add(bl);
  }
  return grp;
}

// Модель конкретной детали
function pc3dPartMesh(p) {
  const [sx, sy, sz] = p.size;
  const grp = new THREE.Group();
  grp.position.set(p.pos[0], p.pos[1], p.pos[2]);
  grp.rotation.set(p.rot[0], p.rot[1], p.rot[2]);
  grp.userData = { cat: p.cat, id: p.id, name: p.name, price: p.price, meta: p.meta, part: true };

  const base = pc3dMaterial(p.color || 0x334155, { metalness: 0.5, roughness: 0.45 });

  if (p.kind === 'board') {
    const pcb = pc3dBox([sx, sy, sz], [0, 0, 0], pc3dMaterial(0x1b4d33, { metalness: 0.2, roughness: 0.75 }));
    grp.add(pcb);
    // чипсет, слоты, разъёмы
    grp.add(pc3dBox([0.4, 4, 4], [-sx / 2 - 0.2, -sy / 2 + 4, sz / 2 - 3], pc3dMaterial(0x94a3b8, { metalness: 0.8, roughness: 0.3 })));
    for (let i = 0; i < 3; i++) {
      grp.add(pc3dBox([0.5, 0.6, sz * 0.55], [-sx / 2 - 0.25, sy / 2 - 12 - i * 6, -sz * 0.1], pc3dMaterial(0x0f172a, { roughness: 0.7 })));
    }
    const lbl = pc3dLabel(p.name, { w: sz * 0.8, h: 2, bg: '#10352a', color: '#c7f9d9', size: 34 });
    lbl.position.set(-sx / 2 - 0.35, sy * 0.18, 0);
    lbl.rotation.y = -Math.PI / 2;
    grp.add(lbl);
  } else if (p.kind === 'cpu') {
    grp.add(pc3dBox([sx, sy, sz], [0, 0, 0], pc3dMaterial(0xc9d3dd, { metalness: 0.95, roughness: 0.22 })));
    grp.add(pc3dBox([sx * 0.6, sy * 0.35, sz * 0.35], [-sx * 0.2, 0, 0], pc3dMaterial(0x8b98a6, { metalness: 0.9, roughness: 0.3 })));
  } else if (p.kind === 'tower') {
    // радиатор из пластин
    const plates = Math.max(10, Math.round(sy / 0.55));
    const finMat = pc3dMaterial(0xb7c2ce, { metalness: 0.95, roughness: 0.25 });
    for (let i = 0; i < plates; i++) {
      const y = -sy / 2 + 0.5 + i * (sy - 1) / plates;
      grp.add(pc3dBox([sx, 0.18, sz], [0, y, 0], finMat));
    }
    // тепловые трубки
    for (let i = 0; i < 3; i++) {
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, sy, 12), pc3dMaterial(0xcdd7e1, { metalness: 1, roughness: 0.18 }));
      tube.position.set(0, 0, -sz / 3 + i * sz / 3);
      grp.add(tube);
    }
    // вентилятор спереди
    const fan = pc3dFan(Math.min(6, sy / 2 - 0.4), 0x111827);
    fan.position.set(-sx / 2 - 0.8, 0, 0);
    fan.rotation.y = Math.PI / 2;
    fan.userData.spin = 1.4;
    grp.add(fan);
    (PC3D.fans = PC3D.fans || []).push(fan);
    const lbl = pc3dLabel(p.name, { w: sx * 0.9, h: 1.8, bg: '#131c26', color: '#bfe9ff', size: 32 });
    lbl.position.set(sx / 2 + 0.1, -sy / 2 + 2, 0);
    lbl.rotation.y = Math.PI / 2;
    grp.add(lbl);
  } else if (p.kind === 'aio') {
    grp.add(pc3dBox([sx, sy, sz], [0, 0, 0], pc3dMaterial(0x1f2937, { metalness: 0.5, roughness: 0.4 })));
    const glow = pc3dBox([0.2, sy * 0.7, sz * 0.7], [-sx / 2 - 0.12, 0, 0], pc3dMaterial(0x22d3ee, { emissive: 0x22d3ee, emissiveIntensity: 1.2 }));
    grp.add(glow);
    // трубки к радиатору сверху
    for (let i = 0; i < 2; i++) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-sx / 2, sy * 0.3, -1 + i * 2),
        new THREE.Vector3(-sx / 2 - 6, sy * 0.9, -3 + i * 3),
        new THREE.Vector3(-sx / 2 - 2, 16, 2 - i * 4),
      ]);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.45, 8, false), pc3dMaterial(0x111827, { roughness: 0.8 }));
      grp.add(tube);
    }
  } else if (p.kind === 'ram') {
    grp.add(pc3dBox([sx, sy, sz], [0, 0, 0], base));
    grp.add(pc3dBox([sx * 0.35, sy * 1.4, sz * 0.92], [sx * 0.25, 0.2, 0], pc3dMaterial(0x1d4ed8, { metalness: 0.7, roughness: 0.35 })));
    const lbl = pc3dLabel(p.meta || 'RAM', { w: sz * 0.7, h: 0.9, bg: '#0b1b33', color: '#cfe4ff', size: 30 });
    lbl.position.set(sx / 2 + 0.2, 0, 0);
    lbl.rotation.y = Math.PI / 2;
    grp.add(lbl);
  } else if (p.kind === 'gpu') {
    // корпус карты + кожух + два-три вентилятора снизу + бэкплейт
    grp.add(pc3dBox([sx, sy, sz], [0, 0, 0], pc3dMaterial(0x0f172a, { metalness: 0.6, roughness: 0.4 })));
    grp.add(pc3dBox([sx * 0.25, sy * 0.9, sz * 0.98], [sx * 0.35, 0, 0], pc3dMaterial(0x1e293b, { metalness: 0.5, roughness: 0.5 })));
    const fans = sz > 30 ? 3 : 2;
    for (let i = 0; i < fans; i++) {
      const f = pc3dFan(Math.min(4.6, sy * 0.36), 0x111827);
      f.position.set(-sx / 2 - 0.35, 0, -sz / 2 + sz / (fans * 2) + i * sz / fans);
      f.rotation.y = -Math.PI / 2;
      f.userData.spin = 1.8;
      grp.add(f);
      (PC3D.fans = PC3D.fans || []).push(f);
    }
    // радиаторные рёбра сверху
    for (let i = 0; i < 14; i++) {
      grp.add(pc3dBox([sx * 0.8, 0.12, 0.25], [0, sy / 2 + 0.1, -sz / 2 + 1 + i * (sz - 2) / 14],
        pc3dMaterial(0xb7c2ce, { metalness: 0.95, roughness: 0.25 })));
    }
    // подсветка и надпись
    grp.add(pc3dBox([0.3, 1.2, sz * 0.5], [sx / 2 + 0.1, sy * 0.32, 0],
      pc3dMaterial(0xa855f7, { emissive: 0xa855f7, emissiveIntensity: 1.3 })));
    const lbl = pc3dLabel(p.name, { w: sz * 0.75, h: 2.4, bg: '#0b1220', color: '#d7ffe0', size: 32 });
    lbl.position.set(-sx / 2 - 0.45, 0, 0);
    lbl.rotation.y = -Math.PI / 2;
    grp.add(lbl);
    // кабель питания
    const cable = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
      new THREE.Vector3(sx / 2, sy / 2, -sz / 2 + 4),
      new THREE.Vector3(8, sy / 2 + 6, -sz / 2 + 6),
      new THREE.Vector3(12, 10, -14),
    ]), 18, 0.35, 8, false), pc3dMaterial(0x111827, { roughness: 0.85 }));
    grp.add(cable);
  } else if (p.kind === 'psu') {
    grp.add(pc3dBox([sx, sy, sz], [0, 0, 0], pc3dMaterial(0x0b1220, { metalness: 0.7, roughness: 0.35 })));
    const f = pc3dFan(Math.min(5.6, sy * 0.42), 0x111827);
    f.position.set(0, -sy / 2 - 0.35, 0);
    f.rotation.x = Math.PI / 2;
    f.userData.spin = 0.7;
    grp.add(f);
    (PC3D.fans = PC3D.fans || []).push(f);
    const lbl = pc3dLabel(p.meta || 'PSU', { w: sx * 0.8, h: 3, bg: '#111827', color: '#fde68a', size: 40 });
    lbl.position.set(-sx / 2 - 0.35, 0, 0);
    lbl.rotation.y = -Math.PI / 2;
    grp.add(lbl);
    // кабели к плате
    for (let i = 0; i < 3; i++) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-sx / 2 + 2 + i * 2, sy / 2, sz / 2 - 2),
        new THREE.Vector3(-6 + i * 3, 16, 6),
        new THREE.Vector3(2, 30 + i * 3, 6),
      ]);
      grp.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.3, 6, false), pc3dMaterial(0x111827, { roughness: 0.85 })));
    }
  } else if (p.kind === 'hdd' || p.kind === 'ssd' || p.kind === 'nvme') {
    grp.add(pc3dBox([sx, sy, sz], [0, 0, 0], pc3dMaterial(p.kind === 'hdd' ? 0x8b98a6 : 0x0ea5e9, { metalness: 0.8, roughness: 0.3 })));
    if (p.kind === 'hdd') {
      grp.add(pc3dBox([sx * 0.7, sy + 0.15, sz * 0.7], [0, 0, 0], pc3dMaterial(0x9ca3af, { metalness: 0.9, roughness: 0.25 })));
    }
    const lbl = pc3dLabel(p.meta || '', { w: Math.max(5, sz * 0.7), h: 1.2, bg: '#0b1220', color: '#bfe9ff', size: 28 });
    lbl.position.set(-sx / 2 - 0.3, 0, 0);
    lbl.rotation.y = -Math.PI / 2;
    grp.add(lbl);
  } else {
    grp.add(pc3dBox([sx, sy, sz], [0, 0, 0], base));
  }

  grp.userData.anim = p.__animate ? { from: 40, t: 0 } : null;
  return grp;
}

// Пустой слот: пунктирный контур + подпись, клик — выбрать деталь
function pc3dSlotMesh(s) {
  const [sx, sy, sz] = s.size;
  const grp = new THREE.Group();
  grp.position.set(s.pos[0], s.pos[1], s.pos[2]);
  const ghost = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.1, depthWrite: false }));
  grp.add(ghost);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(sx, sy, sz)),
    new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 }));
  grp.add(edges);
  const lbl = pc3dLabel('+ ' + s.label, { w: Math.max(8, Math.min(16, sz * 0.8)), h: 2, bg: '#082f49', color: '#bae6fd', size: 30 });
  lbl.position.set(sx / 2 + 0.4, sy / 2 + 2, 0);
  lbl.rotation.y = Math.PI / 2;
  grp.add(lbl);
  grp.userData = { slot: s.cat, slotIndex: s.stick, name: s.label, slotObj: true };
  return grp;
}

// Основная синхронизация сцены с содержимым сборки
function pc3dSync(build) {
  PC3D.lastBuild = build || {};
  if (PC3D.mode !== '3d' || !PC3D.root) { pc3dFallbackParts(build); return; }
  const lay = PC3D_LAYOUT(build);
  const prevIds = new Set((PC3D.parts || []).map(x => x.id + '|' + x.cat));
  PC3D.parts = [];
  PC3D.fans = [];
  pc3dClear();
  const caseMesh = pc3dBuildCase(lay);
  caseMesh.userData = { cat: 'case', id: lay.case.comp?.id, name: lay.case.comp?.name || 'Корпус', part: true, price: lay.case.comp?.basePrice || 0 };
  PC3D.root.add(caseMesh);

  lay.parts.forEach(p => {
    p.__animate = !prevIds.has(p.id + '|' + p.cat);
    const mesh = pc3dPartMesh(p);
    PC3D.root.add(mesh);
    PC3D.parts.push(mesh);
  });
  (lay.slots || []).forEach(s => PC3D.root.add(pc3dSlotMesh(s)));

  // сводка и предупреждения
  const info = document.getElementById('pc3dFit');
  if (info) {
    info.innerHTML = lay.warnings.length
      ? lay.warnings.map(w => `<div class="small bad">⚠ ${esc(w)}</div>`).join('')
      : '<div class="small good">✅ Всё установлено и физически влезает в корпус</div>';
  }
  const cnt = document.getElementById('pc3dCount');
  if (cnt) cnt.textContent = `${lay.parts.length} из ${lay.parts.length + lay.slots.length} позиций установлено`;

  // список «что где стоит» — доступный дубль 3D-сцены (и для мобильных, и для чтения скринридером)
  const list = document.getElementById('pc3dList');
  if (list) {
    const rows = lay.parts.map(p => `<button class="pc3d-row" onclick="pc3dInfoPanel('${p.cat}', '${p.id}')">
        <span class="pc3d-row-ic">${PC3D_PARTS[p.cat]?.icon || '•'}</span>
        <span class="grow"><b>${esc(p.name)}</b><span class="small muted">${esc(p.meta || '')}</span></span>
        <span class="small">${p.price ? fmt(p.price) : ''}</span>
      </button>`).join('');
    const empty = lay.slots.map(s => `<button class="pc3d-row empty" onclick="pc3dOpenPicker('${s.cat}')">
        <span class="pc3d-row-ic">＋</span><span class="grow"><b>${esc(s.label)}</b><span class="small muted">пусто — нажмите, чтобы выбрать</span></span>
      </button>`).join('');
    list.innerHTML = rows + empty || '<div class="empty">Корпус пуст — начните с материнской платы.</div>';
  }
}

// Луч по курсору: подсветка и клик
const PC3D_RAY = typeof THREE !== 'undefined' ? new THREE.Raycaster() : null;
const PC3D_POINT = typeof THREE !== 'undefined' ? new THREE.Vector2() : null;
function pc3dPick(ev) {
  if (!PC3D.ready) return null;
  const rect = PC3D.renderer.domElement.getBoundingClientRect();
  PC3D_POINT.set(((ev.clientX - rect.left) / rect.width) * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1);
  PC3D_RAY.setFromCamera(PC3D_POINT, PC3D.camera);
  const hits = PC3D_RAY.intersectObjects(PC3D.root.children, true);
  for (const h of hits) {
    let o = h.object;
    while (o && !o.userData?.part && !o.userData?.slotObj && o !== PC3D.root) o = o.parent;
    if (o && (o.userData?.part || o.userData?.slotObj)) return o;
  }
  return null;
}
function pc3dHover(ev) {
  const hit = pc3dPick(ev);
  const tip = document.getElementById('pc3dTip');
  if (hit !== PC3D.hovered) {
    if (PC3D.hovered?.children) PC3D.hovered.traverse?.(o => { if (o.material?.emissive && o.userData?.wasEmissive !== undefined) o.material.emissive.setHex(o.userData.wasEmissive); });
    PC3D.hovered = hit;
    if (hit) {
      hit.traverse?.(o => {
        if (o.material?.emissive) { o.userData.wasEmissive = o.material.emissive.getHex(); o.material.emissive.setHex(0x2f4f6f); }
      });
    }
  }
  if (tip) {
    if (hit) {
      const u = hit.userData;
      tip.style.display = 'block';
      tip.style.left = (ev.clientX - tip.parentElement.getBoundingClientRect().left + 12) + 'px';
      tip.style.top = (ev.clientY - tip.parentElement.getBoundingClientRect().top + 12) + 'px';
      tip.innerHTML = u.slotObj
        ? `<b>${esc(u.name)}</b><div class="small muted">пусто · нажмите, чтобы выбрать</div>`
        : `<b>${esc(u.name)}</b><div class="small muted">${PC3D_PARTS[u.cat]?.name || ''}${u.price ? ' · ' + fmt(u.price) : ''}</div><div class="small muted">клик — заменить или снять</div>`;
    } else tip.style.display = 'none';
  }
  PC3D.renderer.domElement.style.cursor = hit ? 'pointer' : 'grab';
}

function pc3dClick(ev) {
  const hit = pc3dPick(ev);
  if (!hit) return;
  const u = hit.userData;
  if (u.slotObj) { pc3dOpenPicker(u.slot, u.slotIndex); return; }
  pc3dInfoPanel(u.cat, u.id);
}

// Окно выбора детали для слота
function pc3dOpenPicker(cat, stickIndex) {
  const cfg = catById(cat);
  let pool = (COMPONENTS || []).filter(c => c.cat === cat);
  if (typeof compatibleOptions === 'function') {
    const opts = compatibleOptions(cat, state.builder);
    if (opts && opts.length) pool = opts;
  }
  if (cat === 'ram' && state.socket) pool = pool.filter(c => socketMatchesCategory(c, state.socket));
  const withPrice = pool.map(c => ({ c, price: minPrice(c.id, state.region, 'new') ?? c.basePrice ?? 0 }))
    .sort((a, b) => a.price - b.price);
  if (!withPrice.length) { toast(`Для «${cfg?.name || cat}» нет совместимых вариантов`); return; }
  let m = document.getElementById('pc3dPicker');
  if (!m) {
    m = document.createElement('div');
    m.className = 'modal';
    m.id = 'pc3dPicker';
    document.body.appendChild(m);
  }
  m.innerHTML = `<div class="modal-box" style="max-width:760px">
    <div class="modal-head">
      <div><h3 style="margin:0">${cfg?.icon || '🔧'} Установить: ${esc(cfg?.name || cat)}</h3>
        <div class="small muted">${withPrice.length} совместимых вариантов · цены новых по официальным магазинам · ${esc(regionById(state.region).name)}${stickIndex ? ' · слот ' + stickIndex : ''}</div></div>
      <button class="btn small ghost" onclick="pc3dClosePicker()">✕</button>
    </div>
    <div class="pc3d-picker-list">
      ${withPrice.slice(0, 60).map(x => `<button class="pc3d-pick" onclick="pc3dPickPart('${cat}', '${x.c.id}')">
        <span class="grow"><b>${esc(x.c.name)}</b><span class="small muted">${Object.entries(x.c.specs).slice(0, 3).map(([k, v]) => esc(v)).join(' · ')}</span></span>
        <span class="price-small">${fmt(x.price)}</span>
      </button>`).join('')}
    </div>
  </div>`;
  m.classList.add('open');
}
function pc3dClosePicker() { document.getElementById('pc3dPicker')?.classList.remove('open'); }
function pc3dPickPart(cat, id) {
  if (typeof setBuilderPart === 'function') setBuilderPart(cat, id);
  else { state.builder = { ...state.builder, [cat]: id }; render(); }
  pc3dClosePicker();
  const c = byId(id);
  toast(`${c ? c.name : 'Деталь'} установлен${cat === 'motherboard' || cat === 'cooling' ? 'а' : 'о'} в корпус`);
}

// Инфо-панель по клику на установленную деталь
function pc3dInfoPanel(cat, id) {
  const c = byId(id);
  if (!c) return;
  const price = minPrice(c.id, state.region, 'new') ?? c.basePrice ?? 0;
  const used = minPrice(c.id, state.region, 'used');
  let m = document.getElementById('pc3dInfoModal');
  if (!m) {
    m = document.createElement('div');
    m.className = 'modal'; m.id = 'pc3dInfoModal';
    document.body.appendChild(m);
  }
  m.innerHTML = `<div class="modal-box" style="max-width:620px">
    <div class="modal-head">
      <div><h3 style="margin:0">${PC3D_PARTS[cat]?.icon || '🔧'} ${esc(c.name)}</h3>
        <div class="small muted">${esc(catById(cat)?.name || '')} · ${esc(c.brand)} · ${c.year}</div></div>
      <button class="btn small ghost" onclick="document.getElementById('pc3dInfoModal').classList.remove('open')">✕</button>
    </div>
    <div class="specs-mini">${Object.entries(c.specs).map(([k, v]) => `<div>${k}: <b>${esc(v)}</b></div>`).join('')}</div>
    <div style="margin:12px 0"><span class="price">${fmt(price)}</span> <span class="small muted">новое · магазины</span>
      ${used ? `<div class="small used-est">БУ ≈ ${fmt(used)} · ⚠ проверять самостоятельно</div>` : ''}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn lime" onclick="pc3dOpenPicker('${cat}')">Заменить</button>
      ${cat !== 'case' && cat !== 'motherboard' && cat !== 'cpu' ? `<button class="btn ghost" onclick="pc3dRemove('${cat}')">Снять с корпуса</button>` : ''}
      <button class="btn ghost" onclick="goPriceId('${c.id}')">Цены →</button>
      <button class="btn ghost" onclick="document.getElementById('pc3dInfoModal').classList.remove('open')">Закрыть</button>
    </div>
    <div class="small muted" style="margin-top:10px">Подсказка: тяните мышью, чтобы вращать корпус, колесо — зум, двойной клик — сбросить вид.</div>
  </div>`;
  m.classList.add('open');
}
function pc3dRemove(cat) {
  state.builder = { ...state.builder, [cat]: '' };
  document.getElementById('pc3dInfoModal')?.classList.remove('open');
  render();
  toast('Деталь снята');
}

// Кнопки панели
function pc3dToggleLid() {
  PC3D.lidTarget = PC3D.lidTarget > -0.1 ? -2.0 : 0;
}
function pc3dToggleSpin() { PC3D.autoRotate = !PC3D.autoRotate; toast(PC3D.autoRotate ? 'Корпус вращается' : 'Вращение остановлено'); }
function pc3dNextRgb() {
  const colors = [0x22d3ee, 0xa855f7, 0x22c55e, 0xf59e0b, 0xef4444, 0x3b82f6];
  PC3D.rgb = (PC3D.rgb + 1) % colors.length;
  const c = colors[PC3D.rgb];
  if (PC3D.rgbStrip) { PC3D.rgbStrip.material.color.setHex(c); PC3D.rgbStrip.material.emissive.setHex(c); }
  toast('Подсветка изменена');
}
function pc3dReset() { if (PC3D.applyOrbit) { /* камера сбрасывается двойным кликом */ } PC3D.lidTarget = -2.0; }

// Анимация
function pc3dLoop() {
  if (!PC3D.ready) return;
  PC3D.raf = requestAnimationFrame(pc3dLoop);
  const t = performance.now() / 1000;
  // крышка
  PC3D.lid += (PC3D.lidTarget - PC3D.lid) * 0.08;
  if (PC3D.lidPivot) PC3D.lidPivot.rotation.y = PC3D.lid;
  // вентиляторы
  (PC3D.fans || []).forEach(f => { f.rotation.z += 0.06 * (f.userData.spin || 1); });
  // авто-вращение
  if (PC3D.autoRotate && PC3D.root) PC3D.root.rotation.y += 0.004;
  // «падение» только что установленной детали
  PC3D.parts.forEach(m => {
    const a = m.userData.anim;
    if (!a) return;
    if (m.userData.baseY === undefined) m.userData.baseY = m.position.y;   // запомнили штатное место
    a.t = Math.min(1, a.t + 0.045);
    const k = 1 - Math.pow(1 - a.t, 3);                                     // ease-out: деталь «садится» на место
    m.position.y = m.userData.baseY + 34 * (1 - k);
    if (a.t >= 1) { m.position.y = m.userData.baseY; m.userData.anim = null; }
  });
  // мягкое мерцание подсветки
  if (PC3D.rgbStrip) PC3D.rgbStrip.material.emissiveIntensity = 1.3 + Math.sin(t * 2) * 0.5;
  try { PC3D.renderer.render(PC3D.scene, PC3D.camera); }
  catch (e) { console.warn('render:', e && e.message); }
}

// ---------- Запасной режим без WebGL ----------
function pc3dFallback(host) {
  PC3D.mode = '2d';
  host.innerHTML = `<div class="pc3d-fallback">
    <div class="pc3d-fb-note small">3D недоступно в этом браузере (нет WebGL) — показываю схему корпуса с открытой крышкой.</div>
    <div class="pc3d-fb-case">
      <div class="pc3d-fb-label">Открытая боковая крышка →</div>
      <div id="pc3dFallbackParts" class="pc3d-fb-parts"></div>
    </div>
  </div>`;
  pc3dFallbackParts(PC3D.lastBuild || state.builder);
}
function pc3dFallbackParts(build) {
  const host = document.getElementById('pc3dFallbackParts');
  if (!host) return;
  const lay = PC3D_LAYOUT(build);
  const rows = lay.parts.map(p => `<button class="pc3d-fb-part" onclick="pc3dInfoPanel('${p.cat}','${p.id}')">
      <b>${PC3D_PARTS[p.cat]?.icon || '•'} ${esc(p.name)}</b><span class="small muted">${esc(p.meta || '')}</span></button>`).join('');
  const slots = lay.slots.map(s => `<button class="pc3d-fb-slot" onclick="pc3dOpenPicker('${s.cat}')">+ ${esc(s.label)}</button>`).join('');
  host.innerHTML = rows + slots;
}

// Точка входа
function pc3dInit() {
  const host = document.getElementById('pc3d');
  if (!host) return;
  if (PC3D.ready) { pc3dSync(state.builder); return; }
  pc3dMount();
  if (PC3D.mode === '3d') {
    PC3D.lidTarget = -2.0;                 // крышка сразу открыта
    if (PC3D.renderer) {
      PC3D.renderer.domElement.addEventListener('click', pc3dClick);
      PC3D.renderer.domElement.addEventListener('pointermove', ev => { if (!PC3D.dragging) pc3dHover(ev); });
      PC3D.renderer.domElement.addEventListener('pointerdown', () => { PC3D.dragging = true; setTimeout(() => { PC3D.dragging = false; }, 120); });
    }
  }
  pc3dSync(state.builder);
}
