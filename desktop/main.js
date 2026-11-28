// ===== BLF Desktop — окно приложения поверх того же кода, что и сайт =====
// Ничего не пересобирает: грузит локальный index.html, поэтому фото комплектующих,
// каталог, конструктор и плашка «изображения нет» работают ровно как на сайте.
const { app, BrowserWindow, Menu, shell, dialog, screen } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

// В установленной программе сайт лежит в resources/app (extraResources),
// в режиме разработки — это корень репозитория рядом с папкой desktop.
function resolveAppDir(isPackaged, resourcesPath) {
  return isPackaged ? path.join(resourcesPath, 'app') : path.join(__dirname, '..');
}
const APP_DIR = resolveAppDir(app.isPackaged, process.resourcesPath);
const STATE_FILE = path.join(app.getPath('userData'), 'window-state.json');

let win = null;

function loadState() {
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    const s = JSON.parse(raw);
    if (s && Number.isFinite(s.width) && Number.isFinite(s.height)) return s;
  } catch (e) { /* первый запуск */ }
  return { width: 1440, height: 900, maximized: false };
}

function saveState() {
  if (!win) return;
  const b = win.getNormalBounds ? win.getNormalBounds() : win.getBounds();
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify({
      x: b.x, y: b.y, width: b.width, height: b.height, maximized: win.isMaximized()
    }));
  } catch (e) { /* не критично */ }
}

// окно не должно открываться за пределами экрана после смены монитора
function fitToScreen(s) {
  const area = screen.getPrimaryDisplay().workAreaSize;
  const width = Math.min(s.width, area.width);
  const height = Math.min(s.height, area.height);
  const out = { width, height, maximized: !!s.maximized };
  if (Number.isFinite(s.x) && Number.isFinite(s.y)) {
    const displays = screen.getAllDisplays().map(d => d.workArea);
    const visible = displays.some(a => s.x < a.x + a.width - 80 && s.x + width > a.x + 80 &&
                                        s.y < a.y + a.height - 80 && s.y + height > a.y);
    if (visible) { out.x = s.x; out.y = s.y; }
  }
  return out;
}

function createWindow() {
  const st = fitToScreen(loadState());

  win = new BrowserWindow({
    ...st,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#f5f7fb',          // фон PS5-темы, чтобы не было белой вспышки
    title: 'BLF — BuildLab',
    show: false,
    autoHideMenuBar: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true
    }
  });

  win.once('ready-to-show', () => {
    if (st.maximized) win.maximize();
    win.show();
  });

  win.loadFile(path.join(APP_DIR, 'index.html'));

  // внешние ссылки (DNS, Ozon, Rufus, дистрибутивы ОС, DeepSeek) — в системный браузер
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('file://')) { e.preventDefault(); shell.openExternal(url); }
  });

  ['resize', 'move', 'maximize', 'unmaximize', 'close'].forEach(evt => win.on(evt, saveState));
  win.on('closed', () => { win = null; });

  return win;
}

function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    {
      label: 'Файл',
      submenu: [
        { label: 'Обновить страницу', accelerator: 'F5', click: () => win && win.reload() },
        { label: 'Сбросить интерфейс', click: () => win && win.webContents.executeJavaScript(
            "try{localStorage.removeItem('blf.ui.v1');location.reload();}catch(e){location.reload();}") },
        { type: 'separator' },
        isMac ? { role: 'close', label: 'Закрыть' } : { role: 'quit', label: 'Выход' }
      ]
    },
    {
      label: 'Вид',
      submenu: [
        { role: 'resetZoom', label: 'Обычный масштаб' },
        { role: 'zoomIn', label: 'Крупнее' },
        { role: 'zoomOut', label: 'Мельче' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Полный экран' },
        { role: 'toggleDevTools', label: 'Инструменты разработчика' }
      ]
    },
    {
      label: 'Справка',
      submenu: [
        { label: 'Где лежат фото комплектующих', click: () => shell.openPath(path.join(APP_DIR, 'img', 'parts')) },
        {
          label: 'О программе',
          click: () => dialog.showMessageBox(win, {
            type: 'info',
            title: 'BLF — BuildLab',
            message: 'BLF Desktop ' + app.getVersion(),
            detail: 'Локальная версия сайта BLF: каталог, конструктор, сравнение и фото комплектующих.\n' +
                    'Фото: ' + path.join(APP_DIR, 'img', 'parts') + '\n' +
                    'Интернет нужен только для ИИ-подбора (DeepSeek) и внешних ссылок.',
            buttons: ['OK']
          })
        }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// один экземпляр: повторный запуск поднимает уже открытое окно
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);      // сначала без меню, чтобы окно открылось быстрее
    createWindow();
    buildMenu();
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  });

  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
}

module.exports = { APP_DIR, resolveAppDir };
