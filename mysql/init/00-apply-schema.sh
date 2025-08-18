#!/bin/bash
set -euo pipefail

# 2) 스키마 적용 (envsubst로 템플릿 치환 후 적용)
SCHEMA_SRC="/docker-entrypoint-initdb.d/01-schema.tmpl"
SCHEMA_TMP="$(mktemp)"
# 템플릿 안에서 ${MYSQL_DATABASE} 같은 변수를 사용할 수 있음
envsubst < "$SCHEMA_SRC" > "$SCHEMA_TMP"
cat "$SCHEMA_TMP"

mysql --protocol=socket -uroot -p"${MYSQL_ROOT_PASSWORD}" "${MYSQL_DATABASE}" < "$SCHEMA_TMP"

rm "$SCHEMA_TMP"
