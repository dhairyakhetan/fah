import Img from '../components/Img'
import { useState, useEffect, useMemo } from 'react'
import directorService, { Director, CategoryAssignments } from '../services/directorService'
import { useAuth } from '../auth/AuthContext'
import {
  AdminLayout, AdminTabHeader, DataToolbar, EmptyLedger,
  AdminSkeleton, AdminErrorState,
} from './adminKit'
import { useConfirm } from '../components/Confirm'
import { useToast } from '../components/Toast'
import '../styles/routes/director-people.css'
import { isSuperAdmin as isSuperAdminRole } from '../lib/roles'

const CATEGORY_INFO: Record<string, { label: string }> = {
  events: { label: 'Events' },
  welfare: { label: 'Welfare' },
  content: { label: 'Content' },
  operations: { label: 'Operations' },
  labs: { label: 'Labs' },
}

// Correct, distinct per-category hue - the --c-* CSS custom properties
// (v6.css) are the current source of truth (recently fixed so labs/ops/
// content no longer collide); the old DEPT_COLORS hex map in lib/supabase.ts
// is a separate, since-drifted palette that doesn't match it category-for-
// category. Use the tokens directly instead of that stale map.
const DEPT_COLORS: Record<string, string> = {
  events: 'var(--c-events)',
  welfare: 'var(--c-welfare)',
  labs: 'var(--c-labs)',
  operations: 'var(--c-ops)',
  content: 'var(--c-content)',
}

const initials = (name: string) => (name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2)

