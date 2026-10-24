import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'
import { V, E } from './data.js'

const gm = (la, lo) => `https://www.google.com/maps/dir/?api=1&destination=${la},${lo}`

// Events come from the database (uploaded by the authority in the Admin page).
// If none are uploaded yet, the built-in sample events are shown.
export default function Events({ t }) {
  const [rows, setRows] = useState(null)
  useEffect(() => {
    if (!supabase) return setRows([])
    supabase
      .from('events')
      .select('*')
      .eq('status', 'approved')
      .order('event_date', { ascending: true })
      .then(({ data }) => setRows(data || []))
  }, [])

  if (rows === null) return <p>{t('loading')}</p>

  const real = rows.length > 0
  const list = real
    ? rows.map((r) => ({
        title: r.title, venue: r.venue, date: r.event_date, notes: r.notes,
        times: [[t('gates'), r.gates_open], [t('lastentry'), r.last_entry], [t('starts'), r.start_time], [t('ends'), r.ends]].filter((x) => x[1]),
      }))
    : E.map((e) => ({ title: e[0], venue: V[e[2]][0], date: e[3], times: e[4].map((x) => [x[1], x[0]]) }))

  return (
    <div>
      {!real && <p className="mu">{t('sample')}</p>}
      {list.map((e, i) => {
        const v = V.find((x) => x[0] === e.venue)
        return (
          <div className="card" key={i}>
            <h3>{e.title}</h3>
            <div className="mu">{e.date ? (real ? new Date(e.date + 'T00:00').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }) : e.date) : ''} · {e.venue}</div>
            {e.times.map((r, k) => (
              <div className="tl" key={k}><b>{r[1]}</b><span>{r[0]}</span></div>
            ))}
            {e.notes && <p className="mu">{e.notes}</p>}
            {v && <a className="btn" target="_blank" rel="noopener noreferrer" href={gm(v[1], v[2])}>{t('dir')}</a>}
          </div>
        )
      })}
    </div>
  )
}
