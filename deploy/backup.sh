#!/usr/bin/env bash
#
# Nightly backup of everything that cannot be rebuilt from the repository:
# the database, and the uploaded product photos. Run by oriyoni-backup.timer.
#
# Deliberately not part of deploy.sh. A backup that only runs when someone
# deploys is not a backup — the gap between releases is exactly when you need
# one.
set -euo pipefail

APP_DIR=/srv/oriyoni
BACKUP_DIR=/srv/backups
KEEP_DAYS=14

mkdir -p "$BACKUP_DIR"
STAMP=$(date +%Y%m%d-%H%M%S)

# Read the URL from .env rather than hardcoding credentials here, so there is
# one place the database password lives. cut -f2- because the URL itself
# contains no "=" but does contain ":" and "@".
DATABASE_URL=$(grep -E '^DATABASE_URL=' "$APP_DIR/.env" | cut -d= -f2-)
if [ -z "${DATABASE_URL:-}" ]; then
    echo "error: no DATABASE_URL in $APP_DIR/.env" >&2
    exit 1
fi

# --clean --if-exists so the dump can be restored over an existing database
# without dropping it by hand first.
pg_dump --clean --if-exists "$DATABASE_URL" | gzip > "$BACKUP_DIR/db-$STAMP.sql.gz"

# Media is small and changes rarely, so a full copy each night is simpler than
# anything incremental and costs little.
if [ -d "$APP_DIR/media" ]; then
    tar -czf "$BACKUP_DIR/media-$STAMP.tar.gz" -C "$APP_DIR" media
fi

# A zero-length dump means pg_dump failed in a way the pipe swallowed — gzip
# exits 0 even when its input ended early, so the exit status alone cannot be
# trusted here.
DB_SIZE=$(stat -c %s "$BACKUP_DIR/db-$STAMP.sql.gz")
if [ "$DB_SIZE" -lt 1000 ]; then
    echo "error: database dump is only ${DB_SIZE} bytes — treating as failed" >&2
    rm -f "$BACKUP_DIR/db-$STAMP.sql.gz"
    exit 1
fi

find "$BACKUP_DIR" -name 'db-*.sql.gz' -mtime +"$KEEP_DAYS" -delete
find "$BACKUP_DIR" -name 'media-*.tar.gz' -mtime +"$KEEP_DAYS" -delete

echo "backed up $STAMP (db: $(numfmt --to=iec "$DB_SIZE"))"
