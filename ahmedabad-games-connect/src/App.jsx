import { useEffect, useState } from 'react'
import L from './i18n.js'
import { V, S, P, E, H, C } from './data.js'
import { FORMS } from './forms.js'
import Form from './Form.jsx'
import Admin from './Admin.jsx'
import Weather from './Weather.jsx'
import LeafletMap, { LAYERS } from './LeafletMap.jsx'
import { supabase } from './supabase.js'

const gm = (la, lo) => `https://www.google.com/maps/dir/?api=1&destination=${la},${lo}`
const km = (a, b, c, d) => {
  const x = (c - a) * 111
  const y = (d - b) * 111 * Math.cos((a * Math.PI) / 180)
  return Math.sqrt(x * x + y * y)
}

function Photo({ icon, city }) {
  const g = city === 'G' ? '#2f855a,#9ae6b4' : '#2b6cb0,#90cdf4'
  return (
    <div className="ph" style={{ background: `linear-gradient(135deg,${g})` }}>
      <span>{icon}</span>
      <small>Photo</small>
    </div>
  )
}

function Btn({ href, children, sec, red }) {
  return (
    <a className={'btn' + (sec ? ' sec' : '') + (red ? ' red' : '')} target="_blank" rel="noopener noreferrer" href={href}>
      {children}
    </a>
  )
}

function HelpLines({ t }) {
  const [extra, setExtra] = useState([])
  useEffect(() => {
    if (!supabase) return
    supabase.from('help_numbers').select('*').eq('active', true).order('created_at').then(({ data }) => setExtra(data || []))
  }, [])
  return (
    <div>
      <h2>{t('hl')}</h2>
      {H.map((x) => (
        <div className="card row" key={x[1]}>
          <div style={{ flex: 1 }}><h3 style={{ margin: 0 }}>{x[0]}</h3><span className="mu">{x[1]}</span></div>
          <Btn href={'tel:' + x[1]} red={x[1] === '112'}>{t('call')} {x[1]}</Btn>
        </div>
      ))}
      <h3>{t('ln')}</h3>
      {!extra.length && <p className="mu">{t('lne')}</p>}
      {extra.map((x) => (
        <div className="card row" key={x.id}>
          <div style={{ flex: 1 }}><h3 style={{ margin: 0 }}>{x.name}</h3><span className="mu">{x.number}{x.note ? ' · ' + x.note : ''}</span></div>
          <Btn href={'tel:' + x.number.replace(/[^0-9+]/g, '')}>{t('call')}</Btn>
        </div>
      ))}
    </div>
  )
}

