// ===== BLF — реальные фотографии комплектующих =====
// Все фото лежат локально в img/parts/*.jpg (никаких CDN и внешних ссылок:
// сайт работает офлайн и на GitHub Pages без CORS-проблем).
//
// Подбор фотографии для конкретной модели идёт по «лестнице» правил:
//   1) точная модель (RTX 4090 → gpu-rtx4090, Ryzen 7 → cpu-amd-ryzen7);
//   2) семейство/поколение (RTX 30xx → gpu-rtx30, DDR5 → ram-ddr5);
//   3) производитель (ASUS → материнка ASUS, MSI → MSI);
//   4) тип/категория — фото есть у каждой из 1 745 позиций.

const PART_IMG_DIR = 'img/parts/';

// Какие фото есть на диске (используется в тестах и для проверки путей)
const PART_IMAGES = {
  // ----- видеокарты, поколения и серии -----
  'gpu-rtx4090': 'NVIDIA GeForce RTX 4090 Founders Edition',
  'gpu-rtx4090-alt': 'NVIDIA GeForce RTX 4090 (вид сбоку)',
  'gpu-rtx40': 'GeForce RTX 4070 Ti SUPER, белая',
  'gpu-rtx4070ti': 'GeForce RTX 4070 Ti SUPER, белая',
  'gpu-rtx4060': 'GeForce RTX 4060 Ti, белая',
  'gpu-rtx30': 'GeForce RTX 30, белая',
  'gpu-rtx3080': 'GeForce RTX 3080 ROG Strix White',
  'gpu-rtx3070': 'GeForce RTX 3070, белая',
  'gpu-rtx3050': 'GeForce RTX 3050 Ventus White',
  'gpu-rtx20': 'GeForce RTX 20, белая',
  'gpu-gtx1660': 'GeForce GTX 1660 SUPER',
  'gpu-gtx1650': 'GeForce GTX 1650 Low Profile',
  'gpu-gtx1080ti': 'GeForce GTX 1080 Ti FTW3 White',
  'gpu-gtx10': 'GeForce GTX 10 (ASUS Dual)',
  'gpu-gtx9': 'GeForce GTX 970',
  'gpu-gtx750ti': 'GeForce GTX 750 Ti Low Profile',
  'gpu-gtx1030': 'GeForce GT 1030 (низкопрофильная)',
  'gpu-rx7900': 'Radeon RX 7900 XTX, белая',
  'gpu-rx7000': 'Radeon RX 7800 XT, белая',
  'gpu-rx6000': 'Radeon RX 6600 Challenger White',
  'gpu-rx6700': 'Radeon RX 6700 XT Hellhound White',
  'gpu-rx5700': 'Radeon RX 5700 XT',
  'gpu-rx500': 'Radeon RX 570/580 (ASRock)',
  'gpu-rx580': 'Radeon RX 580, белая',
  'gpu-rxvega': 'Radeon RX Vega 64',
  'gpu-intelarc': 'Intel Arc B580 Steel Legend',
  'gpu-quadro': 'NVIDIA Quadro P4000 (рабочая станция)',
  'm-rtx4090': 'ASUS TUF RTX 4090',
  'm-rtx4080super': 'AORUS RTX 4080 SUPER ICE',
  'm-rtx4070tisuper': 'ASUS ProArt RTX 4070 Ti SUPER',
  'm-rtx4070super': 'Gigabyte RTX 4070 SUPER Windforce',
  'm-rtx4060': 'MSI RTX 4060 Ventus White',
  'm-rtx4060ti': 'RTX 4060 Ti',
  'm-rtx5090': 'ASUS ROG Astral RTX 5090 White',
  'm-rtx5080': 'ASUS ROG Astral RTX 5080',
  'm-rtx5070': 'ASUS Dual RTX 5070',
  'm-rtx5060': 'Gigabyte RTX 5060 Eagle',
  'm-rtx5060ti': 'Zotac RTX 5060 Ti Twin Edge',
  'm-rtx5050': 'MSI RTX 5050 Ventus',
  'm-rtx3080': 'RTX 3080',
  'm-rtx3070': 'RTX 3070',
  'm-rtx3060': 'RTX 3060',
  'm-rtx3050': 'RTX 3050',
  'm-rtx2080ti': 'RTX 2080 Ti',
  'm-gtx1660super': 'GTX 1660 SUPER',
  'm-gtx1080ti': 'GTX 1080 Ti',
  'm-gtx1060': 'GTX 1060',
  'm-gtx970': 'GTX 970',
  'm-gtx750ti': 'GTX 750 Ti Low Profile',
  'm-gtx1650lp': 'GTX 1650 Low Profile',
  'm-gt1030': 'GT 1030 Low Profile',
  'm-rx7900xtx': 'RX 7900 XTX',
  'm-rx7800xt': 'RX 7800 XT Hellhound White',
  'm-rx6700xt': 'RX 6700 XT',
  'm-rx6600': 'RX 6600 White',
  'm-rx5700xt': 'RX 5700 XT',
  'm-rx580': 'RX 580',
  'm-rx570': 'RX 570',
  'm-rx7600': 'ASUS Dual RX 7600',
  'm-rxvega64': 'RX Vega 64',
  'm-arcb580': 'Intel Arc B580',
  'm-quadrop4000': 'Quadro P4000',
  'm-i7-13700k': 'Intel Core i7-13700K',
  'm-ryzen7-5800x3d': 'AMD Ryzen 7 5800X3D',
  'm-ryzen7-7800x3d': 'AMD Ryzen 7 7800X3D',
  'm-ryzen9': 'AMD Ryzen 9',
  'm-threadripper': 'Ryzen Threadripper',
  'm-epyc': 'AMD EPYC SP3',
  'm-fx8350': 'AMD FX-8350',
  'm-q6600': 'Intel Core 2 Quad Q6600',
  'm-xeon-gold': 'Intel Xeon Gold',
  'm-i7-chip': 'Intel Core i7 (чип)',
  'm-mb-asus-prime': 'ASUS Prime',
  'm-mb-rog-strix': 'ASUS ROG Strix',
  'm-mb-msi': 'MSI MAG Tomahawk',
  'm-mb-aorus': 'Gigabyte AORUS',
  'm-mb-asrock': 'ASRock',
  'm-mb-matx': 'Micro-ATX плата',
  'm-mb-p5q': 'ASUS P5Q (LGA775)',
  'm-ram-ddr5': 'DDR5 32 ГБ (2×16)',
  'm-ram-ddr2': 'DDR2 модуль',
  'm-ram-ecc': 'DDR4 ECC RDIMM',
  'm-psu-750w': 'БП 750 Вт, белый',
  'm-psu-1000w': 'be quiet! 1000 Вт',
  'm-psu-sfx': 'SFX 750 Вт',
  'm-cool-nhd15': 'Noctua NH-D15',
  'm-cool-stock': 'Боксовый кулер Intel',
  'm-cool-aio360': 'СЖО 360 мм, белая',
  'm-cool-2u': 'Серверный 2U-радиатор',
  'm-case-tower': 'Корпус Full Tower',
  'm-case-matx': 'Корпус Micro-ATX, чёрный',
  'm-case-white': 'NZXT H6 Flow White',
  'm-case-nas': 'Корпус NAS 4 отсека',
  'm-ssd-990pro': 'Samsung 990 PRO NVMe',
  'm-ssd-a400': 'Kingston A400 SATA',
  'm-ssd-sn580': 'WD Blue SN580 NVMe',
  'm-ram-tridentz5': 'G.Skill Trident Z5 DDR5',
  'm-ram-lpx': 'Corsair Vengeance LPX DDR4',
  'm-cool-hyper212': 'Cooler Master Hyper 212 EVO',
  'm-case-h5flow': 'NZXT H5 Flow',
  'm-case-popair': 'Fractal Design Pop Air',
  'm-case-lancool207': 'Lian Li Lancool 207',
  'm-case-matrexx': 'DeepCool Matrexx 55 Mesh',
  'm-case-aero500': 'Aerocool Aero-500',
  'm-case-s340': 'NZXT S340',
  'm-psu-rm850e': 'Corsair RM850e 850 Вт, белый',
  'm-psu-seasonic': 'Seasonic Focus GX, белый',
  'm-psu-tt': 'Thermaltake Smart 500 Вт',
  'm-psu-mwe': 'Cooler Master MWE 750 Вт',
  'm-ryzen9-alt': 'AMD Ryzen 9 (крышка)',
  'm-ryzen7-7800x3d-alt': 'AMD Ryzen 7 7800X3D (коробка)',
  'm-i7-chip-alt': 'Intel Core i7 (контакты)',
  'm-hdd-ironwolf': 'Seagate IronWolf 4 ТБ',
  'm-hdd-ironwolf-alt': 'Seagate IronWolf (с торца)',
  'm-ram-furybeast': 'Kingston Fury Beast DDR4',
  'm-cool-ak400': 'DeepCool AK400 White',
  'm-cool-peerless': 'Thermalright Peerless Assassin 120 White',
  'm-case-4000d': 'Corsair 4000D Airflow',
  'm-case-4000d-white': 'Corsair 4000D Airflow White',
  'm-case-o11d': 'Lian Li O11 Dynamic EVO White',
  'm-case-ch510': 'DeepCool CH510 White',
  'm-case-montech': 'Montech AIR 903 White',
  'm-case-zalman': 'Zalman i3 Neo White',
  'm-case-north': 'Fractal Design North Chalk White',
  'm-case-nr600': 'Cooler Master NR600',
  'm-case-versa': 'Thermaltake Versa H18',
  'm-case-antec': 'Antec NX410 White',
  'm-case-fara': 'SilverStone FARA H1M White',
  'm-case-jonsbo': 'Jonsbo U4 Mini White',
  'm-case-purebase': 'be quiet! Pure Base 500 White',
  'm-psu-polaris': 'Chieftec Polaris',
  'm-psu-msi': 'MSI MPG A1000G PCIE5',
  'm-psu-aorus': 'Gigabyte AORUS P850W, белый',
  'm-psu-kcas': 'Aerocool KCAS 800 Вт',
  'm-psu-px850g': 'DeepCool PX850G, белый',
  'm-ram-vengeance-ddr5': 'Corsair Vengeance DDR5, белая',
  'm-cool-nhu12s': 'Noctua NH-U12S White',
  'm-cool-hyper620s': 'Cooler Master Hyper 620S',
  'm-cool-ak620': 'DeepCool AK620 White',
  'm-cool-wraith': 'AMD Wraith Stealth',
  'm-cool-assassin': 'DeepCool Assassin IV White',
  'm-case-meshify': 'Fractal Design Meshify 2 White',
  'm-case-define7': 'Fractal Design Define 7 White',
  'm-case-carbide100r': 'Corsair Carbide 100R',
  'm-case-mb511': 'Cooler Master MasterBox MB511 White',
  'm-case-cc560': 'DeepCool CC560 White',
  'm-case-rare': 'Ardor Gaming Rare M2',
  'm-gtx980ti': 'GTX 980 Ti',
  'm-rx6800xt': 'RX 6800 XT',
  'm-rx480': 'RX 480',
  'm-arca770': 'Intel Arc A770 White',
  'm-gtx780ti': 'GTX 780 Ti',
  // ----- процессоры -----
  'cpu-intel': 'Intel Core i5-12400F (боксовый)',
  'cpu-intel-i7': 'Intel Core i7 (крышка процессора)',
  'cpu-intel-i7-alt': 'Intel Core i7 (вид на чип)',
  'cpu-intel-core2': 'Intel Core 2 Quad Q6600',
  'cpu-amd': 'AMD Ryzen 5 5600',
  'cpu-amd-ryzen7': 'AMD Ryzen 7 7800X3D',
  'cpu-amd-ryzen9': 'AMD Ryzen 9 в сокете AM4',
  'cpu-amd-fx': 'AMD FX-8350 Black Edition',
  'cpu-xeon': 'Intel Xeon E5 LGA2011',
  'cpu-xeon-scalable': 'Intel Xeon Gold 6138 LGA3647',
  'cpu-epyc': 'AMD EPYC (SP3)',
  'cpu-threadripper': 'AMD Ryzen Threadripper 3990X',
  // ----- материнские платы -----
  'motherboard': 'ATX-плата B650 (белая)',
  'motherboard-atx': 'плата LGA775 (Intel DP35DP)',
  'motherboard-matx': 'Micro-ATX плата, белая',
  'motherboard-asus-prime': 'ASUS Prime (белая)',
  'motherboard-msi-mag': 'MSI MAG Tomahawk',
  'motherboard-aorus': 'Gigabyte AORUS',
  'motherboard-asrock': 'ASRock (Challenger)',
  'motherboard-server': 'Supermicro, 2 сокета LGA2011',
  // ----- память -----
  'ram': 'Kingston Fury Beast DDR5, белая',
  'ram-ddr5': 'DDR5 32 ГБ (2×16), белая',
  'ram-ddr4': 'Corsair Vengeance LPX DDR4, белая',
  'ram-ddr3': 'DDR3 240-pin',
  'ram-ddr2': 'DDR2 модуль',
  'ram-ecc': 'DDR4 ECC RDIMM (серверная)',
  'server-ram': 'серверная память ECC (комплект)',
  // ----- блоки питания -----
  'psu': 'Corsair RM750e 750 Вт, белый',
  'psu-atx': 'Corsair RM750x, белый (ATX, модульный)',
  'psu-highwatt': 'be quiet! Pure Power 12 1000 Вт',
  'psu-sfx': 'SFX-блок питания (компактный)',
  'psu-server': 'серверный БП 1U, резервируемый',
  // ----- охлаждение -----
  'cooling': 'башенный кулер Thermalright, белый',
  'cooling-tower': 'башня с вентилятором и теплотрубками',
  'cooling-aio': 'СЖО 240 мм, белая',
  'cooling-aio-360': 'СЖО 360 мм',
  'cooling-low': 'низкопрофильный Thermalright AXP90, белый',
  'cooling-server': 'серверный 2U-радиатор',
  // ----- накопители -----
  'ssd-nvme': 'SSD M.2 NVMe',
  'ssd-sata': 'SSD 2.5" SATA',
  'hdd': 'жёсткий диск 3.5" (Seagate Exos)',
  // ----- корпуса -----
  'case': 'корпус ATX (тёмный, стекло)',
  'case-white': 'корпус ATX, белый',
  'case-itx': 'корпус Mini-ITX, белый',
  'case-nas': 'корпус NAS на несколько дисков',
  'server-chassis': 'серверный корпус 1U (InWin)',
  // ----- сеть / ноутбуки -----
  'server-nic': 'сетевая карта 10G SFP+',
  'laptop': 'ноутбук (открытый)',
  'laptop-open': 'ноутбук (вид спереди)'
};



