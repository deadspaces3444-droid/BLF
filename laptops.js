// ===== BLF — ноутбуки =====
// Каталог ноутбуков (бюджетные, офисные, игровые, ультрабуки, MacBook) с ценами по городам,
// FPS в играх и сравнением «ноутбук ↔ такой же по мощности ПК» — чтобы ИИ мог выбрать, что дешевле.

// Поля строки: id, name, brand, year, type, cpu, cpuPerf, cpuWork, gpu, gpuPerf, vramGb,
// ramGb, ramType, storageGb, storageType, screen, resolution, hz, weight, battery, tdp, basePrice, os
const LAPTOP_ROWS = [
  // Бюджетные и офисные
  ['lap-hp-250-g9', 'HP 250 G9', 'HP', 2022, 'office', 'Intel Core i5-1235U', 38, 44, 'Intel Iris Xe', 14, 0, 8, 'DDR4', 512, 'SSD', 15.6, '1920×1080', 60, 1.74, 41, 25, 39990, 'Windows 11 Home'],
  ['lap-acer-aspire3', 'Acer Aspire 3 A315-59', 'Acer', 2022, 'office', 'Intel Core i3-1215U', 33, 38, 'Intel UHD', 11, 0, 8, 'DDR4', 256, 'SSD', 15.6, '1920×1080', 60, 1.70, 40, 25, 32990, 'Windows 11 Home'],
  ['lap-lenovo-ideapad1', 'Lenovo IdeaPad 1 15ALC7', 'Lenovo', 2022, 'budget', 'AMD Ryzen 5 5500U', 33, 40, 'AMD Radeon Graphics', 12, 0, 8, 'DDR4', 512, 'SSD', 15.6, '1920×1080', 60, 1.61, 42, 25, 34990, 'Windows 11 Home'],
  ['lap-vivobook15', 'ASUS Vivobook 15 X1504', 'ASUS', 2023, 'office', 'Intel Core i5-1335U', 40, 47, 'Intel Iris Xe', 15, 0, 16, 'DDR4', 512, 'SSD', 15.6, '1920×1080', 60, 1.70, 42, 25, 46990, 'Windows 11 Home'],
  ['lap-lenovo-v15', 'Lenovo V15 G4 AMN', 'Lenovo', 2023, 'office', 'AMD Ryzen 5 7520U', 30, 36, 'AMD Radeon 610M', 10, 0, 8, 'LPDDR5', 256, 'SSD', 15.6, '1920×1080', 60, 1.65, 38, 25, 31990, 'без ОС'],
  ['lap-hp-15s', 'HP 15s-fq5', 'HP', 2023, 'budget', 'Intel Core i3-1215U', 33, 38, 'Intel UHD', 11, 0, 8, 'DDR4', 256, 'SSD', 15.6, '1920×1080', 60, 1.69, 41, 25, 30990, 'без ОС'],
  ['lap-honor-x16', 'Honor MagicBook X16', 'Honor', 2023, 'office', 'Intel Core i5-12450H', 48, 52, 'Intel UHD', 12, 0, 16, 'DDR4', 512, 'SSD', 16.0, '1920×1200', 60, 1.68, 56, 45, 44990, 'Windows 11 Home'],
  ['lap-huawei-d15', 'Huawei MateBook D15', 'Huawei', 2022, 'office', 'Intel Core i5-1135G7', 33, 38, 'Intel Iris Xe', 14, 0, 8, 'DDR4', 512, 'SSD', 15.6, '1920×1080', 60, 1.56, 42, 28, 41990, 'Windows 11 Home'],
  ['lap-dell-vostro3520', 'Dell Vostro 3520', 'Dell', 2023, 'office', 'Intel Core i5-1235U', 38, 44, 'Intel Iris Xe', 14, 0, 16, 'DDR4', 512, 'SSD', 15.6, '1920×1080', 120, 1.66, 41, 25, 52990, 'Windows 11 Pro'],
  ['lap-hp-probook450', 'HP ProBook 450 G9', 'HP', 2022, 'office', 'Intel Core i5-1240P', 49, 56, 'Intel Iris Xe', 15, 0, 16, 'DDR4', 512, 'SSD', 15.6, '1920×1080', 60, 1.74, 51, 28, 58990, 'Windows 11 Pro'],
  ['lap-thinkpad-t480', 'Lenovo ThinkPad T480 (б/у)', 'Lenovo', 2018, 'office', 'Intel Core i5-8350U', 24, 30, 'Intel UHD 620', 9, 0, 16, 'DDR4', 512, 'SSD', 14.0, '1920×1080', 60, 1.58, 48, 15, 21990, 'Windows 11 Pro'],
  ['lap-latitude-5410', 'Dell Latitude 5410 (б/у)', 'Dell', 2020, 'office', 'Intel Core i5-10210U', 27, 32, 'Intel UHD 620', 9, 0, 16, 'DDR4', 256, 'SSD', 14.0, '1920×1080', 60, 1.52, 51, 15, 24990, 'Windows 11 Pro'],
  ['lap-iru-office', 'IRU Office 15', 'IRU', 2023, 'budget', 'Intel Core i3-1215U', 33, 38, 'Intel UHD', 11, 0, 8, 'DDR4', 256, 'SSD', 15.6, '1920×1080', 60, 1.70, 38, 25, 27990, 'без ОС'],
  ['lap-dexp-aquilon', 'DEXP Aquilon 15', 'DEXP', 2023, 'budget', 'Intel Celeron N5095', 12, 16, 'Intel UHD', 8, 0, 8, 'DDR4', 256, 'SSD', 15.6, '1920×1080', 60, 1.62, 36, 15, 21990, 'без ОС'],
  ['lap-honor-x14', 'Honor MagicBook X14', 'Honor', 2023, 'ultrabook', 'Intel Core i5-12450H', 48, 52, 'Intel UHD', 12, 0, 16, 'DDR4', 512, 'SSD', 14.0, '1920×1200', 60, 1.40, 60, 45, 48990, 'Windows 11 Home'],
  ['lap-asus-zenbook14', 'ASUS Zenbook 14 OLED', 'ASUS', 2024, 'ultrabook', 'Intel Core Ultra 7 155H', 62, 72, 'Intel Arc Graphics', 20, 0, 16, 'LPDDR5', 1024, 'SSD', 14.0, '2880×1800', 120, 1.22, 75, 28, 109990, 'Windows 11 Home'],
  ['lap-lenovo-yoga', 'Lenovo Yoga Slim 7 14', 'Lenovo', 2024, 'ultrabook', 'AMD Ryzen 7 8845HS', 66, 78, 'AMD Radeon 780M', 24, 0, 16, 'LPDDR5', 1024, 'SSD', 14.5, '2880×1800', 90, 1.48, 70, 45, 104990, 'Windows 11 Home'],
  ['lap-huawei-xpro', 'Huawei MateBook X Pro', 'Huawei', 2024, 'ultrabook', 'Intel Core Ultra 9 185H', 70, 82, 'Intel Arc Graphics', 21, 0, 32, 'LPDDR5', 1024, 'SSD', 14.2, '3120×2080', 120, 0.98, 70, 40, 189990, 'Windows 11 Home'],
  ['lap-dell-xps13', 'Dell XPS 13 9340', 'Dell', 2024, 'ultrabook', 'Intel Core Ultra 7 155H', 62, 72, 'Intel Arc Graphics', 20, 0, 16, 'LPDDR5', 512, 'SSD', 13.4, '1920×1200', 60, 1.19, 55, 28, 129990, 'Windows 11 Home'],
  ['lap-hp-spectre', 'HP Spectre x360 14', 'HP', 2024, 'ultrabook', 'Intel Core Ultra 7 155H', 62, 72, 'Intel Arc Graphics', 20, 0, 16, 'LPDDR5', 1024, 'SSD', 14.0, '2880×1800', 120, 1.44, 68, 28, 169990, 'Windows 11 Home'],
  ['lap-macbook-air-m1', 'Apple MacBook Air M1 13"', 'Apple', 2020, 'macbook', 'Apple M1 (8 ядер)', 55, 62, 'Apple M1 GPU (7 ядер)', 22, 0, 8, 'Unified', 256, 'SSD', 13.3, '2560×1600', 60, 1.29, 49, 15, 62990, 'macOS'],
  ['lap-macbook-air-m2', 'Apple MacBook Air M2 13"', 'Apple', 2022, 'macbook', 'Apple M2 (8 ядер)', 62, 70, 'Apple M2 GPU (8 ядер)', 26, 0, 8, 'Unified', 256, 'SSD', 13.6, '2560×1664', 60, 1.24, 52, 15, 79990, 'macOS'],
  ['lap-macbook-air-m3', 'Apple MacBook Air M3 13"', 'Apple', 2024, 'macbook', 'Apple M3 (8 ядер)', 70, 78, 'Apple M3 GPU (8 ядер)', 29, 0, 16, 'Unified', 512, 'SSD', 13.6, '2560×1664', 60, 1.24, 52, 15, 104990, 'macOS'],
  ['lap-macbook-air-m4', 'Apple MacBook Air M4 13"', 'Apple', 2025, 'macbook', 'Apple M4 (10 ядер)', 78, 88, 'Apple M4 GPU (8 ядер)', 33, 0, 16, 'Unified', 256, 'SSD', 13.6, '2560×1664', 60, 1.24, 53, 15, 119990, 'macOS'],
  ['lap-macbook-pro-14-m3', 'Apple MacBook Pro 14 M3 Pro', 'Apple', 2023, 'macbook', 'Apple M3 Pro (11 ядер)', 82, 95, 'Apple M3 Pro GPU (14 ядер)', 40, 0, 18, 'Unified', 512, 'SSD', 14.2, '3024×1964', 120, 1.61, 70, 30, 189990, 'macOS'],
  ['lap-macbook-pro-16-m4', 'Apple MacBook Pro 16 M4 Pro', 'Apple', 2024, 'macbook', 'Apple M4 Pro (12 ядер)', 88, 100, 'Apple M4 Pro GPU (16 ядер)', 46, 0, 24, 'Unified', 512, 'SSD', 16.2, '3456×2234', 120, 2.14, 100, 40, 269990, 'macOS'],
  // Игровые начального уровня
  ['lap-ideapad-gaming3', 'Lenovo IdeaPad Gaming 3 15', 'Lenovo', 2022, 'gaming', 'AMD Ryzen 5 5600H', 45, 52, 'NVIDIA GeForce GTX 1650', 30, 4, 16, 'DDR4', 512, 'SSD', 15.6, '1920×1080', 120, 2.29, 45, 95, 52990, 'без ОС'],
  ['lap-acer-nitro5-3050', 'Acer Nitro 5 AN515-58', 'Acer', 2022, 'gaming', 'Intel Core i5-12450H', 48, 52, 'NVIDIA GeForce RTX 3050', 38, 4, 16, 'DDR4', 512, 'SSD', 15.6, '1920×1080', 144, 2.50, 57, 110, 64990, 'Windows 11 Home'],
  ['lap-tuf-f15-3050', 'ASUS TUF Gaming F15', 'ASUS', 2023, 'gaming', 'Intel Core i5-12500H', 55, 60, 'NVIDIA GeForce RTX 3050', 38, 4, 16, 'DDR4', 512, 'SSD', 15.6, '1920×1080', 144, 2.20, 90, 110, 69990, 'Windows 11 Home'],
  ['lap-hp-victus15', 'HP Victus 15-fa1', 'HP', 2023, 'gaming', 'Intel Core i5-13500H', 62, 68, 'NVIDIA GeForce RTX 4050', 48, 6, 16, 'DDR5', 512, 'SSD', 15.6, '1920×1080', 144, 2.29, 70, 120, 79990, 'Windows 11 Home'],
  ['lap-msi-thin-gf63', 'MSI Thin GF63 12UC', 'MSI', 2023, 'gaming', 'Intel Core i5-12450H', 48, 52, 'NVIDIA GeForce RTX 4050', 48, 6, 16, 'DDR4', 512, 'SSD', 15.6, '1920×1080', 144, 1.86, 52, 105, 74990, 'Windows 11 Home'],
  ['lap-asus-tuf-a15', 'ASUS TUF Gaming A15', 'ASUS', 2023, 'gaming', 'AMD Ryzen 7 7735HS', 58, 70, 'NVIDIA GeForce RTX 4060', 58, 8, 16, 'DDR5', 512, 'SSD', 15.6, '1920×1080', 144, 2.20, 90, 120, 94990, 'Windows 11 Home'],
  ['lap-acer-nitro-v15', 'Acer Nitro V 15', 'Acer', 2024, 'gaming', 'Intel Core i5-13420H', 50, 55, 'NVIDIA GeForce RTX 4060', 58, 8, 16, 'DDR5', 512, 'SSD', 15.6, '1920×1080', 144, 2.10, 57, 120, 84990, 'Windows 11 Home'],
  ['lap-lenovo-legion5', 'Lenovo Legion 5 16IRX9', 'Lenovo', 2024, 'gaming', 'Intel Core i7-13650HX', 70, 78, 'NVIDIA GeForce RTX 4060', 58, 8, 16, 'DDR5', 1024, 'SSD', 16.0, '2560×1600', 165, 2.38, 80, 140, 119990, 'Windows 11 Home'],
  ['lap-thunderobot-911x', 'Thunderobot 911X (Китай)', 'Thunderobot', 2024, 'gaming', 'Intel Core i7-13620H', 62, 68, 'NVIDIA GeForce RTX 4060', 58, 8, 16, 'DDR5', 512, 'SSD', 15.6, '2560×1440', 165, 2.05, 63, 130, 79990, 'без ОС'],
  ['lap-hasee-4060', 'Hasee Z8 (Китай)', 'Hasee', 2024, 'gaming', 'Intel Core i7-13620H', 62, 68, 'NVIDIA GeForce RTX 4060', 58, 8, 16, 'DDR5', 1024, 'SSD', 15.6, '2560×1440', 165, 2.20, 62, 130, 82990, 'без ОС'],
  ['lap-msi-katana15', 'MSI Katana 15 B13V', 'MSI', 2023, 'gaming', 'Intel Core i7-13620H', 62, 68, 'NVIDIA GeForce RTX 4070', 66, 8, 16, 'DDR5', 1024, 'SSD', 15.6, '1920×1080', 144, 2.25, 53, 140, 114990, 'Windows 11 Home'],
  ['lap-hp-omen16', 'HP Omen 16-wf0', 'HP', 2023, 'gaming', 'Intel Core i7-13700HX', 72, 82, 'NVIDIA GeForce RTX 4070', 66, 8, 32, 'DDR5', 1024, 'SSD', 16.1, '2560×1440', 165, 2.44, 83, 150, 139990, 'Windows 11 Home'],
  ['lap-rog-zephyrus-g14', 'ASUS ROG Zephyrus G14', 'ASUS', 2024, 'gaming', 'AMD Ryzen 9 8945HS', 76, 88, 'NVIDIA GeForce RTX 4070', 66, 8, 32, 'LPDDR5', 1024, 'SSD', 14.0, '2880×1800', 120, 1.50, 73, 125, 169990, 'Windows 11 Home'],
  ['lap-predator-neo16', 'Acer Predator Helios Neo 16', 'Acer', 2024, 'gaming', 'Intel Core i7-14700HX', 78, 88, 'NVIDIA GeForce RTX 4070', 66, 8, 16, 'DDR5', 1024, 'SSD', 16.0, '2560×1600', 165, 2.60, 90, 150, 149990, 'Windows 11 Home'],
  ['lap-legion-pro5', 'Lenovo Legion Pro 5 16', 'Lenovo', 2024, 'gaming', 'Intel Core i9-14900HX', 82, 95, 'NVIDIA GeForce RTX 4080', 78, 12, 32, 'DDR5', 1024, 'SSD', 16.0, '2560×1600', 240, 2.80, 99, 175, 219990, 'Windows 11 Home'],
  ['lap-rog-scar18', 'ASUS ROG Strix Scar 18', 'ASUS', 2024, 'gaming', 'Intel Core i9-14900HX', 82, 95, 'NVIDIA GeForce RTX 4090', 88, 16, 32, 'DDR5', 2048, 'SSD', 18.0, '2560×1600', 240, 3.10, 90, 200, 349990, 'Windows 11 Home'],
  ['lap-msi-titan18', 'MSI Titan 18 HX', 'MSI', 2024, 'gaming', 'Intel Core i9-14900HX', 82, 95, 'NVIDIA GeForce RTX 4090', 88, 16, 64, 'DDR5', 2048, 'SSD', 18.0, '3840×2400', 120, 3.60, 99, 220, 429990, 'Windows 11 Home'],
  ['lap-razer-blade16', 'Razer Blade 16', 'Razer', 2024, 'gaming', 'Intel Core i9-14900HX', 82, 95, 'NVIDIA GeForce RTX 4080', 78, 12, 32, 'DDR5', 1024, 'SSD', 16.0, '2560×1600', 240, 2.45, 95, 170, 289990, 'Windows 11 Home'],
  ['lap-alienware-m16', 'Dell Alienware m16 R2', 'Dell', 2024, 'gaming', 'Intel Core Ultra 7 155H', 62, 72, 'NVIDIA GeForce RTX 4070', 66, 8, 16, 'DDR5', 1024, 'SSD', 16.0, '2560×1600', 240, 2.72, 86, 150, 179990, 'Windows 11 Home'],
  ['lap-msi-raider', 'MSI Raider GE78 HX', 'MSI', 2024, 'gaming', 'Intel Core i9-14900HX', 82, 95, 'NVIDIA GeForce RTX 4080', 78, 12, 32, 'DDR5', 2048, 'SSD', 17.0, '2560×1600', 240, 2.99, 99, 175, 249990, 'Windows 11 Home'],
  ['lap-asus-rog-strix-g16', 'ASUS ROG Strix G16', 'ASUS', 2024, 'gaming', 'Intel Core i7-13650HX', 70, 78, 'NVIDIA GeForce RTX 4060', 58, 8, 16, 'DDR5', 512, 'SSD', 16.0, '1920×1200', 165, 2.50, 90, 140, 119990, 'Windows 11 Home'],
  ['lap-gigabyte-g5', 'Gigabyte G5 KF5', 'Gigabyte', 2023, 'gaming', 'Intel Core i5-12500H', 55, 60, 'NVIDIA GeForce RTX 4060', 58, 8, 16, 'DDR4', 512, 'SSD', 15.6, '1920×1080', 144, 2.08, 54, 120, 91990, 'без ОС'],
  ['lap-acer-nitro16-3050', 'Acer Nitro 16 (б/у)', 'Acer', 2022, 'gaming', 'AMD Ryzen 5 6600H', 47, 54, 'NVIDIA GeForce RTX 3050 Ti', 41, 4, 16, 'DDR5', 512, 'SSD', 16.0, '1920×1200', 165, 2.70, 90, 110, 54990, 'Windows 11 Home'],
  ['lap-hp-pavilion-gaming', 'HP Pavilion Gaming 15 (б/у)', 'HP', 2020, 'gaming', 'Intel Core i5-10300H', 32, 36, 'NVIDIA GeForce GTX 1650', 30, 4, 16, 'DDR4', 512, 'SSD', 15.6, '1920×1080', 144, 2.23, 52, 90, 37990, 'Windows 11 Home'],
  ['lap-lenovo-ideapad-gaming3-bu', 'Lenovo IdeaPad Gaming 3 (б/у)', 'Lenovo', 2021, 'gaming', 'AMD Ryzen 5 5600H', 45, 52, 'NVIDIA GeForce GTX 1650', 30, 4, 16, 'DDR4', 512, 'SSD', 15.6, '1920×1080', 120, 2.29, 45, 95, 39990, 'Windows 11 Home'],
  // Рабочие станции и «для монтажа»
  ['lap-proart-studibook', 'ASUS ProArt Studiobook 16', 'ASUS', 2024, 'creator', 'Intel Core i9-13980HX', 84, 96, 'NVIDIA GeForce RTX 4070', 66, 8, 32, 'DDR5', 1024, 'SSD', 16.0, '3200×2000', 120, 2.40, 90, 150, 199990, 'Windows 11 Pro'],
  ['lap-thinkpad-p16', 'Lenovo ThinkPad P16s', 'Lenovo', 2023, 'creator', 'Intel Core i7-13700H', 68, 76, 'NVIDIA RTX A1000', 34, 4, 32, 'DDR5', 1024, 'SSD', 16.0, '1920×1200', 60, 1.78, 86, 90, 149990, 'Windows 11 Pro'],
  ['lap-dell-precision', 'Dell Precision 3581', 'Dell', 2024, 'creator', 'Intel Core i7-13800H', 70, 80, 'NVIDIA RTX 2000 Ada', 44, 8, 32, 'DDR5', 1024, 'SSD', 15.6, '1920×1080', 60, 1.90, 85, 110, 179990, 'Windows 11 Pro'],
  ['lap-hp-zbook', 'HP ZBook Power G10', 'HP', 2023, 'creator', 'Intel Core i7-13700H', 68, 76, 'NVIDIA RTX A2000', 40, 8, 32, 'DDR5', 1024, 'SSD', 15.6, '1920×1080', 60, 2.05, 83, 110, 159990, 'Windows 11 Pro'],
  ['lap-samsung-book3-pro', 'Samsung Galaxy Book3 Pro', 'Samsung', 2023, 'ultrabook', 'Intel Core i7-1360P', 52, 60, 'Intel Iris Xe', 15, 0, 16, 'LPDDR5', 512, 'SSD', 14.0, '2880×1800', 120, 1.17, 63, 28, 109990, 'Windows 11 Home'],
  ['lap-acer-swift-go', 'Acer Swift Go 14', 'Acer', 2024, 'ultrabook', 'Intel Core Ultra 5 125H', 55, 62, 'Intel Arc Graphics', 20, 0, 16, 'LPDDR5', 512, 'SSD', 14.0, '1920×1200', 60, 1.32, 65, 28, 74990, 'Windows 11 Home'],
  ['lap-msi-modern14', 'MSI Modern 14 C12M', 'MSI', 2023, 'ultrabook', 'Intel Core i5-12450H', 48, 52, 'Intel UHD', 12, 0, 16, 'DDR4', 512, 'SSD', 14.0, '1920×1080', 60, 1.40, 39, 45, 49990, 'Windows 11 Home'],
  ['lap-huawei-matebook14', 'Huawei MateBook 14', 'Huawei', 2023, 'ultrabook', 'Intel Core i5-1240P', 49, 56, 'Intel Iris Xe', 15, 0, 16, 'LPDDR4', 512, 'SSD', 14.2, '2160×1440', 60, 1.49, 56, 28, 69990, 'Windows 11 Home'],
  ['lap-xiaomi-redmibook-pro', 'Xiaomi RedmiBook Pro 14', 'Xiaomi', 2024, 'ultrabook', 'AMD Ryzen 7 7840HS', 66, 78, 'AMD Radeon 780M', 24, 0, 16, 'LPDDR5', 512, 'SSD', 14.0, '2560×1600', 120, 1.45, 60, 45, 69990, 'Windows 11 Home'],
  ['lap-honor-magicbook-14', 'Honor MagicBook 14 Pro', 'Honor', 2023, 'ultrabook', 'AMD Ryzen 7 7840HS', 66, 78, 'AMD Radeon 780M', 24, 0, 16, 'LPDDR5', 1024, 'SSD', 14.2, '2520×1680', 120, 1.47, 75, 45, 74990, 'Windows 11 Home'],
  ['lap-lenovo-thinkbook14', 'Lenovo ThinkBook 14 G6', 'Lenovo', 2023, 'office', 'Intel Core i5-1335U', 40, 47, 'Intel Iris Xe', 15, 0, 16, 'DDR5', 512, 'SSD', 14.0, '1920×1200', 60, 1.38, 45, 25, 54990, 'Windows 11 Pro'],
  ['lap-asus-tuf-a16-4070', 'ASUS TUF Gaming A16', 'ASUS', 2024, 'gaming', 'AMD Ryzen 9 7940HS', 72, 84, 'NVIDIA GeForce RTX 4070', 66, 8, 32, 'DDR5', 1024, 'SSD', 16.0, '2560×1600', 165, 2.30, 90, 145, 149990, 'Windows 11 Home'],
  ['lap-msi-cyborg15', 'MSI Cyborg 15 A12V', 'MSI', 2023, 'gaming', 'Intel Core i7-12650H', 58, 64, 'NVIDIA GeForce RTX 4060', 58, 8, 16, 'DDR5', 512, 'SSD', 15.6, '1920×1080', 144, 1.98, 53, 120, 89990, 'Windows 11 Home'],
  ['lap-acer-predator-helios18', 'Acer Predator Helios 18 (б/у)', 'Acer', 2023, 'gaming', 'Intel Core i9-13900HX', 82, 95, 'NVIDIA GeForce RTX 4080', 78, 12, 32, 'DDR5', 1024, 'SSD', 18.0, '2560×1600', 165, 3.25, 90, 175, 189990, 'Windows 11 Home'],
  ['lap-echips-4060', 'Echips Game 15 (б/у)', 'Echips', 2023, 'gaming', 'Intel Core i7-12650H', 58, 64, 'NVIDIA GeForce RTX 4060', 58, 8, 16, 'DDR5', 512, 'SSD', 15.6, '1920×1080', 144, 2.10, 54, 120, 69990, 'без ОС'],
  ['lap-hasee-4050-bu', 'Hasee Z7 (Китай, б/у)', 'Hasee', 2023, 'gaming', 'Intel Core i5-12450H', 48, 52, 'NVIDIA GeForce RTX 4050', 48, 6, 16, 'DDR5', 512, 'SSD', 15.6, '1920×1080', 144, 2.05, 54, 110, 56990, 'без ОС'],
  ['lap-huawei-d14', 'Huawei MateBook D14', 'Huawei', 2022, 'office', 'Intel Core i5-1135G7', 33, 38, 'Intel Iris Xe', 14, 0, 16, 'DDR4', 512, 'SSD', 14.0, '1920×1080', 60, 1.38, 56, 28, 42990, 'Windows 11 Home'],
  ['lap-lenovo-ip3-15', 'Lenovo IdeaPad 3 15ITL6', 'Lenovo', 2022, 'budget', 'Intel Core i3-1115G4', 28, 30, 'Intel UHD', 10, 0, 8, 'DDR4', 256, 'SSD', 15.6, '1920×1080', 60, 1.65, 45, 25, 27990, 'Windows 11 Home'],
  ['lap-asus-expertbook', 'ASUS ExpertBook B1', 'ASUS', 2023, 'office', 'Intel Core i5-1235U', 38, 44, 'Intel Iris Xe', 14, 0, 16, 'DDR4', 512, 'SSD', 15.6, '1920×1080', 60, 1.69, 42, 25, 52990, 'Windows 11 Pro'],
  ['lap-aquarius-cmp', 'Aquarius Cmp NE515', 'Aquarius', 2023, 'office', 'Intel Core i5-1135G7', 33, 38, 'Intel Iris Xe', 14, 0, 8, 'DDR4', 256, 'SSD', 15.6, '1920×1080', 60, 1.80, 45, 28, 45990, 'Windows 11 Pro'],
];

