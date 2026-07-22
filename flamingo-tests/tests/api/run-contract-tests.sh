#!/usr/bin/env bash
# Контрактное тестирование публичного API Flamingo (schema-first).
#
# Для ПУБЛИЧНОГО API правильная модель — schema-first, а не consumer-driven:
# потребители неизвестны и Pact-файлы вам не напишут.
# Pact подключать только когда появится ИЗВЕСТНЫЙ потребитель
# (например, ваше же мобильное приложение <-> бэкенд).
#
# ⚠️ Dredd НЕ использовать — проект официально архивирован.
set -euo pipefail

SCHEMA="${SCHEMA_URL:-http://localhost:8000/openapi.json}"

pip install --quiet schemathesis

echo "== Property-based тесты из OpenAPI-схемы =="
st run "$SCHEMA" \
  --checks all \
  --hypothesis-max-examples=100 \
  --report

echo
echo "== Отдельно: ingest-эндпоинт SEduM =="
# Старые версии приложения живут на устройствах месяцами —
# контракт приёма агрегатов ломать нельзя.
st run "$SCHEMA" \
  --include-path-regex '/api/sedum/' \
  --checks all \
  --hypothesis-max-examples=200
