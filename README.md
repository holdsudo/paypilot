# PayPilot — paypilot.fastapi.online

Flagship marketing site for PayPilot (by MCCPS): POS + card processing + person-to-person wallet.
Static site on GitHub Pages (`main` → `/docs`). No frameworks; three.js r169 vendored locally.

## Build
    python3 build.py                 # src/ -> docs/
    cd docs && python3 -m http.server 8768
    node tools/render-assets.mjs     # re-render app icon + OG image (headless Chrome)

## Structure
- `src/assets/js/scenes.js` — all WebGL: hero card + particle galaxy + light ribbons (bloom), scroll-driven
  tap story (card → terminal → approved → receipt → deposit), hardware turntable (terminal / handheld / reader,
  drag to spin), payments globe, ambient glass scene. Scenes lazy-start near the viewport and pause off-screen.
- `src/assets/js/app.js` — live POS demo (3 menus, cart, loyalty, tap → approved), wallet send demo (money orb),
  word-reveal statement, bento spotlight, pricing calculator, get-started wizard.
- `src/assets/css/app.css` — design system (indigo night + violet glass, Sora/Inter).
- `src/pages/*.html` — home, pos, wallet, hardware, online, pricing, get-started, 404.

## Notes
- All demos are simulated; forms show a confirmation only (no backend yet).
- Features/availability language in the footer fine print; no invented stats, rates or reviews.