const LAPTOP_TYPES = {
  all: { name: 'Все', icon: '💻' },
  budget: { name: 'Бюджетные', icon: '💸' },
  office: { name: 'Офис и учёба', icon: '📄' },
  ultrabook: { name: 'Ультрабуки', icon: '🪶' },
  gaming: { name: 'Игровые', icon: '🎮' },
  creator: { name: 'Для монтажа и 3D', icon: '🎬' },
  macbook: { name: 'MacBook', icon: '🍎' },
};

const LAPTOPS = LAPTOP_ROWS.map(r => ({
  id: r[0], name: r[1], brand: r[2], year: r[3], type: r[4],
  cat: 'laptop',
  cpu: r[5], cpuPerf: r[6], cpuWork: r[7],
  gpu: r[8], gpuPerf: r[9], vramGb: r[10],
  ramGb: r[11], ramType: r[12], storageGb: r[13], storageType: r[14],
  screen: r[15], resolution: r[16], hz: r[17], weight: r[18], battery: r[19], tdp: r[20],
  basePrice: r[21], os: r[22],
  perf: Math.round((r[6] * 0.35 + r[9] * 0.65) * 10) / 10,   // игровой индекс, как у ПК
  work: Math.round((r[7] * 0.55 + Math.max(r[9] * 0.8, 15) * 0.45) * 10) / 10,
}));
const LAPTOP_BY_ID = new Map(LAPTOPS.map(l => [l.id, l]));
function laptopById(id) { return LAPTOP_BY_ID.get(id) || null; }
const isLaptopId = id => LAPTOP_BY_ID.has(id);

