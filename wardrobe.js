/* ===== StyleSavvy — Page 3: Wardrobe Dashboard (closet CRUD + AI curated look) ===== */

/* --- local data helpers (each page keeps its own copy so it stands alone) ---
   All StyleSavvy data lives in localStorage as JSON under "ss.*" keys:
   ss.users, ss.session, ss.profile, ss.closet, ss.todayLook, ss.looks, ss.chat, ss.feedback, ss.refinements */
const store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : fallback
    } catch {
      return fallback
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value))
  },
  remove(key) {
    localStorage.removeItem(key)
  },
}

/* write data to a real .json file (browser download) */
function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/* read a user-picked .json file back into an object */
function readJSONFile(file) {
  return file.text().then((text) => JSON.parse(text))
}

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

/* toast notification with optional action button */
const toastEl = Object.assign(document.createElement('div'), { className: 'toast' })
toastEl.setAttribute('role', 'status')
toastEl.setAttribute('aria-live', 'polite')
toastEl.innerHTML = '<span></span><button type="button"></button>'
document.body.append(toastEl)
let toastTimer
function toast(message, action) {
  toastEl.querySelector('span').textContent = message
  const btn = toastEl.querySelector('button')
  btn.textContent = action ? action.label : ''
  btn.onclick = action
    ? () => {
        action.run()
        toastEl.classList.remove('show')
      }
    : null
  toastEl.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), action ? 5000 : 2800)
}

/* form validation: rules = { fieldName: (form) => 'error message' | '' } */
function showError(form, name, msg) {
  const out = form.querySelector(`[data-err="${name}"]`)
  if (out) {
    out.textContent = msg
    out.closest('.f-row')?.classList.toggle('invalid', !!msg)
  }
  const el = form.elements[name]
  const list = el && typeof el.length === 'number' && !el.tagName ? [...el] : [el]
  list.forEach((i) => i && i.setAttribute('aria-invalid', msg ? 'true' : 'false'))
}
function validate(form, rules) {
  let first = null
  for (const [name, rule] of Object.entries(rules)) {
    const msg = rule(form)
    showError(form, name, msg)
    if (msg && !first) first = name
  }
  if (first) {
    const el = form.elements[first]
    ;(el && !el.tagName ? el[0] : el)?.focus()
  }
  return !first
}
/* re-check a field when it loses focus, and live while typing once it has been touched */
function liveValidate(form, rules) {
  const touched = new Set()
  const check = (e) => {
    const n = e.target.name
    if (!rules[n]) return
    if (e.type !== 'input') touched.add(n)
    if (touched.has(n)) showError(form, n, rules[n](form))
  }
  form.addEventListener('focusout', check)
  form.addEventListener('input', check)
  form.addEventListener('change', check)
}
const val = (form, name) => (form.elements[name]?.value ?? '').trim()

/* "Export JSON" / "Import JSON" controls in the data bar */
function wireDataBar({ filename, exportData, importData, count }) {
  const countEl = document.getElementById('data-count')
  const refresh = () => countEl && (countEl.textContent = count())
  document.getElementById('export-json')?.addEventListener('click', () => {
    downloadJSON(filename, { app: 'StyleSavvy', exportedAt: new Date().toISOString(), ...exportData() })
    toast(`Saved ${filename}`)
  })
  document.getElementById('import-json')?.addEventListener('change', async (e) => {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    try {
      importData(await readJSONFile(file))
      refresh()
      toast(`Imported ${file.name}`)
    } catch (err) {
      toast(`Import failed: ${err.message}`)
    }
  })
  refresh()
  return refresh
}

