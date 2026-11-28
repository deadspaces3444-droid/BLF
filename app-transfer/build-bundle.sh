#!/usr/bin/env bash
# Собирает один самодостаточный файл blf-photos-bundle.js = data.js + catalog.js + parts-photos.js
# Удобно, если в приложении нет сборщика и проще подключить один <script>.
# Наружу отдаётся window.BLFPhotos (функции фото) и window.BLFPhotos.COMPONENTS.
set -euo pipefail
cd "$(dirname "$0")"
{
  echo '/* BLF: каталог + фото комплектующих одним файлом (сгенерировано build-bundle.sh) */'
  echo '(function (global) {'
  echo "'use strict';"
  cat data.js
  echo
  cat catalog.js
  echo
  cat parts-photos.js
  echo
  cat <<'TAIL'
  global.BLFPhotos = {
    COMPONENTS, EXTRA_COMPONENTS, PART_IMAGES, PART_MODEL_IMAGES, PART_ID_PHOTO, PART_IMG_DIR,
    imgKeyFor, imgFor, partImg, buildImgStrip, shortName, photoBadge, isExactPhoto,
    missingPhotoImg, imgFallback, imgModelToken, hasPhoto, partById
  };
})(typeof window !== 'undefined' ? window : globalThis);
TAIL
} > blf-photos-bundle.js
echo "OK blf-photos-bundle.js ($(wc -c < blf-photos-bundle.js) байт)"
