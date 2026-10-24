import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabase.js'
import { V } from './data.js'

const TABLES = ['daily', 'hazard_reports', 'events', 'parking_listings', 'parking_requests', 'food_vendors', 'volunteers', 'help_numbers']
const LABEL = { daily: 'Daily report', hazard_reports: 'Hazards', events: 'Events', parking_listings: 'Parking offered', parking_requests: 'Parking requests', food_vendors: 'Food vendors', volunteers: 'Volunteers', help_numbers: 'Help numbers' }
const STATUS = ['new', 'approved', 'rejected', 'resolved']
const SECTIONS = [['volunteers', 'Volunteers'], ['parking_listings', 'Parking spaces offered'], ['parking_requests', 'Visitor parking requests'], ['food_vendors', 'Food vendors'], ['hazard_reports', 'Hazard reports']]

// Short beep for new alerts
function beep() {
  try {
    const c = new (window.AudioContext || window.webkitAudioContext)()
    const o = c.createOscillator()
    o.frequency.value = 880
    o.connect(c.destination)
    o.start()
    setTimeout(() => { o.stop(); c.close() }, 600)
  } catch {}
}

const show = (r) =>
  Object.entries(r)
    .filter(([k, x]) => x !== null && x !== '' && !['id', 'created_at', 'status', 'photo_path', 'active'].includes(k))
    .map(([k, x]) => `${k.replace(/_/g, ' ')}: ${x}`)
    .join(' | ')

