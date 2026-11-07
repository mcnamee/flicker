# Flicker: product spec v1

Owner: Product Manager. Status: ready for build. Source of truth for mode, timer and Info copy: `docs/content.json` (the app imports it; this spec mirrors it).

## 1. Problem, users, scope

**Problem.** Flicker-light meditation apps show that closed-eye light pulses plus rhythmic audio can produce vivid visuals and help people unwind, but they sit behind accounts, onboarding and subscriptions. People want to start a session at night in two taps.

**Users.**
- Curious adults who want the eyes-closed colour and pattern experience.
- People winding down before sleep or taking a short calm break.
- All on a phone, at night, often in bed, often with headphones.

**User stories.**
- As a user, I open the app and pick a mode straight away, with no sign-up.
- As a user, I choose screen or torch and a session length, and next time those are already selected.
- As a user, I get a clear seizure warning once, and can stop instantly by tapping anywhere.
- As a user, I can read why it works (with real sources) and how to hold the phone.

**In scope (v1).**
- React + Tailwind single-page app, static build on GitHub Pages, hash routing (`#/`, `#/mode/:id`, `#/info`).
- 4 modes (table below), 2 light sources (screen, torch), 5 timer lengths.
- Web Audio synthesised sound only: binaural or isochronic beats, sine carrier, optional pink or brown noise.
- Photosensitive epilepsy warning and consent, tap-anywhere stop, fade in/out.
- Last choices saved in `localStorage`.
- Info page: Why and How.
- Dark theme only. Original name, copy and visuals.

**Out of scope (v1).**
- Accounts, onboarding, analytics, backend, payments, notifications.
- Custom frequency slider or any flicker outside 2 to 12 Hz. No 40 Hz gamma mode.
- Audio files, music, voice guidance.
- Light theme, PWA install/offline, background play when the phone is locked.
- Any name, copy, logo or visual design taken from existing apps.

## 2. Modes

All flicker is a square wave (light fully on, then fully off). Each mode starts near 10 Hz, where visual entrainment and closed-eye visuals are strongest, then ramps linearly to its target and holds there. The audio beat follows the flicker rate in lockstep throughout the ramp.

| id | Name | Purpose | Flicker start -> target (ramp) | Audio: beat type, beat Hz, carrier Hz, noise | Default | Citations |
|---|---|---|---|---|---|---|
| `dream` | Dream | Strongest eyes-closed colour and pattern | 12 -> 10 Hz (45 s) | Isochronic, 10 Hz, 260 Hz, none | 10 min | R1, R2, R3, R4 |
| `relax` | Relax | Calm, settle, low alpha | 10 -> 7.5 Hz (120 s) | Binaural, 7.5 Hz, 220 Hz, pink | 10 min | R2, R5, R6, R7 |
| `meditate` | Meditate | Quiet inward focus, theta | 10 -> 6 Hz (180 s) | Isochronic, 6 Hz, 180 Hz, none | 15 min | R2, R5, R8 |
| `sleep` | Sleep | Wind down for bed, delta | 10 -> 3 Hz (300 s) | Binaural, 3 Hz, 150 Hz, brown | 20 min | R2, R6, R7, R9 |

**Why these numbers.**
- 10 Hz sits at the visual cortex alpha resonance (R1) and gives peak closed-eye visuals with rhythmic, not random, flicker (R3, R4).
- Entrainment is strongest near the person's own rhythm and weakens further from it (R2, Arnold tongue). Starting near 10 Hz and gliding down is a design inference from R2, not a tested intervention. The Info copy says so.
- Dream starts at 12 Hz so the sweep passes through the 8 to 12 Hz range where most people's natural alpha peak sits.
- Targets 10, 7.5, 6 and 3 Hz divide evenly into 60 Hz and 120 Hz refresh (6, 8, 10 and 20 frames per cycle), so the held phase is a clean, even square wave on screen. Values during the ramp may jitter by a frame; that is acceptable.
- Alpha and theta are the bands most linked to meditation (R8). Binaural beats show a moderate pooled effect on anxiety, attention, memory and pain (R5), but EEG evidence of entrainment is inconsistent (R6). A 3 Hz binaural beat lengthened deep sleep in a small study (R7). Noise as a sleep aid has very low-quality evidence (R9), so it stays quiet in the mix.
- Isochronic for Dream and Meditate so they work through the speaker (sitting up). Binaural for Relax and Sleep (lying down with headphones).
- Carriers sit low (150 to 260 Hz) for a soft sound and are well under the ~1000 Hz ceiling for hearing binaural beats. Lower carriers for the calmer modes.

