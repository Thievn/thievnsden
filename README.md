# Thievn's Den

A private site. The public page is a quiet landing. Sign in leads to a single owner.

The public page does not mention the desk, wallets, or money. Those screens exist only after sign-in.

## Local development

```bash
npm install
cp .env.example .env.local
# fill in the door secrets
npm run dev
```

Open http://localhost:3000. The keyhole on the landing page opens sign-in.

```bash
npm test
npm run build
```

A devnet transfer check lives in `scripts/devnet-transfer-check.ts`. It is not part of the site. The site never signs.

## Auth

There is no public sign-up. One account can sign in, checked on the server. A signed httpOnly cookie (`den_session`) is the session. `/den` and `/api/vault` both refuse a request without it.

No password is stored in the repo. The existing Supabase project was left alone, and no new Supabase project was created. The browser cannot read the desk tables. The server reads them with the service role after sign-in.

## The vault

`/api/vault` is the only desk route. It returns the desk, the public wallet balance, and the transfer cap. Acknowledging an alert is the only write.

Wallet transfers are built in the browser as a plain SOL transfer. Phantom, Solflare, or Backpack must approve them. The site never sees a private key and never signs.

Mainnet is the default. A devnet switch exists only on preview and local development.

Preview deployments can show a clearly marked sample desk when the tables are empty. That sample is not written into the database. Production never shows it.

## Environment variables

Preview and production are separate. A new variable does not affect an existing deployment until that environment is redeployed.

Already set on production and preview. Leave them server-only. Do not reset them, and do not prefix them with `NEXT_PUBLIC_`.

| Name | Secret | Purpose |
| --- | --- | --- |
| `XAI_API_KEY` | Yes | Den's Attic uses it for Enhance, the face check, and body notes. Server only. |
| `SUPABASE_URL` | No | Desk project URL. Server only. |
| `SUPABASE_ANON_KEY` | No | Present on the project. This app does not use it. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server reads and alert acknowledgements. Never sent to the browser. |
| `DEN_OWNER_EMAIL` | No | One way to sign in. Matched without case sensitivity. Must include `@`. |
| `DEN_OWNER_USERNAME` | No | Signed-in name in the Vault, and another way to sign in. Matched without case sensitivity. |
| `DEN_OWNER_PASSWORD` | Yes | The password itself, at least 10 characters. Not a hash. A hash will not sign you in. |
| `SESSION_SECRET` | Yes | HMAC key for the session cookie, at least 32 characters. `openssl rand -base64 48`. |

Still needed before the wallet balance and transfers have a destination:

| Name | Secret | Purpose |
| --- | --- | --- |
| `DEN_WALLET_ADDRESS` | No | Public trading-wallet address. Returned only after sign-in, and only if it is a 32-byte public key. |
| `SOLANA_RPC_URL` | Yes, if set | Optional mainnet RPC for balance reads. If it is a private URL it can embed an API key. The browser never receives it. |
| `DEN_MAX_TRANSFER_SOL` | No | Optional sanity cap per transfer. Default `2`. Larger amounts require typing `CONFIRM`. They are not blocked. |
| `VAPID_PUBLIC_KEY` | No | Public Web Push key. Settings uses it to subscribe this phone. Generate with `npx --yes web-push generate-vapid-keys`. |

The matching `VAPID_PRIVATE_KEY` does not go on Vercel. The desk box also needs `VAPID_PUBLIC_KEY`, `VAPID_SUBJECT` (`mailto:thievnsden@gmail.com`), `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` so `desk/notify.py` can send. See [DESK_NOTIFY.md](DESK_NOTIFY.md). Run `supabase/push.sql` once before the first alert.

Still needed before Den's Attic can make pictures:

| Name | Secret | Purpose |
| --- | --- | --- |
| `RUNPOD_API_KEY` | Yes | Server key for the picture worker. Never sent to the browser. |
| `RUNPOD_ENDPOINT_ID` | Yes | Server endpoint id for that worker. Chroma and Z-Image make new pictures. Qwen edits them. |

Optional filename overrides, only if the worker volume uses different files: `STUDIO_CHROMA_UNET`, `STUDIO_CHROMA_CLIP_1`, `STUDIO_CHROMA_CLIP_2`, `STUDIO_CHROMA_CLIP_TYPE`, `STUDIO_CHROMA_VAE`, `STUDIO_ZIMAGE_UNET`, `STUDIO_ZIMAGE_CLIP`, `STUDIO_ZIMAGE_VAE`, `STUDIO_QWEN_UNET`, `STUDIO_QWEN_LORA`, `STUDIO_QWEN_CLIP`, `STUDIO_QWEN_VAE`, `GROK_REWRITE_MODEL`, `GROK_VISION_MODEL`.

Run `supabase/attic.sql` once before the first picture. It adds owner-only tables and a private `attic` bucket. The service role is the only key that can use them. Signed-out visitors get a 404 at `/attic`. There is no link on the public page. Any adult face can be used for ordinary edits. Explicit requests are limited to the face lock or a made-up character. The age check is unchanged.
