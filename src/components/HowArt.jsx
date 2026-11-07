import { useId } from 'react'

// Hand-drawn style spot illustrations for the How section.
// Flat, grainy blob characters with thin line-art limbs on a soft cream card.

const INK = '#1b1726' // face details, drawn on the coloured bodies
const LINE = '#e9e4f5' // limbs and props, drawn on the dark page
const line = { stroke: LINE, strokeWidth: 2.6, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' }
const face = { ...line, stroke: INK }

/** Shared defs: grain speckle filter. */
function Grain({ id }) {
  return (
    <filter id={id} x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
      <feColorMatrix values="0 0 0 0 0.1  0 0 0 0 0.08  0 0 0 0 0.15  1.8 0 0 0 -0.95" />
    </filter>
  )
}

/** A filled shape with gradient, airbrush highlight and grain, clipped to `shape`. */
function Textured({ uid, name, shape, from, to, children, box, angle = 'diag' }) {
  const clip = `${uid}-${name}-clip`
  const grad = `${uid}-${name}-grad`
  const hi = `${uid}-${name}-hi`
  const [bx, by, bw, bh] = box
  const vec = angle === 'diag'
    ? { x1: bx, y1: by, x2: bx + bw, y2: by + bh }
    : { x1: bx, y1: by + bh, x2: bx + bw, y2: by }
  return (
    <g>
      <defs>
        <clipPath id={clip}>{shape}</clipPath>
        <linearGradient id={grad} gradientUnits="userSpaceOnUse" {...vec}>
          <stop offset="0.1" stopColor={from} />
          <stop offset="0.9" stopColor={to} />
        </linearGradient>
        <radialGradient id={hi} gradientUnits="userSpaceOnUse" cx={bx + bw * 0.3} cy={by + bh * 0.25} r={bw * 0.6}>
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect width="320" height="200" fill={`url(#${grad})`} />
        {children}
        <rect width="320" height="200" fill={`url(#${hi})`} />
        <rect width="320" height="200" filter={`url(#${uid}-grain)`} opacity="0.55" />
      </g>
    </g>
  )
}

const Ground = ({ y = 182, x1 = 40, x2 = 280 }) => (
  <path d={`M${x1} ${y} H${x1 + 40} M${x1 + 52} ${y} H${x2 - 30} M${x2 - 18} ${y} H${x2}`} {...line} strokeWidth="2" />
)

const Shadow = ({ cx, y = 182, rx = 34 }) => <ellipse cx={cx} cy={y} rx={rx} ry="4" fill={LINE} opacity="0.12" />

const Sparkle = ({ x, y, s = 6, c = '#ff5bb0' }) => (
  <path d={`M${x} ${y - s} V${y + s} M${x - s} ${y} H${x + s}`} stroke={c} strokeWidth="2.6" strokeLinecap="round" />
)

const Zap = ({ x, y, c1 = '#ff4f9a', c2 = '#ffb52e' }) => (
  <g strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
    <path d={`M${x} ${y} l7 -8 l5 9 l7 -9 l5 9 l7 -8`} stroke={c1} />
    <path d={`M${x + 4} ${y + 14} l7 -8 l5 9 l7 -9 l5 9`} stroke={c2} />
  </g>
)

/** Measure arrow with label, e.g. "10-15 cm". */
const Measure = ({ x1, x2, y, label }) => (
  <g>
    <path d={`M${x1} ${y} H${x2} M${x1} ${y - 6} V${y + 6} M${x2} ${y - 6} V${y + 6}`} {...line} strokeWidth="2" strokeDasharray="0" />
    <rect x={(x1 + x2) / 2 - 30} y={y - 11} width="60" height="22" rx="11" fill="#141729" stroke={LINE} strokeWidth="2" />
    <text x={(x1 + x2) / 2} y={y + 4.5} textAnchor="middle" fontSize="12.5" fontWeight="800" fill={LINE} fontFamily="inherit">
      {label}
    </text>
  </g>
)

/** Closed, smiling eyes (upside-down arcs) with little brows. */
const SleepyEyes = ({ x, y, gap = 26 }) => (
  <g {...face} strokeWidth="2.4">
    <path d={`M${x} ${y} q5.5 5.5 11 0`} />
    <path d={`M${x + gap} ${y} q5.5 5.5 11 0`} />
    <path d={`M${x + 1} ${y - 9} q4 -2.5 9 -1`} />
    <path d={`M${x + gap + 1} ${y - 10} q4 -1.5 9 1`} />
  </g>
)

// ---------- 1. Before you start: headphones on, Do Not Disturb, quiet night ----------
function BeforeYouStart({ uid }) {
  return (
    <g>
      {/* night sky bits */}
      <path d="M58 40 a18 18 0 1 0 22 26 a14 14 0 1 1 -22 -26z" fill="#ffc21a" />
      <Sparkle x={96} y={30} s={5} c="#7b5cff" />
      <Sparkle x={44} y={84} s={4} c="#ff5bb0" />
      <Ground />
      <Shadow cx={152} />
      {/* legs */}
      <path d="M138 150 L134 180 M168 150 L172 180" {...line} />
      <path d="M126 180 q-4 -8 4 -8 l4 8z M180 180 q4 -8 -4 -8 l-4 8z" fill="#ffc21a" stroke={LINE} strokeWidth="2" />
      {/* hand on hip */}
      <path d="M103 108 q-26 10 -14 32 q6 9 18 4" {...line} />
      {/* body */}
      <Textured uid={uid} name="b1" from="#4b2fd6" to="#14c4a0" box={[98, 50, 108, 108]} shape={<circle cx="152" cy="104" r="54" />} />
      {/* face */}
      <SleepyEyes x={131} y={98} />
      <path d="M137 114 q15 14 30 0" {...face} />
      <ellipse cx="126" cy="108" rx="6" ry="3.5" fill="#ffc21a" />
      <ellipse cx="178" cy="108" rx="6" ry="3.5" fill="#ffc21a" />
      {/* headphones */}
      <path d="M96 104 C92 28 212 28 208 104" {...line} strokeWidth="5" />
      <rect x="86" y="92" width="18" height="32" rx="8" fill="#ff5bb0" stroke={LINE} strokeWidth="2.6" />
      <rect x="200" y="92" width="18" height="32" rx="8" fill="#ff5bb0" stroke={LINE} strokeWidth="2.6" />
      {/* arm holding phone with DND moon */}
      <path d="M204 120 C226 124 236 112 240 98" {...line} />
      <rect x="228" y="52" width="30" height="50" rx="6" fill="#1e2238" stroke={LINE} strokeWidth="2.6" />
      <path d="M248 68 a8 8 0 1 0 4 12 a6 6 0 1 1 -4 -12z" fill="#ffc21a" />
      <path d="M236 98 q4 -8 12 -4 M238 104 q6 -6 12 -1" {...line} strokeWidth="2.2" />
      {/* low volume waves */}
      <path d="M268 78 q5 6 0 12 M276 74 q8 10 0 20" {...line} stroke="#7b5cff" strokeWidth="2.4" />
    </g>
  )
}

// ---------- 2. Using the screen: eyes closed, screen 10-15 cm from face, brightness up ----------
function UsingScreen({ uid }) {
  const petals = [0, 60, 120, 180, 240, 300].map((a) => {
    const r = (a * Math.PI) / 180
    return <circle key={a} cx={112 + Math.cos(r) * 30} cy={100 + Math.sin(r) * 30} r="27" />
  })
  return (
    <g>
      <Ground />
      <Shadow cx={112} rx={36} />
      {/* walking legs */}
      <path d="M98 146 L86 180 M126 146 L136 180" {...line} />
      <path d="M86 180 l-12 0 M136 180 l12 0" {...line} strokeWidth="3.4" />
      {/* back arm waving */}
      <path d="M60 104 q-22 -10 -16 -34" {...line} />
      <path d="M44 70 l-6 -10 M44 70 l-1 -12 M44 70 l5 -11" {...line} strokeWidth="2.2" />
      {/* flower body */}
      <Textured uid={uid} name="b2" from="#ff8ae6" to="#e84fc0" box={[56, 44, 112, 112]} shape={[...petals, <circle key="c" cx="112" cy="100" r="32" />]}>
        <path d="M40 60 l140 40 M40 90 l140 40 M50 40 l140 40 M30 120 l140 40 M60 20 l120 34" stroke="#ff9f1a" strokeWidth="5" strokeLinecap="round" />
      </Textured>
      {/* face looking at phone */}
      <SleepyEyes x={108} y={92} gap={22} />
      <path d="M110 108 q14 16 30 0z" fill="#fff" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M118 108 v6 M125 108 v8 M132 108 v6" {...face} strokeWidth="1.6" />
      {/* arm holding phone in front of face */}
      <path d="M150 122 C178 130 188 120 198 110" {...line} />
      <rect x="198" y="60" width="28" height="56" rx="6" fill="#fff6d9" stroke={LINE} strokeWidth="2.6" />
      <path d="M196 112 q6 -8 12 -2" {...line} strokeWidth="2.2" />
      {/* light rays towards face */}
      <g stroke="#ffb52e" strokeWidth="3.2" strokeLinecap="round">
        <path d="M190 74 L172 68" />
        <path d="M190 88 L168 88" />
        <path d="M190 102 L172 108" />
      </g>
      {/* brightness up */}
      <circle cx="266" cy="52" r="9" fill="#ffc21a" stroke={LINE} strokeWidth="2.2" />
      <g stroke={LINE} strokeWidth="2.2" strokeLinecap="round">
        <path d="M266 34 v-5 M266 70 v5 M248 52 h-5 M284 52 h5 M253 39 l-3 -3 M279 65 l3 3 M279 39 l3 -3 M253 65 l-3 3" />
      </g>
      <path d="M262 92 l4 -6 l4 6 M266 86 v14" {...line} strokeWidth="2.2" />
      <Measure x1={142} x2={212} y={160} label="10-15 cm" />
    </g>
  )
}

// ---------- 3. Using the torch: back of phone towards closed eyes, about 30 cm ----------
function UsingTorch({ uid }) {
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-beam`} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#ffc21a" stopOpacity="0.85" />
          <stop offset="1" stopColor="#ffc21a" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <Ground />
      <Shadow cx={96} rx={38} />
      {/* legs */}
      <path d="M84 150 L78 180 M110 150 L120 180" {...line} />
      <path d="M78 180 l-12 0 M120 180 l12 0" {...line} strokeWidth="3.4" />
      {/* hand on hip */}
      <path d="M52 112 q-20 14 -6 30 q6 4 12 0" {...line} />
      {/* beam from torch to face */}
      <path d="M232 70 L150 56 L150 128 L232 82z" fill={`url(#${uid}-beam)`} />
      {/* square body */}
      <g transform="rotate(-8 98 104)">
        <Textured uid={uid} name="b3" from="#ffd23f" to="#ffa800" box={[52, 58, 92, 92]} shape={<rect x="52" y="58" width="92" height="92" rx="4" />}>
          <path d="M40 80 C80 60 110 120 150 70 M40 120 C70 90 120 150 160 110 M60 160 C80 120 120 140 150 150" stroke="#f47ae0" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        </Textured>
      </g>
      {/* face */}
      <SleepyEyes x={92} y={94} gap={24} />
      <path d="M104 112 q8 8 16 0 q-8 10 -16 0z" fill="#ff7fb8" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
      {/* arm holding phone out */}
      <path d="M142 122 C180 132 214 120 236 104" {...line} />
      {/* phone, back facing the character */}
      <rect x="232" y="56" width="30" height="56" rx="6" fill="#1e2238" stroke={LINE} strokeWidth="2.6" />
      <circle cx="241" cy="66" r="4.5" fill="#0c0e1a" stroke="#8a86a3" strokeWidth="1.5" />
      <circle cx="241" cy="78" r="3.5" fill="#fff6d9" />
      <path d="M232 106 q6 -8 12 -2" {...line} strokeWidth="2.2" />
      <Zap x={266} y={48} />
      <Measure x1={150} x2={246} y={160} label="30 cm" />
    </g>
  )
}

// ---------- 4. Stopping: tap anywhere ----------
function Stopping({ uid }) {
  return (
    <g>
      <Ground />
      <Shadow cx={128} rx={38} />
      {/* legs */}
      <path d="M114 152 q-6 14 -4 28 M144 152 q6 14 4 28" {...line} />
      <path d="M102 180 q-2 -8 6 -8 l2 8z M156 180 q2 -8 -6 -8 l-2 8z" fill="#ff7fe0" stroke={LINE} strokeWidth="2" />
      {/* body */}
      <Textured uid={uid} name="b4" from="#14c4a0" to="#4b2fd6" angle="up" box={[74, 50, 108, 108]} shape={<circle cx="128" cy="104" r="54" />} />
      {/* face */}
      <SleepyEyes x={110} y={96} gap={24} />
      <path d="M118 112 q11 10 22 0" {...face} />
      <ellipse cx="104" cy="106" rx="6" ry="3.5" fill="#ff8fd8" />
      <ellipse cx="152" cy="106" rx="6" ry="3.5" fill="#ff8fd8" />
      {/* arm holding phone */}
      <path d="M78 116 q-14 18 6 30 q30 10 104 -16" {...line} />
      <rect x="184" y="64" width="34" height="62" rx="7" fill="#1e2238" stroke={LINE} strokeWidth="2.6" />
      <rect x="189" y="72" width="24" height="44" rx="3" fill="#0c0e1a" />
      {/* tapping finger */}
      <path d="M180 92 C188 92 196 94 200 92" {...line} />
      <path d="M200 92 l2 -6" {...line} strokeWidth="3.4" />
      <circle cx="202" cy="84" r="9" fill="none" stroke="#ff5bb0" strokeWidth="2.4" />
      <g stroke="#ffb52e" strokeWidth="2.8" strokeLinecap="round">
        <path d="M216 74 l7 -5 M218 86 h9 M208 66 l2 -8" />
      </g>
      {/* heart */}
      <path d="M266 40 c-6 -10 -20 -4 -14 6 l14 12 l14 -12 c6 -10 -8 -16 -14 -6z" fill="#ff7fe0" />
      <path d="M232 86 q20 -6 26 -24" {...line} strokeWidth="2" strokeDasharray="0.1 6" />
    </g>
  )
}

const SCENES = {
  'Before you start': { C: BeforeYouStart, label: 'A smiling character wearing headphones holds a phone in Do Not Disturb mode, under a crescent moon.' },
  'Using the screen': { C: UsingScreen, label: 'A character with eyes closed holds the glowing screen 10 to 15 cm from their face, with brightness turned up.' },
  'Using the torch': { C: UsingTorch, label: 'A character with eyes closed holds the phone about 30 cm away, back of the phone and torch facing them.' },
  Stopping: { C: Stopping, label: 'A relaxed character taps the phone screen to stop the session.' },
}

export default function HowArt({ title }) {
  const uid = useId().replace(/:/g, '')
  const scene = SCENES[title]
  if (!scene) return null
  const { C, label } = scene
  return (
    <div className="-mx-2 mb-2">
      <svg viewBox="0 0 320 200" role="img" aria-label={label} className="block h-auto w-full">
        <defs>
          <Grain id={`${uid}-grain`} />
        </defs>
        <C uid={uid} />
      </svg>
    </div>
  )
}
