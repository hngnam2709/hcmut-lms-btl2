#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
mkdir -p .run logs
if [[ -f .run/flask.pid ]] && kill -0 "$(cat .run/flask.pid)" 2>/dev/null; then
  echo "Server is already running with PID $(cat .run/flask.pid)."
  exit 0
fi

set -a
[[ -f .env ]] && source .env
set +a
export FLASK_RUN_HOST="${FLASK_RUN_HOST:-127.0.0.1}"
export FLASK_RUN_PORT="${FLASK_RUN_PORT:-5000}"

nohup uv run python run.py > logs/server.log 2>&1 &
echo "$!" > .run/flask.pid
echo "Started HCMUT LMS BTL2 (PID $!) on http://${FLASK_RUN_HOST}:${FLASK_RUN_PORT}"
echo "Log: $ROOT/logs/server.log"