/* ---------- garments ---------- */
const SHAPE_PATHS = {
  top: 'M20 32 L34 22 L44 26 L56 26 L66 22 L80 32 L74 44 L26 44 Z',
  coat: 'M34 20 L66 20 L66 64 L58 58 L50 66 L42 58 L34 64 Z',
  trousers: 'M38 20 L62 20 L60 62 L52 62 L50 34 L48 62 L40 62 Z',
  dress: 'M40 20 L60 20 L72 68 L28 68 Z',
  blazer: 'M30 22 L50 30 L70 22 L70 60 L30 60 Z',
  skirt: 'M36 26 L64 26 L72 62 L28 62 Z',
  shoe: 'M22 50 L44 50 L54 38 L62 38 L78 52 L78 60 L22 60 Z',
}
const KIND_LABELS = { top: 'Top', coat: 'Coat', trousers: 'Trousers', dress: 'Dress', blazer: 'Blazer', skirt: 'Skirt', shoe: 'Shoe' }
const CAT_DEFAULT_KIND = { Tops: 'top', Bottoms: 'trousers', Dresses: 'dress', Outerwear: 'coat', Formal: 'blazer', Footwear: 'shoe' }
const PALETTE = ['#e9e0cf', '#c9a96e', '#8a6b3f', '#292524', '#3a3532', '#1f3a5f', '#e0c3ae', '#7b8a6a', '#a63d2f']

/* soft background tint behind a garment colour */
function tint(hex) {
  const n = parseInt(hex.slice(1), 16)
  const mix = (c, b) => Math.round(c * 0.18 + b * 0.82)
  const [r, g, b] = [mix(n >> 16, 0xf7), mix((n >> 8) & 255, 0xf5), mix(n & 255, 0xf2)]
  return `rgb(${r},${g},${b})`
}
const garment = (kind, color, bg = tint(color)) =>
  `<div class="garment g" style="background:${bg}"><svg viewBox="0 0 100 88" fill="${color}"><path d="${SHAPE_PATHS[kind] || SHAPE_PATHS.top}"/></svg></div>`

/* ---------- closet data (seeded on first visit) ---------- */
const FILTERS = ['All', 'Favourites', 'Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Formal', 'Footwear']
const SEED = [
  { cat: 'Tops', name: 'Silk Blouse — Ivory', kind: 'top', color: '#e9e0cf', worn: true },
  { cat: 'Outerwear', name: 'Wool Overcoat — Black', kind: 'coat', color: '#292524' },
  { cat: 'Bottoms', name: 'Tailored Trousers — Stone', kind: 'trousers', color: '#3a3532' },
  { cat: 'Dresses', name: 'Wrap Dress — Camel', kind: 'dress', color: '#c9a96e' },
  { cat: 'Outerwear', name: 'Suede Blazer — Tan', kind: 'blazer', color: '#8a6b3f' },
  { cat: 'Bottoms', name: 'Slim Jeans — Indigo', kind: 'trousers', color: '#1f3a5f' },
  { cat: 'Bottoms', name: 'Midi Skirt — Blush', kind: 'skirt', color: '#e0c3ae' },
  { cat: 'Tops', name: 'Linen Shirt — Ecru', kind: 'top', color: '#eae2d4' },
  { cat: 'Footwear', name: 'Leather Mules — Tan', kind: 'shoe', color: '#8a6b3f' },
  { cat: 'Tops', name: 'Golden Wrap Blouse', kind: 'top', color: '#c9a96e' },
].map((it, i) => ({ id: 'seed' + i, worn: false, fav: false, notes: '', addedAt: '2026-01-01T00:00:00.000Z', ...it }))

let closet = store.get('ss.closet', null)
if (!Array.isArray(closet)) {
  closet = SEED
  store.set('ss.closet', closet)
}
const saveCloset = () => {
  store.set('ss.closet', closet)
  refreshCount()
}

const state = { filter: 'All', query: '' }
const profile = store.get('ss.profile', null)
const session = store.get('ss.session', null)

/* ---------- header + sidebar personalisation ---------- */
const avatarEl = document.getElementById('user-avatar')
if (session) {
  avatarEl.textContent = session.name[0].toUpperCase()
  avatarEl.href = 'index.html#account'
  avatarEl.title = `${session.name} — account`
}
document.getElementById('today').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
if (profile) {
  document.getElementById('city').textContent = profile.city
  document.getElementById('style-tag').textContent = `STYLE: ${profile.archetype.toUpperCase()}`
  document.getElementById('look-match').textContent = `● Matches ${profile.compatibility}% twin`
  document.getElementById('twin-title').textContent = `${profile.styleTwin}'s Look This Week`
}

