import Img from './Img'
import { useState, useEffect, useCallback, useRef } from 'react'
import { dataUrlToFile } from '../lib/uiHelpers'
import { generatePoster, downloadPoster, POSTER_TEMPLATE_NAMES, POSTER_HIRING_TEMPLATE_NAMES, type PosterData, type PosterFormat, type PosterResult } from './posterGenerator'
import TemplatePicker from './TemplatePicker'
import { useToast } from './Toast'
import useDialog from '../hooks/useDialog'

interface PosterStudioModalProps {
  data: PosterData
  onClose: () => void
}

// Web Share API *with files* - see the matching comment in ShareModal.tsx.
// Duplicated rather than imported: the two modals don't otherwise share a
// module, and this is a three-line capability probe, not worth a new shared
// file for.
const canShareFiles = (() => {
  if (typeof navigator === 'undefined' || typeof navigator.canShare !== 'function') return false
  try {
    return navigator.canShare({ files: [new File([''], 'probe.png', { type: 'image/png' })] })
  } catch { return false }
})()


const FORMATS: { value: PosterFormat; label: string; dim: string; ratio: string }[] = [
  { value: 'post', label: 'Post', dim: '1080 × 1440', ratio: '4 / 5' },
  { value: 'story', label: 'Story', dim: '1080 × 1920', ratio: '9 / 16' },
]

