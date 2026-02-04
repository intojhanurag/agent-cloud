# Agent Cloud website

This folder contains a lightweight, static project website (plain HTML/CSS/JS).

## Local preview

From the repo root:

```bash
cd website
python3 -m http.server 5173
```

Then open `http://localhost:5173`.

## Structure

- Pages: `website/*.html`
- Shared styles: `website/assets/styles.css`
- Minimal JS (theme toggle): `website/assets/site.js`
- Favicon/logo: `website/assets/favicon.svg`

## Deployment

Any static hosting works (GitHub Pages, Netlify, Cloudflare Pages, or Vercel). Point the host at the `website/` directory.
