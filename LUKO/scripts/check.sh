#!/usr/bin/env bash
# twin health check — thin wrapper (logic lives in check.py, stdlib-only python3)
exec python3 "$(dirname "$0")/check.py" "$@"
