import { useId, useRef, useState } from 'react'
import { useModal } from '../hooks/useModal.js'

export default function ConsentModal({ onContinue, onCancel }) {
  const ref = useRef(null)
  const titleId = useId()
  const descId = useId()
  const [agreed, setAgreed] = useState(false)

  useModal(ref, onCancel)

  return (
    <div className="fixed inset-0 z-[45] grid place-items-center p-4">
      <div aria-hidden="true" className="animate-fade absolute inset-0 bg-black/80" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        className="animate-sheet relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-night-600 bg-night-800 p-5 shadow-2xl"
      >
        <h2 id={titleId} className="text-xl font-extrabold text-white">Before you begin</h2>
        <div id={descId} className="mt-3 space-y-3 text-[15px] leading-relaxed text-mist">
          <p className="font-semibold text-glow">Flickering light can trigger seizures in people with photosensitive epilepsy.</p>
          <p>Please do not use Flicker if:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>you have epilepsy or a history of seizures</li>
            <li>light triggers your migraines</li>
            <li>you are pregnant, unless a doctor has said it is fine</li>
          </ul>
          <p>Flicker is not a medical treatment. Never use it while driving or doing anything that needs your attention. Stop straight away if you feel unwell, dizzy or uncomfortable.</p>
        </div>

        <label className="mt-5 flex min-h-11 cursor-pointer items-center gap-3 text-white">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="size-6 shrink-0 accent-glow"
          />
          <span className="font-semibold">I understand and want to continue</span>
        </label>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-12 rounded-2xl border border-night-600 font-semibold text-mist hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!agreed}
            onClick={onContinue}
            className="min-h-12 rounded-2xl bg-glow font-extrabold text-night-950 transition disabled:cursor-not-allowed disabled:opacity-30 motion-reduce:transition-none"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
