// ===== BLF — серверы: комплектующие, сборки, ОС, совместимость =====
// Файл подключается после data.js и использует cityById/fmt/byId из data.js

const SERVER_CATEGORIES = [
  { id: 'servercpu', name: 'Серверные процессоры', icon: '🧠', plural: 'процессоров' },
  { id: 'servermb', name: 'Серверные платы', icon: '🔲', plural: 'плат' },
  { id: 'serverram', name: 'Память ECC', icon: '💾', plural: 'модулей' },
  { id: 'serverstorage', name: 'Накопители и RAID', icon: '💿', plural: 'накопителей' },
  { id: 'servernic', name: 'Сетевые карты', icon: '🌐', plural: 'карт' },
  { id: 'serverpsu', name: 'Блоки питания', icon: '⚡', plural: 'блоков' },
  { id: 'serverchassis', name: 'Корпуса и шасси', icon: '🗄️', plural: 'корпусов' },
];

// perf: условный индекс вычислений 0–100 (эталон: Xeon Silver 4310 = 45)
const SERVER_COMPONENTS = [
  // ---------- Процессоры ----------
  { id:'sc-xeon-e2336', cat:'servercpu', name:'Intel Xeon E-2336', brand:'Intel', basePrice:42000, year:2021, perf:28, power:65,
    specs:{ socket:'LGA1200', cores:6, threads:12, baseFreq:'2.9 ГГц', boostFreq:'4.8 ГГц', tdp:65, memType:'DDR4 ECC', channels:2, maxMem:'128 ГБ', pcie:'PCIe 4.0', priceNote:'начальный уровень' },
    aliases:['e2336','xeon e-2336','2336'] },
  { id:'sc-xeon-silver4310', cat:'servercpu', name:'Intel Xeon Silver 4310', brand:'Intel', basePrice:98000, year:2021, perf:46, power:120,
    specs:{ socket:'LGA4189', cores:12, threads:24, baseFreq:'2.1 ГГц', boostFreq:'3.3 ГГц', tdp:120, memType:'DDR4 ECC RDIMM', channels:8, maxMem:'6 ТБ', pcie:'PCIe 4.0', priceNote:'рабочая лошадка ЦОД' },
    aliases:['4310','silver 4310'] },
  { id:'sc-xeon-gold6338', cat:'servercpu', name:'Intel Xeon Gold 6338', brand:'Intel', basePrice:245000, year:2021, perf:78, power:205,
    specs:{ socket:'LGA4189', cores:32, threads:64, baseFreq:'2.0 ГГц', boostFreq:'3.2 ГГц', tdp:205, memType:'DDR4 ECC RDIMM', channels:8, maxMem:'6 ТБ', pcie:'PCIe 4.0', priceNote:'высокая плотность ядер' },
    aliases:['6338','gold 6338'] },
  { id:'sc-epyc-7313', cat:'servercpu', name:'AMD EPYC 7313', brand:'AMD', basePrice:158000, year:2021, perf:62, power:155,
    specs:{ socket:'SP3', cores:16, threads:32, baseFreq:'3.0 ГГц', boostFreq:'3.7 ГГц', tdp:155, memType:'DDR4 ECC RDIMM', channels:8, maxMem:'4 ТБ', pcie:'PCIe 4.0 (128 линий)', priceNote:'много линий PCIe' },
    aliases:['7313','epyc 7313'] },
  { id:'sc-epyc-9354', cat:'servercpu', name:'AMD EPYC 9354', brand:'AMD', basePrice:330000, year:2023, perf:88, power:280,
    specs:{ socket:'SP5', cores:32, threads:64, baseFreq:'3.25 ГГц', boostFreq:'3.8 ГГц', tdp:280, memType:'DDR5 ECC RDIMM', channels:12, maxMem:'6 ТБ', pcie:'PCIe 5.0', priceNote:'DDR5 + PCIe 5.0' },
    aliases:['9354','epyc 9354'] },
  { id:'sc-epyc-9754', cat:'servercpu', name:'AMD EPYC 9754 (Bergamo)', brand:'AMD', basePrice:690000, year:2023, perf:100, power:360,
    specs:{ socket:'SP5', cores:128, threads:256, baseFreq:'2.25 ГГц', boostFreq:'3.1 ГГц', tdp:360, memType:'DDR5 ECC RDIMM', channels:12, maxMem:'6 ТБ', pcie:'PCIe 5.0', priceNote:'максимум ядер для облака' },
    aliases:['9754','bergamo','epyc 9754'] },
  { id:'sc-xeon-e52680v4', cat:'servercpu', name:'Intel Xeon E5-2680 v4 (Б/У)', brand:'Intel', basePrice:9000, year:2016, perf:22, power:120,
    specs:{ socket:'LGA2011-3', cores:14, threads:28, baseFreq:'2.4 ГГц', boostFreq:'3.3 ГГц', tdp:120, memType:'DDR4 ECC RDIMM', channels:4, maxMem:'1.5 ТБ', pcie:'PCIe 3.0', priceNote:'домашний сервер за копейки' },
    aliases:['2680v4','e5 2680 v4','2680 v4'] },

  // ---------- Платы ----------
  { id:'smb-x12stl', cat:'servermb', name:'Supermicro X12STL-F', brand:'Supermicro', basePrice:52000, year:2021, perf:20, power:35,
    specs:{ socket:'LGA1200', formFactor:'microATX', ramType:'DDR4 ECC', ramSlots:4, maxRam:'128 ГБ', maxCpuTdp:95, sata:6, m2:1, nvmeU2:0, nic:'2× 1GbE', raid:'нет (программный)', ipmi:'есть (IPMI 2.0)' },
    aliases:['x12stl','supermicro x12'] },
  { id:'smb-x12stlif', cat:'servermb', name:'Supermicro X12STL-IF (mini-ITX)', brand:'Supermicro', basePrice:48000, year:2021, perf:18, power:30,
    specs:{ socket:'LGA1200', formFactor:'mini-ITX', ramType:'DDR4 ECC', ramSlots:2, maxRam:'64 ГБ', maxCpuTdp:80, sata:4, m2:1, nvmeU2:0, nic:'2× 1GbE', raid:'SATA RAID 0/1/10', ipmi:'есть (IPMI 2.0)' },
    aliases:['x12stl-if','mini-itx server'] },
  { id:'smb-h12ssl', cat:'servermb', name:'Supermicro H12SSL-i', brand:'Supermicro', basePrice:88000, year:2021, perf:40, power:45,
    specs:{ socket:'SP3', formFactor:'ATX', ramType:'DDR4 ECC RDIMM', ramSlots:8, maxRam:'2 ТБ', maxCpuTdp:280, sata:8, m2:2, nvmeU2:2, nic:'2× 10GbE', raid:'SATA RAID 0/1/10', ipmi:'есть (IPMI 2.0)' },
    aliases:['h12ssl','h12ssl-i'] },
  { id:'smb-h13ssl', cat:'servermb', name:'Supermicro H13SSL-N', brand:'Supermicro', basePrice:132000, year:2023, perf:60, power:55,
    specs:{ socket:'SP5', formFactor:'ATX', ramType:'DDR5 ECC RDIMM', ramSlots:12, maxRam:'4.5 ТБ', maxCpuTdp:400, sata:4, m2:2, nvmeU2:2, nic:'2× 25GbE SFP28', raid:'NVMe RAID 0/1/5/10', ipmi:'есть (IPMI 2.0)' },
    aliases:['h13ssl','h13ssl-n'] },
  { id:'smb-x12spl', cat:'servermb', name:'Supermicro X12SPL-F', brand:'Supermicro', basePrice:96000, year:2021, perf:44, power:50,
    specs:{ socket:'LGA4189', formFactor:'ATX', ramType:'DDR4 ECC RDIMM', ramSlots:8, maxRam:'2 ТБ', maxCpuTdp:270, sata:10, m2:2, nvmeU2:0, nic:'2× 10GbE', raid:'SATA RAID 0/1/5/10', ipmi:'есть (IPMI 2.0)' },
    aliases:['x12spl','x12spl-f'] },
  { id:'smb-x10srl', cat:'servermb', name:'Supermicro X10SRL-F (Б/У)', brand:'Supermicro', basePrice:14000, year:2015, perf:12, power:30,
    specs:{ socket:'LGA2011-3', formFactor:'ATX', ramType:'DDR4 ECC RDIMM', ramSlots:8, maxRam:'512 ГБ', maxCpuTdp:145, sata:10, m2:0, nvmeU2:0, nic:'2× 1GbE', raid:'SATA RAID 0/1/5/10', ipmi:'есть (IPMI 2.0)' },
    aliases:['x10srl','x10srl-f'] },

  // ---------- Память ----------
  { id:'sram-ddr4ecc32', cat:'serverram', name:'DDR4 ECC RDIMM 32 ГБ 3200', brand:'Samsung', basePrice:16500, year:2021, perf:30,
    specs:{ type:'DDR4 ECC RDIMM', capacityGb:32, modules:1, speed:'3200 МТ/с', ecc:'ECC (RDIMM)', rank:'2Rx4', voltage:'1.2 В' }, aliases:['ddr4 ecc 32','rdimm 32'] },
  { id:'sram-ddr4ecc64', cat:'serverram', name:'DDR4 ECC RDIMM 64 ГБ 3200', brand:'Micron', basePrice:31000, year:2021, perf:34,
    specs:{ type:'DDR4 ECC RDIMM', capacityGb:64, modules:1, speed:'3200 МТ/с', ecc:'ECC (RDIMM)', rank:'2Rx4', voltage:'1.2 В' }, aliases:['ddr4 ecc 64','rdimm 64'] },
  { id:'sram-ddr5ecc64', cat:'serverram', name:'DDR5 ECC RDIMM 64 ГБ 4800', brand:'Samsung', basePrice:52000, year:2023, perf:44,
    specs:{ type:'DDR5 ECC RDIMM', capacityGb:64, modules:1, speed:'4800 МТ/с', ecc:'ECC (RDIMM)', rank:'2Rx4', voltage:'1.1 В' }, aliases:['ddr5 ecc 64','rdimm ddr5'] },
  { id:'sram-ddr4ecc16', cat:'serverram', name:'DDR4 ECC RDIMM 16 ГБ 2666 (Б/У)', brand:'Kingston', basePrice:4200, year:2018, perf:22,
    specs:{ type:'DDR4 ECC RDIMM', capacityGb:16, modules:1, speed:'2666 МТ/с', ecc:'ECC (RDIMM)', rank:'1Rx4', voltage:'1.2 В' }, aliases:['ddr4 ecc 16','rdimm 16'] },

  // ---------- Накопители ----------
  { id:'sst-pm9a3', cat:'serverstorage', name:'Samsung PM9A3 1.92 ТБ U.2 NVMe (enterprise)', brand:'Samsung', basePrice:56000, year:2021, perf:70, power:12,
    specs:{ type:'NVMe', interface:'U.2 / PCIe 4.0', capacityGb:1920, tbw:'3.5 PBW', read:'6800 МБ/с', write:'3700 МБ/с', formFactor:'U.2 15 мм', workload:'серверные нагрузки 24/7' }, aliases:['pm9a3','u.2 nvme'] },
  { id:'sst-pm9a3m2', cat:'serverstorage', name:'Samsung PM9A3 960 ГБ M.2 NVMe (enterprise)', brand:'Samsung', basePrice:32000, year:2021, perf:64, power:8,
    specs:{ type:'NVMe', interface:'M.2 2280 / PCIe 4.0', capacityGb:960, tbw:'1.75 PBW', read:'6800 МБ/с', write:'1100 МБ/с', formFactor:'M.2 2280', workload:'система и БД 24/7' }, aliases:['pm9a3 m2','m2 enterprise'] },
  { id:'sst-pm893', cat:'serverstorage', name:'Samsung PM893 1.92 ТБ SATA SSD (enterprise)', brand:'Samsung', basePrice:34000, year:2021, perf:40, power:4,
    specs:{ type:'SATA SSD', interface:'SATA 6 Гбит/с', capacityGb:1920, tbw:'3.5 PBW', read:'550 МБ/с', write:'520 МБ/с', formFactor:'2.5" 7 мм', workload:'серверный SATA, 24/7' }, aliases:['pm893','sata enterprise'] },
  { id:'sst-cd6', cat:'serverstorage', name:'Kioxia CD6 3.84 ТБ U.2 NVMe', brand:'Kioxia', basePrice:98000, year:2021, perf:78, power:14,
    specs:{ type:'NVMe', interface:'U.2 / PCIe 4.0', capacityGb:3840, tbw:'7 PBW', read:'6600 МБ/с', write:'4000 МБ/с', formFactor:'U.2 15 мм', workload:'чтение-ёмкость для БД' }, aliases:['cd6','kioxia cd6'] },
  { id:'sst-sas8tb', cat:'serverstorage', name:'Seagate Exos 7E8 8 ТБ SAS', brand:'Seagate', basePrice:24000, year:2020, perf:28, power:10,
    specs:{ type:'HDD SAS', interface:'SAS 12 Гбит/с', capacityGb:8000, tbw:'—', read:'210 МБ/с', write:'210 МБ/с', formFactor:'3.5"', workload:'архив и бэкапы' }, aliases:['exos 8tb','sas 8tb'] },
  { id:'sst-sata4tb', cat:'serverstorage', name:'WD Red Plus 4 ТБ SATA (NAS)', brand:'Western Digital', basePrice:13500, year:2021, perf:20, power:6,
    specs:{ type:'HDD SATA', interface:'SATA 6 Гбит/с', capacityGb:4000, tbw:'—', read:'180 МБ/с', write:'180 МБ/с', formFactor:'3.5"', workload:'NAS 24/7' }, aliases:['wd red 4tb','nas 4tb'] },
  { id:'sst-raid-lsi', cat:'serverstorage', name:'LSI MegaRAID 9361-8i (RAID-контроллер)', brand:'Broadcom', basePrice:42000, year:2015, perf:30, power:20,
    specs:{ type:'RAID-контроллер', interface:'PCIe 3.0 ×8', capacityGb:0, tbw:'—', read:'до 12 Гбит/с на порт', write:'кэш 1 ГБ', formFactor:'low-profile', workload:'RAID 5/6, горячая замена' }, aliases:['lsi 9361','raid controller'] },

  // ---------- Сеть ----------
  { id:'snic-x710', cat:'servernic', name:'Intel X710-DA2 2× 10GbE SFP+', brand:'Intel', basePrice:22000, year:2018, perf:40, power:12,
    specs:{ type:'10GbE', ports:'2× SFP+', interface:'PCIe 3.0 ×8', speed:'10 Гбит/с', offload:'SR-IOV, VXLAN, iSCSI', drivers:'Linux / Windows / VMware' }, aliases:['x710','10gbe'] },
  { id:'snic-e810', cat:'servernic', name:'Intel E810-XXVDA2 2× 25GbE SFP28', brand:'Intel', basePrice:58000, year:2021, perf:65, power:18,
    specs:{ type:'25GbE', ports:'2× SFP28', interface:'PCIe 4.0 ×8', speed:'25 Гбит/с', offload:'SR-IOV, RDMA (RoCEv2), PTP', drivers:'Linux / Windows / VMware' }, aliases:['e810','25gbe','sfp28'] },
  { id:'snic-i350', cat:'servernic', name:'Intel I350-T4 4× 1GbE', brand:'Intel', basePrice:7800, year:2014, perf:12, power:8,
    specs:{ type:'1GbE', ports:'4× RJ-45', interface:'PCIe 2.1 ×4', speed:'1 Гбит/с', offload:'SR-IOV, VLAN', drivers:'Linux / Windows / FreeBSD' }, aliases:['i350','4x 1gbe'] },

  // ---------- БП ----------
  { id:'spsu-500w', cat:'serverpsu', name:'Sea Sonic SS-500U 500 Вт (1U, Gold)', brand:'Seasonic', basePrice:18000, year:2020, perf:30, power:500,
    specs:{ wattage:500, formFactor:'1U / Flex ATX', efficiency:'80+ Gold', redundancy:'нет', connectors:'24-pin, 2× EPS, 4× SATA', cooling:'40 мм вентилятор' }, aliases:['500w 1u','ss-500u'] },
  { id:'spsu-800wredundant', cat:'serverpsu', name:'Delta 800 Вт ×2 (RPS, Platinum)', brand:'Delta', basePrice:42000, year:2021, perf:50, power:1600,
    specs:{ wattage:1600, formFactor:'2U RPS', efficiency:'80+ Platinum', redundancy:'есть (2×800 Вт, горячая замена)', connectors:'24-pin, 2× EPS, 8× SATA/SAS', cooling:'80 мм' }, aliases:['rps 800','redundant psu'] },
  { id:'spsu-1200w', cat:'serverpsu', name:'Seasonic Prime 1200 Вт Platinum', brand:'Seasonic', basePrice:36000, year:2022, perf:45, power:1200,
    specs:{ wattage:1200, formFactor:'ATX', efficiency:'80+ Platinum', redundancy:'нет', connectors:'24-pin, 2× EPS, 6× PCIe, 8× SATA', cooling:'120 мм' }, aliases:['1200w platinum'] },

  // ---------- Шасси ----------
  { id:'sch-1u', cat:'serverchassis', name:'Supermicro CSE-813 1U (4× 3.5")', brand:'Supermicro', basePrice:38000, year:2019, perf:30, power:0,
    specs:{ formFactor:'1U', boardSupport:'microATX, mini-ITX', driveBays:'4× 3.5" горячая замена', maxPsu:'1U / RPS', heightU:1, depth:'503 мм', fans:'4× 40 мм' }, aliases:['1u chassis','cse-813'] },
  { id:'sch-1u-atx', cat:'serverchassis', name:'Supermicro CSE-815 1U (4× 3.5", ATX)', brand:'Supermicro', basePrice:45000, year:2019, perf:32, power:0,
    specs:{ formFactor:'1U', boardSupport:'ATX, microATX, mini-ITX', driveBays:'4× 3.5" горячая замена', maxPsu:'1U / RPS', heightU:1, depth:'647 мм', fans:'4× 40 мм' }, aliases:['cse-815','1u atx'] },
  { id:'sch-2u', cat:'serverchassis', name:'Supermicro CSE-825 2U (8× 3.5")', brand:'Supermicro', basePrice:62000, year:2019, perf:36, power:0,
    specs:{ formFactor:'2U', boardSupport:'ATX, microATX, E-ATX', driveBays:'8× 3.5" + 2× 2.5"', maxPsu:'2U RPS', heightU:2, depth:'647 мм', fans:'3× 80 мм' }, aliases:['2u chassis','cse-825'] },
  { id:'sch-tower', cat:'serverchassis', name:'Fractal Design Define 7 XL (tower)', brand:'Fractal Design', basePrice:22000, year:2020, perf:24, power:0,
    specs:{ formFactor:'Tower', boardSupport:'E-ATX, ATX, microATX, mini-ITX', driveBays:'6× 3.5" + 2× 5.25"', maxPsu:'ATX', heightU:0, depth:'604 мм', fans:'3× 140 мм' }, aliases:['tower server','define 7 xl'] },
  { id:'sch-nas4', cat:'serverchassis', name:'Jonsbo N4 NAS (4× 3.5", ITX)', brand:'Jonsbo', basePrice:12500, year:2022, perf:16, power:0,
    specs:{ formFactor:'NAS', boardSupport:'mini-ITX', driveBays:'4× 3.5" горячая замена', maxPsu:'SFX', heightU:0, depth:'300 мм', fans:'1× 140 мм' }, aliases:['nas case','jonsbo n4'] },
];