// ---------- Цены ----------
function laptopPrice(l, cityId = state.region, condition = 'new') {
  const lap = typeof l === 'string' ? laptopById(l) : l;
  if (!lap) return null;
  const city = cityById(cityId) || { coeff: 1 };
  let seed = 0;
  for (const ch of lap.id + cityId) seed = (seed * 31 + ch.charCodeAt(0)) % 9973;
  const jitter = 0.975 + (seed % 60) / 1000;
  const age = Math.max(0, 2026 - (lap.year || 2023));
  // ноутбуки теряют в цене быстрее: БУ ≈ 0.62, для старых моделей ещё ниже
  const usedFactor = Math.max(0.45, 0.66 - age * 0.03);
  const base = lap.basePrice * (condition === 'used' ? usedFactor : 1) * city.coeff * jitter;
  return Math.round(base / 100) * 100;
}
function laptopMinPrice(l, cityId = state.region, condition = 'new') {
  return laptopPrice(l, cityId, condition);
}
function laptopStoreLinks(l) {
  const q = l.name.replace(/\s*\(.*?\)\s*/g, ' ').trim();
  return STORES.filter(s => s.type === 'new').slice(0, 5).map(s => ({ name: s.name, url: s.searchUrl(q) }))
    .concat([{ name: 'Avito (БУ)', url: avitoUrl(q) }]);
}

