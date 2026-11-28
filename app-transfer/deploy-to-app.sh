#!/usr/bin/env bash
# ===== Перенос фото BLF в ПК-приложение =====
#
# Что делает:
#   1) копирует фото и модуль в папку вашего приложения;
#   2) сам находит в его HTML место, куда вставить <script src="parts-photos.js">
#      (сразу после data.js — так же, как на сайте) и <link> на стили;
#   3) если места не нашлось — печатает предупреждение и ничего не ломает.
#
# Запуск:
#   ./deploy-to-app.sh /путь/к/приложению
#
# После запуска откройте приложение и проверьте, что карточки показывают фото,
# а там, где фото нет — плашку «изображения нет».

set -euo pipefail

SRC="$(cd "$(dirname "$0")" && pwd)"
DST="${1:-}"

if [ -z "$DST" ] || [ ! -d "$DST" ]; then
  echo "Использование: $0 /путь/к/папке/приложения" >&2
  echo "Папка должна содержать HTML приложения (index.html и т. п.)." >&2
  exit 1
fi

echo "Откуда: $SRC"
echo "Куда:   $DST"

# ---------- 1. файлы ----------
mkdir -p "$DST/img/parts"
cp -f "$SRC"/img/parts/*.jpg "$DST/img/parts/"
cp -f "$SRC/parts-photos.js" "$DST/parts-photos.js"
cp -f "$SRC/parts-photos.css" "$DST/parts-photos.css"
echo "OK   скопировано фото: $(ls "$SRC"/img/parts/*.jpg | wc -l)"

# ---------- 2. подключение в HTML ----------
HTML=$(grep -rl --include='*.html' -e '</body>' "$DST" 2>/dev/null | head -5 || true)
if [ -z "$HTML" ]; then
  echo "ВНИМАНИЕ: HTML-файлы не найдены — подключите вручную:"
  echo '  <link rel="stylesheet" href="parts-photos.css">'
  echo '  <script src="parts-photos.js"></script>  <!-- после data.js -->'
  exit 0
fi

for f in $HTML; do
  # подключаем стили один раз
  if ! grep -q 'parts-photos.css' "$f"; then
    if grep -q '</head>' "$f"; then
      # вставляем перед </head>; | как разделитель, чтобы не ломать пути с /
      sed -i 's|</head>|<link rel="stylesheet" href="parts-photos.css">\n</head>|' "$f"
    else
      sed -i '1i <link rel="stylesheet" href="parts-photos.css">' "$f"
    fi
    echo "OK   стили подключены: $f"
  fi

  # скрипт — после data.js, если он есть; иначе перед </body>
  if ! grep -q 'parts-photos.js' "$f"; then
    if grep -q 'data\.js' "$f"; then
      sed -i 's|\(<script[^>]*src="[^"]*data\.js"[^>]*></script>\)|\1\n<script src="parts-photos.js"></script>|' "$f"
      if ! grep -q 'parts-photos.js' "$f"; then
        sed -i 's|</body>|<script src="parts-photos.js"></script>\n</body>|' "$f"
      fi
    else
      sed -i 's|</body>|<script src="parts-photos.js"></script>\n</body>|' "$f"
      echo "ВНИМАНИЕ: data.js в $f не найден — модуль подключён в конец,"
      echo "         убедитесь, что он загружается ПОСЛЕ каталога комплектующих."
    fi
    echo "OK   модуль подключён: $f"
  fi
done

# ---------- 3. проверка ----------
echo
echo "Проверка:"
for f in $HTML; do
  printf '  %s → стили: %s, модуль: %s\n' "$f" \
    "$(grep -c 'parts-photos.css' "$f")" "$(grep -c 'parts-photos.js' "$f")"
done
cat <<'TIP'

Дальше в коде приложения замените вывод картинок на функции модуля:
  было:  <img src="..."> или иконка
  стало: partImg(part, { size: 'md' })        // карточка/слот
         buildImgStrip(parts, 4)               // полоска фото в сборке
         photoBadge(part)                      // подпись «фото модели» / «типовое фото серии»

Если в приложении свои имена функций — достаточно, чтобы перед ними
подключался parts-photos.js: imgFor/partImg/imgKeyFor будут доступны глобально.
TIP
