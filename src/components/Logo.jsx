import { useId } from 'react'

// Hand-lettered "flicker" wordmark: thick brush strokes melted together with a goo
// filter, bulbous stroke ends, and the glowing orb as the dot on the i.

const STROKES = [
  'M34 128 C46 108 50 72 54 48 C58 26 70 16 84 22', // f stem
  'M30 70 C48 68 64 64 80 60', // f bar
  'M118 22 C110 52 104 82 106 104 C107 114 114 114 120 108', // l
  'M138 70 C136 82 134 94 136 106', // i
  'M188 74 C180 64 160 66 158 86 C156 104 170 110 184 102', // c
  'M220 20 C216 52 212 82 212 106', // k stem
  'M248 64 C234 74 224 80 216 86 C228 90 238 98 248 110', // k arm
  'M272 90 C288 90 304 84 302 72 C300 62 278 62 274 82 C270 102 286 112 306 102', // e
  'M328 68 C328 82 326 94 326 106', // r stem
  'M327 84 C332 72 346 64 364 68', // r arm
]

const BULBS = [
  [34, 128, 9], [86, 22, 10], [82, 60, 8.5], [118, 20, 9.5], [188, 74, 8.5], [184, 102, 7.5],
  [220, 19, 9.5], [250, 63, 8.5], [250, 111, 9], [308, 101, 8.5], [366, 68, 10], [326, 108, 8],
]

export default function Logo({ className = '', color = '#f2b33d', title = 'Flicker', weight = 13 }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="8 6 380 132" role="img" aria-label={title} className={className}>
      <defs>
        <radialGradient id={`${id}-orb`} cx="40%" cy="35%" r="65%">
          <stop offset="0" stopColor="#fff1dc" />
          <stop offset=".45" stopColor="#f7c867" />
          <stop offset="1" stopColor="#e59e1b" />
        </radialGradient>
        <radialGradient id={`${id}-halo`}>
          <stop offset="0" stopColor="#f2b33d" stopOpacity=".45" />
          <stop offset="1" stopColor="#f2b33d" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-goo`} x="-10%" y="-20%" width="120%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3.2" />
          <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" />
        </filter>
      </defs>
      <g transform="translate(14 0) skewX(-8)">
        <g fill={color} filter={`url(#${id}-goo)`}>
          <g fill="none" stroke={color} strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round">
            {STROKES.map((d) => <path key={d} d={d} />)}
          </g>
          {BULBS.map(([cx, cy, r]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r + (weight - 13) / 2} />)}
        </g>
        <circle cx="146" cy="44" r="24" fill={`url(#${id}-halo)`} />
        <circle cx="146" cy="44" r="10" fill={`url(#${id}-orb)`} />
      </g>
    </svg>
  )
}