/* ---------- today's recommended look ---------- */
const byId = (id) => closet.find((c) => c.id === id)
const pick = (list, avoid) => {
  const pool = list.filter((x) => x.id !== avoid)
  return (pool.length ? pool : list)[Math.floor(Math.random() * (pool.length || list.length))]
}
function generateLook(prev = {}) {
  const tops = closet.filter((c) => ['Tops', 'Outerwear', 'Formal'].includes(c.cat))
  const bottoms = closet.filter((c) => ['Bottoms', 'Dresses'].includes(c.cat))
  const extras = closet.filter((c) => ['Footwear', 'Outerwear'].includes(c.cat))
  const top = tops.length ? pick(tops, prev.top) : null
  const bottom = bottoms.length ? pick(bottoms, prev.bottom) : null
  const extra = extras.length ? pick(extras.filter((x) => x.id !== top?.id), prev.extra) : null
  return { top: top?.id, bottom: bottom?.id, extra: extra?.id, generatedAt: new Date().toISOString() }
}
let look = store.get('ss.todayLook', null)
if (!look || ![look.top, look.bottom, look.extra].some(byId)) look = generateLook()
store.set('ss.todayLook', look)

function renderLook() {
  const top = byId(look.top)
  const bottom = byId(look.bottom)
  const extra = byId(look.extra)
  document.getElementById('look-hero').innerHTML = top
    ? garment(top.kind, top.color, '#fff') +
      '<button type="button" class="star" title="Today\'s pick">★</button>' +
      `<div class="look-meta"><small>${esc(top.cat)}</small><span style="font-size:14px">${esc(top.name)}</span></div>`
    : '<div class="look-meta"><small>Add a top to get a recommendation</small></div>'
  document.getElementById('look-pair').innerHTML = [bottom, extra]
    .filter(Boolean)
    .map(
      (it) =>
        `<div class="item">${garment(it.kind, it.color)}<div class="t"><small>${esc(it.cat)}</small><span style="font-size:12px">${esc(it.name)}</span></div></div>`
    )
    .join('')
}

document.getElementById('regenerate').addEventListener('click', (e) => {
  const card = e.currentTarget.closest('.mini')
  card.classList.add('regen')
  setTimeout(() => {
    look = generateLook(look)
    store.set('ss.todayLook', look)
    renderLook()
    card.classList.remove('regen')
  }, 250)
})

/* ---------- filters + search ---------- */
const filtersEl = document.getElementById('filters')
function renderFilters() {
  filtersEl.innerHTML = FILTERS.map(
    (f) => `<button type="button" class="pill ${state.filter === f ? 'on' : ''}" data-filter="${f}">${f === 'Favourites' ? '♥ ' : ''}${f}</button>`
  ).join('')
}
filtersEl.addEventListener('click', (e) => {
  const b = e.target.closest('[data-filter]')
  if (!b) return
  state.filter = b.dataset.filter
  renderFilters()
  renderGrid()
})
document.getElementById('search').addEventListener('input', (e) => {
  state.query = e.target.value.trim().toLowerCase()
  renderGrid()
})

