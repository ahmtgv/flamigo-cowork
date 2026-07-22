#!/usr/bin/env bash
# Генерация Y4M-фикстур для детерминированного тестирования SEduM.
#
# Исходники (mp4) кладите в tests/fixtures/source/.
# Требуется ffmpeg.
set -euo pipefail

SRC_DIR="tests/fixtures/source"
OUT_DIR="tests/fixtures/video"
mkdir -p "$SRC_DIR" "$OUT_DIR"

# 480p достаточно для распознавания лица.
# Y4M — СЫРОЙ формат: ~1 ГБ на 10 сек 1080p. Не поднимайте разрешение без нужды.
WIDTH=640
HEIGHT=480
DURATION=15

declare -A CLIPS=(
  [attentive_15s]="Смотрит в экран, лицо во фронт"
  [looking_away_15s]="Отводит взгляд в сторону"
  [no_face_10s]="Пустой кадр без лица"
  [eyes_closed_15s]="Глаза закрыты > 3 секунд"
  [low_light_15s]="Слабое освещение"
)

for name in "${!CLIPS[@]}"; do
  src="$SRC_DIR/${name%%_*}.mp4"
  [[ -f "$SRC_DIR/$name.mp4" ]] && src="$SRC_DIR/$name.mp4"

  if [[ ! -f "$src" ]]; then
    echo "SKIP  $name — нет исходника $src  (${CLIPS[$name]})"
    continue
  fi

  out="$OUT_DIR/$name.y4m"
  echo "GEN   $name  <- $src"
  ffmpeg -y -loglevel error -i "$src" \
         -vf "scale=${WIDTH}:${HEIGHT}" -t "$DURATION" -pix_fmt yuv420p "$out"

  # ⚠️ КРИТИЧНО: ffmpeg пишет в заголовок C420mpeg2, Chrome ожидает C420
  # и БЕЗ этой правки падает при старте. Проверено — это не опционально.
  if head -c 200 "$out" | grep -q "C420mpeg2"; then
    if sed --version >/dev/null 2>&1; then
      sed -i '0,/C420mpeg2/s//C420/' "$out"        # GNU sed
    else
      sed -i '' '0,/C420mpeg2/s//C420/' "$out"     # BSD/macOS sed
    fi
    echo "      патч заголовка C420mpeg2 -> C420 применён"
  fi

  du -h "$out" | awk '{print "      размер: "$1}'
done

echo
echo "Готово. Фикстуры в $OUT_DIR"
echo "Напоминание: .y4m в .gitignore. Версионируйте исходные .mp4 через Git LFS."
