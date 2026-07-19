#!/usr/bin/env bash
# Rebuild Twin HQ (dashboard/index.html) from the vault.
exec python3 "$(dirname "$0")/hub.py" "$@"
