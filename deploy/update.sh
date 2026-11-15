#!/usr/bin/env bash
# Pull the latest code, rebuild and restart. Run on the server as user "abc": ~/site/deploy/update.sh
set -euo pipefail
cd "$HOME/site"
git pull --ff-only
cd web
npm ci
npm run build
sudo systemctl restart abc-web
sleep 3
curl -fsS http://127.0.0.1:3000/api/health && echo " <- site is up"