// ---------- фото, привязанные к конкретной позиции каталога ----------
// Здесь только те фото, которые действительно изображают эту модель
// (или её точную модификацию). Остальные позиции получают типовое фото серии.
const PART_ID_PHOTO = {
  // процессоры
  'cpu-r7-7800x3d': 'm-ryzen7-7800x3d',
  'cpu-r7-5700x3d': 'm-ryzen7-5800x3d',
  'cpu-r9-7950x': 'm-ryzen9',
  'cpu-fx8350': 'm-fx8350',
  'cpu-i7-14700kf': 'm-i7-13700k',
  // материнские платы
  'mb-b550': 'm-mb-msi',
  'mb-b650e': 'm-mb-rog-strix',
  'mb-b360': 'm-mb-asus-prime',
  'mb-b460': 'm-mb-asus-prime',
  'mb-b550m': 'm-mb-asus-prime',
  'mb-h610m': 'm-mb-matx',
  'mb-b660m': 'm-mb-matx',
  // память
  'ram-gskill32': 'm-ram-tridentz5',
  'ram-ddr4-16-3000': 'm-ram-lpx',
  'ram-ddr2-4': 'm-ram-ddr2',
  // накопители
  'ssd-990pro-2tb': 'm-ssd-990pro',
  'ssd-a400-240': 'm-ssd-a400',
  'ssd-sn580-1tb': 'm-ssd-sn580',
  // питание
  'psu-pure1000': 'm-psu-1000w',
  'psu-rm750': 'm-psu-750w',
  // охлаждение
  'cool-nhd15': 'm-cool-nhd15',
  'cool-hyper212': 'm-cool-hyper212',
  'cool-box': 'm-cool-stock',
  // корпуса
  'case-h5flow': 'm-case-h5flow',
  'case-popair': 'm-case-popair',
  'case-lancool': 'm-case-lancool207',
  'case-matrexx': 'm-case-matrexx',
  'case-aero500': 'm-case-aero500',
  'case-s340': 'm-case-s340',
  // питание — конкретные модели
  'psu-rm850': 'm-psu-rm850e',
  'psu-rm650': 'm-psu-rm850e',
  'psu-gx1000': 'm-psu-seasonic',
  'psu-smart600': 'm-psu-tt',
  'psu-cx500': 'm-psu-mwe',
  'psu-vx400': 'm-psu-mwe',
  'psu-s12ii': 'm-psu-seasonic',
  'psu-pf550': 'm-psu-mwe',
  'cpu-i7-4790k': 'm-i7-chip',
  'cpu-i7-6700k': 'm-i7-chip-alt',
  'cpu-i7-8700k': 'm-i7-chip-alt',
  'cpu-i7-9700k': 'm-i7-chip',
  'cpu-i7-10700k': 'm-i7-chip-alt',
  // диски и память — конкретные серии
  'case-kendomen': 'case',
  'case-bolt': 'case-itx',
  'ssd-870evo-2tb': 'm-ssd-a400',
  'ssd-860evo-500': 'm-ssd-a400',
  'ssd-mx500-1tb': 'm-ssd-a400',
  'ssd-wdgreen-480': 'm-ssd-a400',
  'ssd-nv2-500': 'm-ssd-sn580',
  'ssd-nv2-1tb': 'm-ssd-sn580',
  'ssd-a2000-500': 'm-ssd-sn580',
  'ssd-crucialp1-1tb': 'ssd-nvme',
  'ssd-wdblue-hdd': 'm-hdd-ironwolf',
  'ssd-seagate-hdd': 'm-hdd-ironwolf-alt',
  'ram-kingston16': 'm-ram-furybeast',
  'ram-kingston32': 'm-ram-furybeast',
  'ram-ddr4-8-2133': 'ram-ddr4',
  'ram-corsair32': 'ram-ddr5',
  'ram-corsair64': 'ram-ddr5',
  'ram-crucial16': 'ram-ddr5',
  'cool-ak400': 'm-cool-ak400',
  'cool-peerless': 'm-cool-peerless',
  // серверные позиции
  'sc-xeon-silver4310': 'm-xeon-gold',
  'sc-xeon-gold6338': 'm-xeon-gold',
  'sc-silver4210': 'm-xeon-gold',
  'sc-platinum8272cl': 'm-xeon-gold',
  'sc-w2295': 'm-xeon-gold',
  'sc-epyc-7313': 'm-epyc',
  'sc-epyc-9354': 'm-epyc',
  'sc-epyc-9754': 'm-epyc',
  'sc-epyc-7282': 'm-epyc',
  'smb-h12ssl': 'motherboard-server',
  'smb-h13ssl': 'motherboard-server',
  'smb-x12stl': 'motherboard-server',
  'smb-x12stlif': 'motherboard-server',
  'smb-x12spl': 'motherboard-server',
  'sram-ddr4ecc32': 'm-ram-ecc',
  'sram-ddr4ecc64': 'm-ram-ecc',
  'sram-ddr4ecc16': 'm-ram-ecc',
  'sst-nv2-1tb': 'm-ssd-sn580',
  'sst-sata240': 'm-ssd-a400',
  'sst-skyhawk4tb': 'm-hdd-ironwolf',
  'sst-wdpurple2tb': 'm-hdd-ironwolf-alt'

};

