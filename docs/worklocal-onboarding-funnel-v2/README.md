# workLocal Onboarding Funnel (v2)

Fixes & Changes
- Header is **white** (logo readable). Works in dark mode too.
- Removed placeholder nav links. Only actions remain.
- **Prev/Next bug fixed** — listeners are one-time and buttons are never replaced.
- Step titles rewritten to be more engaging (emoji + concise).
- Progress persists via `localStorage`; export/import JSON supported.

Deploy
1) Zip this folder or use the provided `worklocal-onboarding-funnel-v2.zip`.
2) Drag to Netlify Drop.

Customize
- Colors: edit CSS `--brand-1` / `--brand-2`.
- Titles/sections: edit `<section class="step">` blocks in `index.html`.
- Checklist keys: `data-check` attributes save state in `localStorage`.
