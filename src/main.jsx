import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/bricolage-grotesque/opsz.css'
import './index.css'
import App from './App.jsx'

const SPLASH_MIN_MS = 2000

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Keep the splash (in index.html) up for at least 2 s from launch, and until the page and
// fonts have finished loading - whichever is later - then fade it out.
function hideSplash() {
  const boot = document.getElementById('boot')
  if (!boot) return
  const loaded = document.readyState === 'complete'
    ? Promise.resolve()
    : new Promise((r) => window.addEventListener('load', r, { once: true }))
  const fonts = document.fonts?.ready ?? Promise.resolve()
  const minTime = new Promise((r) => setTimeout(r, Math.max(0, SPLASH_MIN_MS - performance.now())))
  Promise.all([loaded, fonts, minTime]).then(() => {
    boot.classList.add('is-hidden')
    boot.addEventListener('transitionend', () => boot.remove(), { once: true })
    setTimeout(() => boot.remove(), 1000) // in case transitionend doesn't fire
  })
}
hideSplash()
