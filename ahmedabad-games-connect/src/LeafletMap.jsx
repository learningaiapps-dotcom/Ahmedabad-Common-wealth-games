import { useEffect, useRef } from 'react'
import leaflet from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { V, S, P } from './data.js'

// Ahmedabad city centre
export const AHMEDABAD = [23.0225, 72.5714]

const COLORS = {
  venue: '#d7263d', place: '#2b6cb0', hotel: '#805ad5', toilet: '#dd6b20',
  water: '#0987a0', help: '#c53030', food: '#b7791f', charging: '#2f855a', atm: '#4a5568',
}
export const LAYERS = Object.keys(COLORS)

const dirLink = (la, lo) => `https://www.google.com/maps/dir/?api=1&destination=${la},${lo}`

// Builds the list of points for the layers that are switched on
function points(on) {
  const out = []
  if (on.includes('venue')) V.forEach((v) => out.push({ layer: 'venue', name: v[0], lat: v[1], lng: v[2] }))
  if (on.includes('place')) S.forEach((s) => out.push({ layer: 'place', name: s[0], lat: s[2], lng: s[3], color: s[1] === 'G' ? '#2f855a' : '#2b6cb0' }))
  P.forEach((p) => { if (on.includes(p[0])) out.push({ layer: p[0], name: p[1], lat: p[2], lng: p[3] }) })
  return out
}

export default function LeafletMap({ on, me }) {
  const box = useRef(null)
  const map = useRef(null)
  const group = useRef(null)
  const meMarker = useRef(null)

  // Create the map once (OpenStreetMap tiles)
  useEffect(() => {
    map.current = leaflet.map(box.current).setView(AHMEDABAD, 11)
    leaflet
      .tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      })
      .addTo(map.current)
    group.current = leaflet.layerGroup().addTo(map.current)
    return () => map.current.remove()
  }, [])

  // Redraw markers when the layer chips change
  useEffect(() => {
    group.current.clearLayers()
    points(on).forEach((p) => {
      leaflet
        .circleMarker([p.lat, p.lng], { radius: p.layer === 'venue' ? 10 : 7, color: '#fff', weight: 2, fillColor: p.color || COLORS[p.layer], fillOpacity: 0.95 })
        .bindPopup(`<b>${p.name}</b><br><a target="_blank" rel="noopener" href="${dirLink(p.lat, p.lng)}">Directions</a>`)
        .addTo(group.current)
    })
  }, [on])

  // Show "my location"
  useEffect(() => {
    if (!me) return
    meMarker.current?.remove()
    meMarker.current = leaflet.circleMarker(me, { radius: 9, color: '#fff', weight: 3, fillColor: '#0b5fff', fillOpacity: 1 }).addTo(map.current).bindPopup('You are here')
    map.current.setView(me, 14)
  }, [me])

  return <div ref={box} style={{ height: 440, borderRadius: 14, border: '1px solid var(--bd)', zIndex: 0 }} />
}
