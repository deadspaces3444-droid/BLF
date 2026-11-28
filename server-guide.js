// ===== BLF — подробный гайд по настройке серверов =====
// Пошаговый справочник: от выбора железа и установки ОС до безопасности, бэкапов,
// виртуализации, видеонаблюдения и домашнего NAS. С командами, которые можно копировать.

const SERVER_GUIDES = [
  {
    id: 'plan',
    title: 'Планирование: что за сервер и сколько ресурсов',
    icon: '🧭',
    level: 'Старт',
    time: '15 минут',
    intro: 'До покупки железа определитесь с задачей: от неё зависит, что важнее — ядра, объём памяти, быстрый диск или канал сети. Ниже — типовые «вилки» под частные и небольшие рабочие сценарии.',
    steps: [
      'Сформулируйте задачу одной фразой: «сайт-визитка на 1 домен», «NAS на 8 ТБ для фото и фильмов», «видеонаблюдение на 8 камер 30 дней», «домашние сервисы в Docker».',
      'Посчитайте нагрузку: количество пользователей/камер/сайтов, объём данных, требования к отказоустойчивости.',
      'Определите бюджет на железо и на электричество: сервер работает 24/7, 60 Вт ≈ 500 ₽/мес в России.',
      'Решите, нужна ли виртуализация: если планируете несколько сервисов — сразу берите память с запасом и ставьте hypervisor.',
      'Проверьте, что в вашем городе есть комплектующие (сайт считает цены по всем городам и Б/У на Avito).',
    ],
    table: [
      ['Задача', 'CPU (ядра)', 'RAM', 'Диск', 'Сеть'],
      ['Один сайт / визитка', '2–4', '4 ГБ', '60–120 ГБ SSD', '1 Гбит/с'],
      ['Домашний NAS', '4', '8 ГБ', '2×4 ТБ RAID1', '1 Гбит/с'],
      ['Docker-сервисы (10–15 контейнеров)', '6–8', '16 ГБ', 'NVMe 500 ГБ', '1–2.5 Гбит/с'],
      ['Видеонаблюдение 8 камер', '4–6', '8 ГБ', '4–8 ТБ HDD (NVR-диски)', '1 Гбит/с'],
      ['Виртуализация 5–8 ВМ', '8–12', '32–64 ГБ', 'NVMe + RAID HDD', '2×1 Гбит/с'],
      ['Небольшая БД', '8', '32 ГБ', 'NVMe с запасом TBW', '1–10 Гбит/с'],
    ],
    tips: [
      'Для домашнего сервера важнее тишина и потребление, чем максимум ядер: Xeon E5 на X99 шумный, но дешёвый.',
      'ECC-память — не роскошь: она ловит ошибки, которые иначе тихо портят данные БД и бэкапы.',
      'SSD для системы и БД, HDD для архива: не храните единственную копию на одном диске.',
    ],
  },
  {
    id: 'hardware',
    title: 'Сборка железа и первый запуск',
    icon: '🔧',
    level: 'Старт',
    time: '1–2 часа',
    intro: 'Сервер собирается как обычный ПК, но есть нюансы: порядок модулей памяти, охлаждение в 1U/2U, питание с резервированием.',
    steps: [
      'Установите процессор в сокет строго по ключу, не гните ножки. Для LGA2011/2011-3 используйте обе защёлки и не забывайте про рамку.',
      'Память ставьте по схеме каналов из мануала платы (обычно через слот: A1, B1, C1, D1). На серверных платах часто требуется заполнять все каналы для максимальной пропускной способности.',
      'Для REG/RDIMM проверьте маркировку: обычная DDR4 в серверную плату с RDIMM не встанет (и наоборот).',
      'Кулер подбирайте по TDP процессора и высоте корпуса: в 1U/2U ставятся только низкопрофильные турбины.',
      'Диски в шасси 2U/4U крепите в салазки, SATA/SAS-кабели — с фиксацией, чтобы не отвалились при вибрации.',
      'Первый запуск: зайдите в BIOS (Del/F2), включите VT-x/VT-d (виртуализация), IOMMU, режим памяти (ECC/NUMA), выставьте «Restore on AC Power Loss = Power On».',
      'Проверьте температуры и обороты вентиляторов в BIOS/HWMonitor, обновите BIOS и BMC/IPMI.',
    ],
    commands: [
      ['Обновление прошивки (пример для Supermicro через IPMI)', 'ipmitool -I lanplus -H 192.168.1.50 -U ADMIN -P пароль raw 0x32 0x01'],
      ['Проверка памяти при старте', 'Memtest86+ с флешки: минимум 2 прохода'],
    ],
    tips: [
      'Не включайте сервер без охлаждения даже на минуту: Xeon без радиатора греется мгновенно.',
      'Для домашнего варианта замените серверные вентиляторы на Noctua/Arctic с PWM — шум падает в разы.',
      'Если плата китайская X79/X99 — проверьте, что в BIOS включён режим UEFI и есть AHCI, иначе установщик ОС не увидит диск.',
    ],
  },
  {
    id: 'os-install',
    title: 'Установка ОС: Ubuntu Server, Debian, Proxmox, TrueNAS',
    icon: '💿',
    level: 'Старт',
    time: '30–60 минут',
    intro: 'Начните с одной ОС под задачу: Ubuntu Server — универсально, Debian — стабильно и легко, Proxmox — если нужны виртуалки, TrueNAS — если это NAS.',
    steps: [
      'Скачайте ISO с официального сайта (ссылки есть в разделе «ОС для серверов»), запишите на флешку (Rufus/Ventoy/balenaEtcher).',
      'В BIOS выставьте загрузку с USB, режим UEFI, Secure Boot выключите (для Linux-серверов проще).',
      'Ubuntu/Debian: выберите язык, разметку диска (для сервера — LVM, отдельный раздел /home при необходимости), создайте пользователя и включите установку OpenSSH.',
      'Proxmox VE: установщик сам ставит Debian + веб-панель на https://IP:8006. Задайте статический IP, шлюз и DNS.',
      'TrueNAS SCALE: установка с флешки, затем настройка пулов через веб-интерфейс, включите SMB/NFS.',
      'После установки сразу задайте статический IP (DHCP для сервера — плохая идея), выполните обновление пакетов.',
      'Подключитесь по SSH и настройте базовую защиту (следующий шаг гайда).',
    ],
    commands: [
      ['Обновление системы (Ubuntu/Debian)', 'sudo apt update && sudo apt full-upgrade -y'],
      ['Статический IP через netplan (Ubuntu)', 'sudo nano /etc/netplan/01-netcfg.yaml  →  address: 192.168.1.10/24, gateway4: 192.168.1.1'],
      ['Установка Proxmox на Debian (альтернатива ISO)', 'echo "deb [arch=amd64] http://download.proxmox.com/debian/pve bookworm pve-no-subscription" > /etc/apt/sources.list.d/pve.list && apt update && apt install proxmox-ve'],
      ['Проверить версию и ядро', 'lsb_release -a; uname -r'],
    ],
    tips: [
      'Для дома выбирайте LTS-релизы: Ubuntu 24.04 или Debian 12 — обновления 5 лет без переустановки.',
      'Не ставьте графическую оболочку на сервер — она тратит память и увеличивает поверхность атаки.',
      'Отдельный маленький SSD под систему (128–256 ГБ) сильно упрощает бэкапы и переустановку.',
    ],
  },
  {
    id: 'ssh-secure',
    title: 'SSH, пользователи и базовая безопасность',
    icon: '🔐',
    level: 'Обязательно',
    time: '20 минут',
    intro: 'Первые 20 минут после установки — самые важные: закройте парольный вход, включите firewall, отключите root-логин.',
    steps: [
      'Создайте отдельного пользователя с sudo, root напрямую не используйте.',
      'Сгенерируйте SSH-ключ на своём компьютере и скопируйте публичную часть на сервер.',
      'В /etc/ssh/sshd_config: PermitRootLogin no, PasswordAuthentication no, Port 22 → свой порт (по желанию).',
      'Включите firewall: разрешите только SSH и нужные сервисы.',
      'Установите fail2ban, чтобы блокировать перебор паролей.',
      'Включите автоматические обновления безопасности.',
      'Проверьте доступ по ключу В НОВОМ окне терминала — только потом закрывайте текущую сессию.',
    ],
    commands: [
      ['Создать пользователя и дать sudo', 'adduser admin && usermod -aG sudo admin'],
      ['Скопировать ключ (со своего ПК)', 'ssh-copy-id -i ~/.ssh/id_ed25519.pub admin@192.168.1.10'],
      ['Запретить пароли и root', 'sudo nano /etc/ssh/sshd_config → PermitRootLogin no, PasswordAuthentication no, затем sudo systemctl restart ssh'],
      ['Firewall (UFW)', 'sudo ufw allow 22/tcp && sudo ufw allow 80,443/tcp && sudo ufw enable'],
      ['fail2ban', 'sudo apt install fail2ban -y && sudo systemctl enable --now fail2ban'],
      ['Автообновления безопасности', 'sudo apt install unattended-upgrades -y && sudo dpkg-reconfigure --priority=low unattended-upgrades'],
      ['Проверить, кто слушает порты', 'ss -tulpn'],
    ],
    tips: [
      'Если сервер доступен из интернета — не открывайте SSH напрямую: используйте WireGuard/Tailscale или «стучитесь» через bastion.',
      'Не храните пароли в истории браузера на сервере — только на своём ПК и в менеджере паролей.',
      'Проверка портов снаружи: nmap -Pn -p- ваш.внешний.ip (только для своего сервера).',
    ],
  },
  {
    id: 'network',
    title: 'Сеть: статический IP, DNS, порты и доступ извне',
    icon: '🌐',
    level: 'Средний',
    time: '30 минут',
    intro: 'Домашний сервер обычно стоит за роутером. Правильный вариант: статический внутренний IP + проброс только нужных портов либо туннель без проброса.',
    steps: [
      'Закрепите IP по MAC-адресу в роутере (DHCP reservation) или настройте статику на сервере.',
      'Проверьте DNS: dig ya.ru — если медленно, пропишите 1.1.1.1 / 8.8.8.8 или DNS провайдера.',
      'Для сайта: пробросьте 80/443 на сервер, поставьте динамический DNS (DuckDNS, no-ip) или используйте VPS с reverse-proxy.',
      'Для домашних сервисов без проброса: WireGuard/Tailscale — сервер доступен как в локальной сети, но не виден из интернета.',
      'Проверьте скорость: iperf3 между сервером и клиентом (1 Гбит/с ≈ 940 Мбит/с реально).',
      'Для нескольких сервисов используйте reverse-proxy (Nginx Proxy Manager / Traefik) и поддомены.',
    ],
    commands: [
      ['Показать адреса и маршруты', 'ip -br a; ip r'],
      ['Проверить DNS и скорость отклика', 'dig +short ya.ru; ping -c 4 1.1.1.1'],
      ['iperf3 (на сервере)', 'iperf3 -s'],
      ['iperf3 (на клиенте)', 'iperf3 -c 192.168.1.10 -P 4'],
      ['Tailscale (простой VPN-доступ)', 'curl -fsSL https://tailscale.com/install.sh | sh && sudo tailscale up'],
    ],
    tips: [
      'Двойной NAT от провайдера ломает проброс портов — уточните, выдаётся ли вам «белый» IP.',
      'Не ставьте сервер в DMZ роутера: это открывает все порты сразу.',
      'Для видеонаблюдения извне достаточно Tailscale — камеры остаются в локальной сети.',
    ],
  },
  {
    id: 'storage',
    title: 'Диски, RAID и файловая система',
    icon: '💾',
    level: 'Средний',
    time: '40 минут',
    intro: 'RAID защищает от отказа диска, но не заменяет бэкап. Для дома удобнее всего RAID1 (зеркало) или ZFS с чек-суммами.',
    steps: [
      'Разметьте диски: GPT, отдельные разделы под систему и данные (система никогда не должна лежать на RAID-массиве из HDD).',
      'RAID1 (зеркало) — самый простой вариант на 2 диска: mdadm или аппаратный/полуаппаратный контроллер.',
      'ZFS (TrueNAS/Proxmox) — даёт чек-суммы, снапшоты и отправку на второй сервер.',
      'Настройте SMART-мониторинг и уведомления о деградации диска.',
      'Для HDD в NAS включите спин-даун (hdparm) — диски тише и живут дольше.',
      'Проверьте реальную скорость: hdparm -tT и dd — не ждите больше 200 МБ/с от одного HDD.',
    ],
    commands: [
      ['Создать RAID1', 'sudo mdadm --create /dev/md0 --level=1 --raid-devices=2 /dev/sdb /dev/sdc'],
      ['Статус массива', 'cat /proc/mdstat && sudo mdadm --detail /dev/md0'],
      ['Файловая система ext4', 'sudo mkfs.ext4 /dev/md0 && sudo mount /dev/md0 /mnt/data'],
      ['Постоянное монтирование', 'echo "UUID=$(blkid -s UUID -o value /dev/md0) /mnt/data ext4 defaults 0 2" | sudo tee -a /etc/fstab'],
      ['SMART-статус', 'sudo smartctl -a /dev/sdb'],
      ['Скорость диска', 'sudo hdparm -tT /dev/sdb'],
      ['Создать ZFS-пул (зеркало)', 'sudo zpool create tank mirror /dev/sdb /dev/sdc'],
    ],
    tips: [
      'RAID ≠ бэкап: при пожаре/шифровальщике/ошибке «rm -rf» зеркало не спасёт.',
      'Для видеонаблюдения берите диски линейки NVR (WD Purple, Seagate SkyHawk) — они рассчитаны на постоянную запись.',
      'Не используйте SMR-диски в RAID: они «проваливаются» при перестройке массива.',
    ],
  },
  {
    id: 'backup',
    title: 'Бэкапы по правилу 3-2-1',
    icon: '🛡️',
    level: 'Обязательно',
    time: '30 минут',
    intro: 'Три копии, на двух носителях, одна — вне сервера. Это минимум, который спасает от шифровальщиков, ошибок и отказов дисков.',
    steps: [
      'Настройте автоматический бэкап конфигов и данных на внешний диск/NAS (rsync, restic, borg).',
      'Сделайте вторую копию в облако (Яндекс Диск, S3, Backblaze B2) — минимум самое важное.',
      'Проверьте восстановление: бэкап без теста восстановления не считается бэкапом.',
      'Для баз данных делайте дампы (pg_dump/mysqldump), а не копию файлов на работающей БД.',
      'Настройте ротацию: 7 дневных, 4 недельных, 12 месячных копий.',
      'Раз в квартал — учебное восстановление на тестовой ВМ.',
    ],
    commands: [
      ['rsync на внешний диск', 'rsync -aHAX --delete /mnt/data/ /mnt/backup/data/'],
      ['restic: первый бэкап в репозиторий', 'restic -r /mnt/backup/restic init && restic -r /mnt/backup/restic backup /etc /mnt/data'],
      ['restic: проверить и восстановить', 'restic -r /mnt/backup/restic snapshots && restic -r /mnt/backup/restic restore latest --target /tmp/restore'],
      ['Дамп PostgreSQL', 'pg_dump -U postgres dbname | gzip > /mnt/backup/db-$(date +%F).sql.gz'],
      ['Дамп MySQL/MariaDB', 'mysqldump --single-transaction -u root -p dbname | gzip > /mnt/backup/db-$(date +%F).sql.gz'],
      ['Cron для ночного бэкапа', '0 3 * * * /usr/local/bin/backup.sh >> /var/log/backup.log 2>&1'],
    ],
    tips: [
      'Правило 3-2-1 работает только если третья копия физически в другом месте (или в облаке, к которому нет доступа с сервера по записи).',
      'Шифруйте бэкапы: restic/borg делают это из коробки.',
      'Храните пароль от бэкапа вне сервера — иначе после шифровальщика вы потеряете всё.',
    ],
  },
  {
    id: 'services',
    title: 'Сервисы: веб-сервер, Docker и база данных',
    icon: '🧩',
    level: 'Средний',
    time: '40 минут',
    intro: 'Типовой набор домашнего/рабочего сервера: reverse-proxy + контейнеры + база. Всё ставится за один вечер.',
    steps: [
      'Поставьте Docker и docker compose — так проще обновлять и переносить сервисы.',
      'Поднимите reverse-proxy (Nginx Proxy Manager или Traefik) и получите сертификаты Let\'s Encrypt.',
      'Разверните нужное: Nextcloud (файлы), Jellyfin (медиа), Gitea (git), Vaultwarden (пароли), Home Assistant.',
      'Базу данных ставьте в контейнере с volume на быстром диске и отдельными бэкапами.',
      'Ограничьте ресурсы контейнеров (--memory, --cpus), чтобы один сервис не «съел» сервер.',
      'Обновляйте образы раз в месяц, но сначала читайте changelog: сломать базу легко.',
    ],
    commands: [
      ['Установить Docker (Ubuntu)', 'curl -fsSL https://get.docker.com | sudo sh && sudo usermod -aG docker $USER'],
      ['Пример docker-compose.yml', 'services:\n  nginx-proxy:\n    image: jc21/nginx-proxy-manager:latest\n    ports: ["80:80","443:443","81:81"]\n    volumes: ["./data:/data","./letsencrypt:/etc/letsencrypt"]'],
      ['Запустить стек', 'docker compose up -d && docker compose ps'],
      ['Логи контейнера', 'docker logs -f --tail=100 имя'],
      ['Nginx: конфиг сайта', 'sudo nano /etc/nginx/sites-available/site.conf → server { listen 80; server_name example.ru; root /var/www/site; }'],
      ['Проверить и перезагрузить Nginx', 'sudo nginx -t && sudo systemctl reload nginx'],
      ['Certbot (бесплатный SSL)', 'sudo apt install certbot python3-certbot-nginx -y && sudo certbot --nginx -d example.ru'],
    ],
    tips: [
      'Не запускайте контейнеры с --privileged без необходимости.',
      'Секреты (пароли, токены) храните в .env вне git и с правами 600.',
      'Один сервис = один контейнер. Не смешивайте базу и приложение в одном образе.',
    ],
  },
  {
    id: 'virtualization',
    title: 'Виртуализация: Proxmox, KVM и LXC',
    icon: '🧱',
    level: 'Продвинутый',
    time: '1 час',
    intro: 'Гипервизор позволяет держать на одном железе несколько независимых серверов: тесты, прод, роутер, NAS и «песочницу».',
    steps: [
      'Установите Proxmox VE на отдельный SSD (система + ISO-образы).',
      'Создайте мост vmbr0 с внешним интерфейсом — так ВМ получат адреса из вашей сети.',
      'Для LXC-контейнеров используйте шаблоны Debian/Ubuntu: они легче ВМ (50 МБ RAM против 1 ГБ).',
      'Настройте снапшоты перед обновлениями — откат за секунды.',
      'Включите бэкап ВМ (vzdump) по расписанию на отдельный диск/NAS.',
      'Для проброса диска или GPU используйте PCI passthrough (нужен VT-d/IOMMU).',
    ],
    commands: [
      ['Список ВМ и контейнеров', 'qm list; pct list'],
      ['Снапшот ВМ', 'qm snapshot 100 pre-update'],
      ['Откат', 'qm rollback 100 pre-update'],
      ['Бэкап всех ВМ ночью', 'vzdump --all --mode snapshot --storage backup --compress zstd'],
      ['Создать LXC-контейнер из шаблона', 'pct create 200 local:vztmpl/debian-12-standard_12.7-1_amd64.tar.zst --memory 1024 --cores 2 --net0 name=eth0,bridge=vmbr0,ip=dhcp'],
    ],
    tips: [
      'Не смешивайте системный диск Proxmox и хранилище ВМ: при заполнении диска панель «умирает».',
      'Для домашнего сервера на 16 ГБ памяти достаточно 2–3 LXC + 1–2 ВМ.',
      'Проброс USB (Zigbee-стики, UPS) делается через qm set ... -usb0 host=...',
    ],
  },
  {
    id: 'cctv',
    title: 'Видеонаблюдение: камеры, запись и доступ',
    icon: '📹',
    level: 'Средний',
    time: '1–2 часа',
    intro: 'Свой NVR на сервере — это приватно и без подписок. Нужны камеры с RTSP/ONVIF, диски для постоянной записи и правильный кодек.',
    steps: [
      'Выберите камеры с RTSP/ONVIF и PoE — питание и данные по одному кабелю.',
      'Поставьте Frigate (ИИ-детекция) или ZoneMinder/Shinobi для записи.',
      'Для 8 камер 1080p хватает 4–8 ТБ HDD (детекция по движению экономит в разы).',
      'Включите запись «по детекции» и хранение 14–30 дней.',
      'Отдельный VLAN для камер: они не должны иметь доступ в интернет.',
      'Доступ извне — через VPN (WireGuard/Tailscale), а не проброс портов NVR.',
    ],
    commands: [
      ['Проверить RTSP-поток камеры', 'ffplay -rtsp_transport tcp rtsp://user:pass@192.168.1.60:554/Streaming/Channels/101'],
      ['Тест записи 1 минуты (ffmpeg)', 'ffmpeg -rtsp_transport tcp -i rtsp://user:pass@192.168.1.60/Streaming/Channels/101 -t 60 -c copy test.mp4'],
      ['Посчитать объём на 8 камер/30 дней', 'битрейт(Мбит/с) × 3600 × 24 × 30 × 8 / 8 / 1000 ГБ'],
      ['Docker: Frigate', 'docker run -d --name frigate --restart unless-stopped --shm-size=256m -v /mnt/data/frigate:/media/frigate -p 5000:5000 -p 8554:8554 ghcr.io/blakeblackshear/frigate:stable'],
    ],
    tips: [
      'HEVC/H.265 экономит ~40% места, но требует поддержки в браузере и на телефоне.',
      'Проверьте, что HDD для NVR рассчитан на круглосуточную запись.',
      'Детекция движения встроенная в камеру дешевле по CPU, чем постоянная запись и анализ на сервере.',
    ],
  },
  {
    id: 'monitoring',
    title: 'Мониторинг, UPS и обслуживание',
    icon: '📈',
    level: 'Продвинутый',
    time: '40 минут',
    intro: 'Сервер без мониторинга — это чёрный ящик. Минимум: температуры, SMART, свободное место, нагрузка и уведомления в Telegram.',
    steps: [
      'Поставьте node_exporter + Prometheus + Grafana (или Netdata для «в одном флаконе»).',
      'Настройте SMART-оповещения и проверку свободного места (df).',
      'Подключите UPS по USB (NUT) — сервер должен корректно выключаться при пропадании света.',
      'Сделайте Telegram-бота для алертов (CPU > 90%, диск > 85%, RAID degraded).',
      'Раз в месяц: обновления, чтение логов, проверка бэкапов.',
    ],
    commands: [
      ['Netdata в контейнере', 'docker run -d --name=netdata -p 19999:19999 --cap-add SYS_PTRACE --security-opt apparmor=unconfined netdata/netdata'],
      ['Проверить место и inode', 'df -h; df -i'],
      ['Топ по CPU и памяти', 'top -o %CPU; free -h'],
      ['NUT: статус UPS', 'upsc myups@localhost'],
      ['Проверка RAID', 'cat /proc/mdstat'],
      ['Журнал загрузки (ошибки)', 'journalctl -p 3 -b'],
      ['Автоочистка старых логов', 'sudo journalctl --vacuum-time=14d'],
    ],
    tips: [
      'Настройте уведомление о деградации RAID — иначе узнаете о ней через год.',
      'UPS на 600–1000 ВА держит домашний сервер 10–20 минут — достаточно для корректного выключения.',
      'Grafana + Telegram — 15 минут настройки, но экономят часы разбирательств.',
    ],
  },
  {
    id: 'troubleshoot',
    title: 'Если что-то не работает: чек-лист',
    icon: '🧯',
    level: 'Справка',
    time: 'по ситуации',
    intro: 'Короткий список «почему не грузится, не видно диск, нет сети, не отвечает сайт» — с командами для диагностики.',
    steps: [
      'Не включается: проверьте БП (тестер или скрепка на зелёный/чёрный), кнопку питания на плате, память в первом слоте.',
      'Не видит диск при установке: переключите SATA-режим в BIOS (AHCI), проверьте кабель и питание, для NVMe — слот M.2 и режим PCIe.',
      'Не грузится после обновления: выберите старое ядро в GRUB, откатите пакет, проверьте место на /boot.',
      'Нет сети: ip a (есть ли адрес), ip r (шлюз), ping шлюза, DNS (cat /etc/resolv.conf).',
      'Сайт не открывается: nginx -t, systemctl status nginx, ss -tulpn, логи /var/log/nginx/error.log.',
      'Сервер тормозит: top/htop, iotop, free -h, проверьте своп и температуры.',
      'Забыли пароль root: загрузка в recovery mode, mount -o remount,rw /, passwd.',
    ],
    commands: [
      ['Логи ядра и ошибки', 'dmesg -T | tail -50; journalctl -xe'],
      ['Проверить диск на ошибки', 'sudo smartctl -a /dev/sda; sudo fsck -f /dev/sda1 (только в recovery)'],
      ['Что занимает место', 'sudo du -xh --max-depth=1 / | sort -h | tail'],
      ['Кто слушает порт', 'sudo ss -tulpn | grep :80'],
      ['Перезапуск сервиса с логами', 'sudo systemctl restart nginx && sudo journalctl -u nginx -n 50 --no-pager'],
    ],
    tips: [
      'Перед любыми «лечениями» сделайте снапшот или бэкап — так безопаснее.',
      'Если сервер в другом городе — договоритесь о KVM-over-IP или попросите кого-то нажать кнопку питания.',
      'Ведите журнал изменений: что и когда меняли — экономит часы поиска причины.',
    ],
  },
];

