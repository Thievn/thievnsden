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

Set these in Vercel for **Production** before the private door will open there. All three are server-only. Do not prefix them with `NEXT_PUBLIC_`.

| Name | Purpose |
| --- | --- |
| `DEN_OWNER_EMAIL` | The one account. Matched without case sensitivity. |
| `DEN_OWNER_PASSWORD` | Passphrase, at least 10 characters. Keep it long and unique. |
| `SESSION_SECRET` | HMAC key for the session cookie, at least 32 characters. `openssl rand -base64 48` |

Preview and production are separate. A preview deployment will not open the door until the same three names exist on the Preview environment. If any of them is missing or too short, sign-in fails closed and the public page still loads.

Mark the password and session secret as sensitive in Vercel.
