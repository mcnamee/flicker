// Generates brand assets from the hand-lettered wordmark:
//   public/favicon.svg, public/apple-touch-icon.png, public/icon-192.png, public/icon-512.png,
//   public/splash/*.png (iOS launch images) and scripts/splash-inline.svg (pasted into index.html).
// Run: node scripts/brand.cjs   (needs Playwright's Chromium)
// Keep the letter shapes in sync with src/components/Logo.jsx.

const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright')

const ROOT = path.join(__dirname, '..')
const AMBER = '#f2b33d'
const MIST = '#a7a9c4'
const NIGHT = '#07080f'

const STROKES = [
  'M34 128 C46 108 50 72 54 48 C58 26 70 16 84 22',
  'M30 70 C48 68 64 64 80 60',
  'M118 22 C110 52 104 82 106 104 C107 114 114 114 120 108',
  'M138 70 C136 82 134 94 136 106',
  'M188 74 C180 64 160 66 158 86 C156 104 170 110 184 102',
  'M220 20 C216 52 212 82 212 106',
  'M248 64 C234 74 224 80 216 86 C228 90 238 98 248 110',
  'M272 90 C288 90 304 84 302 72 C300 62 278 62 274 82 C270 102 286 112 306 102',
  'M328 68 C328 82 326 94 326 106',
  'M327 84 C332 72 346 64 364 68',
]
const BULBS = [
  [34, 128, 9], [86, 22, 10], [82, 60, 8.5], [118, 20, 9.5], [188, 74, 8.5], [184, 102, 7.5],
  [220, 19, 9.5], [250, 63, 8.5], [250, 111, 9], [308, 101, 8.5], [366, 68, 10], [326, 108, 8],
]

const defs = (p) => `
  <radialGradient id="${p}orb" cx="40%" cy="35%" r="65%"><stop offset="0" stop-color="#fff1dc"/><stop offset=".45" stop-color="#f7c867"/><stop offset="1" stop-color="#e59e1b"/></radialGradient>
  <radialGradient id="${p}halo"><stop offset="0" stop-color="${AMBER}" stop-opacity=".45"/><stop offset="1" stop-color="${AMBER}" stop-opacity="0"/></radialGradient>
  <filter id="${p}goo" x="-10%" y="-20%" width="120%" height="140%"><feGaussianBlur in="SourceGraphic" stdDeviation="3.2"/><feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9"/></filter>`

const letters = (p, strokes, bulbs) => `
  <g fill="${AMBER}" filter="url(#${p}goo)">
    <g fill="none" stroke="${AMBER}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round">${strokes.map((d) => `<path d="${d}"/>`).join('')}</g>
    ${bulbs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}
  </g>`

const orb = (p, x, y, r = 10) =>
  `<circle cx="${x}" cy="${y}" r="${r * 2.4}" fill="url(#${p}halo)"/><circle class="orb" cx="${x}" cy="${y}" r="${r}" fill="url(#${p}orb)"/>`

/** Wordmark with the "light + sound" pill, transparent background. */
function wordmarkSvg(p = 'wm-') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="8 6 380 160" role="img" aria-label="Flicker">
<defs>${defs(p)}</defs>
<g transform="translate(14 0) skewX(-8)">${letters(p, STROKES, BULBS)}${orb(p, 146, 44)}</g>
<g transform="translate(232 128) rotate(-4)" fill="none" stroke="${MIST}" stroke-width="3" stroke-linecap="round">
  <rect width="128" height="30" rx="15"/>
  <path d="M-16 4 l10 6 M-14 14 l9 -2 M-8 -4 l3 9"/>
  <text x="64" y="20.5" text-anchor="middle" stroke="none" fill="${MIST}" font-family="Arial Black, Arial, Helvetica, sans-serif" font-weight="900" font-size="13" letter-spacing="1.5">LIGHT + SOUND</text>
</g>
</svg>`
}

/** App icon: the melted "f" with the glowing orb, full-bleed night background. */
function iconSvg(p = 'ic-') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<defs>${defs(p)}<radialGradient id="${p}bg" cx="50%" cy="42%" r="75%"><stop offset="0" stop-color="#1e2238"/><stop offset="1" stop-color="${NIGHT}"/></radialGradient></defs>
<rect width="512" height="512" fill="url(#${p}bg)"/>
<g transform="translate(250 262) scale(2.9) translate(-57 -74) skewX(-8)">${letters(p, STROKES.slice(0, 2), BULBS.slice(0, 3))}</g>
${orb(p, 348, 150, 26)}
</svg>`
}

const DEVICES = [
  [440, 956, 3], [430, 932, 3], [428, 926, 3], [420, 912, 3], [414, 896, 3], [414, 896, 2],
  [402, 874, 3], [393, 852, 3], [390, 844, 3], [375, 812, 3], [375, 667, 2],
]

async function shot(browser, svg, w, h, ratio, out, bg = NIGHT, logoWidth = null) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: ratio })
  const inner = logoWidth
    ? `<div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center"><div style="width:${logoWidth}px">${svg}</div></div>`
    : svg
  await page.setContent(`<style>html,body{margin:0;height:100%;background:${bg}}svg{display:block;width:100%;height:${logoWidth ? 'auto' : '100%'}}</style>${inner}`)
  await page.screenshot({ path: out })
  await page.close()
}

;(async () => {
  const browser = await chromium.launch()
  const icon = iconSvg()
  fs.writeFileSync(path.join(ROOT, 'public/favicon.svg'), icon)
  for (const [name, size] of [['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]]) {
    await shot(browser, icon, size, size, 1, path.join(ROOT, 'public', name))
  }
  const wm = wordmarkSvg()
  fs.mkdirSync(path.join(ROOT, 'public/splash'), { recursive: true })
  for (const [w, h, r] of DEVICES) {
    await shot(browser, wm, w, h, r, path.join(ROOT, 'public/splash', `${w * r}x${h * r}.png`), NIGHT, 230)
  }
  fs.writeFileSync(path.join(__dirname, 'splash-inline.svg'), wordmarkSvg('boot-'))
  await browser.close()
  console.log('Brand assets written.')
})()