const GUIDE_LEVELS = ['Все', 'Старт', 'Обязательно', 'Средний', 'Продвинутый', 'Справка'];

function guidesFiltered() {
  const q = (state.guideQuery || '').toLowerCase().trim();
  return SERVER_GUIDES.filter(g => {
    if (state.guideLevel && state.guideLevel !== 'Все' && g.level !== state.guideLevel) return false;
    if (!q) return true;
    const hay = (g.title + ' ' + g.intro + ' ' + g.steps.join(' ') + ' ' + (g.commands || []).map(c => c.join(' ')).join(' ')).toLowerCase();
    return hay.includes(q);
  });
}

function renderServerGuide() {
  const root = document.getElementById('guideRoot');
  if (!root) return;
  const chips = document.getElementById('guideChips');
  if (chips) chips.innerHTML = GUIDE_LEVELS.map(l =>
    `<button class="chip ${(state.guideLevel || 'Все') === l ? 'active' : ''}" onclick="state.guideLevel='${l}';render()">${l}${l === 'Все' ? ' · ' + SERVER_GUIDES.length : ''}</button>`).join('');
  const list = guidesFiltered();
  const openId = state.guideOpen || 'plan';
  const nav = `<div class="guide-nav">${list.map(g => `<button class="guide-nav-item ${g.id === openId ? 'active' : ''}" onclick="state.guideOpen='${g.id}';render()">
      <span class="gn-icon">${g.icon}</span><span><b>${esc(g.title)}</b><small>${esc(g.level)} · ${esc(g.time)}</small></span></button>`).join('')}</div>`;
  const g = SERVER_GUIDES.find(x => x.id === openId) || list[0];
  const body = g ? `<article class="guide-body">
    <div class="guide-body-head">
      <h3 style="margin:0">${g.icon} ${esc(g.title)}</h3>
      <span class="guide-meta">${esc(g.level)} · ${esc(g.time)}</span>
    </div>
    <p class="guide-intro">${esc(g.intro)}</p>
    ${g.table ? `<div class="table-wrap"><table class="guide-table"><tr>${g.table[0].map(h => `<th>${esc(h)}</th>`).join('')}</tr>
      ${g.table.slice(1).map(row => `<tr>${row.map((cell, i) => `<td>${i === 0 ? '<b>' + esc(cell) + '</b>' : esc(cell)}</td>`).join('')}</tr>`).join('')}</table></div>` : ''}
    <h4>Шаги</h4>
    <ol class="guide-steps">${g.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
    ${g.commands ? `<h4>Команды</h4>
      <div class="guide-cmds">${g.commands.map(([title, cmd], i) => `<div class="guide-cmd">
        <div class="guide-cmd-title">${esc(title)} <button class="btn small ghost" onclick="copyGuideCommand(${i})">Копировать</button></div>
        <pre id="guideCmd${i}">${esc(cmd)}</pre>
      </div>`).join('')}</div>` : ''}
    ${g.tips ? `<h4>Практика и подводные камни</h4><ul class="guide-tips">${g.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
    <div class="guide-foot">
      <button class="btn small ghost" onclick="state.guideOpen='${(SERVER_GUIDES[(SERVER_GUIDES.findIndex(x => x.id === g.id) + 1) % SERVER_GUIDES.length]).id}';render()">Следующий раздел →</button>
      <button class="btn small ghost" onclick="navigate('servers')">К сборке сервера →</button>
      <button class="btn small ghost" onclick="navigate('server-os')">ОС для серверов →</button>
    </div>
  </article>` : '<div class="empty">Разделов по фильтру нет.</div>';
  root.innerHTML = `<div class="guide-layout">${nav}${body}</div>`;
  // копирование команд текущего раздела
  window.__guideCommands = (g && g.commands) || [];
}
function copyGuideCommand(i) {
  const cmds = window.__guideCommands || [];
  const cmd = cmds[i] && cmds[i][1];
  if (!cmd) return;
  try { navigator.clipboard.writeText(cmd); } catch (e) { /* игнорируем */ }
  if (typeof toast === 'function') toast('Команда скопирована');
}
