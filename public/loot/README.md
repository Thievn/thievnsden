# Loot images

Drop product photos here. The loot page looks for files by `id`.

## Naming

Use the product `id` from `src/app/loot/page.tsx` (or `src/lib/loot-items.ts` if present):

```
public/loot/corsair-4000d.jpg
public/loot/rog-rtx.jpg
public/loot/anime-figure-sitting.jpg
public/loot/wireless-headset.jpg
public/loot/compact-keyboard.jpg
public/loot/anime-figure-dual.jpg
```

Supported extensions: `.jpg`, `.jpeg`, `.png`, `.webp`

## How to add

1. Download / export your photo.
2. Rename to match the id (lowercase, hyphens).
3. Upload into this folder on GitHub:
   - Repo → `public/loot/` → **Add file** → **Upload files**
4. Commit. Vercel will pick it up on deploy.
5. Refresh `/loot` — the card uses `/loot/{id}.jpg` (falls back to placeholder if missing).

## Tips

- Prefer landscape-ish crops (~16:10 or 4:3). Cards use that aspect ratio.
- Keep files under ~500KB if you can (webp is ideal).
- Don’t use spaces in filenames.
