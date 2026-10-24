import { useEffect, useState } from 'react'

// Ahmedabad only. Free ECMWF forecast from Open-Meteo (no key needed).
const LAT = 23.0225
const LON = 72.5714
const url = (vars) =>
  `https://api.open-meteo.com/v1/ecmwf?latitude=${LAT}&longitude=${LON}&hourly=${vars}&timezone=Asia%2FKolkata&forecast_days=3&wind_speed_unit=kmh`

async function load() {
  let r = await fetch(url('temperature_2m,wind_speed_10m,relative_humidity_2m,precipitation'))
  if (!r.ok) r = await fetch(url('temperature_2m,wind_speed_10m'))
  if (!r.ok) throw new Error('Weather service not reachable')
  return r.json()
}

// Plain-words helpers
const tempWord = (c) => (c < 20 ? 'wcool' : c < 28 ? 'wpleasant' : c < 34 ? 'wwarm' : c < 39 ? 'whot' : 'wvhot')
const windWord = (k) => (k < 6 ? 'wcalm' : k < 20 ? 'wlight' : k < 29 ? 'wbreezy' : k < 39 ? 'wwindy' : 'wvwindy')
const icon = (c, rain) => (rain ? '🌧️' : c < 20 ? '🧥' : c < 28 ? '🌤️' : c < 34 ? '☀️' : '🔥')
const SLOTS = [['wmorn', 6, 11], ['waft', 12, 16], ['weve', 17, 20], ['wnight', 21, 23]]
const avg = (a) => a.reduce((s, x) => s + x, 0) / (a.length || 1)

export default function Weather({ t }) {
  const [d, setD] = useState(null)
  const [err, setErr] = useState('')
  useEffect(() => { load().then(setD).catch((e) => setErr(e.message)) }, [])
  if (err) return <p className="mu">{err}</p>
  if (!d) return <p>{t('loading')}</p>

  const h = d.hourly
  const times = h.time
  const now = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' }).slice(0, 16).replace(' ', 'T')
  let i = times.findIndex((x) => x >= now)
  if (i < 0) i = 0
  const temp = Math.round(h.temperature_2m[i])
  const wind = Math.round(h.wind_speed_10m[i])
  const hum = h.relative_humidity_2m ? Math.round(h.relative_humidity_2m[i]) : null
  const rainNext = h.precipitation ? h.precipitation.slice(i, i + 6).reduce((s, x) => s + (x || 0), 0) : 0
  const rain = rainNext > 0.2

  const tips = []
  if (temp >= 34) tips.push(t('wtip_hot'))
  if (rain) tips.push(t('wtip_rain'))
  if (wind >= 29) tips.push(t('wtip_wind'))
  if (!tips.length) tips.push(t('wtip_ok'))

  const dates = [...new Set(times.map((x) => x.slice(0, 10)))]
  const slotData = (date, a, b) => {
    const idx = times.map((x, k) => [x, k]).filter(([x]) => x.startsWith(date) && +x.slice(11, 13) >= a && +x.slice(11, 13) <= b).map(([, k]) => k)
    if (!idx.length) return null
    const tm = idx.map((k) => h.temperature_2m[k])
    const wd = idx.map((k) => h.wind_speed_10m[k])
    const rn = h.precipitation ? idx.reduce((s, k) => s + (h.precipitation[k] || 0), 0) : 0
    return { tmin: Math.round(Math.min(...tm)), tmax: Math.round(Math.max(...tm)), wind: Math.round(avg(wd)), rain: rn > 0.2 }
  }

  return (
    <div>
      <div className="wnow">
        <div className="wbig">{icon(temp, rain)}</div>
        <div>
          <div className="wtemp">{temp}°C</div>
          <div>{t(tempWord(temp))} · {t('wnow')}</div>
        </div>
      </div>
      <div className="wrow">
        <div className="wchip">💨 {t(windWord(wind))}<small>{wind} km/h</small></div>
        <div className="wchip">{rain ? '🌧️ ' + t('wrain') : '🌂 ' + t('wdry')}</div>
        {hum != null && <div className="wchip">💧 {t('whum')}<small>{hum}%</small></div>}
      </div>
      <div className="notice"><b>{t('wtips')}</b>{tips.map((x, k) => <div key={k}>• {x}</div>)}</div>
      {dates.map((date) => (
        <div className="card" key={date}>
          <b>{new Date(date + 'T00:00').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}</b>
          <div className="slots">
            {SLOTS.map(([k, a, b]) => {
              const s = slotData(date, a, b)
              if (!s) return null
              return (
                <div className="slot" key={k}>
                  <small>{t(k)}</small>
                  <div className="ic">{icon(s.tmax, s.rain)}</div>
                  <b>{s.tmin === s.tmax ? s.tmax : s.tmin + '–' + s.tmax}°</b>
                  <small>{t(windWord(s.wind))}</small>
                  {s.rain && <small>🌧️</small>}
                </div>
              )
            })}
          </div>
        </div>
      ))}
      <p className="mu">
        {t('wnote')} <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo.com</a> (CC BY 4.0)
      </p>
    </div>
  )
}