const CategoryManagement = () => {
  const { member } = useAuth()
  const confirm = useConfirm()
  const toast = useToast()
  const isSuperAdmin = isSuperAdminRole(member?.role)

  const [directors, setDirectors] = useState<Director[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [assignments, setAssignments] = useState<CategoryAssignments>({})
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedDirector, setSelectedDirector] = useState<number | null>(null)
  // Per-assignment busy keys (`memberId:category`) - deliberately NOT one
  // desk-wide `isAssigning` flag, which used to freeze every other HoD's
  // chips while a single assignment was in flight.
  const [busy, setBusy] = useState<Set<string>>(new Set())
  const isBusy = (memberId: number, cat: string) => busy.has(`${memberId}:${cat}`)
  const setBusyKey = (key: string, on: boolean) => setBusy(prev => {
    const next = new Set(prev)
    if (on) next.add(key); else next.delete(key)
    return next
  })

  const fetchData = async () => {
    setLoadError(null)
    try {
      const [directorsRes, assignmentsRes] = await Promise.all([
        directorService.getAllDirectors(),
        directorService.getCategoryAssignments()
      ])
      if (directorsRes.success) setDirectors(directorsRes.data.directors)
      if (assignmentsRes.success) { setCategories(assignmentsRes.data.categories); setAssignments(assignmentsRes.data.assignments) }
    } catch (err: any) {
      const msg = err?.message || err?.error_description || JSON.stringify(err)
      setLoadError(msg)
      toast.error('categories didn’t load.', msg)
    }
    finally { setIsLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleAssign = async (memberId: number, category: string) => {
    const key = `${memberId}:${category}`
    setBusyKey(key, true)
    try {
      const result = await directorService.assignCategory(memberId, category)
      if (result.success) { toast.success(`Assigned ${CATEGORY_INFO[category]?.label || category}`); await fetchData() }
    } catch (e: any) {
      toast.error('couldn’t assign that category.', e?.message ?? 'try again.')
    }
    finally { setBusyKey(key, false); setSelectedDirector(null) }
  }

  const handleUnassign = async (memberId: number, category: string) => {
    // Hard removal of a moderation scope - always an explicit confirm.
    if (!(await confirm({ title: 'Remove assignment?', body: `Remove the ${CATEGORY_INFO[category]?.label || category} assignment from this HoD?`, confirmLabel: 'Remove', danger: true }))) return
    const key = `${memberId}:${category}`
    setBusyKey(key, true)
    try {
      const result = await directorService.unassignCategory(memberId, category)
      if (result.success) { toast.success(`Removed ${CATEGORY_INFO[category]?.label || category} assignment`); await fetchData() }
    } catch (e: any) {
      toast.error('couldn’t remove that assignment.', e?.message ?? 'try again.')
    }
    finally { setBusyKey(key, false) }
  }

  const visibleDirectors = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return directors
    return directors.filter(d =>
      d.fullName.toLowerCase().includes(term) ||
      d.email.toLowerCase().includes(term) ||
      d.categories.some(c => (CATEGORY_INFO[c]?.label || c).toLowerCase().includes(term)))
  }, [directors, search])

  return (
    <AdminLayout>
      <div style={{ paddingTop: 'clamp(8px,2vw,16px)', paddingBottom: 64, maxWidth: 860 }}>
        <AdminTabHeader
          label="Categories"
          title="Category management"
          subtitle={isSuperAdmin ? 'Assign HoDs to categories for post moderation.' : 'View category assignments (super admin only).'}
        />

        <DataToolbar search={search} onSearch={setSearch} searchPlaceholder="Search HoD, email or category…" />

        {isLoading ? (
          <AdminSkeleton rows={4} />
        ) : loadError ? (
          <AdminErrorState message={`Could not load category assignments - ${loadError}`} onRetry={() => { setIsLoading(true); fetchData() }} />
        ) : (
          <>
            {/* Directors list */}
            <div className="card" style={{ marginBottom: 16, padding: 0 }}>
              <div className="panel-h">
                <b>HoDs &amp; assignments</b>
                <span className="mono xs muted adm-nums">{visibleDirectors.length} {visibleDirectors.length === 1 ? 'HoD' : 'HoDs'}</span>
              </div>
              {visibleDirectors.length === 0 ? (
                <EmptyLedger
                  message={search ? 'nothing matches that search' : 'no HoDs found'}
                  sub={search ? 'Try a different name or category.' : 'Assignable HoDs will appear here.'}
                />
              ) : visibleDirectors.map(director => (
                <div key={director.memberId} className="cat-row">
                  <div className="cat-row-top">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div className="people-av" style={{ width: 36, height: 36, fontSize: 12, background: 'var(--accent)' }} aria-hidden>
                        {director.avatarUrl ? <Img ctx="avatar" src={director.avatarUrl} alt="" referrerPolicy="no-referrer" /> : initials(director.fullName)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 13, color: 'var(--ink)' }}>{director.fullName}</div>
                        <div className="mdir-line">{director.email}</div>
                      </div>
                    </div>
                    {isSuperAdmin && (
                      <button onClick={() => setSelectedDirector(selectedDirector === director.memberId ? null : director.memberId)}
                        className="btn btn-sm" style={{ fontSize: 11 }}
                        aria-expanded={selectedDirector === director.memberId}>
                        {selectedDirector === director.memberId ? 'Cancel' : '+ Assign'}
                      </button>
                    )}
                  </div>

                  {/* Current categories - CHROME sticker chips (colour swatch +
                      slight tilt); the HoD's name/email above stays flat. */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    {director.categories.length === 0 ? (
                      <span className="cat-none">No categories assigned</span>
                    ) : director.categories.map(cat => {
                      const rowBusy = isBusy(director.memberId, cat)
                      return (
                        <span key={cat} className="cat-sticker" style={{ ['--cc' as any]: DEPT_COLORS[cat] || 'var(--accent)' }} aria-busy={rowBusy || undefined}>
                          {CATEGORY_INFO[cat]?.label || cat}
                          {isSuperAdmin && (
                            <button
                              className="cat-sticker-x"
                              onClick={() => handleUnassign(director.memberId, cat)}
                              disabled={rowBusy}
                              aria-label={`Remove ${CATEGORY_INFO[cat]?.label || cat} assignment`}
                            >{rowBusy ? '…' : '✕'}</button>
                          )}
                        </span>
                      )
                    })}
                  </div>

                  {/* Assign tray */}
                  {selectedDirector === director.memberId && (
                    <div className="cat-tray">
                      <div className="cat-tray-label">Select category to assign</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {categories.filter(cat => !director.categories.includes(cat)).map(cat => {
                          const rowBusy = isBusy(director.memberId, cat)
                          return (
                            <button key={cat} onClick={() => handleAssign(director.memberId, cat)} disabled={rowBusy}
                              className="cat-pick"
                              style={{ ['--cc' as any]: DEPT_COLORS[cat] || 'var(--accent)' }}>
                              {/* The 9px swatch is the only thing that says a
                                  pick and the sticker it becomes are the same
                                  category. The label string is unchanged. */}
                              <span className="adm-swatch" style={{ ['--sw' as any]: DEPT_COLORS[cat] || 'var(--accent)' }} aria-hidden />
                              {rowBusy ? 'assigning…' : (CATEGORY_INFO[cat]?.label || cat)}
                            </button>
                          )
                        })}
                        {director.categories.length === categories.length && (
                          <span className="cat-none">All categories assigned</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Categories Overview */}
            <div className="card" style={{ padding: 0 }}>
              <div className="panel-h"><b>categories overview</b><span className="mono xs muted adm-nums">{categories.length} areas</span></div>
              <div className="adm-grid cat-grid" style={{ padding: '16px 18px' }}>
                {categories.map(cat => {
                  // A category with nobody assigned means posts in it have
                  // NOBODY to review them - the one fact this whole panel
                  // exists to surface, and source rendered it as quiet grey
                  // italic text indistinguishable from an empty slot. Derived
                  // from `assignments`, no new state and no new query.
                  const orphaned = !assignments[cat]?.length
                  return (
                  <div key={cat} className={'cat-card' + (orphaned ? ' is-orphaned' : '')} style={{ ['--cc' as any]: DEPT_COLORS[cat] || 'var(--accent)' }}>
                    <div className="cat-card-head">{CATEGORY_INFO[cat]?.label || cat}</div>
                    {orphaned ? (
                      <p className="cat-none" style={{ margin: 0 }}>No HoDs</p>
                    ) : assignments[cat]!.map(director => (
                      <div key={director.memberId} className="cat-hod">
                        <div className="people-av" style={{ width: 24, height: 24, fontSize: 9, background: DEPT_COLORS[cat] || 'var(--accent)' }} aria-hidden>
                          {director.avatarUrl ? <Img ctx="avatar" src={director.avatarUrl} alt="" referrerPolicy="no-referrer" /> : initials(director.fullName)}
                        </div>
                        <span className="cat-hod-name">{director.fullName}</span>
                      </div>
                    ))}
                  </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}

export default CategoryManagement
