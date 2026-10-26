/* ===== StyleSavvy — Page 4: Virtual Try-On (swap pieces, toggles, save looks) ===== */

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
const tint = (hex) => {
  const n = parseInt(hex.slice(1), 16)
  const mix = (c, b) => Math.round(c * 0.18 + b * 0.82)
  return `rgb(${mix(n >> 16, 0xf7)},${mix((n >> 8) & 255, 0xf5)},${mix(n & 255, 0xf2)})`
}
const garment = (kind, color) =>
  `<div class="garment g" style="background:${tint(color)}"><svg viewBox="0 0 100 88" fill="${color}"><path d="${SHAPE_PATHS[kind] || SHAPE_PATHS.top}"/></svg></div>`

/* ---------- data from other pages (with stand-alone fallbacks) ---------- */
const FALLBACK = [
  { id: 'd-top', cat: 'Outerwear', name: 'Golden Wrap Blazer', kind: 'blazer', color: '#c9a96e' },
  { id: 'd-bot', cat: 'Bottoms', name: 'Tailored Trousers', kind: 'trousers', color: '#292524' },
  { id: 'd-shoe', cat: 'Footwear', name: 'Leather Mules — Tan', kind: 'shoe', color: '#8a6b3f' },
]
const closet = store.get('ss.closet', null) || FALLBACK
const profile = store.get('ss.profile', null)
const session = store.get('ss.session', null)
const SKIN = profile?.skinTone || '#d8a878'

const SLOTS = {
  top: { label: 'Top layer', cats: ['Outerwear', 'Tops', 'Formal'], toggle: 'rollSleeves', toggleLabel: 'Roll sleeves' },
  bottom: { label: 'Bottoms', cats: ['Bottoms', 'Dresses'], toggle: 'cuffed', toggleLabel: 'Cuffed' },
  shoes: { label: 'Footwear', cats: ['Footwear'], toggle: null },
}
const optionsFor = (slot) => {
  const list = closet.filter((c) => SLOTS[slot].cats.includes(c.cat))
  return list.length ? list : FALLBACK.filter((c) => SLOTS[slot].cats.includes(c.cat))
}
const find = (id) => closet.find((c) => c.id === id) || FALLBACK.find((c) => c.id === id)

/* start from today's look picked on the Wardrobe page */
const today = store.get('ss.todayLook', {})
const firstOf = (slot, prefer) => (prefer && find(prefer) && SLOTS[slot].cats.includes(find(prefer).cat) ? find(prefer) : optionsFor(slot)[0])
const state = {
  view: 'Front',
  rollSleeves: true,
  cuffed: false,
  necklace: false,
  top: firstOf('top', today.top),
  bottom: firstOf('bottom', today.bottom),
  shoes: firstOf('shoes', today.extra),
}

/* header avatar */
const avatarEl = document.getElementById('user-avatar')
if (session) {
  avatarEl.textContent = session.name[0].toUpperCase()
  avatarEl.href = 'index.html#account'
  avatarEl.title = `${session.name} — account`
}

/* ---------- avatar reacts to pieces + toggles ---------- */
function renderAvatar() {
  const { rollSleeves: rs, cuffed: cf, necklace } = state
  const topC = state.top.color
  const botC = state.bottom.color
  const shoeC = state.shoes.color
  const skirt = ['skirt', 'dress'].includes(state.bottom.kind)
  const legs = skirt
    ? `<path d="M68 230 h64 l12 70 h-88 z" fill="${botC}"/>
       <rect x="82" y="300" width="12" height="30" fill="${SKIN}"/><rect x="106" y="300" width="12" height="30" fill="${SKIN}"/>`
    : `<rect x="70" y="230" width="60" height="${cf ? 92 : 100}" fill="${botC}"/>
       <rect x="98" y="230" width="4" height="${cf ? 92 : 100}" fill="rgba(0,0,0,0.25)"/>
       ${cf ? `<rect x="70" y="316" width="60" height="6" fill="${topC}" opacity="0.5"/>` : ''}`
  const footY = skirt ? 328 : cf ? 322 : 330
  document.getElementById('avatar').innerHTML = `<svg viewBox="0 0 200 340" role="img" aria-label="Avatar wearing ${esc(state.top.name)}, ${esc(state.bottom.name)} and ${esc(state.shoes.name)}">
    <path d="M78 40 q22 -22 44 0 v18 h-44 z" fill="#1a1613"/>
    <circle cx="100" cy="58" r="24" fill="${SKIN}"/>
    <rect x="92" y="80" width="16" height="20" fill="${SKIN}"/>
    <path d="M62 100 h76 v130 h-76 z" fill="${topC}"/>
    <path d="M96 100 l4 40 l4 -40 z" fill="rgba(0,0,0,0.12)"/>
    ${necklace ? '<path d="M90 100 q10 18 20 0" fill="none" stroke="#e6c47a" stroke-width="2"/><circle cx="100" cy="109" r="2.5" fill="#e6c47a"/>' : ''}
    <rect x="46" y="${rs ? 108 : 100}" width="18" height="${rs ? 90 : 120}" rx="9" fill="${topC}"/>
    <rect x="136" y="${rs ? 108 : 100}" width="18" height="${rs ? 90 : 120}" rx="9" fill="${topC}"/>
    <circle cx="55" cy="${rs ? 206 : 228}" r="9" fill="${SKIN}"/>
    <circle cx="145" cy="${rs ? 206 : 228}" r="9" fill="${SKIN}"/>
    ${legs}
    <rect x="${skirt ? 78 : 70}" y="${footY}" width="${skirt ? 20 : 26}" height="8" rx="2" fill="${shoeC}"/>
    <rect x="${skirt ? 102 : 104}" y="${footY}" width="${skirt ? 20 : 26}" height="8" rx="2" fill="${shoeC}"/>
  </svg>`

  document.getElementById('anno-top').textContent = state.top.name
  document.getElementById('anno-bottom').textContent = state.bottom.name
  document.getElementById('anno-fit').textContent = necklace
    ? 'Gold chain — finishing touch'
    : rs
      ? 'Rolled sleeves — relaxed polish'
      : 'Tailored fit — perfect'
}

