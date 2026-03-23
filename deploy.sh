#!/bin/bash
# project-run-complete (Prime Clinic frontend) — backup + deploy
# Usage: ./deploy.sh [--no-deploy]  (--no-deploy = backup only, skip git/build/restart)
#
# When run with sudo, the PM2 step runs as the project directory owner (same pattern as PrimePOS).
# Override with: PM2_USER=admin93 ./deploy.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Backup directory (create if missing, use fallback if not writable)
BACKUP_DIR="${BACKUP_DIR:-$SCRIPT_DIR/backups}"
mkdir -p "$BACKUP_DIR"
if ! touch "$BACKUP_DIR/.write-test" 2>/dev/null; then
  BACKUP_DIR="${HOME:-/tmp}/project-run-complete-backups"
  mkdir -p "$BACKUP_DIR"
  echo "Note: Using $BACKUP_DIR (default backups dir not writable by current user)"
fi
rm -f "$BACKUP_DIR/.write-test" 2>/dev/null || true

# Timestamp: MM-DD-YYYY-HH-MM (e.g. 08-15-2026-23-30)
TIMESTAMP=$(date +%m-%d-%Y-%H-%M)
PREFIX="${TIMESTAMP}-prime-clinic"
TAR_FILE="$BACKUP_DIR/${PREFIX}.tar.gz"
SQL_FILE="$BACKUP_DIR/${PREFIX}.sql"

PM2_APP_NAME="${PM2_APP_NAME:-prime-clinic}"

echo "=== Prime Clinic (project-run-complete) Backup & Deploy ==="
echo "Timestamp: $TIMESTAMP"
echo "Backup dir: $BACKUP_DIR"
echo ""

# Load .env for DATABASE_URL (optional; this app uses Supabase — pg_dump only if you set DATABASE_URL)
if [ -f .env ]; then
  set -a
  source .env 2>/dev/null || true
  set +a
fi

# --- 1. Backup code ---
echo "[1/7] Backing up code to $TAR_FILE"
tar --exclude='node_modules' --exclude='dist' --exclude='.git' --exclude='backups' \
  --exclude='*.zip' --exclude='*.tar.gz' --exclude='*.sql' --exclude='.env' \
  --exclude='*.log' -czf "$TAR_FILE" .
echo "  Code backup: $TAR_FILE"

# --- 2. Backup database ---
if [ -n "$DATABASE_URL" ]; then
  echo "[2/7] Backing up database to $SQL_FILE"
  if command -v pg_dump >/dev/null 2>&1; then
    if pg_dump "$DATABASE_URL" -F p -f "$SQL_FILE" 2>"$BACKUP_DIR/.pg_dump_err"; then
      echo "  Database backup: $SQL_FILE"
      rm -f "$BACKUP_DIR/.pg_dump_err"
    else
      echo "  WARNING: pg_dump failed. Skipping DB backup."
      [ -s "$BACKUP_DIR/.pg_dump_err" ] && echo "  Error: $(cat "$BACKUP_DIR/.pg_dump_err")"
      if grep -q "1234@localhost\|could not translate host" "$BACKUP_DIR/.pg_dump_err" 2>/dev/null; then
        echo ""
        echo "  Hint: Password contains @ which breaks the URL. Encode @ as %40 in DATABASE_URL."
        echo ""
      fi
      rm -f "$SQL_FILE" "$BACKUP_DIR/.pg_dump_err"
    fi
  else
    echo "  WARNING: pg_dump not found. Install with: apt install postgresql-client"
    echo "  Skipping DB backup."
  fi
else
  echo "[2/7] Skipping DB backup (DATABASE_URL not set — normal for Supabase-only frontend)"
fi

# --- Check if deploy requested ---
if [ "$1" = "--no-deploy" ]; then
  echo ""
  echo "Backup complete. (--no-deploy: skipping deployment)"
  exit 0
fi

# --- 3. Git pull ---
echo ""
echo "[3/7] git pull"
git pull

# --- 4. Clean caches and old build ---
echo "[4/7] Cleaning caches and dist"
rm -rf dist
rm -rf node_modules/.cache
rm -rf client/node_modules/.cache
npm cache clean --force 2>/dev/null || true

# --- 5. npm install ---
echo "[5/7] npm install"
npm install

# --- 6. Build ---
echo "[6/7] npm run build"
npm run build

# --- 7. PM2 restart (delete + start ensures fresh process loads new dist) ---
RUN_USER="${PM2_USER:-$(stat -c '%U' "$SCRIPT_DIR" 2>/dev/null || stat -f '%Su' "$SCRIPT_DIR" 2>/dev/null || whoami)}"
if [ "$(id -u)" = "0" ] && [ "$RUN_USER" != "root" ]; then
  echo "[7/7] pm2 restart (as user: $RUN_USER)"
  sudo -u "$RUN_USER" bash -c "cd '$SCRIPT_DIR' && (pm2 delete \"$PM2_APP_NAME\" 2>/dev/null || true) && pm2 start ecosystem.config.cjs && (pm2 save 2>/dev/null || true)"
else
  echo "[7/7] pm2 restart"
  (cd "$SCRIPT_DIR" && pm2 delete "$PM2_APP_NAME" 2>/dev/null || true)
  cd "$SCRIPT_DIR" && pm2 start ecosystem.config.cjs
  pm2 save 2>/dev/null || true
fi

echo ""
echo "=== Deploy complete ==="
echo "Backups: $TAR_FILE, $SQL_FILE"