// ---------- Готовые серверные сборки ----------
const SERVER_BUILDS = [
  { id:'srv-home', name:'Домашний сервер / NAS', tag:'NAS · Дом', budget:180000,
    desc:'Тихий домашний сервер: файлы, бэкапы, медиатека, Docker-контейнеры. Низкое потребление, 4 диска с горячей заменой.',
    purpose:'Файлы, бэкапы, медиасервер, Home Assistant',
    parts:{ servercpu:'sc-xeon-e2336', servermb:'smb-x12stlif', serverram:'sram-ddr4ecc32', serverstorage:'sst-sata4tb', servernic:'snic-i350', serverpsu:'spsu-500w', serverchassis:'sch-nas4' },
    drives:3, ramModules:1, os:'truenas', note:'TrueNAS SCALE или Unraid — идеальная пара к этой сборке.' },
  { id:'srv-web', name:'Веб-сервер / хостинг', tag:'Web · 1U', desc:'Сборка под сайты и API: nginx + PHP/Python, десятки сайтов, TLS, контейнеры. Экономичная и ремонтопригодная.',
    purpose:'Сайты, API, reverse-proxy, CI', budget:430000,
    parts:{ servercpu:'sc-xeon-silver4310', servermb:'smb-x12spl', serverram:'sram-ddr4ecc32', serverstorage:'sst-pm9a3m2', servernic:'snic-x710', serverpsu:'spsu-800wredundant', serverchassis:'sch-1u-atx' },
    drives:2, ramModules:2, os:'ubuntu-server', note:'Ubuntu Server LTS + nginx — самый предсказуемый стек для веба.' },
  { id:'srv-db', name:'Сервер базы данных', tag:'БД · NVMe', desc:'База данных под нагрузку: 12 ядер, 128 ГБ ECC, быстрый NVMe U.2 и резервный БП. Низкие задержки важнее числа ядер.',
    purpose:'PostgreSQL/MySQL, 1С, Redis', budget:730000,
    parts:{ servercpu:'sc-xeon-silver4310', servermb:'smb-x12spl', serverram:'sram-ddr4ecc64', serverstorage:'sst-pm9a3m2', servernic:'snic-x710', serverpsu:'spsu-800wredundant', serverchassis:'sch-2u' },
    drives:4, ramModules:2, os:'almalinux', note:'AlmaLinux или Ubuntu LTS + PostgreSQL; RAID 10 на NVMe.' },
  { id:'srv-virt', name:'Гипервизор / виртуализация', tag:'Виртуализация · 2U', desc:'Хост под виртуальные машины и контейнеры: 32 ядра, 256 ГБ памяти, 8 дисковых корзин — десятки ВМ на одной машине.',
    purpose:'Proxmox, KVM, VMs, VDI', budget:850000,
    parts:{ servercpu:'sc-xeon-gold6338', servermb:'smb-x12spl', serverram:'sram-ddr4ecc64', serverstorage:'sst-pm9a3m2', servernic:'snic-e810', serverpsu:'spsu-800wredundant', serverchassis:'sch-2u' },
    drives:6, ramModules:4, os:'proxmox', note:'Proxmox VE — бесплатный гипервизор с HA и бэкапами.' },
  { id:'srv-ai', name:'ИИ / рендер-ферма', tag:'GPU-сервер', desc:'Сервер под обучение и инференс: 128 ядер EPYC, DDR5, PCIe 5.0 — база под несколько ускорителей и быстрые NVMe.',
    purpose:'ML, рендер, HPC, анализ данных', budget:1350000,
    parts:{ servercpu:'sc-epyc-9754', servermb:'smb-h13ssl', serverram:'sram-ddr5ecc64', serverstorage:'sst-cd6', servernic:'snic-e810', serverpsu:'spsu-1200w', serverchassis:'sch-tower' },
    drives:4, ramModules:4, os:'ubuntu-server', note:'Ubuntu Server LTS — стандарт для CUDA и контейнеров ML.' },
  { id:'srv-budget', name:'Бюджетный сервер на Б/У', tag:'Б/У · Дом', desc:'Классика вторичного рынка: Xeon E5-2680 v4 + плата Supermicro X10. 14 ядер за цену офисного ПК — для дома и тестов.',
    purpose:'Тесты, CI, домашние сервисы', budget:100000,
    parts:{ servercpu:'sc-xeon-e52680v4', servermb:'smb-x10srl', serverram:'sram-ddr4ecc16', serverstorage:'sst-sata4tb', servernic:'snic-i350', serverpsu:'spsu-500w', serverchassis:'sch-tower' },
    drives:2, ramModules:4, os:'debian', note:'Debian стабильно живёт на старом железе; шумно и горячо — учитывайте при домашней установке.' },
];