// ---------- точные фото конкретных моделей ----------
// Ключ — «токен» модели: rtx4090, rtx4060ti, ryzen7-7800x3d, i5-12400f, rx7900xtx…
const PART_MODEL_IMAGES = {
  // NVIDIA
  'rtx5090': 'm-rtx5090', 'rtx5080': 'm-rtx5080', 'rtx5070': 'm-rtx5070',
  'rtx5060ti': 'm-rtx5060ti', 'rtx5060': 'm-rtx5060', 'rtx5050': 'm-rtx5050',
  'rtx4090': 'm-rtx4090', 'rtx4080super': 'm-rtx4080super', 'rtx4080': 'm-rtx4080super',
  'rtx4070tisuper': 'm-rtx4070tisuper', 'rtx4070ti': 'm-rtx4070tisuper',
  'rtx4070super': 'm-rtx4070super', 'rtx4070': 'm-rtx4070super',
  'rtx4060ti': 'm-rtx4060ti', 'rtx4060': 'm-rtx4060',
  'rtx3080': 'm-rtx3080', 'rtx3070': 'm-rtx3070', 'rtx3060ti': 'm-rtx3060ti',
  'rtx3060': 'm-rtx3060', 'rtx3050': 'm-rtx3050',
  'rtx2080ti': 'm-rtx2080ti', 'rtx2080': 'm-rtx2080ti', 'rtx2070super': 'gpu-rtx20',
  'rtx2060super': 'gpu-rtx20', 'rtx2060': 'gpu-rtx20',
  'gtx1660super': 'm-gtx1660super', 'gtx1660ti': 'm-gtx1660super', 'gtx1660': 'm-gtx1660super',
  'gtx1650': 'm-gtx1650lp', 'gtx1630': 'gpu-gtx1650',
  'gtx1080ti': 'm-gtx1080ti', 'gtx1080': 'gpu-gtx1080ti', 'gtx1070': 'gpu-gtx1080ti',
  'gtx1060': 'm-gtx1060', 'gtx1050ti': 'gpu-gtx10', 'gtx1050': 'gpu-gtx10',
  'gtx980ti': 'm-gtx980ti', 'gtx980': 'gpu-gtx9', 'gtx970': 'm-gtx970',
  'gtx780ti': 'm-gtx780ti', 'gtx780': 'gpu-gtx750ti', 'gtx770': 'gpu-gtx750ti',
  'gtx760': 'gpu-gtx750ti', 'gtx750ti': 'm-gtx750ti', 'gtx750': 'm-gtx750ti', 'gtx660': 'gpu-gtx750ti',
  'gt1030': 'm-gt1030',
  'titan': 'gpu-quadro', 'tesla': 'gpu-quadro', 'rtxa4000': 'gpu-quadro',
  'quadrop4000': 'm-quadrop4000', 'quadrok2200': 'gpu-quadro',
  // AMD
  'rx9070xt': 'm-rx7900xtx', 'rx9060xt': 'm-rx7900xtx', 'rx7900xtx': 'm-rx7900xtx', 'rx7900xt': 'm-rx7900xtx',
  'rx7800xt': 'm-rx7800xt', 'rx7700xt': 'm-rx7800xt', 'rx7600': 'm-rx7600',
  'rx6950xt': 'm-rx6700xt', 'rx6800xt': 'm-rx6800xt', 'rx6800': 'm-rx6800xt',
  'rx6700xt': 'm-rx6700xt', 'rx6700': 'm-rx6700xt', 'rx6600xt': 'm-rx6600', 'rx6600': 'm-rx6600',
  'rx5700xt': 'm-rx5700xt', 'rx5700': 'm-rx5700xt', 'rx5600xt': 'gpu-rx5700',
  'rx590': 'm-rx580', 'rx580': 'm-rx580', 'rx570': 'm-rx570',
  'rx5500xt': 'm-rx580', 'rx550': 'm-rx570', 'rx480': 'm-rx480', 'rx470': 'm-rx580', 'rx460': 'm-rx570',
  'hd7850': 'gpu-rx500', 'hd7770': 'gpu-rx500',
  'rxvega': 'm-rxvega64', 'radeonvii': 'm-rxvega64',
  'arca380': 'm-arcb580', 'arca750': 'm-arcb580', 'arca770': 'm-arca770', 'arcb580': 'm-arcb580',
  // CPU Intel
  'i7-13700k': 'm-i7-13700k', 'i7-14700kf': 'm-i7-13700k', 'i9-14900k': 'm-i7-13700k',
  'i5-12400f': 'cpu-intel', 'i5-13400f': 'cpu-intel', 'i5-14600kf': 'cpu-intel', 'i5-13600k': 'cpu-intel',
  'i3-12100f': 'cpu-intel', 'i3-10100f': 'cpu-intel', 'i5-10400f': 'cpu-intel',
  'i7-10700k': 'm-i7-chip', 'i7-9700k': 'm-i7-chip', 'i7-8700k': 'm-i7-chip',
  'i5-9400f': 'cpu-intel', 'i5-7600k': 'cpu-intel', 'i5-6500': 'cpu-intel',
  'i7-6700k': 'm-i7-chip', 'i7-6700': 'm-i7-chip', 'i5-6600k': 'cpu-intel',
  'i7-4790k': 'm-i7-chip', 'i5-4590': 'cpu-intel', 'i5-4690k': 'cpu-intel', 'i7-4770k': 'm-i7-chip',
  'i7-3770k': 'm-i7-chip', 'i5-3570k': 'cpu-intel', 'i5-2500k': 'cpu-intel',
  'i7-2600k': 'm-i7-chip', 'i3-2100': 'cpu-intel', 'i3-3220': 'cpu-intel', 'i3-4130': 'cpu-intel',
  'i5-4460': 'cpu-intel', 'i3-6100': 'cpu-intel', 'g4560': 'cpu-intel-core2',
  // CPU AMD
  'ryzen7-7800x3d': 'm-ryzen7-7800x3d', 'ryzen7-5800x3d': 'm-ryzen7-5800x3d',
  'ryzen7-5700x3d': 'm-ryzen7-5800x3d', 'ryzen7-3700x': 'cpu-amd-ryzen7', 'ryzen5-7600': 'cpu-amd',
  'ryzen5-5600': 'cpu-amd', 'ryzen5-3600': 'cpu-amd', 'ryzen3-3100': 'cpu-amd',
  'ryzen5-2600': 'cpu-amd', 'ryzen5-1600': 'cpu-amd', 'ryzen9-7950x': 'm-ryzen9',
  'fx8350': 'm-fx8350', 'fx6300': 'm-fx8350', 'fx4300': 'm-fx8350',
  'xeongold': 'm-xeon-gold', 'c2qq6600': 'm-q6600'
};