// ---------- FPS ----------
const LAPTOP_FPS_CACHE = new Map();
function laptopFps(l, gameId = (typeof priorityInfo === 'function' ? priorityInfo().games[0]?.id : 'cs2') || 'cs2', res = (typeof priorityRes === 'function' ? priorityRes() : '1080p')) {
  const lap = typeof l === 'string' ? laptopById(l) : l;
  if (!lap) return null;
  const key = [lap.id, gameId, res].join('|');
  if (LAPTOP_FPS_CACHE.has(key)) return LAPTOP_FPS_CACHE.get(key);
  const g = GAMES.find(x => x.id === gameId) || GAMES.find(x => x.id === 'cyberpunk');
  if (!g) return null;
  // ноутбучные чипы держат частоты хуже десктопных — небольшая поправка
  const laptopFactor = 0.93;
  let fps = g.refFps
    * Math.pow(Math.max(lap.gpuPerf, 4) / REF_GPU_PERF, g.gpuWeight)
    * Math.pow(Math.max(lap.cpuPerf, 4) / REF_CPU_PERF, 1 - g.gpuWeight)
    * laptopFactor;
  if (res === '1440p') fps *= g.res1440;
  else if (res === '4K') fps *= g.res4k;
  if (lap.ramGb < 16) fps *= 0.93;
  if (lap.ramGb < 8) fps *= 0.9;
  const out = Math.max(1, Math.round(fps));
  LAPTOP_FPS_CACHE.set(key, out);
  return out;
}
function laptopFpsAvg(l, games, res) {
  const list = (games && games.length ? games : GAMES).map(g => laptopFps(l, g.id || g, res));
  return Math.round(list.reduce((a, b) => a + b, 0) / list.length);
}
function laptopValue(l, games, res) {
  const fps = laptopFpsAvg(l, games, res);
  const price = laptopPrice(l) ?? l.basePrice;
  return fps ? Math.round(price / fps) : Infinity;
}