/* ---------- view switcher ---------- */
const VIEWS = { Front: 'view-front', Side: 'view-side', '360°': 'view-spin' }
const viewsEl = document.getElementById('views')
function renderViews() {
  viewsEl.innerHTML = Object.keys(VIEWS)
    .map((v) => `<button type="button" class="${state.view === v ? 'on' : ''}" data-view="${v}" aria-pressed="${state.view === v}">${v}</button>`)
    .join('')
  document.getElementById('avatar').className = VIEWS[state.view]
  document.querySelector('.stage').classList.toggle('hide-anno', state.view !== 'Front')
}
viewsEl.addEventListener('click', (e) => {
  const b = e.target.closest('[data-view]')
  if (!b) return
  state.view = b.dataset.view
  renderViews()
})

/* ---------- currently wearing ---------- */
const wearingEl = document.getElementById('wearing')
function renderWearing() {
  wearingEl.innerHTML = Object.entries(SLOTS)
    .map(([slot, cfg]) => {
      const it = state[slot]
      const n = optionsFor(slot).length
      const showToggle = cfg.toggle && !(cfg.toggle === 'cuffed' && ['skirt', 'dress'].includes(it.kind))
      return `<div class="ctrl-row">
        <div class="g">${garment(it.kind, it.color)}</div>
        <div class="info">
          <small>${esc(it.cat)}</small><span style="font-size:14px">${esc(it.name)}</span>
          ${showToggle ? `<span class="toggle-line">${cfg.toggleLabel} <button type="button" class="toggle ${state[cfg.toggle] ? 'on' : ''}" data-toggle="${cfg.toggle}" role="switch" aria-checked="${state[cfg.toggle]}" aria-label="${cfg.toggleLabel}"><span class="knob"></span></button></span>` : ''}
        </div>
        <button type="button" class="swap" data-swap="${slot}" ${n < 2 ? 'disabled title="Add more pieces on the Wardrobe page"' : ''}>↕ Swap</button>
      </div>`
    })
    .join('')
}
wearingEl.addEventListener('click', (e) => {
  const t = e.target.closest('[data-toggle]')
  if (t) {
    state[t.dataset.toggle] = !state[t.dataset.toggle]
    renderAll()
  }
  const s = e.target.closest('[data-swap]')
  if (s) {
    const slot = s.dataset.swap
    const list = optionsFor(slot)
    const i = list.findIndex((x) => x.id === state[slot].id)
    state[slot] = list[(i + 1) % list.length]
    renderAll()
  }
})

/* ---------- accessory ---------- */
const accBtn = document.getElementById('add-accessory')
accBtn.addEventListener('click', () => {
  state.necklace = !state.necklace
  renderAll()
  toast(state.necklace ? 'Gold chain necklace added' : 'Necklace removed')
})

/* ---------- colour harmony ---------- */
function isWarm(hex) {
  const n = parseInt(hex.slice(1), 16)
  return (n >> 16) >= (n & 255)
}
function renderHarmony() {
  const colors = [state.top.color, state.bottom.color, state.shoes.color, ...(state.necklace ? ['#e6c47a'] : [])]
  document.getElementById('swatches').innerHTML = colors.map((c) => `<span style="background:${c}" title="${c}"></span>`).join('')
  const warm = colors.filter(isWarm).length
  document.getElementById('harmony-text').textContent =
    warm === colors.length
      ? 'Warm neutrals — an analogous palette that complements warm skin undertones beautifully.'
      : warm === 0
        ? 'Cool, tonal palette — calm and polished. Add a gold accent to bring warmth to the face.'
        : 'Warm and cool in contrast — the deeper tone grounds the look while the lighter piece lifts it.'
  accBtn.textContent = state.necklace ? '✓ Added' : '+ Add'
  accBtn.setAttribute('aria-pressed', String(state.necklace))
}