// ---------- Серверные ОС ----------
const SERVER_OS = [
  { id:'ubuntu-server', name:'Ubuntu Server 24.04 LTS', vendor:'Canonical', family:'Linux', familyIcon:'🐧',
    license:'Бесплатно', price:0, support:'Standard до 2029, ESM до 2034 (по подписке)',
    minCores:1, minRamGb:1, minDiskGb:10, recommends:'2 ядра / 4 ГБ / 40 ГБ',
    packageManager:'apt / snap', virtualization:'KVM, LXD, Docker, Kubernetes',
    desc:'Самый популярный серверный дистрибутив: огромная база документации и гайдов, свежие пакеты, отличная поддержка облаков и контейнеров. LTS-релизы выходят раз в два года и обновляются 5 лет (10 с ESM). Хороший выбор, когда нужен предсказуемый стек nginx + PHP/Python/Node.',
    pros:['Максимум гайдов и готовых инструкций','Свежие версии ПО в репозиториях','Отличная работа с Docker/Kubernetes и облаками','Платная поддержка Canonical'],
    cons:['Частые обновления требуют внимания','Snap-пакеты местами спорны','Телеметрия/сервисы Canonical можно отключить'],
    bestFor:['Веб-сервер','Docker','CI/CD','ML-стенды'], install:'ISO/cloud-init, установка за 10 минут, UFW включён по умолчанию.' },
  { id:'debian', name:'Debian 12 «Bookworm»', vendor:'Debian Project', family:'Linux', familyIcon:'🐧',
    license:'Бесплатно', price:0, support:'LTS 5 лет (до 2028), расширенная — дольше',
    minCores:1, minRamGb:1, minDiskGb:8, recommends:'2 ядра / 4 ГБ / 32 ГБ',
    packageManager:'apt', virtualization:'KVM, Docker, LXC',
    desc:'Эталон стабильности: пакеты проверяются годами, обновления ломают систему крайне редко. На Debian основаны Ubuntu, Proxmox и TrueNAS. Идеален для серверов, которые должны годами работать без вмешательства, и для старого железа.',
    pros:['Легендарная стабильность','Минимальное потребление ресурсов','Работает на старом и экзотическом железе','Полностью свободный'],
    cons:['ПО в репозиториях старше, чем в Ubuntu','Нет вендорской поддержки «из коробки»'],
    bestFor:['Долгоживущие серверы','Домашние сервисы','Б/У железо'], install:'netinst-образ ~400 МБ, ставится с текстовым или графическим установщиком.' },
  { id:'almalinux', name:'AlmaLinux 9', vendor:'AlmaLinux OS Foundation', family:'Linux', familyIcon:'🐧',
    license:'Бесплатно', price:0, support:'10 лет на релиз (до 2032)',
    minCores:1, minRamGb:2, minDiskGb:10, recommends:'4 ядра / 8 ГБ / 60 ГБ',
    packageManager:'dnf / rpm', virtualization:'KVM, Podman, OpenShift',
    desc:'Бесплатный бинарно-совместимый клон RHEL: те же пакеты, тот же SELinux, те же команды. Прямая замена CentOS после смены его политики. 10 лет поддержки на релиз — стандарт для корпоративных серверов и БД.',
    pros:['10 лет поддержки','Совместим с RHEL и его инструкциями','SELinux и firewalld по умолчанию','Стабильные ABI для коммерческого ПО'],
    cons:['Старые версии пакетов (зато стабильные)','AppStream/CRB требуют понимания'],
    bestFor:['Базы данных','1С','Корпоративные сервисы','Веб'], install:'DVD/мини-ISO, Anaconda-установщик, есть образы для облаков.' },
  { id:'rocky', name:'Rocky Linux 9', vendor:'Rocky Enterprise Software Foundation', family:'Linux', familyIcon:'🐧',
    license:'Бесплатно', price:0, support:'10 лет на релиз',
    minCores:1, minRamGb:2, minDiskGb:10, recommends:'4 ядра / 8 ГБ / 60 ГБ',
    packageManager:'dnf / rpm', virtualization:'KVM, Podman',
    desc:'Второй крупный клон RHEL, создан одним из основателей CentOS. Практически идентичен AlmaLinux по возможностям — выбирайте по привычке или требованиям вендора. Полностью совместим с пакетами и инструкциями для RHEL 9.',
    pros:['Полная совместимость с RHEL 9','Долгая поддержка','Активное сообщество'], cons:['Меньше коммерческих сертификаций, чем у AlmaLinux','Те же консервативные версии пакетов'],
    bestFor:['Веб-хостинг','БД','Миграция с CentOS'], install:'ISO, Anaconda, cloud-образы.' },
  { id:'windows-server-2025', name:'Windows Server 2025', vendor:'Microsoft', family:'Windows', familyIcon:'🪟',
    license:'Подписка / бессрочная', price:110000, support:'10 лет (5+5), с обновлениями',
    minCores:2, minRamGb:4, minDiskGb:32, recommends:'8 ядер / 16 ГБ / 200 ГБ',
    packageManager:'winget / MSI', virtualization:'Hyper-V, Windows Containers',
    desc:'Серверная Windows: Active Directory, групповые политики, Exchange, MS SQL, RDS и Hyper-V. Единственный разумный выбор, если в компании уже есть домен AD или ПО работает только под Windows. Требует лицензий (по ядрам/CAL) и регулярных обновлений.',
    pros:['Active Directory и домен','Hyper-V и Windows-контейнеры','Огромный выбор коммерческого ПО','Знакомый интерфейс администраторам'],
    cons:['Дорогие лицензии и CAL','Требует больше RAM и диска','Регулярные перезагрузки после обновлений'],
    bestFor:['Домен AD','MS SQL','1С (Windows)','RDS/терминалы'], install:'ISO + ключ; в ядре Server Core или с графической оболочкой (Desktop Experience).' },
  { id:'windows-server-2022', name:'Windows Server 2022', vendor:'Microsoft', family:'Windows', familyIcon:'🪟',
    license:'Подписка / бессрочная', price:95000, support:'до 2031',
    minCores:2, minRamGb:4, minDiskGb:32, recommends:'8 ядер / 16 ГБ / 160 ГБ',
    packageManager:'winget / MSI', virtualization:'Hyper-V',
    desc:'Предыдущая LTS-версия Windows Server — всё ещё массовая в компаниях. Поддерживает тот же AD, Hyper-V и MS SQL; выбирают, когда 2025-я ещё не сертифицирована под конкретное ПО.',
    pros:['Зрелость и сертификация ПО','Полный набор ролей Windows','Долгая поддержка'],
    cons:['Лицензии','Ресурсоёмкость'], bestFor:['AD','Файловый сервер','1С'], install:'ISO, Server Core или Desktop Experience.' },
  { id:'proxmox', name:'Proxmox VE 8', vendor:'Proxmox Server Solutions', family:'Гипервизор', familyIcon:'🧱',
    license:'Бесплатно (подписка от €95/год)', price:0, support:'Корпоративный репозиторий по подписке; без неё — обновления из community',
    minCores:2, minRamGb:2, minDiskGb:16, recommends:'8 ядер / 32 ГБ / 2× SSD',
    packageManager:'apt', virtualization:'KVM (ВМ) + LXC (контейнеры)',
    desc:'Гипервизор на Debian: веб-интерфейс, KVM-виртуалки, LXC-контейнеры, кластеры с HA, live-миграция, ZFS и Ceph, встроенные бэкапы. Заменяет VMware ESXi в большинстве домашних и SMB-сценариев и не требует лицензий на ядра.',
    pros:['Бесплатно и без лимита ядер','ВМ и контейнеры в одном интерфейсе','Кластеры, HA и live-миграция','ZFS/Ceph, снапшоты, бэкапы'],
    cons:['Нет официальной поддержки без подписки','Enterprise-репозиторий платный','Требует понимания виртуализации'],
    bestFor:['Виртуализация','Домашняя лаборатория','Миграция с ESXi'], install:'ISO, установка на весь диск, управление — через https://ip:8006.' },
  { id:'truenas', name:'TrueNAS SCALE', vendor:'iXsystems', family:'NAS', familyIcon:'🗄️',
    license:'Бесплатно (TrueNAS Enterprise — платно)', price:0, support:'Community + платная Enterprise',
    minCores:2, minRamGb:8, minDiskGb:16, recommends:'4 ядра / 16–32 ГБ / SSD под систему',
    packageManager:'App-каталог (Docker/K3s)', virtualization:'KVM, Docker-приложения',
    desc:'Специализированная NAS-ОС: ZFS с контрольными суммами и снапшотами, SMB/NFS/iSCSI, права доступа, репликация и облачная синхронизация. Правило: 1 ГБ RAM на 1 ТБ данных (минимум 8 ГБ). Отличный выбор для дома и небольших офисов.',
    pros:['ZFS: надёжность и снапшоты','SMB/NFS/iSCSI из коробки','Приложения и виртуалки','Репликация и бэкапы'],
    cons:['Нужно много RAM (ECC желательно)','ZFS не любит расширение по одному диску','Тонкая настройка прав требует опыта'],
    bestFor:['NAS','Бэкапы','Медиасервер','Домашнее облако'], install:'ISO на отдельный SSD/NVMe; данные — на пул HDD.' },
  { id:'opensuse-leap', name:'openSUSE Leap 15.6', vendor:'SUSE', family:'Linux', familyIcon:'🦎',
    license:'Бесплатно', price:0, support:'до конца 2025 (SUSE Liberty — дольше)',
    minCores:1, minRamGb:1, minDiskGb:10, recommends:'2 ядра / 4 ГБ / 40 ГБ',
    packageManager:'zypper / rpm', virtualization:'KVM, Docker, Podman',
    desc:'Стабильный корпоративный Linux с отличным инструментом управления YaST и снапшотами Btrfs (откат после неудачного обновления в один клик). Хорош там, где важна предсказуемость и удобная настройка без ручного правки конфигов.',
    pros:['YaST: настройка сервисов через меню','Btrfs-снапшоты и откаты','Хорошая интеграция с SUSE'],
    cons:['Меньше гайдов на русском','Постепенный переход линейки на ALP'],
    bestFor:['Файловый сервер','Веб','Учебные стенды'], install:'ISO/DVD, установщик с профилями сервера.' },
  { id:'astra', name:'Astra Linux Special Edition', vendor:'АО «НПО РусБИТех»', family:'Linux', familyIcon:'🇷🇺',
    license:'Платная лицензия', price:65000, support:'Техподдержка по договору',
    minCores:2, minRamGb:4, minDiskGb:40, recommends:'4 ядра / 8 ГБ / 100 ГБ',
    packageManager:'apt (deb)', virtualization:'KVM, Docker',
    desc:'Российская ОС с сертификацией ФСТЭК (уровни «Воронеж», «Смоленск») для защищённых систем и госсектора. Включает мандатное разбиение доступа, контроль целостности, журналирование и средства защиты информации. Обязательный вариант, если проект требует сертифицированной ОС из реестра.',
    pros:['Сертификация ФСТЭК и реестр российского ПО','Мандатное разбиение доступа','Русская техподдержка','Совместимость с deb-пакетами'],
    cons:['Платная лицензия на сервер','Специфичный репозиторий','Нужен опыт администрирования защищённых систем'],
    bestFor:['Госсектор','Защищённые системы','Медицина','КИИ'], install:'ISO с ключом активации; разметка диска с шифрованием — штатная опция.' },
  { id:'alt-server', name:'ALT Server 10', vendor:'«Базальт СПО»', family:'Linux', familyIcon:'🇷🇺',
    license:'Бесплатно / поддержка по договору', price:0, support:'платная техподдержка, обновления 5+ лет',
    minCores:1, minRamGb:2, minDiskGb:20, recommends:'2 ядра / 4 ГБ / 60 ГБ',
    packageManager:'apt-rpm (ALT)', virtualization:'KVM, Docker, LXC',
    desc:'Российский дистрибутив с собственной пакетной базой и простым управлением (Alterator/etckeeper). Входит в реестр российского ПО, часто используется в школах и госучреждениях. Бесплатная серверная редакция — хороший способ познакомиться с импортонезависимым стеком.',
    pros:['Бесплатная серверная редакция','В реестре российского ПО','Простое управление конфигурацией','Хорошая локализация'],
    cons:['Свои пакеты и репозитории','Меньше совместимости с внешним ПО'],
    bestFor:['Госучреждения','Образование','Импортозамещение'], install:'ISO, установщик с выбором ролей (файлы, веб, БД, домен).' },
  { id:'esxi', name:'VMware ESXi 8', vendor:'Broadcom', family:'Гипервизор', familyIcon:'🧱',
    license:'Подписка', price:240000, support:'По подписке Broadcom',
    minCores:2, minRamGb:8, minDiskGb:32, recommends:'16 ядер / 128 ГБ / 2× SSD',
    packageManager:'нет (VIB/образы)', virtualization:'ESXi-гипервизор',
    desc:'Промышленный гипервизор с vCenter, HA, DRS и отточенной производительностью. После перехода на подписки Broadcom лицензии сильно подорожали и продаются пакетами — для домашних и небольших задач чаще выгоднее Proxmox, но в крупных корпоративных контурах ESXi по-прежнему стандарт.',
    pros:['Зрелая корпоративная виртуализация','vCenter, HA, DRS','Минимальный гипервизор'],
    cons:['Дорогие подписки','Ограниченный бесплатный режим','Привязка к HCL'],
    bestFor:['Крупный бизнес','VDI','Кластеры'], install:'ISO или vendor-образ, управление через Host Client.' },
  { id:'pfsense', name:'OPNsense / pfSense (маршрутизатор)', vendor:'Deciso / Netgate', family:'Firewall', familyIcon:'🛡️',
    license:'Бесплатно (OPNsense), pfSense CE', price:0, support:'Community / платно у вендора',
    minCores:1, minRamGb:2, minDiskGb:8, recommends:'4 ядра / 8 ГБ / 32 ГБ',
    packageManager:'pkg (FreeBSD)', virtualization:'—',
    desc:'Специализированные firewall/роутер-ОС на FreeBSD (OPNsense) и FreeBSD-основе (pfSense): NAT, VLAN, VPN (WireGuard/IPsec/OpenVPN), IDS/IPS Suricata, лимиты трафика и резервирование каналов. Закрывают задачи, для которых обычный роутер слишком слаб.',
    pros:['Полноценный фаервол и VPN','IDS/IPS и лимиты','Резервирование каналов (CARP)','Гибкие правила и логи'],
    cons:['Нужны знания сетей','Требует 2+ сетевых порта','Не для «просто интернета»'],
    bestFor:['Шлюз','VPN','Сегментация сети'], install:'ISO/VGA-образ на мини-ПК с 2–4 портами.' },
  { id:'unraid', name:'Unraid 7', vendor:'Lime Technology', family:'NAS', familyIcon:'🗄️',
    license:'Платная (от $49)', price:5900, support:'обновления по лицензии',
    minCores:2, minRamGb:4, minDiskGb:16, recommends:'4 ядра / 16 ГБ / SSD-кэш',
    packageManager:'App-каталог (Docker)', virtualization:'KVM, Docker',
    desc:'NAS-ОС с «гибким» массивом: диски разного размера, защита через чётность, потеря одного диска не убивает данные. Простая установка приложений (Plex, Nextcloud, *arr), докеры и виртуалки. Проще TrueNAS, но платная и менее строгая к целостности данных.',
    pros:['Диски любого размера в одном массиве','Очень простой App-каталог','Виртуалки и Docker','Быстрый SSD-кэш'],
    cons:['Платная лицензия','Нет контрольных сумм как в ZFS','Меньше корпоративных функций'],
    bestFor:['Медиасервер','Домашний NAS','Plex/Jellyfin'], install:'USB-загрузчик + веб-настройка массива.' },
];

