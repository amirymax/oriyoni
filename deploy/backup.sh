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
find "$BACKUP_DIR" -name '*.gpg' -mtime +"$KEEP_DAYS" -delete

echo "backed up $STAMP (db: $(numfmt --to=iec "$DB_SIZE"))"

# --------------------------------------------------------- offsite copy --
#
# Optional: send the dump to the shop owner's Telegram chat, which is the only
# offsite copy this setup has. Skipped entirely unless configured.
#
# The dump is encrypted first, and that is not negotiable. It holds every
# customer's name, email, postal address and order history, plus every password
# hash. Telegram cloud chats are not end-to-end encrypted and keep history
# indefinitely, so anyone reaching that account would otherwise reach the whole
# customer database. The passphrase belongs in a password manager, not on this
# server — kept here it would protect nothing that losing the server has not
# already lost.
TG_TOKEN=$(sed -n 's/^TELEGRAM_BOT_TOKEN=//p' "$APP_DIR/.env")
TG_CHAT=$(sed -n 's/^TELEGRAM_CHAT_ID=//p' "$APP_DIR/.env")
PASSPHRASE=$(sed -n 's/^BACKUP_PASSPHRASE=//p' "$APP_DIR/.env")

if [ -z "$TG_TOKEN" ] || [ -z "$TG_CHAT" ]; then
    exit 0
fi

if [ -z "$PASSPHRASE" ]; then
    echo "warning: BACKUP_PASSPHRASE is unset, so nothing was sent." >&2
    echo "         Refusing to upload an unencrypted customer database." >&2
    exit 0
fi

ARCHIVE="$BACKUP_DIR/db-$STAMP.sql.gz.gpg"
gpg --batch --yes --symmetric --cipher-algo AES256 \
    --passphrase "$PASSPHRASE" \
    --output "$ARCHIVE" "$BACKUP_DIR/db-$STAMP.sql.gz"

# The Bot API refuses documents over 50 MB. Saying so beats an upload that
# silently fails every night once the shop has grown into it.
ARCHIVE_SIZE=$(stat -c %s "$ARCHIVE")
if [ "$ARCHIVE_SIZE" -gt 49000000 ]; then
    echo "warning: encrypted dump is $(numfmt --to=iec "$ARCHIVE_SIZE"), over Telegram's" >&2
    echo "         50 MB limit. The local backup is fine, but the offsite copy" >&2
    echo "         needs somewhere else now." >&2
    rm -f "$ARCHIVE"
    exit 0
fi

if curl -sf --max-time 120 \
        -F "chat_id=$TG_CHAT" \
        -F "document=@$ARCHIVE" \
        -F "caption=ORIYONI backup $STAMP · $(numfmt --to=iec "$ARCHIVE_SIZE") · AES256" \
        "https://api.telegram.org/bot$TG_TOKEN/sendDocument" > /dev/null; then
    echo "sent encrypted dump to Telegram"
else
    # Not fatal. The local backup already succeeded, and failing here would
    # mark the timer red for something that did its actual job.
    echo "warning: could not send the dump to Telegram" >&2
fi

# Removed either way: the encrypted copy exists only to be uploaded, and
# keeping it would double the disk this script uses for no benefit.
rm -f "$ARCHIVE"
