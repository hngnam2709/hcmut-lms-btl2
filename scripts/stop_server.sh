#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
if [[ ! -f .run/flask.pid ]]; then
  echo "No PID file found at .run/flask.pid."
  exit 0
fi
pid="$(cat .run/flask.pid)"
if kill -0 "$pid" 2>/dev/null; then
  kill "$pid"
  echo "Stopped PID $pid."
else
  echo "PID $pid is not running."
fi
rm -f .run/flask.pid