// ---------- Цены серверных компонентов по городам ----------
function serverPartById(id) { return SERVER_COMPONENTS.find(x => x.id === id); }
function serverCatById(id) { return SERVER_CATEGORIES.find(x => x.id === id); }
function serverPrice(partId, cityId = 'msk', condition = 'new') {
  const p = typeof partId === 'string' ? serverPartById(partId) : partId;
  if (!p) return null;
  const city = cityById(cityId) || { coeff: 1 };
  // детерминированный разброс по id и городу
  let seed = 0;
  for (const ch of p.id + cityId) seed = (seed * 31 + ch.charCodeAt(0)) % 9973;
  const jitter = 0.97 + (seed % 70) / 1000;
  const used = condition === 'used';
  const base = p.basePrice * (used ? 0.55 : 1) * city.coeff * jitter;
  return Math.round(base / 100) * 100;
}
function serverBuildParts(build) {
  return { ...build.parts, drives: Math.max(1, build.drives || 1), ramModules: Math.max(1, build.ramModules || 1) };
}
function serverBuildPrice(build, cityId = 'msk', condition = 'new') {
  const drives = Math.max(1, build.drives || 1);
  let total = 0;
  Object.entries(build.parts).forEach(([cat, id]) => {
    const p = serverPartById(id);
    if (!p) return;
    let price = serverPrice(p, cityId, condition) || 0;
    if (cat === 'serverstorage') price *= drives;
    total += price;
  });
  return total;
}
function serverBuildRamGb(build) {
  const ram = serverPartById(build.parts.serverram);
  if (!ram) return 0;
  const modules = Math.max(1, build.ramModules || 1);
  return ram.specs.capacityGb * modules;
}
function serverBuildCores(build) {
  const cpu = serverPartById(build.parts.servercpu);
  return cpu ? cpu.specs.cores : 0;
}
function serverBuildDiskGb(build) {
  const st = serverPartById(build.parts.serverstorage);
  if (!st) return 0;
  return st.specs.capacityGb * Math.max(1, build.drives || 1);
}
function serverBuildConsumption(build) {
  const cpu = serverPartById(build.parts.servercpu);
  const drives = Math.max(1, build.drives || 1);
  return (cpu?.specs?.tdp || 65) + 60 + drives * 10 + 30;
}