/* ---------- closet grid ---------- */
const gridEl = document.getElementById('grid')
const emptyEl = document.getElementById('empty')
function visibleItems() {
  return closet.filter((c) => {
    const inFilter = state.filter === 'All' || (state.filter === 'Favourites' ? c.fav : c.cat === state.filter)
    const inQuery = !state.query || `${c.name} ${c.cat} ${c.notes}`.toLowerCase().includes(state.query)
    return inFilter && inQuery
  })
}
function renderGrid() {
  const items = visibleItems()
  document.getElementById('count').textContent = `${items.length} of ${closet.length} pieces`
  gridEl.innerHTML = items
    .map(
      (it) => `<div class="piece" tabindex="0" data-id="${it.id}" aria-label="Edit ${esc(it.name)}">
        <div class="g">
          ${garment(it.kind, it.color)}
          ${it.worn ? '<span class="worn">WORN TODAY</span>' : ''}
          <span class="edit">EDIT</span>
          <button type="button" class="fav ${it.fav ? 'on' : ''}" data-fav="${it.id}" aria-label="${it.fav ? 'Remove from' : 'Add to'} favourites">${it.fav ? '♥' : '♡'}</button>
        </div>
        <div class="t"><small>${esc(it.cat)}</small><span class="nm" title="${esc(it.notes)}">${esc(it.name)}</span></div>
      </div>`
    )
    .join('')
  emptyEl.hidden = items.length > 0
  emptyEl.innerHTML = state.query
    ? `<b>No matches for “${esc(state.query)}”.</b>Try another search or clear the filter.`
    : state.filter === 'Favourites'
      ? '<b>No favourites yet.</b>Tap the heart on any piece to save it here.'
      : `<b>Nothing in ${esc(state.filter)} yet.</b>Use “+ Add Item” to start building this section.`
}
gridEl.addEventListener('click', (e) => {
  const fav = e.target.closest('[data-fav]')
  if (fav) {
    const it = byId(fav.dataset.fav)
    it.fav = !it.fav
    saveCloset()
    renderGrid()
    toast(it.fav ? 'Added to favourites' : 'Removed from favourites')
    return
  }
  const piece = e.target.closest('[data-id]')
  if (piece) openItem(byId(piece.dataset.id))
})
gridEl.addEventListener('keydown', (e) => {
  const piece = e.target.closest('[data-id]')
  if (piece && e.target === piece && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault()
    openItem(byId(piece.dataset.id))
  }
})

/* ---------- add / edit item form ---------- */
const modal = document.getElementById('item-modal')
const form = document.getElementById('item-form')
let editingId = null

document.getElementById('kinds').innerHTML = Object.entries(KIND_LABELS)
  .map(
    ([k, label]) =>
      `<label><input type="radio" name="kind" value="${k}" /><svg viewBox="0 0 100 88"><path d="${SHAPE_PATHS[k]}"/></svg>${label}</label>`
  )
  .join('')
document.getElementById('colors').innerHTML =
  PALETTE.map((c) => `<label style="background:${c}"><input type="radio" name="color" value="${c}" aria-label="Colour ${c}" /></label>`).join('') +
  '<label class="custom" style="box-shadow:none;width:auto;height:auto"><input type="color" name="customColor" value="#c9a96e" style="position:static;opacity:1;pointer-events:auto" aria-label="Custom colour" /> Custom</label>'

const formColor = () => form.querySelector('input[name=color]:checked')?.value || ''
const formKind = () => form.querySelector('input[name=kind]:checked')?.value || ''

const itemRules = {
  name: (f) => {
    const v = val(f, 'name')
    if (!v) return 'Give this piece a name.'
    if (v.length < 2) return 'Name must be at least 2 characters.'
    if (closet.some((c) => c.id !== editingId && c.name.toLowerCase() === v.toLowerCase())) return 'You already have a piece with this name.'
    return ''
  },
  cat: (f) => (!val(f, 'cat') ? 'Choose a category.' : ''),
  kind: () => (!formKind() ? 'Pick the silhouette that fits best.' : ''),
  color: () => (!formColor() ? 'Choose a colour.' : ''),
  notes: (f) => (val(f, 'notes').length > 120 ? 'Keep notes under 120 characters.' : ''),
}
liveValidate(form, itemRules)

function renderPreview() {
  document.getElementById('item-preview').innerHTML = garment(formKind() || 'top', formColor() || '#d6d3d1')
}

function openItem(item) {
  editingId = item?.id ?? null
  form.reset()
  Object.keys(itemRules).forEach((n) => showError(form, n, ''))
  document.getElementById('item-eyebrow').textContent = item ? 'Edit piece' : 'New piece'
  document.getElementById('item-title').innerHTML = item ? `Edit <em>${esc(item.name)}.</em>` : 'Add to your <em>closet.</em>'
  document.getElementById('item-submit').textContent = item ? 'SAVE CHANGES' : 'ADD TO CLOSET'
  document.getElementById('delete-item').hidden = !item
  if (item) {
    form.elements.name.value = item.name
    form.elements.cat.value = item.cat
    form.elements.notes.value = item.notes || ''
    form.elements.worn.checked = !!item.worn
    form.querySelectorAll('input[name=kind]').forEach((i) => (i.checked = i.value === item.kind))
    setColor(item.color)
  }
  document.getElementById('notes-count').textContent = `${form.elements.notes.value.length} / 120`
  renderPreview()
  modal.showModal()
  form.elements.name.focus()
}

