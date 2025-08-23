#!/bin/bash
set -euo pipefail

SCHEMA_SRC="/docker-entrypoint-initdb.d/01-schema.tmpl"
SCHEMA_TMP=`mktemp`
sed \
  -e "s|\${DB_PORT}|${DB_PORT}|g" \
  -e "s|\${DB_USER}|${DB_USER}|g" \
  -e "s|\${DB_PASSWORD}|${DB_PASSWORD}|g" \
  -e "s|\${DB_DATABASE}|${DB_DATABASE}|g" \
  "$SCHEMA_SRC" > "$SCHEMA_TMP"

mysql --protocol=socket -uroot -p"${MYSQL_ROOT_PASSWORD}" "${MYSQL_DATABASE}" < "$SCHEMA_TMP"

rm "$SCHEMA_TMP"