// ---------- Подбор под ИИ ----------
function findLaptops({ budget = 80000, games = [], res = '1080p', target = 60, condition = 'new', type = 'all', limit = 6 } = {}) {
  return LAPTOPS
    .map(l => {
      const price = (condition === 'used' ? laptopPrice(l, state.region, 'used') : laptopPrice(l, state.region, condition === 'any' ? 'new' : condition)) ?? l.basePrice;
      const fps = laptopFpsAvg(l, games, res);
      const priceUsed = laptopPrice(l, state.region, 'used');
      const bestPrice = condition === 'any' ? Math.min(price, priceUsed ?? Infinity) : price;
      return { l, price: bestPrice, priceNew: laptopPrice(l, state.region, 'new'), priceUsed, fps };
    })
    .filter(x => x.price <= budget * 1.02)
    .filter(x => type === 'all' || x.l.type === type)
    .map(x => {
      const enough = x.fps >= target;
      const value = x.fps / Math.max(x.price / 1000, 1);
      return { ...x, enough, value, score: value * (enough ? 1.25 : 0.8) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
// Лучший ноутбук под бюджет и профиль:
// если бюджет позволяет добить цель по FPS — берём самый мощный в бюджете (с разумным запасом),
// иначе — самый производительный из доступных.
function aiPickLaptop(budget, profile) {
  const list = findLaptops({ budget, games: profile.games, res: profile.res, target: profile.target, condition: state.aiCondition, limit: 999 });
  if (!list.length) return null;
  const enough = list.filter(x => x.enough).sort((a, b) => b.fps - a.fps || a.price - b.price);
  const byValue = list.slice().sort((a, b) => a.value - b.value);
  let best;
  if (enough.length) {
    const strongest = enough[0];
    // не переплачиваем больше, чем в 1.8 раза, за прирост FPS
    const reasonable = enough.filter(x => x.price <= Math.max(strongest.price * 0.65, strongest.price - budget * 0.25));
    best = reasonable[0] || strongest;
  } else {
    best = list.slice().sort((a, b) => b.fps - a.fps || a.price - b.price)[0];
  }
  const cheaper = list.filter(x => x.l.id !== best.l.id && x.price < best.price).sort((a, b) => b.fps - a.fps)[0] || null;
  return { ...best, altCheaper: cheaper, list: byValue.slice(0, 8) };
}

// Самый дешёвый ноутбук, который добивает нужный FPS
function aiCheapestLaptop(profile, minFps, budget = Infinity) {
  const list = findLaptops({ budget: Math.max(budget, 5000), games: profile.games, res: profile.res, target: minFps, condition: state.aiCondition, limit: 999 });
  const ok = list.filter(x => x.fps >= minFps).sort((a, b) => a.price - b.price);
  return ok[0] || null;
}

// ---------- «Такой же по мощности ПК» ----------
// Собираем самый дешёвый десктоп с сопоставимой производительностью.
const PC_TWIN_CACHE = new Map();
// Самый дешёвый ПК, который добивает нужный FPS (для честного сравнения с ноутбуком)
function aiCheapestPc(profile, minFps, maxBudget = Infinity) {
  if (typeof aiEstimateFps !== 'function' || typeof aiRestPool !== 'function') return null;
  const key = [minFps, profile.res, (profile.gameIds || []).join(','), state.region, state.aiCondition].join('|');
  if (PC_TWIN_CACHE.has(key)) return PC_TWIN_CACHE.get(key);
  const cpus = COMPONENTS.filter(c => c.cat === 'cpu' && (c.perf || 0) > 0)
    .map(c => ({ c, price: minPrice(c.id, state.region, 'new') ?? c.basePrice ?? 0 })).sort((a, b) => a.price - b.price);
  const gpus = COMPONENTS.filter(c => c.cat === 'gpu' && (c.perf || 0) > 0)
    .map(c => ({ c, price: minPrice(c.id, state.region, 'new') ?? c.basePrice ?? 0 })).sort((a, b) => a.price - b.price);
  let best = null;
  // смотрим весь диапазон цен, а не только самые дешёвые карты
  const gpuSteps = typeof aiThin === 'function' ? aiThin(gpus, 44) : gpus.slice(0, 44);
  const cpuSteps = typeof aiThin === 'function' ? aiThin(cpus, 26) : cpus.slice(0, 26);
  for (const g of gpuSteps) {
    for (const cp of cpuSteps) {
      const corePrice = g.price + cp.price;
      if (best && corePrice >= best.total) break;
      const fps = aiEstimateFps(cp.c.id, g.c.id, profile);
      if (fps < minFps) continue;
      const info = aiRestPool({ cpu: cp.c, gpu: g.c }, profile);
      const base = aiBaseRest(info.pools, profile, 16);
      if (!base) continue;
      const total = corePrice + base.sum;
      if (total > maxBudget) continue;
      if (!best || total < best.total) {
        best = {
          total, fps,
          parts: { cpu: cp.c.id, gpu: g.c.id, ...Object.fromEntries(Object.entries(base.choice).map(([k, v]) => [k, v.c.id])) },
          items: { cpu: cp.c, gpu: g.c },
        };
        break;                    // дальше по цене только дороже — этот вариант лучший
      }
    }
  }
  PC_TWIN_CACHE.set(key, best);
  return best;
}

function desktopTwin(lap) {
  if (!lap || typeof aiFitRest !== 'function') return null;
  const gpuPool = COMPONENTS.filter(c => c.cat === 'gpu' && (c.perf || 0) >= lap.gpuPerf * 0.95)
    .map(c => ({ c, price: minPrice(c.id, state.region, 'new') ?? c.basePrice ?? 0 }))
    .sort((a, b) => a.price - b.price);
  const cpuPool = COMPONENTS.filter(c => c.cat === 'cpu' && (c.perf || 0) >= lap.cpuPerf * 0.95)
    .map(c => ({ c, price: minPrice(c.id, state.region, 'new') ?? c.basePrice ?? 0 }))
    .sort((a, b) => a.price - b.price);
  if (!gpuPool.length || !cpuPool.length) return null;
  const profile = typeof aiProfile === 'function' ? aiProfile() : { work: 0.2, heavy: false };
  let best = null;
  gpuPool.slice(0, 6).forEach(g => {
    cpuPool.slice(0, 8).forEach(cp => {
      const core = { cpu: cp.c, gpu: g.c, cpuPrice: cp.price, gpuPrice: g.price };
      const info = aiRestPool(core, profile);
      const base = aiBaseRest(info.pools, profile, 16);
      if (!base) return;
      const total = cp.price + g.price + base.sum;
      if (!best || total < best.total) best = { total, parts: { cpu: cp.c.id, gpu: g.c.id, ...Object.fromEntries(Object.entries(base.choice).map(([k, v]) => [k, v.c.id])) }, items: { cpu: cp.c, gpu: g.c } };
    });
  });
  if (!best) return null;
  return { ...best, fps: laptopFpsAvg(lap, typeof priorityInfo === 'function' ? priorityInfo().games : GAMES, priorityRes ? priorityRes() : '1080p') };
}
// Наоборот: ноутбук, сравнимый с готовой сборкой ПК
function laptopTwinOfBuild(build, profile) {
  const parts = build.parts || build;
  const cpu = byId(parts.cpu), gpu = byId(parts.gpu);
  if (!cpu || !gpu) return null;
  const games = profile && profile.games && profile.games.length ? profile.games : GAMES;
  const res = (profile && profile.res) || '1080p';
  const targetFps = (typeof aiEstimateFps === 'function' && profile) ? aiEstimateFps(parts.cpu, parts.gpu, profile) : null;
  const list = LAPTOPS.map(l => ({ l, fps: laptopFpsAvg(l, games, res), price: laptopPrice(l, state.region, 'new') ?? l.basePrice }))
    .filter(x => x.fps >= (targetFps ? targetFps * 0.95 : 0));
  if (!list.length) return null;
  list.sort((a, b) => a.price - b.price);
  return { ...list[0], targetFps };
}

// ---------- Карточка ноутбука ----------
function laptopTypeName(type) { return (LAPTOP_TYPES[type] || LAPTOP_TYPES.all).name; }
function laptopBadge(l) {
  if (l.type === 'gaming') return '🎮 игровой';
  if (l.type === 'macbook') return '🍎 macOS';
  if (l.type === 'creator') return '🎬 рабочая станция';
  if (l.type === 'ultrabook') return '🪶 ультрабук';
  if (l.type === 'budget') return '💸 бюджетный';
  return '📄 офисный';
}
function laptopCard(l) {
  const pNew = laptopPrice(l, state.region, 'new');
  const pUsed = laptopPrice(l, state.region, 'used');
  const fps = (typeof priorityInfo === 'function' && !priorityIsAll())
    ? laptopFps(l) : laptopFps(l, 'cyberpunk', '1080p');
  const game = (typeof priorityInfo === 'function' && !priorityIsAll()) ? priorityInfo().games[0] : GAMES.find(g => g.id === 'cyberpunk');
  const twin = typeof desktopTwin === 'function' ? desktopTwin(l) : null;
  const diff = twin ? Math.round(((pNew ?? l.basePrice) - twin.total) / Math.max(twin.total, 1) * 100) : null;
  return `<article class="card laptop-card">
    <div class="tag">${laptopBadge(l)} · ${esc(l.brand)} · ${l.year}</div>
    <h3>${esc(l.name)}</h3>
    <div class="specs-mini">
      <div>CPU: <b>${esc(l.cpu)}</b></div>
      <div>GPU: <b>${esc(l.gpu)}${l.vramGb ? ' · ' + l.vramGb + ' ГБ' : ''}</b></div>
      <div>Память: <b>${l.ramGb} ГБ ${esc(l.ramType)}</b> · ${l.storageGb >= 1000 ? (l.storageGb / 1000) + ' ТБ' : l.storageGb + ' ГБ'} ${esc(l.storageType)}</div>
      <div>Экран: <b>${l.screen}" ${esc(l.resolution)} ${l.hz} Гц</b> · ${l.weight} кг</div>
    </div>
    <div class="meter-label"><span>Игровой индекс</span><b>${l.perf}/100</b></div>
    <div class="bar"><i style="width:${l.perf}%"></i></div>
    <div class="fps-inline">🎯 <b>${fps} FPS</b> <span class="muted small">· ${esc(game ? game.name : '')} 1080p</span></div>
    ${twin ? `<div class="laptop-twin small ${diff > 0 ? 'neg' : 'pos'}">
      ${diff > 0 ? `📈 дороже` : `📉 дешевле`} равного по мощности ПК на ${Math.abs(diff)}% · ПК ≈ ${fmt(twin.total)}
      <span class="muted">(без экрана, клавиатуры и батареи)</span>
    </div>` : ''}
    <div class="row">
      <div><span class="price">${fmt(pNew)}</span> <span class="muted small">новый</span><br>
      <span class="small" style="color:#fda4af">БУ от ${fmt(pUsed)}</span></div>
      <div class="laptop-actions">
        <button class="btn small ghost" onclick="openLaptop('${l.id}')">Подробнее</button>
        <button class="btn small lime" onclick="compareLaptopWithPc('${l.id}')">⚖️ ПК vs ноутбук</button>
      </div>
    </div>
  </article>`;
}

// ---------- Страница «Ноутбуки» ----------
function filteredLaptops() {
  const q = (state.laptopQuery || '').toLowerCase().trim();
  return LAPTOPS.filter(l => {
    if (state.laptopType !== 'all' && l.type !== state.laptopType) return false;
    if (q) {
      const hay = (l.name + ' ' + l.brand + ' ' + l.cpu + ' ' + l.gpu + ' ' + laptopTypeName(l.type)).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (state.laptopMaxPrice !== '' && !isNaN(Number(state.laptopMaxPrice)) && (laptopPrice(l) ?? l.basePrice) > Number(state.laptopMaxPrice)) return false;
    return true;
  }).sort((a, b) => {
    if (state.laptopSort === 'price') return (laptopPrice(a) ?? a.basePrice) - (laptopPrice(b) ?? b.basePrice);
    if (state.laptopSort === 'perf') return b.perf - a.perf;
    if (state.laptopSort === 'value') return laptopValue(a, null, '1080p') - laptopValue(b, null, '1080p');
    return (laptopPrice(a) ?? a.basePrice) - (laptopPrice(b) ?? b.basePrice);
  });
}

function renderLaptops() {
  const chips = $('#laptopChips');
  if (chips) chips.innerHTML = Object.entries(LAPTOP_TYPES).map(([id, t]) => {
    const n = id === 'all' ? LAPTOPS.length : LAPTOPS.filter(l => l.type === id).length;
    return `<button class="chip ${state.laptopType === id ? 'active' : ''}" onclick="state.laptopType='${id}';render()">${t.icon} ${t.name} · ${n}</button>`;
  }).join('');
  const grid = $('#laptopGrid');
  if (!grid) return;
  const list = filteredLaptops();
  grid.innerHTML = list.length ? list.map(laptopCard).join('') : '<div class="empty">Ноутбуков под такие фильтры нет. Сбросьте цену или категорию.</div>';
  const cnt = $('#laptopCount');
  if (cnt) cnt.textContent = `${list.length} из ${LAPTOPS.length} ноутбуков · цены в ${regionById(state.region).name}`;
  const ai = $('#laptopAiHint');
  if (ai) ai.innerHTML = `<div class="ai-home-head">
    <div><b>🤖 Пусть ИИ подберёт ноутбук</b>
    <div class="small muted">Укажите бюджет и во что играете — ИИ выберет ноутбук и сравнит его с ПК той же мощности: что дешевле.</div></div>
    <button class="btn small lime" onclick="aiPickLaptopAndOpen()">Подобрать ноутбук с ИИ →</button>
  </div>`;
}
function aiPickLaptopAndOpen() {
  state.aiDevice = 'laptop';
  const info = typeof priorityInfo === 'function' ? priorityInfo() : null;
  if (info && info.kind !== 'all') state.aiGameQuery = info.name;
  else if (!state.aiGameQuery) state.aiGameQuery = 'игры';
  navigate('ai');
  setTimeout(() => { if (typeof aiGenerate === 'function') aiGenerate(); }, 30);
}

// ---------- Сравнение «ноутбук ↔ ПК» ----------
function compareLaptopWithPc(id) {
  const lap = laptopById(id);
  if (!lap) return;
  state.aiDevice = 'auto';
  state.aiBudget = Math.round((laptopPrice(lap) ?? lap.basePrice) * 1.05 / 1000) * 1000;
  state.aiLaptopPick = id;
  state.aiGameQuery = state.aiGameQuery || (typeof priorityInfo === 'function' && !priorityIsAll() ? priorityInfo().name : 'игры');
  navigate('ai');
  setTimeout(() => { if (typeof aiGenerate === 'function') aiGenerate(); }, 30);
  toast(`Сравниваем ${lap.name} с ПК за те же деньги`);
}
function openLaptop(id) {
  state.laptopOpen = id;
  renderLaptopsDetail();
  const el = $('#laptopDetail');
  if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function renderLaptopsDetail() {
  const box = $('#laptopDetail');
  if (!box) return;
  const l = laptopById(state.laptopOpen);
  if (!l) { box.innerHTML = ''; return; }
  const games = GAMES.slice(0, 12);
  const twin = desktopTwin(l);
  const pNew = laptopPrice(l, state.region, 'new'), pUsed = laptopPrice(l, state.region, 'used');
  box.innerHTML = `<div class="laptop-detail">
    <div class="row" style="justify-content:space-between;align-items:flex-start;gap:12px">
      <div>
        <div class="tag">${laptopBadge(l)} · ${esc(l.brand)} · ${l.year}</div>
        <h3 style="margin:4px 0">${esc(l.name)}</h3>
        <div class="small muted">${esc(l.cpu)} · ${esc(l.gpu)}${l.vramGb ? ' ' + l.vramGb + ' ГБ' : ''} · ${l.ramGb} ГБ ${esc(l.ramType)} · ${l.storageGb >= 1000 ? (l.storageGb / 1000) + ' ТБ' : l.storageGb + ' ГБ'} ${esc(l.storageType)}</div>
        <div class="small muted">${l.screen}" ${esc(l.resolution)} ${l.hz} Гц · ${l.weight} кг · батарея ${l.battery} Вт·ч · ${esc(l.os)}</div>
      </div>
      <div style="text-align:right">
        <div class="price" style="font-size:1.4rem">${fmt(pNew)}</div>
        <div class="small" style="color:#fda4af">БУ от ${fmt(pUsed)}</div>
        <button class="btn small ghost" onclick="state.laptopOpen=null;renderLaptopsDetail()">✕</button>
      </div>
    </div>
    <div class="laptop-fps">
      ${games.map(g => { const f = laptopFps(l, g.id, '1080p'); const v = fpsVerdict(f); return `<div class="laptop-fps-item"><span>${esc(g.name)}</span><b class="${v.cls}">${f}</b></div>`; }).join('')}
    </div>
    ${twin ? `<div class="verdict ${(pNew ?? l.basePrice) > twin.total ? 'warn' : 'ok'}">
      <b>ПК той же мощности ≈ ${fmt(twin.total)}</b>
      <div class="small">${(pNew ?? l.basePrice) > twin.total
        ? `Ноутбук дороже на ${fmt((pNew ?? l.basePrice) - twin.total)} — вы платите за мобильность, экран, клавиатуру и батарею.`
        : `Ноутбук дешевле на ${fmt(twin.total - (pNew ?? l.basePrice))} — собирать ПК под эту мощность смысла нет.`}
        <button class="btn small ghost" onclick="loadBuilderTwin('${l.id}')">Показать этот ПК в конструкторе</button></div>
    </div>` : ''}
    ${typeof laptopSwapsHtml === 'function' ? laptopSwapsHtml(l) : ''}
    <div class="laptop-links">
      ${laptopStoreLinks(l).map(s => `<a class="btn small ghost" href="${s.url}" target="_blank" rel="noopener">${esc(s.name)} ↗</a>`).join('')}
    </div>
  </div>`;
}
function loadBuilderTwin(id) {
  const l = laptopById(id);
  const twin = l ? desktopTwin(l) : null;
  if (!twin) { toast('Не удалось собрать ПК такой же мощности'); return; }
  state.builder = { ...twin.parts };
  navigate('builder');
  toast('В конструкторе — ПК той же мощности');
}
