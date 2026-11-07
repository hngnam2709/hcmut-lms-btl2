#!/usr/bin/env bash
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
fail=0

echo "============================================"
echo " HCMUT LMS BTL2 - environment check"
echo "============================================"

if command -v python3 >/dev/null 2>&1; then
  python3 - <<'PY' || fail=1
import sys
if sys.version_info < (3, 12):
    print("[FAIL] Python 3.12 or newer is required.")
    raise SystemExit(1)
print(f"[ OK ] Python {sys.version.split()[0]}")
PY
else
  echo "[FAIL] python3 was not found on PATH."
  fail=1
fi

for command in uv mysql docker node; do
  if command -v "$command" >/dev/null 2>&1; then
    echo "[ OK ] $command: $($command --version 2>/dev/null | head -1)"
  else
    echo "[WARN] $command was not found on PATH."
  fi
done

if [[ -f .env ]]; then echo "[ OK ] .env exists."; else echo "[WARN] .env is missing; run setup.bat or copy .env.example."; fi
if [[ -f frontend/vendor/bootstrap/bootstrap.min.css ]]; then echo "[ OK ] local Bootstrap CSS exists."; else echo "[FAIL] local Bootstrap CSS missing."; fail=1; fi
if [[ -f frontend/vendor/bootstrap/bootstrap.bundle.min.js ]]; then echo "[ OK ] local Bootstrap JS exists."; else echo "[FAIL] local Bootstrap JS missing."; fail=1; fi
if [[ -d .venv ]]; then echo "[ OK ] .venv exists."; else echo "[WARN] .venv is missing; run uv sync."; fi

echo
if [[ "$fail" == "0" ]]; then echo "Environment check: PASS"; else echo "Environment check: FAIL"; fi
exit "$fail"