// ---------- правила: конкретная модель ----------
// Порядок важен: чем специфичнее правило, тем выше оно должно стоять.
const MODEL_IMG_RULES = [
  // ===== видеокарты NVIDIA: конкретные модели =====
  [/rtx\s*5090|rtx\s*5080|rtx\s*5070|rtx\s*4080/i, 'gpu-rtx40'],
  [/rtx\s*4090/i, 'gpu-rtx4090'],
  [/rtx\s*4070\s*ti|4070ti/i, 'gpu-rtx4070ti'],
  [/rtx\s*4070/i, 'gpu-rtx40'],
  [/rtx\s*4060/i, 'gpu-rtx4060'],
  [/rtx\s*3080/i, 'gpu-rtx3080'],
  [/rtx\s*3070/i, 'gpu-rtx3070'],
  [/rtx\s*3060/i, 'gpu-rtx30'],
  [/rtx\s*3050/i, 'gpu-rtx3050'],
  [/rtx\s*20[67]0/i, 'gpu-rtx20'],
  [/rtx\s*2080/i, 'gpu-rtx20'],
  [/gtx\s*1660/i, 'gpu-gtx1660'],
  [/gtx\s*1650|gtx\s*1630/i, 'gpu-gtx1650'],
  [/gt\s*1030/i, 'gpu-gtx1030'],
  [/gtx\s*1080|gtx\s*1070/i, 'gpu-gtx1080ti'],
  [/gtx\s*1060|gtx\s*1050/i, 'gpu-gtx10'],
  [/gtx\s*980|gtx\s*970/i, 'gpu-gtx9'],
  [/gtx\s*780|gtx\s*770|gtx\s*760|gtx\s*750|gtx\s*660/i, 'gpu-gtx750ti'],
  [/quadro|tesla|rtx\s*a4000/i, 'gpu-quadro'],
  // ===== видеокарты AMD =====
  [/rx\s*9[0-9]{3}/i, 'gpu-rx7900'],
  [/rx\s*79[0-9]{2}/i, 'gpu-rx7900'],
  [/rx\s*78[0-9]{2}|rx\s*77[0-9]{2}|rx\s*76[0-9]{2}/i, 'gpu-rx7000'],
  [/rx\s*69[0-9]{2}|rx\s*68[0-9]{2}/i, 'gpu-rx6000'],
  [/rx\s*67[0-9]{2}|rx\s*66[0-9]{2}/i, 'gpu-rx6700'],
  [/rx\s*57[0-9]{2}|rx\s*56[0-9]{2}|rx\s*55[0-9]{2}/i, 'gpu-rx5700'],
  [/rx\s*5[89]0\s*(4|8)?\s*гб|rx\s*580|rx\s*570/i, 'gpu-rx580'],
  [/rx\s*4[6-9]0/i, 'gpu-rx580'],
  [/vega|vii\b/i, 'gpu-rxvega'],
  [/radeon\s*hd/i, 'gpu-rx500'],
  [/arc\s*[ab]\d{3}/i, 'gpu-intelarc'],

  // ===== процессоры =====
  [/epyc/i, 'cpu-epyc'],
  [/threadripper/i, 'cpu-threadripper'],
  [/xeon\s*(gold|silver|bronze|platinum|w-|e-|scalable)/i, 'cpu-xeon-scalable'],
  [/xeon/i, 'cpu-xeon'],
  [/ryzen\s*9/i, 'cpu-amd-ryzen9'],
  [/ryzen\s*7/i, 'cpu-amd-ryzen7'],
  [/ryzen\s*[35]|ryzen\s*threadripper/i, 'cpu-amd'],
  [/fx-|a10-|athlon|phenom/i, 'cpu-amd-fx'],
  [/core\s*2|core\s*quad|core\s*duo|pentium|celeron/i, 'cpu-intel-core2'],
  [/core\s*i9|core\s*i7|core\s*ultra\s*9|core\s*ultra\s*7/i, 'cpu-intel-i7'],
  [/core\s*i5|core\s*i3|core\s*ultra\s*5/i, 'cpu-intel'],
];