**Flicker engine rules.**
- Hard clamp: the app never drives light outside 2 to 12 Hz, whatever `content.json` says.
- Torch clamp: on torch, the rate is `min(hz, 10)` (iOS toggle latency 10 to 50 ms makes 12 Hz unreliable). So Dream on torch holds 10 Hz throughout.
- Effective ramp = `min(rampSec, 0.4 x session seconds)` (for example Sleep on 5 min ramps over 120 s).
- Screen: full-viewport overlay, phase from elapsed time on each rAF frame (as in the prototype). "On" colour is warm white `#FFF1DC`, never red; "off" is `#000000`.
- Torch: `getUserMedia` rear camera + `applyConstraints({ advanced: [{ torch }] })` loop scheduled against a running clock (as in the prototype). Screen shows a near-black overlay with remaining time and "Tap anywhere to stop".
- Screen Wake Lock requested during a session where supported.

**Audio engine rules (Web Audio only).**
- Binaural: two sine oscillators, left `carrier - beat/2`, right `carrier + beat/2`, via a stereo merger.
- Isochronic: one sine at `carrier`, gain gated on/off at `beat` Hz with ~5 ms edges (no clicks).
- Noise: generated in code (pink: filtered white; brown: integrated white), looped buffer, about 12 dB below the tones.
- Beat Hz tracks the current flicker Hz during the ramp.

**Session timeline.**
- 0 to 10 s: audio fades in from silence; screen light intensity fades in from 0 to full. Torch (cannot dim) switches on at 10 s.
- Ramp, then hold at target until the last 10 s.
- Last 10 s: audio and screen light fade to zero; torch switches off at the start of the fade.
- Manual stop (tap anywhere, Escape, page hidden): light stops on that frame; audio fades out over 1.5 s; torch and camera released.

## 3. Timer options

5, 10, 15, 20, 30 minutes. Each mode preselects its default (above) until the user picks another.

## 4. Info page copy

Final copy lives in `docs/content.json` (`why`, `how`). Rendered verbatim, in order. Summary:

### Why
Intro: "Flicker uses steady pulses of light and sound to give your brain a rhythm to follow. Some of this is well studied and some is still early, so here is what the research does and does not show."

Points: Your brain follows a steady rhythm; Why you see colours and patterns; Why sessions start fast and slow down; About the beats; About the noise; What we don't claim; Safety.

References shown in the app (all verified, title, journal and DOI cross-checked):

- R2. Notbohm, Kurths & Herrmann (2016). Front Hum Neurosci. https://doi.org/10.3389/fnhum.2016.00010
- R3. Amaya et al. (2023). PLOS ONE. https://doi.org/10.1371/journal.pone.0284271
- R4. Bartossek, Kemmerer & Schmidt (2021). PLOS ONE. https://doi.org/10.1371/journal.pone.0253779
- R5. Garcia-Argibay, Santed & Reales (2019). Psychol Res. https://doi.org/10.1007/s00426-018-1066-8
- R6. Ingendoh, Posny & Heine (2023). PLOS ONE. https://doi.org/10.1371/journal.pone.0286023
- R7. Jirakittayakorn & Wongsawat (2018). Front Hum Neurosci. https://doi.org/10.3389/fnhum.2018.00387
- R9. Riedy et al. (2021). Sleep Med Rev. https://doi.org/10.1016/j.smrv.2020.101385
- R10. Fisher et al. (2022). Epilepsia. https://doi.org/10.1111/epi.17175

Spec-only references (cited in the modes table, not shown in the app):

- R1. Herrmann (2001). Human EEG responses to 1-100 Hz flicker. Exp Brain Res. https://doi.org/10.1007/s002210100682
- R8. Lomas, Ivtzan & Fu (2015). Neurophysiology of mindfulness on EEG oscillations. Neurosci Biobehav Rev. https://doi.org/10.1016/j.neubiorev.2015.09.018

