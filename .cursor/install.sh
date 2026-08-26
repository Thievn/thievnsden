#!/usr/bin/env bash
set -euo pipefail

# Install JS dependencies. No lockfile is committed, so use `npm install`.
npm install

# Provide placeholder env values so `next dev`/`next build` boot for local and
# UI development even when no backend credentials are configured. Real values
# supplied as Cloud Agent secrets are injected into the process environment and
# take precedence over this file (Next.js does not override existing env vars).
if [ ! -f .env.local ]; then
  cat > .env.local <<'EOF'
# Placeholder credentials for local/UI development only.
# Add real values as Cloud Agent secrets to enable Supabase + xAI features;
# injected env vars override the values in this file.
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key
SUPABASE_SERVICE_ROLE_KEY=placeholder-service-role-key
EOF
fi