// Нагрузка: сколько ВМ / сайтов / TPS выдержит конфигурация
function serverWorkload(parts) {
  const cpu = serverPartById(parts.servercpu);
  const ram = serverPartById(parts.serverram);
  const st = serverPartById(parts.serverstorage);
  const cores = cpu?.specs?.cores || 0;
  const ramGb = (ram?.specs?.capacityGb || 0) * (parts.ramModules || 1);
  const diskType = st?.specs?.type || '';
  return {
    vms: Math.max(1, Math.floor(Math.min(cores * 2, ramGb / 4))),
    sites: Math.max(1, Math.floor(cores * 6 + ramGb / 2)),
    dbTps: Math.max(50, Math.round(cores * 950 * (diskType === 'NVMe' ? 1.6 : diskType.includes('SAS') ? 0.8 : 0.5))),
    containers: Math.max(2, Math.floor(ramGb / 1.5)),
    diskType,
  };
}

// ---------- Совместимость серверной сборки ----------
function checkServerCompatibility(parts) {
  const get = k => parts[k] ? serverPartById(parts[k]) : null;
  const cpu = get('servercpu'), mb = get('servermb'), ram = get('serverram'),
    st = get('serverstorage'), nic = get('servernic'), psu = get('serverpsu'), ch = get('serverchassis');
  const issues = [];
  const add = (level, title, desc, fix) => issues.push({ level, title, desc, fix });

  // 1. Сокет
  if (cpu && mb) {
    if (cpu.specs.socket !== mb.specs.socket) {
      add('error', 'Сокет не совпадает', `Процессор ${cpu.name} (${cpu.specs.socket}) не встанет в плату ${mb.name} (${mb.specs.socket}).`, `Возьмите плату с сокетом ${cpu.specs.socket}.`);
    } else {
      add('ok', 'Сокет совпадает', `${cpu.specs.socket} — процессор и плата совместимы.`);
    }
    if (cpu.specs.tdp > mb.specs.maxCpuTdp) {
      add('error', 'Плата не рассчитана на TDP процессора', `${cpu.name} — ${cpu.specs.tdp} Вт, плата держит до ${mb.specs.maxCpuTdp} Вт.`, 'Нужна плата с большим лимитом TDP.');
    }
  }

  // 2. Память
  if (ram && mb) {
    if (!String(ram.specs.type).startsWith(mb.specs.ramType.split(' ').slice(0, 2).join(' '))) {
      add('error', 'Тип памяти не совпадает', `Память ${ram.specs.type}, плата поддерживает ${mb.specs.ramType}.`, `Возьмите ${mb.specs.ramType}.`);
    } else {
      add('ok', 'Память ECC совместима', `${ram.specs.type} — плата поддерживает.`);
    }
    const cap = parseInt(String(mb.specs.maxRam).replace(/\D/g, ''), 10) * (/ТБ/.test(mb.specs.maxRam) ? 1024 : 1);
    if (ram.specs.capacityGb * (parts.ramModules || 1) > cap) {
      add('error', 'Слишком большой объём памяти', `Максимум платы: ${mb.specs.maxRam}.`, 'Уменьшите число модулей.');
    }
    if ((parts.ramModules || 1) > mb.specs.ramSlots) {
      add('error', 'Не хватает слотов памяти', `Модулей: ${parts.ramModules}, слотов на плате: ${mb.specs.ramSlots}.`, 'Возьмите модули большей ёмкости.');
    } else {
      add('ok', 'Слоты памяти в порядке', `${parts.ramModules || 1} из ${mb.specs.ramSlots} слотов занято.`);
    }
    if (!ram.specs.ecc || !/ECC/.test(ram.specs.ecc)) {
      add('warn', 'Память без ECC', 'Для сервера желательна ECC-память: она исправляет одиночные ошибки и не даёт тихо испортить данные.', 'Выберите ECC RDIMM.');
    } else {
      add('ok', 'ECC включён', 'Память с коррекцией ошибок — обязательный минимум для сервера.');
    }
  }

  // 3. Накопитель и плата
  if (st && mb) {
    if (st.specs.type === 'NVMe' && st.specs.formFactor === 'U.2 15 мм' && mb.specs.nvmeU2 === 0) {
      add('warn', 'Нет порта U.2 на плате', `${st.name} — U.2 NVMe, у платы нет U.2-портов.`, 'Нужен переходник U.2→M.2/PCIe или плата с U.2.');
    } else if (st.specs.type === 'HDD SAS' && !mb.specs.raid.includes('SAS')) {
      add('warn', 'SAS-диск требует контроллера', 'Плата не имеет SAS-контроллера — понадобится HBA/RAID-карта.', 'Добавьте LSI/Broadcom HBA или возьмите SATA-диск.');
    }
    if (st.specs.type === 'HDD SATA' && mb.specs.sata === 0) {
      add('error', 'Нет портов SATA', 'На плате нет SATA-портов.', 'Возьмите NVMe или плату с SATA.');
    }
  }
  if (st && st.specs.type === 'RAID-контроллер') {
    add('warn', 'Нужен диск к контроллеру', 'RAID-контроллер сам по себе не хранит данные — добавьте диски в сборку.', 'Выберите HDD/SSD и учтите порты контроллера.');
  }

  // 4. Питание
  if (cpu && psu) {
    const need = (cpu.specs.tdp + 60 + Math.max(1, (parts.drives || 1)) * 12) * 1.25;
    if (psu.specs.wattage < need) {
      add('error', 'Блок питания слабый', `Расчётная потребность ≈ ${Math.round(need)} Вт, а блок — ${psu.specs.wattage} Вт.`, 'Возьмите БП мощнее или с резервированием.');
    } else {
      add('ok', 'Питания достаточно', `Потребность ≈ ${Math.round(need)} Вт при блоке ${psu.specs.wattage} Вт.`);
    }
    if (psu.specs.redundancy === 'нет' && ch && ch.specs.heightU > 0) {
      add('warn', 'Нет резервирования питания', 'Для стоечного сервера 24/7 желателен второй БП (RPS): выход из строя одного не остановит систему.', 'Возьмите шасси и БП с горячей заменой.');
    } else {
      add('ok', 'Питание резервировано', psu.specs.redundancy);
    }
    if (ch && /U$/.test(ch.specs.formFactor) && /ATX/.test(psu.specs.formFactor) && !/U$/.test(psu.specs.formFactor) && psu.specs.formFactor !== '2U RPS') {
      add('warn', 'Форм-фактор БП не подходит к шасси', `${psu.name} — ${psu.specs.formFactor}, шасси ${ch.name} — ${ch.specs.formFactor}.`, 'Возьмите БП формата 1U/2U RPS.');
    }
  }

  // 5. Шасси и плата
  if (ch && mb) {
    const support = String(ch.specs.boardSupport).split(',').map(s => s.trim().toLowerCase());
    const ff = String(mb.specs.formFactor).toLowerCase();
    const ffRank = { 'mini-itx': 0, 'microatx': 1, 'atx': 2, 'e-atx': 3 }[ff] ?? 2;
    const ok = support.some(s => (ffRank <= ({ 'mini-itx': 0, 'microatx': 1, 'atx': 2, 'e-atx': 3 }[s] ?? -1)));
    if (!ok) {
      add('error', 'Плата не помещается в шасси', `Плата ${mb.specs.formFactor}, шасси поддерживает: ${ch.specs.boardSupport}.`, 'Возьмите шасси под этот форм-фактор.');
    } else {
      add('ok', 'Плата помещается в шасси', `${mb.specs.formFactor} поддерживается.`);
    }
    const bays = parseInt(String(ch.specs.driveBays).replace(/\D/g, ''), 10) || 1;
    if ((parts.drives || 1) > bays) {
      add('warn', 'Не хватает дисковых корзин', `Дисков: ${parts.drives}, корзин в шасси: ${bays}.`, 'Возьмите шасси с большим числом корзин.');
    }
  }

  // 6. Сеть и IPMI
  if (mb) {
    if (!/IPMI/.test(mb.specs.ipmi)) {
      add('warn', 'Нет IPMI/out-of-band', 'Без IPMI удалённая переустановка и диагностика возможны только «руками».', 'Выбирайте плату с IPMI/BMC.');
    } else {
      add('ok', 'IPMI есть', 'Удалённое управление сервером доступно.');
    }
  }
  if (nic && mb) {
    add('ok', 'Сетевые порты', `Плата: ${mb.specs.nic}; карта: ${nic.specs.ports} (${nic.specs.type}).`);
  }
  if (nic && nic.specs.type === '25GbE') {
    add('info', 'Нужен коммутатор 25G', 'Карта 25GbE раскроется только с соответствующим свитчем и оптикой SFP28.', 'Проверьте сетевую инфраструктуру.');
  }

  // 7. Диск и нагрузка
  if (st && st.specs.type === 'HDD SATA' && (parts.drives || 1) < 2) {
    add('warn', 'Один диск — нет защиты данных', 'Один HDD без зеркала: потеря диска = потеря данных.', 'Добавьте второй диск и RAID 1 или бэкап.');
  }
  if (st && st.specs.type === 'HDD SAS' && !mb?.specs?.raid?.includes('SAS')) {
    add('info', 'SAS без контроллера', 'SAS-диски нельзя подключить напрямую к SATA-портам.', 'Добавьте HBA/RAID-контроллер.');
  }

  const hasError = issues.some(i => i.level === 'error');
  const hasWarn = issues.some(i => i.level === 'warn');
  return { status: hasError ? 'error' : hasWarn ? 'warn' : 'ok', issues };
}

// Подбор ОС под сборку: жёсткие минимумы + рекомендации
function osFitsBuild(os, build) {
  const cores = serverBuildCores(build);
  const ramGb = serverBuildRamGb(build);
  const disk = serverBuildDiskGb(build);
  const problems = [];
  if (cores < os.minCores) problems.push(`нужно ядер ≥ ${os.minCores} (есть ${cores})`);
  if (ramGb < os.minRamGb) problems.push(`нужно RAM ≥ ${os.minRamGb} ГБ (есть ${ramGb})`);
  if (disk < os.minDiskGb) problems.push(`нужно диска ≥ ${os.minDiskGb} ГБ (есть ${disk})`);
  const tight = ramGb < os.minRamGb * 2;
  return { ok: problems.length === 0, problems, tight };
}