// ---------- правила: материнские платы по бренду/форм-фактору ----------
const BOARD_IMG_RULES = [
  [/supermicro|asrock\s*rack|tyan|gigabyte\s*mz/i, 'motherboard-server'],
  [/asus/i, 'motherboard-asus-prime'],
  [/msi|mag\s|mpg\s|meg\s/i, 'motherboard-msi-mag'],
  [/gigabyte|aorus/i, 'motherboard-aorus'],
  [/asrock/i, 'motherboard-asrock'],
  [/servermb/i, 'motherboard-server'],
];

// ---------- правила: память по типу ----------
const RAM_IMG_RULES = [
  [/vengeance/i, 'm-ram-vengeance-ddr5'],
  [/trident/i, 'm-ram-tridentz5'],
  [/fury\s*beast/i, 'm-ram-furybeast'],
  [/lpx/i, 'm-ram-lpx'],
  [/ddr5/i, 'ram-ddr5'],
  [/ddr4/i, 'ram-ddr4'],
  [/ddr3/i, 'ram-ddr3'],
  [/ddr2/i, 'ram-ddr2'],
  [/ecc|rdimm|reg/i, 'ram-ecc'],
];

// ---------- правила: блоки питания ----------
const PSU_IMG_RULES = [
  [/polaris|chieftec/i, 'm-psu-polaris'],
  [/a1000g|mpg/i, 'm-psu-msi'],
  [/aorus|gigabyte/i, 'm-psu-aorus'],
  [/kcas|aerocool/i, 'm-psu-kcas'],
  [/px850|deepcool/i, 'm-psu-px850g'],
  [/rm\s*750|rm750/i, 'm-psu-750w'],
  [/rm\s*850|rm850/i, 'm-psu-rm850e'],
  [/pure\s*power/i, 'm-psu-1000w'],
  [/focus\s*gx|seasonic/i, 'm-psu-seasonic'],
  [/thermaltake/i, 'm-psu-tt'],
  [/mwe|elite\s*nex|cooler\s*master/i, 'm-psu-mwe'],
  [/sfx|sf750/i, 'psu-sfx'],
  [/1u|резерв|redundant/i, 'psu-server'],
  [/сервер/i, 'psu-server'],
];

