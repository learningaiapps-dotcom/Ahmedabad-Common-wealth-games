import { useEffect, useState } from 'react'

// Ahmedabad only
const LAT = 23.0225
const LON = 72.5714
const BASE = 'https://api.open-meteo.com/v1/ecmwf'
const params = (vars) =>
  `${BASE}?latitude=${LAT}&longitude=${LON}&hourly=${vars}&timezone=Asia%2FKolkata&forecast_days=3&wind_speed_unit=kmh`

async function getWeather() {
  // ECMWF model. If the 100 m wind is not available, retry without it.
  let r = await fetch(params('temperature_2m,wind_speed_10m,wind_speed_100m,shortwave_radiation'))
  if (!r.ok) r = await fetch(params('temperature_2m,wind_speed_10m,shortwave_radiation'))
  if (!r.ok) throw new Error('Weather service not reachable')
  return r.json()
}

function Chart({ title, unit, times, values, color }) {
  const W = 340, H = 120, pad = 26
  const v = values.map((x) => (x == null ? 0 : x))
  const lo = Math.min(...v), hi = Math.max(...v)
  const span = hi - lo || 1
  const x = (i) => pad + (i / (v.length - 1)) * (W - pad - 6)
  const y = (val) => H - 22 - ((val - lo) / span) * (H - 40)
  const line = v.map((val, i) => `${x(i).toFixed(1)},${y(val).toFixed(1)}`).join(' ')
  const days = times.map((t, i) => [t, i]).filter(([t]) => t.endsWith('T00:00'))
  return (
    <div className="card">
      <b>{title}</b> <span className="mu">({unit})</span>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }} role="img" aria-label={title}>
        <polyline points={line} fill="none" stroke={color} strokeWidth="2" />
        <text x="2" y="14" fontSize="10" fill="currentColor">{hi.toFixed(0)}</text>
        <text x="2" y={H - 22} fontSize="10" fill="currentColor">{lo.toFixed(0)}</text>
        {days.map(([t, i]) => (
          <g key={t}>
            <line x1={x(i)} x2={x(i)} y1="10" y2={H - 20} stroke="currentColor" opacity=".25" />
            <text x={x(i) + 2} y={H - 6} fontSize="10" fill="currentColor">{t.slice(5, 10)}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}

export default function Weather({ t }) {
  const [d, setD] = useState(null)
  const [err, setErr] = useState('')
  useEffect(() => {
    getWeather().then(setD).catch((e) => setErr(e.message))
  }, [])

  if (err) return <p className="mu">{err}</p>
  if (!d) return <p>{t('loading')}</p>

  const h = d.hourly
  const times = h.time
  const now = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' }).slice(0, 16).replace(' ', 'T')
  let i = times.findIndex((x) => x >= now)
  if (i < 0) i = 0
  const w100 = h.wind_speed_100m
  const cur = (a) => (a ? a[i] : null)
  const day = (date) => {
    const idx = times.map((x, k) => (x.startsWith(date) ? k : -1)).filter((k) => k >= 0)
    const pick = (a) => idx.map((k) => a[k]).filter((z) => z != null)
    const max = (a) => (a ? Math.max(...pick(a)) : null)
    return { date, tmax: max(h.temperature_2m), tmin: Math.min(...pick(h.temperature_2m)), wmax: max(w100 || h.wind_speed_10m), smax: max(h.shortwave_radiation) }
  }
  const dates = [...new Set(times.map((x) => x.slice(0, 10)))]

  return (
    <div>
      <div className="tiles">
        <div className="card"><span className="mu">{t('wtemp')}</span><h3>{cur(h.temperature_2m)} °C</h3></div>
        <div className="card"><span className="mu">{t('wwind')} 10 m</span><h3>{cur(h.wind_speed_10m)} km/h</h3></div>
        {w100 && <div className="card"><span className="mu">{t('wwind')} 100 m</span><h3>{cur(w100)} km/h</h3></div>}
        <div className="card"><span className="mu">{t('wsolar')}</span><h3>{cur(h.shortwave_radiation)} W/m²</h3></div>
      </div>
      <h3>{t('wdays')}</h3>
      {dates.map((dt) => {
        const s = day(dt)
        return (
          <div className="card" key={dt}>
            <b>{dt}</b>
            <div className="mu">
              {t('wtemp')}: {s.tmin.toFixed(0)} to {s.tmax.toFixed(0)} °C · {t('wwind')} max: {s.wmax.toFixed(0)} km/h · {t('wsolar')} max: {s.smax.toFixed(0)} W/m²
            </div>
          </div>
        )
      })}
      <Chart title={t('wtemp')} unit="°C" times={times} values={h.temperature_2m} color="#dd6b20" />
      <Chart title={t('wsolar')} unit="W/m²" times={times} values={h.shortwave_radiation} color="#d69e2e" />
      <Chart title={t('wwind') + ' 10 m'} unit="km/h" times={times} values={h.wind_speed_10m} color="#3182ce" />
      {w100 && <Chart title={t('wwind') + ' 100 m'} unit="km/h" times={times} values={w100} color="#2f855a" />}
      <p className="mu">
        {t('wnote')} <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo.com</a> (CC BY 4.0)
      </p>
    </div>
  )
}
