# Thievn's Den

A private hideout on the web. The public page is a candlelit landing. One door inside it leads to a single owner.

The public page does not mention the desk, wallets, or money. Those rooms exist only behind the door.

## Local development

```bash
npm install
cp .env.example .env.local
# fill in the door secrets
npm run dev
```

Open http://localhost:3000. The keyhole on the vault door is the sign-in.

```bash
npm test
npm run build
```

A devnet transfer check lives in `scripts/devnet-transfer-check.ts`. It is not part of the site. The site never signs.

## Auth

There is no public sign-up. One account can enter, checked on the server. A signed httpOnly cookie (`den_session`) is the session. `/den` and `/api/vault` both refuse a request without it.

No password is stored in the repo. The existing Supabase project was left alone, and no new Supabase project was created. The browser cannot read the desk tables. The server reads them with the service role after the owner door opens.

## The vault

`/api/vault` is the only desk route. It returns the book, the public wallet balance, and the transfer cap. Acknowledging an alert is the only write.

Wallet transfers are built in the browser as a plain SOL transfer. Phantom, Solflare, or Backpack must approve them. The site never sees a private key and never signs.

Mainnet is the default. A devnet switch exists only on preview and local development.

Preview deployments can draw a clearly marked sample desk when the book is empty. That sample is not written into the database. Production never shows it.

## Environment variables

Preview and production are separate. A new variable does not affect an existing deployment until that environment is redeployed.

Already set on production and preview. Leave them server-only. Do not reset them, and do not prefix them with `NEXT_PUBLIC_`.

| Name | Secret | Purpose |
| --- | --- | --- |
| `XAI_API_KEY` | Yes | Optional. This app does not read it. |
| `SUPABASE_URL` | No | Desk project URL. Server only. |
| `SUPABASE_ANON_KEY` | No | Present on the project. This app does not use it. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server reads and alert acknowledgements. Never sent to the browser. |

Still needed before the private door and the wallet behave:

| Name | Secret | Purpose |
| --- | --- | --- |
| `DEN_OWNER_EMAIL` | No | The one account. Matched without case sensitivity. Must include `@`. |
| `DEN_OWNER_PASSWORD` | Yes | The passphrase itself, at least 10 characters. Not a hash. A hash will not open the door. |
| `SESSION_SECRET` | Yes | HMAC key for the session cookie, at least 32 characters. `openssl rand -base64 48`. |
| `DEN_WALLET_ADDRESS` | No | Public trading-wallet address. Returned only after sign-in, and only if it is a 32-byte public key. |
| `SOLANA_RPC_URL` | Yes, if set | Optional mainnet RPC for balance reads. If it is a private URL it can embed an API key. The browser never receives it. |
| `DEN_MAX_TRANSFER_SOL` | No | Optional sanity cap per transfer. Default `2`. Larger amounts require typing `CONFIRM`. They are not blocked. |