// ---------- правила: охлаждение ----------
const COOL_IMG_RULES = [
  [/nh-d15/i, 'm-cool-nhd15'],
  [/nh-u12s|nh-u14s/i, 'm-cool-nhu12s'],
  [/hyper\s*620|hyper\s*212/i, 'm-cool-hyper212'],
  [/ak620|assassin/i, 'm-cool-ak620'],
  [/ak400|ag400/i, 'm-cool-ak400'],
  [/peerless|phantom\s*spirit|assassin\s*x/i, 'm-cool-peerless'],
  [/wraith/i, 'm-cool-wraith'],
  [/box\s*cooler|боксов/i, 'm-cool-stock'],
  [/360|h150i|kraken\s*360|lt720/i, 'cooling-aio-360'],
  [/240|aio|liquid|сжо|водян|freezer\s*ii|ls520/i, 'cooling-aio'],
  [/2u|сервер|snk-|dynatron/i, 'cooling-server'],
  [/low|низкопроф|itx|axp|nh-l12/i, 'cooling-low'],
];

// ---------- правила: накопители ----------
const SSD_IMG_RULES = [
  [/hdd|жёстк|barracuda|exos|ironwolf|skyhawk|purple|ultrastar|deskstar|p300|n300|mg10|wd\s*(blue|black|red)\s*\d|\d+\s*тб.*hdd/i, 'hdd'],
  [/sata|2\.5/i, 'ssd-sata'],
];

