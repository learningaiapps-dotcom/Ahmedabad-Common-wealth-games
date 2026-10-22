import { useState } from 'react'
import { supabase } from './supabase.js'
import { HZ } from './data.js'

// Shrinks a photo so uploads are small and fast.
function shrink(file) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const k = Math.min(1, 1000 / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = img.width * k
      c.height = img.height * k
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      c.toBlob((b) => resolve(b), 'image/jpeg', 0.7)
    }
    img.src = URL.createObjectURL(file)
  })
}

export default function Form({ config, t, children }) {
  const { table, fields, photo } = config
  const start = {}
  fields.forEach((f) => {
    start[f.col] = f.type === 'select' ? (f.hazard ? Object.keys(HZ)[0] : f.options[0]) : f.def || ''
  })
  const [v, setV] = useState(start)
  const [file, setFile] = useState(null)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (col, val) => setV((p) => ({ ...p, [col]: val }))

  function geo(col) {
    navigator.geolocation?.getCurrentPosition((p) =>
      set(col, `${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)}`)
    )
  }

  async function submit(e) {
    e.preventDefault()
    if (!supabase) return setMsg(t('nodb'))
    setBusy(true)
    setMsg(t('saving'))
    const row = {}
    fields.forEach((f) => {
      const x = v[f.col]
      if (f.type === 'number') row[f.col] = x === '' ? null : parseInt(x, 10)
      else if (f.type === 'date' || f.type === 'time') row[f.col] = x || null
      else row[f.col] = String(x).trim()
    })
    if (photo && file) {
      const blob = await shrink(file)
      const path = `${crypto.randomUUID()}.jpg`
      const up = await supabase.storage.from('hazard-photos').upload(path, blob, { contentType: 'image/jpeg' })
      if (!up.error) row.photo_path = path
    }
    const { error } = await supabase.from(table).insert(row)
    setBusy(false)
    if (error) return setMsg(error.message)
    setMsg(t('saved'))
    setV(start)
    setFile(null)
  }

  return (
    <form onSubmit={submit}>
      {children}
      {fields.map((f) => (
        <div key={f.col}>
          <label>{t(f.k)}</label>
          {f.type === 'select' ? (
            <select value={v[f.col]} onChange={(e) => set(f.col, e.target.value)} style={{ width: '100%' }}>
              {(f.hazard ? Object.keys(HZ) : f.options).map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          ) : f.type === 'textarea' ? (
            <textarea rows="3" value={v[f.col]} onChange={(e) => set(f.col, e.target.value)} />
          ) : (
            <input
              type={f.type || 'text'}
              inputMode={f.mode}
              placeholder={f.ph}
              required={f.req}
              value={v[f.col]}
              onChange={(e) => set(f.col, e.target.value)}
            />
          )}
          {f.hazard && <div className="card" style={{ borderLeft: '5px solid var(--am)' }}><b>{t('tip')}:</b> {HZ[v[f.col]]}</div>}
          {f.geo && (
            <button type="button" className="btn sec" onClick={() => geo(f.col)}>
              {t('loc')}
            </button>
          )}
        </div>
      ))}
      {photo && (
        <div>
          <label>{t('ph')}</label>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
          {file && <img alt="" src={URL.createObjectURL(file)} style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 12, marginTop: 8 }} />}
        </div>
      )}
      <button className="btn" disabled={busy}>{t('send')}</button>
      <p className="ok">{msg}</p>
    </form>
  )
}
