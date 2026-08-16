#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

DEFAULT_PORT="8001"
PORT="${PORT:-$DEFAULT_PORT}"

if [[ -f ".env" ]]; then
  APP_ENV_NAME="$(grep -E '^NEXT_PUBLIC_APPLICATION_NAME=' .env | head -1 | cut -d= -f2- | sed 's/^["'\'']//; s/["'\'']$//')"
else
  APP_ENV_NAME=""
fi

APP_NAME="${APP_ENV_NAME:-eBroker}-Website"

RESET="\033[0m"
BOLD="\033[1m"
GREEN="\033[32m"
YELLOW="\033[33m"
BLUE="\033[34m"
CYAN="\033[36m"
RED="\033[31m"

log() {
  echo -e "${BLUE}i${RESET} $1"
}

success() {
  echo -e "${GREEN}ok${RESET} $1"
}

warn() {
  echo -e "${YELLOW}warn${RESET} $1"
}

fail() {
  echo -e "${RED}error${RESET} $1"
  exit 1
}

step() {
  echo ""
  echo -e "${BOLD}${CYAN}$1${RESET}"
}

run() {
  log "$1"
  shift
  "$@"
}

echo "--------------------------------------------------"
echo -e "${BOLD}eBroker VPS standalone deployment${RESET}"
echo "--------------------------------------------------"
echo "App  : $APP_NAME"
echo "Port : $PORT"

if [[ -t 0 ]]; then
  read -r -p "Enter port, or press Enter to keep $PORT: " INPUT_PORT
  PORT="${INPUT_PORT:-$PORT}"
fi

step "Checking required commands"
command -v npm >/dev/null 2>&1 || fail "npm is required."
command -v node >/dev/null 2>&1 || fail "node is required."
command -v pm2 >/dev/null 2>&1 || fail "pm2 is required."
success "Required commands are available"

step "Installing dependencies"
run "Running npm install" npm install

step "Building standalone Next.js app"
export NODE_ENV="production"
export NEXT_OUTPUT_STANDALONE="true"
export PORT

run "Running Next.js build with standalone output" npm run build
run "Copying standalone assets" node scripts/setup-standalone.js

[[ -f ".next/standalone/server.js" ]] || fail ".next/standalone/server.js was not generated."
[[ -d ".next/standalone/.next/static" ]] || warn ".next/standalone/.next/static was not found."

step "Generating Apache .htaccess"
run "Writing standalone .htaccess for port $PORT" node scripts/generate-standalone-htaccess.js "$PORT"

step "Starting PM2"
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  run "Restarting $APP_NAME" env PORT="$PORT" pm2 restart ecosystem.config.cjs --update-env
else
  run "Starting $APP_NAME" env PORT="$PORT" pm2 start ecosystem.config.cjs
fi

run "Saving PM2 process list" pm2 save

step "Apache reload"
if command -v systemctl >/dev/null 2>&1; then
  sudo systemctl reload apache2 2>/dev/null || sudo systemctl reload httpd 2>/dev/null || warn "Apache reload failed or service was not found."
elif command -v service >/dev/null 2>&1; then
  sudo service apache2 reload 2>/dev/null || sudo service httpd reload 2>/dev/null || warn "Apache reload failed or service was not found."
else
  warn "Apache reload skipped; systemctl/service was not found."
fi

echo ""
echo "--------------------------------------------------"
echo -e "${GREEN}${BOLD}Deployment complete${RESET}"
echo "App  : $APP_NAME"
echo "Mode : Next.js standalone"
echo "Port : $PORT"
echo "URL  : http://127.0.0.1:$PORT"
echo "--------------------------------------------------"

pm2 ls