// Instagram graphic studio. Picks a random brand-compliant template every
// generate/regenerate so each export is a fresh design (or pins a chosen one
// via the design picker).
//
// It used to be role-gated: FeedPostCard hand-rolled
// `['hod','director','super_admin'].includes(role)` and PostPage used
// `hasLeaderAccess`, so a member could not make a graphic out of their own
// post. There is nothing to gate - this writes nothing, reads nothing, and
// only redraws content the viewer is already looking at - so the studio is now
// reached from ShareModal's poster row by anyone who can open the share sheet.
// The one caller that stays leader-scoped is OpportunitiesPage's ManagePopover,
// and that is because the popover itself is opening MANAGEMENT (edit, pause,
// close, delete), not because the studio is.
export default function PosterStudioModal({ data, onClose }: PosterStudioModalProps) {
  const { error: toastError } = useToast()
  const [format, setFormat] = useState<PosterFormat>('post')
  const [template, setTemplate] = useState<string | null>(null)
  const [result, setResult] = useState<PosterResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // In-flight state for the share-sheet handoff, separate from `busy` (canvas
  // generation) so a slow tap-to-share doesn't read as "regenerating".
  const [sharing, setSharing] = useState(false)
  const reqId = useRef(0)

  const lastTemplate = useRef<string | null>(null)

  const run = useCallback(async (fmt: PosterFormat, tpl: string | null) => {
    const id = ++reqId.current
    setBusy(true); setError(null)
    try {
      // When not pinning a template, exclude the last-drawn one so regenerate
      // doesn't redraw the same design on a small sub-pool.
      const res = await generatePoster(data, fmt, {
        template: tpl ?? undefined,
        exclude: tpl ? undefined : (lastTemplate.current ?? undefined),
      })
      lastTemplate.current = res.template
      if (id === reqId.current) setResult(res)
    } catch (e) {
      console.error('Poster generation failed:', e)
      if (id === reqId.current) setError('Could not generate - try again.')
    } finally {
      if (id === reqId.current) setBusy(false)
    }
  }, [data])

  // First design on open + whenever the format changes.
  useEffect(() => { run(format, template) }, [format, run]) // eslint-disable-line react-hooks/exhaustive-deps

  // Was an Escape listener only — no Tab trap and no scroll-lock.
  const panelRef = useDialog(true, onClose)

  const posterFilename = () => {
    const slug = (data.uuid || 'post').slice(0, 6)
    return `aquaterra-${format}-${slug}.png`
  }

  const posterShareTitle = data.hiring
    ? (data.hiring.teamName ? `${data.hiring.teamName} is hiring` : 'Open role at AquaTerra')
    : 'AquaTerra'

  const handleDownload = () => {
    if (!result) return
    downloadPoster(result.dataUrl, posterFilename())
  }

  // Primary action once a design is ready. Hands the PNG to the OS share
  // sheet (Instagram appears there as a target, same as any native app share)
  // when the browser can share files at all; otherwise falls back to the
  // existing download flow. See the matching handler in ShareModal.tsx for
  // why this is a share-sheet handoff rather than Graph API auto-publish.
  const handleShare = async () => {
    if (!result) return
    const filename = posterFilename()
    if (!canShareFiles) { downloadPoster(result.dataUrl, filename); return }
    setSharing(true)
    try {
      const file = await dataUrlToFile(result.dataUrl, filename)
      if (!navigator.canShare({ files: [file] })) { downloadPoster(result.dataUrl, filename); return }
      await navigator.share({ files: [file], title: posterShareTitle })
    } catch (e: any) {
      if (e?.name === 'AbortError') return // user backed out of the share sheet - not a failure
      console.error('Poster share failed:', e)
      toastError('couldn’t open the share sheet', 'downloading the image instead')
      downloadPoster(result.dataUrl, filename)
    } finally {
      setSharing(false)
    }
  }

  return (
    <div
      role="presentation"
      onClick={e => { e.stopPropagation(); onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 320,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Poster studio"
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 460,
          background: 'var(--card)', borderRadius: 'var(--r-md)', border: 'var(--hair-2)', boxShadow: 'var(--lift-4)',
          overflow: 'hidden', maxHeight: '92dvh', display: 'flex', flexDirection: 'column',
          animation: 'sheetUp 0.22s var(--ease-out)', outline: 'none',
        }}
      >
        {/* Overlay-layer migration: the studio panel's 2px ink border became a
            hairline and gained --lift-4 (the modal depth) in its place; the 2px
            --line header/footer rules became --hair, and the 10/8 off-scale
            radii inside moved onto --r-tight. */}
        {/* Header */}
        <div style={{ padding: '14px 18px 12px', borderBottom: 'var(--hair)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ fontSize: 18 }}>🎨</span>
            <div>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 17, lineHeight: 1 }}>poster studio</div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 3, letterSpacing: '0.03em' }}>
                random brand design · instagram-ready
              </div>
            </div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onClose() }}
            aria-label="Close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', fontSize: 18, width: 44, height: 44, display: 'grid', placeItems: 'center', borderRadius: 'var(--r-tight)', transition: 'color 0.12s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-3)')}
          >✕</button>
        </div>

        {/* Format toggle */}
        <div style={{ padding: '14px 18px 6px', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8, background: 'var(--bg-2)', padding: 5, borderRadius: 'var(--r-tight)', border: 'var(--hair-2)' }}>
            {FORMATS.map(f => {
              const active = format === f.value
              return (
                <button
                  key={f.value}
                  onClick={() => setFormat(f.value)}
                  aria-pressed={active}
                  style={{
                    flex: 1, padding: '9px 4px', borderRadius: 'var(--r-tight)', cursor: 'pointer', border: 'none',
                    background: active ? 'var(--ink)' : 'transparent',
                    color: active ? 'var(--card)' : 'var(--ink-2)',
                    transition: 'background 0.16s, color 0.16s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  }}
                >
                  <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 14 }}>{f.label}</span>
                  <span className="mono" style={{ fontSize: 9.5, opacity: 0.7, fontVariantNumeric: 'tabular-nums' }}>{f.dim}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Preview */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              position: 'relative',
              aspectRatio: FORMATS.find(f => f.value === format)!.ratio,
              height: 'min(46dvh, 420px)',
              borderRadius: 'var(--r-tight)', overflow: 'hidden',
              border: 'var(--hair-2)', background: 'var(--bg-2)',
              display: 'grid', placeItems: 'center', flexShrink: 0,
              transition: 'aspect-ratio 0.2s',
            }}
          >
            {result && (
              <Img
                src={result.dataUrl}
                alt="Generated poster preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: busy ? 0.4 : 1, transition: 'opacity 0.2s' }}
              />
            )}
            {busy && (
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 30, height: 30, border: '3px solid var(--line-2)', borderTopColor: 'var(--welfare)', borderRadius: '50%', animation: 'login-spin 0.8s linear infinite' }} />
                  <span className="mono" style={{ fontSize: 11, color: 'var(--welfare-ink)' }}>designing…</span>
                </div>
              </div>
            )}
            {error && !busy && (
              <div role="alert" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 20, textAlign: 'center' }}>
                <span className="mono" style={{ fontSize: 12, color: 'var(--tomato-ink)' }}>{error}</span>
              </div>
            )}
          </div>
          {result && !busy && (
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.03em' }}>
              ✦ {result.template}{result.usedPhoto ? ' · photo' : ' · typographic'}
            </div>
          )}
          <TemplatePicker
            names={data.hiring ? POSTER_HIRING_TEMPLATE_NAMES : POSTER_TEMPLATE_NAMES}
            selected={template}
            onSelect={tpl => { setTemplate(tpl); run(format, tpl) }}
          />
        </div>

        {/* Actions */}
        <div style={{ padding: '12px 18px', borderTop: 'var(--hair)', flexShrink: 0, paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-sm"
              onClick={() => run(format, template)}
              disabled={busy}
              style={{ flex: 1, transition: 'transform 0.1s var(--ease-out)' }}
              onMouseDown={e => !busy && ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.96)')}
              onMouseUp={e => ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)')}
              title="Generate a new random design"
            >
              ↻ regenerate
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={handleShare}
              disabled={busy || !result || sharing}
              style={{ flex: 1.4, transition: 'transform 0.1s var(--ease-out)' }}
              onMouseDown={e => !busy && result && !sharing && ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.96)')}
              onMouseUp={e => ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)')}
            >
              {sharing ? 'opening share sheet…' : canShareFiles ? '↗ share' : '↓ download PNG'}
            </button>
          </div>
          {/* Download stays reachable as a fallback once share is the primary
              action, instead of disappearing behind it. */}
          {canShareFiles && (
            <button
              onClick={handleDownload}
              disabled={busy || !result}
              style={{
                display: 'block', width: '100%', marginTop: 8, padding: 4,
                fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)',
                background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center',
              }}
            >
              download PNG instead
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