### How
Sections: Before you start; Using the screen; Using the torch; Stopping. Key guidance: dark quiet spot, Do Not Disturb, headphones for Relax and Sleep, low volume; screen at full brightness (lower for Sleep), 10 to 15 cm from closed eyes, centred; torch about 30 cm, back of phone towards closed eyes, never look into it, keep the app open; tap anywhere to stop, stop if unwell.

Footer on Info: "Flicker is not a medical device. Don't use it if you have epilepsy or a history of seizures."

### Safety consent copy (dialog)
Title: "Before your first session"
Body: "Flicker uses flashing light. Flashing light can trigger seizures in people with photosensitive epilepsy, sometimes for the first time. Don't use Flicker if you or a close family member have epilepsy or have had a seizure. Never use it while driving or moving around. Stop straight away if you feel dizzy, sick, get a headache or notice any twitching."
Checkbox: "I've read this and I don't have epilepsy or a history of seizures."
Buttons: "Start" (disabled until ticked), "Cancel".

## 5. Storage and test hooks

`localStorage` keys (all reads/writes wrapped in try/catch; app works if storage throws):
- `flicker.consent.v1` = `"1"` once consent is accepted.
- `flicker.prefs.v1` = `{ "source": "screen"|"torch", "minutes": { "<modeId>": number }, "lastMode": "<modeId>" }`, written when Start is tapped.

Stable selectors for tests:
- Mode cards: `[data-testid="mode-card"][data-mode="<id>"]`.
- Options view: `[data-testid="options"]`; source radios `input[name="source"]` (`screen`, `torch`); timer radios `input[name="minutes"]` (`5`...`30`); `[data-testid="start"]`.
- Consent: `[data-testid="consent"]` (role `dialog`), checkbox inside it, `[data-testid="consent-accept"]`, `[data-testid="consent-cancel"]`.
- Session overlay: `[data-testid="session"]` with attributes `data-mode`, `data-source`, `data-current-hz` (1 decimal), `data-target-hz`, `data-phase` (`fade-in` | `ramp` | `hold` | `fade-out`), `data-audio` (`running` | `stopped`).
- Torch error: `[data-testid="torch-error"]`.
- Info: `[data-testid="info-link"]`, sections `#why` and `#how`.

## 6. Acceptance criteria

Tested with Playwright on a 390 x 844 mobile viewport (Chromium, `hasTouch`), using `page.clock` for time-dependent checks unless noted.

**Launch and navigation**
- AC-1. Loading the app URL with a clean `localStorage` shows the mode selector as the first screen. No sign-up, onboarding, splash or cookie banner appears.
- AC-2. The selector shows exactly 4 mode cards in this order: Dream, Relax, Meditate, Sleep, each showing its `name` and `tagline` from `content.json`.
- AC-3. Tapping a mode card navigates to `#/mode/<id>` and shows the options view with the mode's name, description, a Screen/Torch choice, the timer choice and a Start button.
- AC-4. The options view has a back control that returns to `#/`. Browser back does the same.
- AC-5. Loading `#/mode/relax` or `#/info` directly (deep link / refresh) renders that view, not a 404.

**Options and saved defaults**
- AC-6. With no saved prefs, Screen is selected and the timer equals the mode's `defaultMinutes` (Dream 10, Relax 10, Meditate 15, Sleep 20).
- AC-7. Timer options are exactly 5, 10, 15, 20 and 30 minutes.
- AC-8. After choosing Torch and 30 min on Relax and tapping Start, `flicker.prefs.v1` holds `source: "torch"` and `minutes.relax: 30`. After reload, Relax opens with Torch and 30 min selected; Meditate opens with Torch and 15 min.
- AC-9. The last used mode card is visually marked on the selector (`aria-current="true"`) after reload.
- AC-10. If `localStorage` throws on access, the app still loads and runs a session using defaults.

**Safety and consent**
- AC-11. With no `flicker.consent.v1`, tapping Start opens the consent dialog with the copy in section 4. No session overlay exists and no light or audio starts while it is open.
- AC-12. The dialog's Start button is disabled until the checkbox is ticked.
- AC-13. Cancel closes the dialog, stays on the options view and does not set `flicker.consent.v1`.
- AC-14. Accepting sets `flicker.consent.v1` to `"1"` and starts the session. On later Starts the dialog does not appear.
- AC-15. The Info page shows the seizure warning in its Safety point and footer.

