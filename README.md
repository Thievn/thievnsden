# Thievn's Den

A private hideout on the web. The public page is a candlelit landing. One door inside it leads to a single owner.

## Local development

```bash
npm install
cp .env.example .env.local
# fill in the three secrets
npm run dev
```

Open http://localhost:3000. The keyhole on the vault door is the sign-in.

```bash
npm test
npm run build
```

## Auth

There is no public sign-up. One account can enter, checked on the server. A signed httpOnly cookie (`den_session`) is the session. Private routes under `/den` redirect anyone without that cookie.

No password is stored in the repo. The existing Supabase project behind the previous site was left alone, and no new Supabase project was created.

### Environment variables

The public page loads with no secrets. The private door stays shut until these three are set. All of them are server-only. Do not prefix them with `NEXT_PUBLIC_`.

| Name | Secret | Purpose |
| --- | --- | --- |
| `DEN_OWNER_EMAIL` | No | The one account. Matched without case sensitivity. |
| `DEN_OWNER_PASSWORD` | Yes | The passphrase itself, at least 10 characters. Not a hash. |
| `SESSION_SECRET` | Yes | HMAC key for the session cookie, at least 32 characters. `openssl rand -base64 48` |

Set them for **Production** before that door will open. Preview is a separate environment, so a preview deployment needs the same three names on Preview or sign-in fails closed.

`XAI_API_KEY` is already set on this Vercel project for production and preview. This foundation does not read it. If a later server route uses it, keep it server-only and never copy it into a `NEXT_PUBLIC_` variable.
