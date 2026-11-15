#!/usr/bin/env bash
# Nightly database backup (members, payments and uploaded documents all live in this one file).
# Keeps 14 days on the server and, if rclone has a "gdrive" remote set up, copies each backup to the trust's Google Drive.
# Cron (crontab -e as user abc):  30 2 * * * /home/abc/site/deploy/backup.sh >> /home/abc/backups/backup.log 2>&1
set -euo pipefail
DB="$HOME/site/web/data/abc.db"
OUT="$HOME/backups"
mkdir -p "$OUT"
FILE="$OUT/abc-$(date +%F).db"
sqlite3 "$DB" ".backup '$FILE'"   # safe copy while the site is running
gzip -f "$FILE"
find "$OUT" -name 'abc-*.db.gz' -mtime +14 -delete
if command -v rclone >/dev/null && rclone listremotes | grep -q '^gdrive:'; then
  rclone copy "$FILE.gz" gdrive:abc-website-backups
fi
echo "$(date) backup ok: $FILE.gz"