/* custom colours become an extra swatch radio */
function setColor(hex) {
  let radio = form.querySelector(`input[name=color][value="${hex}"]`)
  if (!radio) {
    form.querySelector('.colors [data-custom]')?.remove()
    const label = document.createElement('label')
    label.dataset.custom = ''
    label.style.background = hex
    label.innerHTML = `<input type="radio" name="color" value="${hex}" aria-label="Custom colour ${hex}" />`
    form.querySelector('.colors .custom').before(label)
    radio = label.querySelector('input')
  }
  radio.checked = true
}

form.addEventListener('input', (e) => {
  if (e.target.name === 'customColor') {
    setColor(e.target.value)
    showError(form, 'color', '')
  }
  if (e.target.name === 'notes') document.getElementById('notes-count').textContent = `${e.target.value.length} / 120`
  renderPreview()
})
form.addEventListener('change', (e) => {
  /* suggest a silhouette when a category is chosen */
  if (e.target.name === 'cat' && !formKind() && CAT_DEFAULT_KIND[e.target.value]) {
    form.querySelector(`input[name=kind][value="${CAT_DEFAULT_KIND[e.target.value]}"]`).checked = true
    showError(form, 'kind', '')
  }
  renderPreview()
})

form.addEventListener('submit', (e) => {
  e.preventDefault()
  if (!validate(form, itemRules)) return
  const data = {
    name: val(form, 'name'),
    cat: val(form, 'cat'),
    kind: formKind(),
    color: formColor(),
    notes: val(form, 'notes'),
    worn: form.elements.worn.checked,
  }
  if (editingId) {
    closet = closet.map((c) => (c.id === editingId ? { ...c, ...data, updatedAt: new Date().toISOString() } : c))
    toast(`Saved changes to ${data.name}`)
  } else {
    closet = [{ id: uid(), fav: false, addedAt: new Date().toISOString(), ...data }, ...closet]
    if (state.filter !== 'All' && state.filter !== data.cat) state.filter = 'All'
    toast(`${data.name} added to your closet`)
  }
  saveCloset()
  modal.close()
  renderFilters()
  renderGrid()
  renderLook()
})

document.getElementById('delete-item').addEventListener('click', () => {
  const index = closet.findIndex((c) => c.id === editingId)
  const [removed] = closet.splice(index, 1)
  saveCloset()
  modal.close()
  renderGrid()
  renderLook()
  toast(`Deleted ${removed.name}`, {
    label: 'Undo',
    run: () => {
      closet.splice(index, 0, removed)
      saveCloset()
      renderGrid()
      renderLook()
    },
  })
})

document.getElementById('add-item').addEventListener('click', () => openItem(null))
modal.addEventListener('click', (e) => {
  if (e.target === modal || e.target.closest('[data-close]')) modal.close()
})

/* ---------- JSON export / import ---------- */
const refreshCount = wireDataBar({
  filename: 'stylesavvy-closet.json',
  count: () => closet.length,
  exportData: () => ({ closet, todayLook: look }),
  importData: (data) => {
    const items = data.closet ?? data
    if (!Array.isArray(items)) throw new Error('expected a "closet" array')
    if (!items.every((c) => c.name && c.cat && c.kind && c.color)) throw new Error('each item needs name, cat, kind and color')
    closet = items.map((c) => ({ id: c.id || uid(), fav: false, worn: false, notes: '', ...c }))
    store.set('ss.closet', closet)
    look = generateLook()
    store.set('ss.todayLook', look)
    renderGrid()
    renderLook()
  },
})

renderFilters()
renderGrid()
renderLook()