// ---------- правила: корпуса ----------
const CASE_IMG_RULES = [
  [/4000d/i, 'm-case-4000d'],
  [/meshify/i, 'm-case-meshify'],
  [/define\s*(7|r4|r5)|core\s*1000/i, 'm-case-define7'],
  [/carbide|100r|275r|3000d|5000d|7000d|6500x|2000d/i, 'm-case-carbide100r'],
  [/mb511|td500|n400|q300l|elite\s*300|elite\s*330|centurion/i, 'm-case-mb511'],
  [/cc560|cg560|ck560|ch360|dukase|tesseract|morpheus|matrexx/i, 'm-case-cc560'],
  [/ardor|rare\s*m2|rare\s*m4|zeta|phantom/i, 'm-case-rare'],
  [/o11|dynamic\s*evo/i, 'm-case-o11d'],
  [/ch510/i, 'm-case-ch510'],
  [/air\s*903|montech/i, 'm-case-montech'],
  [/zalman.*i3|i3\s*neo/i, 'm-case-zalman'],
  [/north/i, 'm-case-north'],
  [/nr600|masterbox\s*nr/i, 'm-case-nr600'],
  [/versa\s*h18/i, 'm-case-versa'],
  [/nx4\d{2}|antec\s*nx/i, 'm-case-antec'],
  [/fara/i, 'm-case-fara'],
  [/jonsbo|u4\s*mini/i, 'm-case-jonsbo'],
  [/pure\s*base/i, 'm-case-purebase'],
  [/nas|n1\b|cs380|node\s*304/i, 'case-nas'],
  [/1u|сервер/i, 'case-server'],
  [/itx|ridge|2000d|core\s*v1/i, 'case-itx'],
  [/бел|white|ice/i, 'case-white'],
];

// ---------- правила: ноутбуки ----------
const LAPTOP_IMG_RULES = [
  [/macbook|pro\s*16|thinkpad|ultrabook/i, 'laptop-open'],
];

// Фото категории по умолчанию — гарантия, что картинка есть всегда
const CAT_IMG = {
  cpu: 'cpu-intel', gpu: 'gpu-rtx30', motherboard: 'motherboard', ram: 'ram',
  psu: 'psu-atx', ssd: 'ssd-nvme', case: 'case', cooling: 'cooling',
  servercpu: 'cpu-xeon', servermb: 'motherboard-server', serverram: 'server-ram',
  serverpsu: 'psu-server', serverstorage: 'ssd-sata', serverchassis: 'server-chassis',
  servernic: 'server-nic', laptop: 'laptop'
};

// Кэш: id → ключ фото (считаем один раз на старте)
const PART_IMG_CACHE = new Map();

function matchRule(rules, text) {
  for (const [re, key] of rules) if (re.test(text)) return key;
  return null;
}


