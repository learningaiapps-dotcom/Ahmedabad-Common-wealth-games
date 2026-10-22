import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'

const TABLES = ['hazard_reports', 'parking_requests', 'parking_listings', 'food_vendors', 'volunteers', 'help_numbers']
const STATUS = ['new', 'approved', 'rejected', 'resolved']

export default function Admin({ t }) {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [tab, setTab] = useState(TABLES[0])
  const [rows, setRows] = useState([])
  const [load, setLoad] = useState(false)
  const [nn, setNn] = useState({ name: '', number: '', note: '' })

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
    setLoad(true)
    const { data } = await supabase.from(tab).select('*').order('created_at', { ascending: false })
    setRows(data || [])
    setLoad(false)
  }

  useEffect(() => {
    if (isAdmin) refresh()
  }, [isAdmin, tab])

  async function setStatus(id, status) {
    await supabase.from(tab).update({ status }).eq('id', id)
    refresh()
  }
  async function del(id) {
    if (!confirm('Delete?')) return
    await supabase.from(tab).delete().eq('id', id)
    refresh()
  }
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
      <div className="row">
        <h2 style={{ flex: 1 }}>{t('adminpage')}</h2>
        <button className="btn sec" onClick={() => supabase.auth.signOut().then(() => check(null))}>{t('logout')}</button>
      </div>
      <div className="tabs">
        {TABLES.map((x) => (
          <button key={x} className={'chip' + (x === tab ? ' on' : '')} onClick={() => setTab(x)}>{x.replace('_', ' ')}</button>
        ))}
      </div>
      {tab === 'help_numbers' && (
        <form onSubmit={addNumber} className="card">
          <b>{t('addn')}</b>
          <input required placeholder={t('lab')} value={nn.name} onChange={(e) => setNn({ ...nn, name: e.target.value })} />
          <input required inputMode="tel" placeholder={t('num')} value={nn.number} onChange={(e) => setNn({ ...nn, number: e.target.value })} />
          <input placeholder={t('note')} value={nn.note} onChange={(e) => setNn({ ...nn, note: e.target.value })} />
          <button className="btn">{t('addn')}</button>
        </form>
      )}
      <button className="btn sec" onClick={refresh}>{t('refresh')}</button>
      {load && <p>{t('loading')}</p>}
      {!load && !rows.length && <p className="mu">{t('empty')}</p>}
      {rows.map((r) => (
        <div className="card" key={r.id}>
          <div className="mu">{new Date(r.created_at).toLocaleString()} · {r.status}</div>
          {Object.entries(r)
            .filter(([k, x]) => x !== null && x !== '' && !['id', 'created_at', 'status', 'photo_path', 'active'].includes(k))
            .map(([k, x]) => (
              <div key={k}><b>{k.replace('_', ' ')}:</b> {String(x)}</div>
            ))}
          <div className="row" style={{ marginTop: 8 }}>
            {STATUS.map((s) => (
              <button key={s} className={'chip' + (r.status === s ? ' on' : '')} onClick={() => setStatus(r.id, s)}>{s}</button>
            ))}
            {r.photo_path && <button className="btn sec" onClick={() => photo(r.photo_path)}>{t('view_photo')}</button>}
            <button className="btn red" onClick={() => del(r.id)}>{t('del')}</button>
          </div>
        </div>
      ))}
    </div>
  )
}