export default function App() {
  const [lang, setLang] = useState(() => { try { return localStorage.getItem('gc_lang') || 'en' } catch { return 'en' } })
  const [view, setView] = useState('home')
  const [filt, setFilt] = useState('toilet')
  const [city, setCity] = useState('all')
  const [vt, setVt] = useState('v')
  const [me, setMe] = useState(null)
  const [big, setBig] = useState(false)
  const [on, setOn] = useState(['venue', 'place', 'help'])
  const t = (k) => (L[lang] && L[lang][k]) || L.en[k] || k

  useEffect(() => { document.documentElement.lang = lang }, [lang])
  const go = (v) => { setView(v); window.scrollTo(0, 0) }
  const changeLang = (l) => { setLang(l); try { localStorage.setItem('gc_lang', l) } catch {} }
  const locate = () => navigator.geolocation?.getCurrentPosition((p) => setMe([p.coords.latitude, p.coords.longitude]))
  const Tile = ({ icon, k, to, wide }) => (
    <div className={'tile' + (wide ? ' wide' : '')} role="button" tabIndex="0" onClick={() => go(to)}><span>{icon}</span>{t(k)}</div>
  )

  let body
  if (view === 'home') {
    body = (
      <>
        <p className="mu">{t('sub')}</p>
        <div className="notice">{t('notice')}</div>
        <div className="tiles">
          <Tile icon="📍" k="near" to="near" /><Tile icon="🎟️" k="ev" to="ev" />
          <Tile icon="🏛️" k="see" to="see" /><Tile icon="🚇" k="how" to="how" />
          <Tile icon="🗺️" k="map" to="map" /><Tile icon="📞" k="hl" to="hl" />
          <Tile icon="🅿️" k="park" to="park" /><Tile icon="🙋" k="vol" to="vol" />
          <Tile icon="🍜" k="fv" to="fv" /><Tile icon="🚨" k="hz" to="hz" />
          <Tile icon="🌤️" k="wx" to="wx" wide />
        </div>
        <p><button className="btn sec" onClick={() => setBig(!big)}>{t('big')}</button></p>
      </>
    )
  } else if (view === 'near') {
    const o = me || [V[0][1], V[0][2]]
    const list = P.filter((p) => p[0] === filt).map((p) => [km(o[0], o[1], p[2], p[3]), p]).sort((a, b) => a[0] - b[0])
    body = (
      <>
        <h2>{t('near')}</h2>
        <button className="btn sec" onClick={locate}>{t('loc')}</button>
        <div className="chips">
          {['toilet', 'water', 'help', 'food', 'charging', 'atm', 'hotel'].map((k) => (
            <button key={k} className={'chip' + (k === filt ? ' on' : '')} onClick={() => setFilt(k)}>{t(k)}</button>
          ))}
        </div>
        <p className="mu">{t('nearest')}</p>
        {list.map(([d, p]) => (
          <div className="card" key={p[1]}>
            <h3>{p[1]}<span className="badge">{t('nv')}</span></h3>
            <div className="mu">~{d.toFixed(1)} km</div>
            <Btn href={gm(p[2], p[3])}>{t('dir')}</Btn>
          </div>
        ))}
      </>
    )
  } else if (view === 'ev') {
    body = (
      <>
        <h2>{t('ev')}</h2>
        <p className="mu">{t('sample')}</p>
        {E.map((e) => (
          <div className="card" key={e[0]}>
            <h3>{e[1]} {e[0]}</h3>
            <div className="mu">{e[3]} · {V[e[2]][0]}</div>
            <b>{t('day')}</b>
            {e[4].map((r) => <div className="tl" key={r[0]}><b>{r[0]}</b><span>{r[1]}</span></div>)}
            <Btn href={gm(V[e[2]][1], V[e[2]][2])}>{t('dir')}</Btn>
          </div>
        ))}
      </>
    )
  } else if (view === 'see') {
    body = (
      <>
        <h2>{t('see')}</h2>
        <div className="chips">
          {[['all', 'allc'], ['A', 'ahm'], ['G', 'gnr']].map(([c, k]) => (
            <button key={c} className={'chip' + (city === c ? ' on' : '')} onClick={() => setCity(c)}>{t(k)}</button>
          ))}
        </div>
        {S.filter((s) => city === 'all' || s[1] === city).map((s) => (
          <div className="card" key={s[0]}>
            <Photo icon={s[5]} city={s[1]} />
            <h3>{s[0]}<span className="badge" style={{ borderColor: 'var(--mu)', color: 'var(--mu)' }}>{t(s[1] === 'A' ? 'ahm' : 'gnr')}</span></h3>
            <p style={{ margin: '4px 0' }}>{s[6]}</p>
            <div className="mu">{t('hrs')}: {s[4]} · {s[7]}</div>
            <Btn href={gm(s[2], s[3])}>{t('dir')}</Btn>
          </div>
        ))}
      </>
    )
  } else if (view === 'how') {
    body = (
      <>
        <h2>{t('how')}</h2>
        <p className="mu">{t('sample')}</p>
        {V.map((v) => (
          <div className="card" key={v[0]}>
            <Photo icon={v[3]} />
            <h3>{v[0]}</h3>
            <p className="mu" style={{ margin: '2px 0' }}>{v[4]}</p>
            <pre>{v[5]}</pre>
            <Btn href={gm(v[1], v[2])}>{t('dir')}</Btn>
            <Btn sec href={'https://wa.me/?text=' + encodeURIComponent(v[0] + ' ' + gm(v[1], v[2]))}>WhatsApp</Btn>
          </div>
        ))}
      </>
    )
  } else if (view === 'map') {
    const toggle = (k) => setOn(on.includes(k) ? on.filter((x) => x !== k) : [...on, k])
    const names = { venue: t('venue'), place: t('see'), hotel: t('hotel'), toilet: t('toilet'), water: t('water'), help: t('help'), food: t('food'), charging: t('charging'), atm: t('atm') }
    body = (
      <>
        <h2>{t('map')}</h2>
        <p className="mu">{t('layers')}</p>
        <div className="chips">
          {LAYERS.map((k) => (
            <button key={k} className={'chip' + (on.includes(k) ? ' on' : '')} onClick={() => toggle(k)}>{k === 'venue' ? '📍 ' : ''}{k === 'place' ? t('see') : names[k]}</button>
          ))}
        </div>
        <button className="btn sec" onClick={locate}>{t('loc')}</button>
        <LeafletMap on={on} me={me} />
        <Btn href="https://www.openstreetmap.org/#map=11/23.0225/72.5714">OpenStreetMap</Btn>
      </>
    )
  } else if (view === 'wx') {
    body = (<><h2>{t('wx')}</h2><p className="mu">{t('wxt')}</p><Weather t={t} /></>)
  } else if (view === 'hl') {
    body = <HelpLines t={t} />
  } else if (view === 'park') {
    body = (
      <Form key="p" config={FORMS.parking} t={t}>
        <h2>{t('park')}</h2><p className="mu">{t('pn')}</p><h3>{t('preg')}</h3>
      </Form>
    )
  } else if (view === 'vol') {
    body = (
      <>
        <div className="chips">
          <button className={'chip' + (vt === 'v' ? ' on' : '')} onClick={() => setVt('v')}>{t('vol')}</button>
          <button className={'chip' + (vt === 'r' ? ' on' : '')} onClick={() => setVt('r')}>{t('rent')}</button>
        </div>
        {vt === 'v' ? (
          <Form key="v" config={FORMS.volunteer} t={t}>
            <h2>{t('vol')}</h2><p className="mu">{t('vn')}</p>
            <div className="steps"><div className="a">1 {t('s1')}</div><div>2 {t('s2')}</div><div>3 {t('s3')}</div><div>4 {t('s4')}</div></div>
          </Form>
        ) : (
          <Form key="r" config={FORMS.rent} t={t}>
            <h2>{t('rent')}</h2><p className="mu">{t('rt')}</p><div className="notice">{t('ph2')}</div>
          </Form>
        )}
      </>
    )
  } else if (view === 'fv') {
    body = (
      <Form key="f" config={FORMS.food} t={t}>
        <h2>{t('fv')}</h2><p className="mu">{t('fvt')}</p><div className="notice">{t('fvn')}</div>
      </Form>
    )
  } else if (view === 'hz') {
    body = (
      <Form key="h" config={FORMS.hazard} t={t}>
        <h2>{t('hz')}</h2><p className="mu">{t('hzt')}</p>
        <div className="notice" style={{ borderColor: 'var(--red)' }}>
          <b>{t('hz1')}</b><br />
          <Btn href="tel:112" red>112</Btn><Btn href="tel:101">Fire 101</Btn><Btn href="tel:108">108</Btn><Btn href="tel:100">100</Btn>
        </div>
      </Form>
    )
  } else if (view === 'admin') {
    body = <div className="adm"><Admin t={t} /></div>
  }

  return (
    <div className={big ? 'big' : ''}>
      <header>
        <h1>{t('t')}</h1>
        <select value={lang} onChange={(e) => changeLang(e.target.value)} aria-label="Language">
          <option value="en">English</option><option value="hi">हिन्दी</option><option value="gu">ગુજરાતી</option>
        </select>
        <button className="sos" onClick={() => go('hl')}>{t('sos')}</button>
      </header>
      <main>
        {view !== 'home' && <button className="back" onClick={() => go('home')}>{t('back')}</button>}
        {body}
        <p className="demo">{t('demo')}</p>
        {view === 'home' && <p className="demo"><a href="#admin" onClick={(e) => { e.preventDefault(); go('admin') }}>{t('adminpage')}</a></p>}
      </main>
    </div>
  )
}