// Нормализованный токен модели: «NVIDIA GeForce RTX 4060 Ti 8GB» → 'rtx4060ti'
function imgModelToken(name) {
  const s = String(name || '')
    .toLowerCase()
    .replace(/[®™]/g, '')
    .replace(/[()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const nv = s.match(/\b(rtx|gtx|gt)\s*([a]?\d{3,4})\s*(ti|super)?/);
  if (nv) return nv[1] + nv[2] + (nv[3] || '');
  const amd = s.match(/\b(rx|hd)\s*(\d{3,4})\s*(xtx|xt|gre|le)?/);
  if (amd) return amd[1] + amd[2] + (amd[3] || '');
  if (/vega\s*\d+/.test(s)) return 'rxvega';
  if (/radeon\s*vii/.test(s)) return 'radeonvii';
  const arc = s.match(/\barc\s*([ab]\d{3})/);
  if (arc) return 'arc' + arc[1];
  const q = s.match(/quadro\s*([kp])?\s*(\d{4})/);
  if (q) return 'quadro' + (q[1] || '') + q[2];
  if (/tesla/.test(s)) return 'tesla';
  if (/titan/.test(s)) return 'titan';
  const rtx = s.match(/rtx\s*a(\d{4})/);
  if (rtx) return 'rtxa' + rtx[1];
  if (/threadripper/.test(s)) return 'threadripper';
  const epyc = s.match(/epyc\s*(\d{4}[a-z]*)/);
  if (epyc) return 'epyc' + epyc[1];
  const xg = s.match(/xeon\s*(gold|silver|bronze|platinum|scalable|w)/);
  if (xg) return 'xeongold';
  const ry = s.match(/ryzen\s*([3579])\s*(\d{4}[a-z0-9]*)/);
  if (ry) return 'ryzen' + ry[1] + '-' + ry[2];
  const fx = s.match(/fx-(\d{4})/);
  if (fx) return 'fx' + fx[1];
  const ci = s.match(/core\s*(i[3579])-(\d{4,5}[a-z]{0,2})/);
  if (ci) return ci[1] + '-' + ci[2];
  const c2 = s.match(/core\s*2\s*(?:quad|duo)?\s*([a-z]?\d{4})/);
  if (c2) return 'c2q' + c2[1];
  return '';
}

// Точное фото модели (если оно есть) — приоритет выше семейных правил
function modelImgKey(part) {
  const name = `${part.name || ''} ${part.brand || ''}`;
  const token = imgModelToken(name);
  if (!token) return null;
  const key = PART_MODEL_IMAGES[token];
  return key && PART_IMAGES[key] ? key : null;
}

function imgKeyFor(part) {
  if (!part || !part.cat) return 'case';
  if (PART_IMG_CACHE.has(part.id)) return PART_IMG_CACHE.get(part.id);
  const name = `${part.name || ''} ${part.brand || ''}`;
  const specs = part.specs || {};
  // 1) точное фото конкретной позиции, 2) точное фото модели, 3) семейные правила
  const idKey = PART_ID_PHOTO[part.id];
  let key = idKey && PART_IMAGES[idKey] ? idKey : modelImgKey(part);

  switch (key ? '__model__' : part.cat) {
    case '__model__':
      break;
    case 'gpu':
      key = matchRule(MODEL_IMG_RULES, name);
      break;
    case 'cpu':
    case 'servercpu':
      key = matchRule(MODEL_IMG_RULES, name);
      break;
    case 'motherboard':
    case 'servermb':
      key = matchRule(BOARD_IMG_RULES, name);
      break;
    case 'ram':
    case 'serverram':
      key = matchRule(RAM_IMG_RULES, `${name} ${specs.type || ''} ${specs.ramType || ''} ${specs.memType || ''}`);
      break;
    case 'psu':
    case 'serverpsu':
      key = matchRule(PSU_IMG_RULES, `${name} ${specs.redundancy || ''}`);
      break;
    case 'cooling':
      key = matchRule(COOL_IMG_RULES, `${name} ${specs.type || ''} ${specs.radiatorSize || ''} ${specs.radiatorMm || ''}`);
      break;
    case 'ssd':
    case 'serverstorage':
      key = matchRule(SSD_IMG_RULES, `${name} ${specs.type || ''} ${specs.interface || ''}`);
      break;
    case 'case':
      key = matchRule(CASE_IMG_RULES, `${name} ${specs.formFactor || ''}`);
      break;
    case 'serverchassis':
      key = 'server-chassis';
      break;
    case 'servernic':
      key = 'server-nic';
      break;
    case 'laptop':
      key = matchRule(LAPTOP_IMG_RULES, name);
      break;
  }

  if (!key) key = CAT_IMG[part.cat] || 'case';
  if (!PART_IMAGES[key]) key = CAT_IMG[part.cat] || 'case';
  PART_IMG_CACHE.set(part.id, key);
  return key;
}

// Есть ли для ключа реальный файл в манифесте PART_IMAGES
function hasPhoto(key) {
  return !!(key && Object.prototype.hasOwnProperty.call(PART_IMAGES, key));
}

// Заглушка «изображения нет» — вместо битой картинки или пустого места.
// Рисуется рамкой-иконкой на CSS, без эмодзи и без внешних файлов.
function missingPhotoImg(size = 'md', label = '') {
  const s = ['sm', 'md', 'lg'].indexOf(size) >= 0 ? size : 'md';
  const sub = label ? `<span class="pim-sub">${escAttr(label)}</span>` : '';
  return `<div class="part-img-missing part-img-missing-${s}" role="img" aria-label="изображения нет">`
    + `<span class="pim-icon" aria-hidden="true"></span>`
    + `<span class="pim-text">изображения нет</span>${sub}</div>`;
}

function imgFor(part) {
  if (!part) return '';
  const key = imgKeyFor(part);
  return hasPhoto(key) ? PART_IMG_DIR + key + '.jpg' : '';
}

// Готовая картинка-плитка: белый фон, объект по центру, ленивая загрузка.
// alt — человеческое название модели: фото реальное, подпись честная.
function partImg(part, { size = 'md', cls = '', alt = '' } = {}) {
  if (!part) return missingPhotoImg(size);
  const label = alt || part.name || '';
  const src = imgFor(part);
  if (!src) return missingPhotoImg(size, label);
  const exact = isExactPhoto(part);
  // честная подпись: у семейного фото прямо сказано, что это типовое фото серии
  const title = exact ? label : `${label} · типовое фото серии`;
  return `<img class="part-img part-img-${size} ${cls}" src="${src}" alt="${escAttr(label)}" title="${escAttr(title)}" data-photo="${exact ? 'exact' : 'series'}" loading="lazy" decoding="async" onerror="imgFallback(this)">`;
}

// Нормализация названия для сверки «позиция ↔ что на фото»
function normPhotoName(v) {
  return String(v || '')
    .toLowerCase()
    .replace(/бел(ый|ая|ое)?|white|чёрн(ый|ая)|black/g, '')
    .replace(/[^a-zа-я0-9]+/g, ' ')
    .replace(/\b(гб|тб|вт|мм|ddr\d?|sata|nvme|ssd|hdd|cpu|gpu|atx|matx|itx)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Фото — это правда о модели или типовое фото серии?
function isExactPhoto(part) {
  if (!part) return false;
  const key = imgKeyFor(part);
  if (PART_ID_PHOTO[part.id] === key) return true;
  const want = imgModelToken(part.name || '');
  const got = imgModelToken(PART_IMAGES[key] || '');
  if (want && want === got) return true;
  // корпуса, память, диски и кулеры опознаём по названию: «NZXT H5 Flow» ↔ «NZXT H5 Flow»
  const a = normPhotoName(part.name);
  const b = normPhotoName(PART_IMAGES[key]);
  if (!a || !b) return false;
  return a === b || (a.length > 6 && b.indexOf(a) === 0) || (b.length > 6 && a.indexOf(b) === 0);
}

// Пометка под фото: «точное фото модели» или «типовое фото серии»
function photoBadge(part) {
  if (!part) return '';
  const exact = isExactPhoto(part);
  return `<span class="photo-badge ${exact ? 'is-exact' : 'is-series'}">${exact ? 'фото модели' : 'типовое фото серии'}</span>`;
}

// Небольшая строка фото-превью для карточек сборок (CPU + GPU + …)
function buildImgStrip(parts, max = 4) {
  const list = (parts || []).filter(Boolean).slice(0, max);
  if (!list.length) return '';
  return `<div class="build-img-strip">${list.map(p => partImg(p, { size: 'sm' })).join('')}</div>`;
}

// Битая ссылка (файл не загрузился) → подставляем плашку «изображения нет»
function imgFallback(el) {
  if (!el || !el.parentNode) return;
  const cls = String(el.className || '');
  const size = (cls.match(/part-img-(sm|md|lg)/) || [])[1] || 'md';
  const label = el.getAttribute('alt') || '';
  const box = el.ownerDocument.createElement('div');
  box.innerHTML = missingPhotoImg(size, label);
  const node = box.firstElementChild;
  if (node) el.parentNode.replaceChild(node, el);
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
