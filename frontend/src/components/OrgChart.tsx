// The AquaTerra org chart: AquaTerra -> 8 departments -> sub-departments
// (where real data exists), all clickable. Lives on the About page.
// See sub_teams_hierarchy_2026_09_17.sql for the schema this reads.
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import teamService, { DepartmentTreeTeam } from '../services/teamService'
import { deptColorForTeamName, isDarkDepartmentFill } from '../lib/departments'
import './OrgChart.css'

export default function OrgChart() {
  const navigate = useNavigate()
  const [depts, setDepts] = useState<DepartmentTreeTeam[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false
    teamService.getDepartmentTree()
      .then(d => { if (!cancelled) setDepts(d) })
      .catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true }
  }, [])

  const toggle = (uuid: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(uuid)) next.delete(uuid)
      else next.add(uuid)
      return next
    })
  }

  // The flat "the departments" list right above this section already covers
  // the content, so a failed fetch here just quietly omits the chart instead
  // of showing an error box under a page that otherwise loaded fine.
  if (failed) return null

  if (!depts) {
    return (
      <div className="orgchart-skeleton" aria-hidden="true">
        {[1, 2, 3, 4].map(i => <div key={i} className="v6-skeleton" style={{ height: 72, marginBottom: 12 }} />)}
      </div>
    )
  }

  return (
    <div className="orgchart">
      <div className="orgchart-root-wrap">
        <span className="orgchart-root-pill">AquaTerra</span>
      </div>
      <div className="orgchart-row" role="list">
        {depts.map(d => {
          const color = deptColorForTeamName(d.name) || 'var(--teal)'
          const dark = isDarkDepartmentFill(color)
          const isOpen = expanded.has(d.uuid)
          const hasSubs = d.subTeams.length > 0
          return (
            <div className="orgchart-node" key={d.uuid} role="listitem" style={{ ['--dept' as any]: color }}>
              <button
                type="button"
                className={'orgchart-card' + (dark ? ' is-onink' : '')}
                onClick={() => navigate(`/teams/${d.uuid}`)}
              >
                <span className="orgchart-card-name">{d.name}</span>
                <span className="orgchart-card-meta">{d.memberCount} member{d.memberCount === 1 ? '' : 's'}</span>
              </button>

              {hasSubs && (
                <button
                  type="button"
                  className="orgchart-toggle"
                  aria-expanded={isOpen}
                  aria-label={(isOpen ? 'Hide ' : 'Show ') + d.name + `'s ${d.subTeams.length} sub-teams`}
                  onClick={() => toggle(d.uuid)}
                >
                  {d.subTeams.length} sub-team{d.subTeams.length === 1 ? '' : 's'} {isOpen ? '▲' : '▼'}
                </button>
              )}

              {hasSubs && isOpen && (
                <div className="orgchart-subrow">
                  {d.subTeams.map(st => (
                    // A real <a href>, not a button with an onClick handler.
                    // There are 25 live sub-teams and this was the ONLY route to
                    // any of them, so with a button they were reachable solely by
                    // running JS and clicking: no crawlable link anywhere on the
                    // site, no middle-click, no open-in-new-tab, nothing in the
                    // link graph. Audit 2026-09-17, SEO P2.
                    <Link
                      key={st.uuid}
                      className="orgchart-subnode"
                      to={`/teams/${d.uuid}/sub/${st.slug}`}
                    >
                      <span>{st.name}</span>
                      {st.memberCount > 0 && <span className="orgchart-subnode-count">{st.memberCount}</span>}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
