import { V } from './data.js'

const venues = V.map((v) => v[0])

// Each form: which database table it saves to, and its fields.
// col = column name in Supabase, k = text key in i18n.js
export const FORMS = {
  food: {
    table: 'food_vendors',
    fields: [
      { col: 'name', k: 'name', req: true },
      { col: 'phone', k: 'phone', req: true, mode: 'tel' },
      { col: 'stall_name', k: 'stall', req: true },
      { col: 'food_type', k: 'ftype', type: 'select', options: ['Snacks', 'Full meals', 'Tea / Coffee', 'Sweets', 'Juice / Cold drinks', 'Other'] },
      { col: 'veg_type', k: 'veg', type: 'select', options: ['Veg', 'Non-veg', 'Both'] },
      { col: 'cart_type', k: 'cart', type: 'select', options: ['Hand cart', 'Stall', 'Vehicle / food truck'] },
      { col: 'area', k: 'area', type: 'select', options: venues },
      { col: 'timings', k: 'tim' },
      { col: 'menu', k: 'menu', type: 'textarea' },
      { col: 'fssai_no', k: 'lic' },
      { col: 'vending_cert_no', k: 'vid' },
    ],
  },
  parking: {
    table: 'parking_requests',
    fields: [
      { col: 'name', k: 'name', req: true },
      { col: 'phone', k: 'phone', req: true, mode: 'tel' },
      { col: 'vehicle_no', k: 'vno', req: true, ph: 'GJ 01 AB 1234' },
      { col: 'vehicle_type', k: 'vtype', type: 'select', options: ['Car', 'SUV', 'Two-wheeler', 'Tempo traveller', 'Bus'] },
      { col: 'members', k: 'mem', type: 'number', def: '4' },
      { col: 'venue', k: 'venue', type: 'select', options: venues },
      { col: 'park_date', k: 'date', type: 'date' },
      { col: 'arrival_time', k: 'arr', type: 'time' },
      { col: 'hours', k: 'dur', type: 'number', def: '4' },
      { col: 'accessible', k: 'acc', type: 'select', options: ['No', 'Yes'] },
    ],
  },
  rent: {
    table: 'parking_listings',
    fields: [
      { col: 'name', k: 'name', req: true },
      { col: 'phone', k: 'phone', req: true, mode: 'tel' },
      { col: 'address', k: 'addr', req: true },
      { col: 'landmark', k: 'land' },
      { col: 'floor_level', k: 'flr', type: 'select', options: ['Open ground / street level', 'Ground floor', 'Basement 1', 'Basement 2', 'Upper floor', 'Terrace'] },
      { col: 'location_pin', k: 'pin', geo: true, ph: 'lat, lng' },
      { col: 'nearest_venue', k: 'nv', type: 'select', options: venues },
      { col: 'vehicle_type', k: 'vtype', type: 'select', options: ['Car', 'SUV', 'Two-wheeler', 'Car and two-wheeler'] },
      { col: 'spaces', k: 'nsp', type: 'number', def: '1' },
      { col: 'space_size', k: 'size' },
      { col: 'rate', k: 'rate' },
      { col: 'availability', k: 'avail' },
      { col: 'owner_type', k: 'own', type: 'select', options: ['Owner', 'Tenant with permission', 'Apartment association'] },
    ],
  },
  volunteer: {
    table: 'volunteers',
    fields: [
      { col: 'name', k: 'name', req: true },
      { col: 'phone', k: 'phone', req: true, mode: 'tel' },
      { col: 'skills', k: 'skills' },
      { col: 'availability', k: 'avail' },
    ],
  },
  hazard: {
    table: 'hazard_reports',
    photo: true,
    fields: [
      { col: 'category', k: 'cat', type: 'select', hazard: true },
      { col: 'severity', k: 'sev', type: 'select', options: ['Urgent, danger now', 'High', 'Medium', 'Low'] },
      { col: 'location', k: 'where', req: true, geo: true, ph: 'Place or landmark' },
      { col: 'description', k: 'desc', type: 'textarea' },
      { col: 'vehicle_no', k: 'vehno' },
      { col: 'phone', k: 'phone', mode: 'tel' },
    ],
  },
}
