#!/usr/bin/env bash
# Generate a self-signed code-signing certificate for Documenso (local dev only).
# Production: replace with a real cert issued by a trusted CA.
#
# Usage:  cd infra && bash scripts/generate-documenso-cert.sh

set -euo pipefail

CERT_DIR="$(cd "$(dirname "$0")/.." && pwd)/documenso-cert"
mkdir -p "$CERT_DIR"

if [[ -f "$CERT_DIR/cert.p12" ]]; then
  echo "Cert already exists at $CERT_DIR/cert.p12. Delete it first to regenerate."
  exit 0
fi

PASSPHRASE="${DOCUMENSO_CERT_PASSPHRASE:-documenso}"

cd "$CERT_DIR"
openssl req -x509 -nodes -newkey rsa:2048 \
  -keyout key.pem -out cert.pem -days 365 \
  -subj "/CN=Stoned Goose Hub (dev)/O=Stoned Goose Productions/C=US"

openssl pkcs12 -export \
  -out cert.p12 \
  -inkey key.pem \
  -in cert.pem \
  -passout "pass:$PASSPHRASE"

chmod 600 cert.p12
rm -f key.pem cert.pem

echo "Wrote $CERT_DIR/cert.p12 (passphrase: $PASSPHRASE)"
echo "Make sure DOCUMENSO_CERT_PASSPHRASE in infra/.env matches."