**Session: screen**
- AC-16. Starting Dream on Screen shows `[data-testid="session"]` covering the full viewport, with `data-mode="dream"`, `data-source="screen"`, `data-target-hz="10"` and the text "Tap anywhere to stop", which fades out within 5 s.
- AC-17. `data-phase` is `fade-in` from 0 to 10 s, then `ramp`, then `hold`, then `fade-out` for the final 10 s.
- AC-18. For Sleep at 20 min, `data-current-hz` reads 10.0 at start, decreases monotonically, and reads 3.0 (plus or minus 0.1) from 300 s onward. For Sleep at 5 min it reaches 3.0 at 120 s (ramp capped at 40% of session).
- AC-19. At no time in any mode does `data-current-hz` exceed 12 or fall below 2. If `content.json` is edited to a value outside 2 to 12, the app clamps to the range.
- AC-20. (Real time, no clock mock.) During Dream's hold phase, sampling the overlay background colour every animation frame for 5 s records 100 plus or minus 10 colour changes (10 Hz square wave), and the "on" colour is never red (`#FFF1DC`).
- AC-21. During the first 10 s the "on" colour's opacity/intensity is below full and increasing; during the last 10 s it is decreasing.

**Session: torch**
- AC-22. Starting a session on Torch calls `getUserMedia` with `facingMode` `environment`. If the call fails, or the track has no `torch` capability, `[data-testid="torch-error"]` shows a message suggesting Screen, no session overlay remains, and the camera track is stopped.
- AC-23. With a mocked camera track that reports `torch: true`, the app calls `applyConstraints` with alternating `torch: true/false`, never faster than 10 Hz (Dream on torch holds 10 Hz), and makes no torch-on call before 10 s.
- AC-24. On torch, the overlay is near-black (not flashing), shows remaining time and "Tap anywhere to stop".

**Audio**
- AC-25. Within 1 s of a session starting, `data-audio="running"`, and an `AudioContext` exists in state `running`.
- AC-26. The app makes no network request for audio files (no `.mp3`, `.wav`, `.ogg`, `.m4a`, `.aac`) and has no `<audio>` element with a `src`.
- AC-27. With `AudioContext` instrumented in an init script: binaural modes create two oscillators whose frequencies differ by the current beat Hz and are centred on the mode's carrier; isochronic modes create one oscillator at the carrier; Relax adds a pink-noise source and Sleep a brown-noise source; Dream and Meditate add none.

**Stopping and ending**
- AC-28. Tapping anywhere on the session overlay removes the flashing within one frame, sets `data-audio` to `stopped` within 2 s, and returns to the options view for that mode.
- AC-29. Pressing Escape stops the session the same way.
- AC-30. Firing `visibilitychange` with `document.hidden` true stops the session.
- AC-31. When the timer runs out, the session fades out, the overlay closes and the options view shows "Session complete".
- AC-32. After any stop, all camera tracks are stopped and no torch call is made afterwards.

**Info page**
- AC-33. The selector has `[data-testid="info-link"]` that opens `#/info` with a "Why" section (`#why`) and a "How" section (`#how`).
- AC-34. Why shows the intro, all 7 points and exactly 8 references, each a link whose `href` matches `content.json` and starts with `https://doi.org/`. Links open in a new tab with `rel="noopener"`.
- AC-35. How shows the 4 sections (Before you start, Using the screen, Using the torch, Stopping) with all steps from `content.json`.

**Look, feel and identity**
- AC-36. Dark only: with `colorScheme: 'light'` emulated, the body background is still dark (relative luminance below 0.05) and `<meta name="color-scheme" content="dark">` is present. There is no theme toggle.
- AC-37. No horizontal scroll at 320 px width. All tap targets on the selector and options view are at least 44 x 44 CSS px.
- AC-38. The app makes no requests to origins other than its own (no analytics, CDNs or font hosts at runtime).
- AC-39. The page text contains no other app's brand name, and all copy is Australian English with no em dashes (no `—` character in rendered text).
- AC-40. The production build serves correctly from the GitHub Pages project sub-path (assets load, routes work).
