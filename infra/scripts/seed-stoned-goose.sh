#!/usr/bin/env bash
# Wrapper that sources infra/.env and runs the TypeScript seed script via tsx.
#
# Usage:  bash infra/scripts/seed-stoned-goose.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

if [[ -f infra/.env ]]; then
  set -a
  # shellcheck disable=SC1091
  . infra/.env
  set +a
fi

if [[ -z "${TWENTY_API_KEY:-}" ]]; then
  echo "TWENTY_API_KEY is not set in infra/.env. Generate one in Twenty UI → Settings → Developers → API Keys." >&2
  exit 1
fi

exec npx --yes -p tsx@4.22.3 tsx infra/scripts/seed-stoned-goose.ts