function renderAll() {
  renderWearing()
  renderAvatar()
  renderHarmony()
}

/* ---------- save look form ---------- */
let looks = store.get('ss.looks', [])
const form = document.getElementById('look-form')
const lookRules = {
  name: (f) => {
    const v = val(f, 'name')
    if (!v) return 'Give this look a name.'
    if (v.length < 3) return 'Use at least 3 characters.'
    if (looks.some((l) => l.name.toLowerCase() === v.toLowerCase())) return 'You already saved a look with this name.'
    return ''
  },
  occasion: (f) => (!val(f, 'occasion') ? 'Choose an occasion.' : ''),
  rating: (f) => (!f.elements.rating.value ? 'Rate this look from 1 to 5 stars.' : ''),
  notes: (f) => (val(f, 'notes').length > 200 ? 'Keep notes under 200 characters.' : ''),
}
liveValidate(form, lookRules)
form.elements.notes.addEventListener('input', (e) => (document.getElementById('lk-count').textContent = `${e.target.value.length} / 200`))

const snapshot = (it) => ({ id: it.id, name: it.name, cat: it.cat, kind: it.kind, color: it.color })
form.addEventListener('submit', (e) => {
  e.preventDefault()
  if (!validate(form, lookRules)) return
  const look = {
    id: uid(),
    name: val(form, 'name'),
    occasion: val(form, 'occasion'),
    rating: +form.elements.rating.value,
    notes: val(form, 'notes'),
    items: { top: snapshot(state.top), bottom: snapshot(state.bottom), shoes: snapshot(state.shoes) },
    styling: { rollSleeves: state.rollSleeves, cuffed: state.cuffed, necklace: state.necklace },
    userId: session?.userId ?? null,
    savedAt: new Date().toISOString(),
  }
  looks = [look, ...looks]
  saveLooks()
  form.reset()
  document.getElementById('lk-count').textContent = '0 / 200'
  toast(`“${look.name}” saved to your lookbook`, { label: 'Read notes', run: () => (location.href = 'notes.html') })
})

/* ---------- saved looks list ---------- */
function saveLooks() {
  store.set('ss.looks', looks)
  renderSaved()
  refreshCount()
}
function renderSaved() {
  document.getElementById('saved-count').textContent = looks.length ? `${looks.length}` : ''
  document.getElementById('saved-list').innerHTML = looks.length
    ? looks
        .map(
          (l) => `<div class="look-card" data-id="${l.id}">
        <div class="dots">${Object.values(l.items).map((i) => `<span style="background:${i.color}"></span>`).join('')}</div>
        <div class="info"><b>${esc(l.name)}</b><small><span class="st">${'★'.repeat(l.rating)}</span> · ${esc(l.occasion)} · ${new Date(l.savedAt).toLocaleDateString()}</small></div>
        <button type="button" data-load="${l.id}">Wear</button>
        <button type="button" class="del" data-del="${l.id}" aria-label="Delete ${esc(l.name)}">✕</button>
      </div>`
        )
        .join('')
    : '<p class="saved-empty">No saved looks yet. Style the avatar, then save it above.</p>'
}
document.getElementById('saved-list').addEventListener('click', (e) => {
  const load = e.target.closest('[data-load]')
  if (load) {
    const l = looks.find((x) => x.id === load.dataset.load)
    for (const slot of Object.keys(SLOTS)) state[slot] = find(l.items[slot].id) || l.items[slot]
    Object.assign(state, l.styling)
    renderAll()
    document.querySelector('.stage').scrollIntoView({ behavior: 'smooth', block: 'start' })
    toast(`Wearing “${l.name}”`)
  }
  const del = e.target.closest('[data-del]')
  if (del) {
    const i = looks.findIndex((x) => x.id === del.dataset.del)
    const [removed] = looks.splice(i, 1)
    saveLooks()
    toast(`Deleted “${removed.name}”`, {
      label: 'Undo',
      run: () => {
        looks.splice(i, 0, removed)
        saveLooks()
      },
    })
  }
})

/* ---------- JSON export / import ---------- */
const refreshCount = wireDataBar({
  filename: 'stylesavvy-looks.json',
  count: () => looks.length,
  exportData: () => ({ looks }),
  importData: (data) => {
    const list = data.looks ?? data
    if (!Array.isArray(list)) throw new Error('expected a "looks" array')
    if (!list.every((l) => l.name && l.items?.top && l.items?.bottom && l.items?.shoes)) throw new Error('each look needs a name and top/bottom/shoes items')
    looks = list.map((l) => ({ id: l.id || uid(), rating: 3, occasion: 'Other', notes: '', styling: {}, savedAt: new Date().toISOString(), ...l }))
    store.set('ss.looks', looks)
    renderSaved()
  },
})

renderViews()
renderAll()
renderSaved()
