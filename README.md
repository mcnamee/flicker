# Flicker

Light and sound sessions for sleep, calm and focus. A phone-first React + Tailwind single page app that strobes the screen or the phone torch at a set frequency, paired with synthesised binaural or isochronic audio. No accounts, no tracking - preferences are kept in local storage.

> **Safety:** flashing light can trigger seizures in people with photosensitive epilepsy. Don't use Flicker if you have epilepsy or a history of seizures.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs dist/
npm run preview
```

Torch mode needs camera access, so it only works over HTTPS (or localhost) and in browsers that expose the torch constraint (Chrome on Android, Safari on recent iOS).

## Deploy to GitHub Pages

1. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Push to `main`. `.github/workflows/deploy.yml` builds and publishes `dist/`.

The build uses a relative base (`./`), so it works from `https://<user>.github.io/<repo>/` without config.

## Structure

- `src/engine/session.js` - session runner: frequency ramp, screen strobe (rAF phase accumulator), torch strobe (`applyConstraints`), timer, wake lock
- `src/engine/audio.js` - Web Audio: binaural / isochronic beats, pink / brown noise, fades
- `src/components/` - UI (home, mode sheet, consent, player, info)
- `src/content.json` - modes, timers and info copy (mirrors `docs/content.json`)
- `docs/SPEC.md` - product spec, research and acceptance criteria

## Agent team

`.claude/agents/` defines the dev workflow used to build this:

| Agent | Model / effort | Role |
| --- | --- | --- |
| `product-manager` | Opus, high | Owns the outcome: spec, research, acceptance criteria, ship call |
| `dev-lead` | Opus, max | Architecture, engines, task breakdown, code review |
| `developer` | Sonnet, high | Implements scoped tasks |
| `tester` | Opus, high | Independently verifies every acceptance criterion in a real browser |