// ---------- Daily compiled report for the authority ----------
function Daily() {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  const [date, setDate] = useState(today)
  const [data, setData] = useState(null)
  const [msg, setMsg] = useState('')

  async function load() {
    const from = new Date(`${date}T00:00:00+05:30`)
    const to = new Date(from.getTime() + 864e5)
    const out = {}
    for (const [tb] of SECTIONS) {
      const { data: d } = await supabase.from(tb).select('*').gte('created_at', from.toISOString()).lt('created_at', to.toISOString()).order('created_at')
      out[tb] = d || []
    }
    setData(out)
  }
  useEffect(() => { load() }, [date])

  const summary = () =>
    `Ahmedabad Games Connect: daily report for ${date}\n` +
    SECTIONS.map(([tb, name]) => `${name}: ${data[tb].length}`).join('\n') +
    '\n\n' +
    SECTIONS.map(([tb, name]) => `== ${name} ==\n` + (data[tb].map((r, i) => `${i + 1}. ${show(r)}`).join('\n') || 'None')).join('\n\n')

  function csv() {
    const esc = (x) => `"${String(x ?? '').replace(/"/g, '""')}"`
    let out = ''
    SECTIONS.forEach(([tb, name]) => {
      const rows = data[tb]
      out += `${name} (${rows.length})\n`
      if (rows.length) {
        const cols = Object.keys(rows[0]).filter((c) => !['id', 'photo_path'].includes(c))
        out += cols.join(',') + '\n' + rows.map((r) => cols.map((c) => esc(r[c])).join(',')).join('\n') + '\n'
      }
      out += '\n'
    })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([out], { type: 'text/csv' }))
    a.download = `games-connect-${date}.csv`
    a.click()
  }

  async function copy() {
    await navigator.clipboard.writeText(summary())
    setMsg('Copied. Paste it into WhatsApp or email.')
  }

  return (
    <div>
      <div className="card noprint">
        <label>Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        {data && (
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn" onClick={csv}>Download CSV</button>
            <button className="btn sec" onClick={() => window.print()}>Print / Save PDF</button>
            <button className="btn sec" onClick={copy}>Copy summary</button>
            <a className="btn sec" href={`mailto:?subject=${encodeURIComponent('Games Connect daily report ' + date)}&body=${encodeURIComponent(summary().slice(0, 1800))}`}>Email</a>
          </div>
        )}
        <p className="ok">{msg}</p>
      </div>
      {data && (
        <div>
          <h3>Report for {date}</h3>
          <div className="tiles">
            {SECTIONS.map(([tb, name]) => (
              <div className="card" key={tb}><span className="mu">{name}</span><h3 style={{ margin: 0 }}>{data[tb].length}</h3></div>
            ))}
          </div>
          {SECTIONS.map(([tb, name]) => (
            <div key={tb}>
              <h3>{name}</h3>
              {!data[tb].length && <p className="mu">None</p>}
              {data[tb].map((r) => <div className="card" key={r.id}>{show(r)}</div>)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------- Add event form ----------
function EventForm({ done }) {
  const empty = { title: '', venue: V[0][0], event_date: '', gates_open: '', last_entry: '', start_time: '', ends: '', notes: '' }
  const [f, setF] = useState(empty)
  const [msg, setMsg] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  async function add(e) {
    e.preventDefault()
    const row = { ...f, event_date: f.event_date || null, status: 'approved' }
    const { error } = await supabase.from('events').insert(row)
    setMsg(error ? error.message : 'Event added. Visitors can see it now.')
    if (!error) { setF(empty); done() }
  }
  const inp = (k, label, type = 'text', ph) => (
    <div><label>{label}</label><input type={type} placeholder={ph} value={f[k]} onChange={set(k)} required={k === 'title'} /></div>
  )
  return (
    <form onSubmit={add} className="card">
      <b>Add an event</b>
      {inp('title', 'Event name')}
      <label>Venue</label>
      <select value={f.venue} onChange={set('venue')} style={{ width: '100%' }}>{V.map((v) => <option key={v[0]}>{v[0]}</option>)}</select>
      {inp('event_date', 'Date', 'date')}
      {inp('gates_open', 'Gates open', 'text', 'e.g. 14:00')}
      {inp('last_entry', 'Last entry', 'text', 'e.g. 17:00')}
      {inp('start_time', 'Starts', 'text', 'e.g. 18:00')}
      {inp('ends', 'Ends', 'text', 'e.g. 21:30')}
      {inp('notes', 'Notes for visitors (optional)')}
      <button className="btn">Add event</button>
      <p className="ok">{msg}</p>
    </form>
  )
}

export default function Admin({ t }) {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [tab, setTab] = useState('daily')
  const [rows, setRows] = useState([])
  const [load, setLoad] = useState(false)
  const [nn, setNn] = useState({ name: '', number: '', note: '' })
  const [alerts, setAlerts] = useState([])
  const tabRef = useRef(tab)
  tabRef.current = tab

  async function check(u) {
    setUser(u)
    if (!u) return setIsAdmin(false)
    const { data } = await supabase.from('admins').select('user_id').eq('user_id', u.id)
    setIsAdmin(!!(data && data.length))
  }
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getUser().then(({ data }) => check(data.user))
  }, [])

  async function login(e) {
    e.preventDefault()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pw })
    if (error) return setErr(error.message)
    setErr('')
    check(data.user)
  }

  async function refresh() {
    if (tabRef.current === 'daily') return
    setLoad(true)
    const order = tabRef.current === 'events' ? 'event_date' : 'created_at'
    const { data } = await supabase.from(tabRef.current).select('*').order(order, { ascending: tabRef.current === 'events' })
    setRows(data || [])
    setLoad(false)
  }
  useEffect(() => { if (isAdmin) refresh() }, [isAdmin, tab])

  // LIVE ALERTS: new hazard reports appear instantly while this page is open
  useEffect(() => {
    if (!isAdmin) return
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission()
    const ch = supabase
      .channel('hazards-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'hazard_reports' }, (p) => {
        setAlerts((a) => [p.new, ...a].slice(0, 5))
        beep()
        try {
          if (Notification.permission === 'granted') new Notification('New hazard: ' + p.new.category, { body: (p.new.location || '') + ' (' + (p.new.severity || '') + ')' })
        } catch {}
        if (tabRef.current === 'hazard_reports') refresh()
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [isAdmin])

  const setStatus = async (id, status) => { await supabase.from(tab).update({ status }).eq('id', id); refresh() }
  const del = async (id) => { if (confirm('Delete?')) { await supabase.from(tab).delete().eq('id', id); refresh() } }
  async function photo(path) {
    const { data } = await supabase.storage.from('hazard-photos').createSignedUrl(path, 300)
    if (data) window.open(data.signedUrl, '_blank')
  }
  async function addNumber(e) {
    e.preventDefault()
    await supabase.from('help_numbers').insert({ ...nn, status: 'approved', active: true })
    setNn({ name: '', number: '', note: '' })
    refresh()
  }

  if (!supabase) return <p>{t('nodb')}</p>
  if (!user || !isAdmin)
    return (
      <form onSubmit={login} className="card">
        <h3>{t('adminpage')}</h3>
        <label>{t('email')}</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <label>{t('password')}</label>
        <input type="password" required value={pw} onChange={(e) => setPw(e.target.value)} />
        <button className="btn">{t('login')}</button>
        <p className="mu">{user && !isAdmin ? t('notadmin') : err}</p>
      </form>
    )

  return (
    <div>
      <div className="row noprint">
        <h2 style={{ flex: 1 }}>{t('adminpage')}</h2>
        <button className="btn sec" onClick={() => supabase.auth.signOut().then(() => check(null))}>{t('logout')}</button>
      </div>
      {alerts.map((a) => (
        <div className="notice noprint" key={a.id} style={{ borderColor: 'var(--red)' }}>
          <b>🚨 New hazard: {a.category}</b> · {a.severity}<br />
          {a.location} {a.phone ? '· ' + a.phone : ''}
          <div><button className="btn sec" onClick={() => { setTab('hazard_reports'); setAlerts((x) => x.filter((y) => y.id !== a.id)) }}>Open</button></div>
        </div>
      ))}
      <div className="tabs noprint">
        {TABLES.map((x) => (
          <button key={x} className={'chip' + (x === tab ? ' on' : '')} onClick={() => setTab(x)}>{LABEL[x]}</button>
        ))}
      </div>

      {tab === 'daily' && <Daily />}
      {tab === 'events' && <EventForm done={refresh} />}
      {tab === 'help_numbers' && (
        <form onSubmit={addNumber} className="card">
          <b>{t('addn')}</b>
          <input required placeholder={t('lab')} value={nn.name} onChange={(e) => setNn({ ...nn, name: e.target.value })} />
          <input required inputMode="tel" placeholder={t('num')} value={nn.number} onChange={(e) => setNn({ ...nn, number: e.target.value })} />
          <input placeholder={t('note')} value={nn.note} onChange={(e) => setNn({ ...nn, note: e.target.value })} />
          <button className="btn">{t('addn')}</button>
        </form>
      )}

      {tab !== 'daily' && (
        <>
          <button className="btn sec" onClick={refresh}>{t('refresh')}</button>
          {load && <p>{t('loading')}</p>}
          {!load && !rows.length && <p className="mu">{t('empty')}</p>}
          {rows.map((r) => (
            <div className="card" key={r.id} style={r.severity && r.severity.startsWith('Urgent') && r.status === 'new' ? { borderColor: 'var(--red)', borderWidth: 2 } : null}>
              <div className="mu">{new Date(r.created_at).toLocaleString()} · {r.status}</div>
              {Object.entries(r)
                .filter(([k, x]) => x !== null && x !== '' && !['id', 'created_at', 'status', 'photo_path', 'active'].includes(k))
                .map(([k, x]) => <div key={k}><b>{k.replace(/_/g, ' ')}:</b> {String(x)}</div>)}
              <div className="row" style={{ marginTop: 8 }}>
                {STATUS.map((s) => (
                  <button key={s} className={'chip' + (r.status === s ? ' on' : '')} onClick={() => setStatus(r.id, s)}>{s}</button>
                ))}
                {r.photo_path && <button className="btn sec" onClick={() => photo(r.photo_path)}>{t('view_photo')}</button>}
                <button className="btn red" onClick={() => del(r.id)}>{t('del')}</button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
