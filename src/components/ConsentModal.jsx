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
        data-testid="consent"
        tabIndex={-1}
        className="animate-sheet relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-night-600 bg-night-800 p-5 shadow-2xl"
      >
        <h2 id={titleId} className="text-xl font-extrabold text-white">Before your first session</h2>
        <p id={descId} className="mt-3 text-[15px] leading-relaxed text-mist">
          Flicker uses flashing light. Flashing light can trigger seizures in people with photosensitive epilepsy,
          sometimes for the first time. Don't use Flicker if you or a close family member have epilepsy or have had a
          seizure. Never use it while driving or moving around. Stop straight away if you feel dizzy, sick, get a
          headache or notice any twitching.
        </p>

        <label className="mt-5 flex min-h-11 cursor-pointer items-start gap-3 text-white">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 size-6 shrink-0 accent-glow"
          />
          <span className="font-semibold">I've read this and I don't have epilepsy or a history of seizures.</span>
        </label>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            data-testid="consent-cancel"
            onClick={onCancel}
            className="min-h-12 rounded-2xl border border-night-600 font-semibold text-mist hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            data-testid="consent-accept"
            disabled={!agreed}
            onClick={onContinue}
            className="min-h-12 rounded-2xl bg-glow font-extrabold text-night-950 transition disabled:cursor-not-allowed disabled:opacity-30 motion-reduce:transition-none"
          >
            Start
          </button>
        </div>
      </div>
    </div>
  )
}
