/* ===== StyleSavvy — Page 2: Onboarding (2-step profile form + live style result) ===== */

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

/* ---------- options ---------- */
const SHAPES = {
  Hourglass: 'M12 8 h16 l-6 16 l6 16 h-16 l6 -16 z',
  Pear: 'M15 8 h10 l2 14 l5 18 h-24 l5 -18 z',
  Athletic: 'M8 8 h24 l-6 16 l2 16 h-16 l2 -16 z',
  Rectangle: 'M13 8 h14 v32 h-14 z',
}
const SKIN = ['#f2dcc4', '#e7c9a5', '#d8a878', '#c08a53', '#9c6738', '#6f4525', '#3d2416']
const QUIZ = ['Minimalist', 'Classic', 'Bohemian', 'Elegant', 'Streetwear', 'Romantic', 'Athletic', 'Eclectic']
const OCCASIONS = ['Work', 'Weekend', 'Evening', 'Travel', 'Events']
const MAX_PICKS = 3

/* each aesthetic maps to an archetype + celebrity style twin */
const ARCHETYPES = {
  Minimalist: { arch: 'Elegant Minimalist', twin: 'Zendaya', vibe: 'iconic elevated minimalism — clean lines, tailored silhouettes, and bold statement pieces', s: [78, 45, 32, 92] },
  Elegant: { arch: 'Elegant Minimalist', twin: 'Zendaya', vibe: 'iconic elevated minimalism — clean lines, tailored silhouettes, and bold statement pieces', s: [84, 38, 30, 86] },
  Classic: { arch: 'Timeless Classic', twin: 'Audrey Hepburn', vibe: 'refined classics — crisp shirting, ballet flats, and impeccable tailoring', s: [95, 20, 40, 70] },
  Bohemian: { arch: 'Free-Spirited Bohemian', twin: 'Florence Welch', vibe: 'romantic layers — flowing fabrics, earthy textures, and vintage details', s: [40, 35, 80, 30] },
  Romantic: { arch: 'Modern Romantic', twin: 'Florence Pugh', vibe: 'soft romance — delicate florals, gentle volume, and blush tones', s: [60, 25, 85, 45] },
  Streetwear: { arch: 'Urban Edge', twin: 'Rihanna', vibe: 'fearless street style — oversized cuts, sneakers, and bold contrasts', s: [25, 92, 70, 40] },
  Athletic: { arch: 'Sport Luxe', twin: 'Hailey Bieber', vibe: 'sport-luxe ease — clean sneakers, crisp knits, and polished basics', s: [45, 60, 55, 75] },
  Eclectic: { arch: 'Eclectic Maximalist', twin: 'Harry Styles', vibe: 'joyful maximalism — prints, colour clashes, and statement tailoring', s: [35, 75, 95, 15] },
}
const SCORE_LABELS = ['CLASSIC', 'EDGY', 'PLAYFUL', 'MINIMALIST']

const form = document.getElementById('profile-form')
const session = store.get('ss.session', null)

/* ---------- render option groups as real radio / checkbox inputs ---------- */
document.getElementById('shapes').innerHTML = Object.entries(SHAPES)
  .map(
    ([s, d]) => `<label class="shape"><input type="radio" name="shape" value="${s}" />
      <svg viewBox="0 0 40 48" fill="none" stroke="currentColor" stroke-width="1.4"><path d="${d}"/></svg>${s}</label>`
  )
  .join('')
document.getElementById('skins').innerHTML = SKIN.map(
  (c, i) => `<label class="skin" style="background:${c}"><input type="radio" name="skin" value="${i}" aria-label="Skin tone ${i + 1}" /></label>`
).join('')
document.getElementById('quiz').innerHTML = QUIZ.map(
  (q) => `<label class="pill"><input type="checkbox" name="picks" value="${q}" />${q}</label>`
).join('')
document.getElementById('occasions').innerHTML = OCCASIONS.map(
  (o) => `<label class="pill"><input type="checkbox" name="occasions" value="${o}" />${o}</label>`
).join('')

/* keep the visual "on" state in sync with the inputs */
function syncChoiceStyles() {
  form.querySelectorAll('.shape, .skin, label.pill').forEach((l) => l.classList.toggle('on', l.querySelector('input').checked))
  const picks = checkedValues('picks')
  form.querySelectorAll('input[name=picks]').forEach((i) => {
    i.disabled = !i.checked && picks.length >= MAX_PICKS
    i.parentElement.classList.toggle('disabled', i.disabled)
  })
  document.getElementById('pick-count').textContent = `${picks.length} / ${MAX_PICKS} selected`
}
const checkedValues = (name) => [...form.querySelectorAll(`input[name="${name}"]:checked`)].map((i) => i.value)

/* ---------- sliders ---------- */
const height = form.elements.height
const weight = form.elements.weight
const fmtHeight = (h) => `${Math.floor(h / 12)}'${h % 12}"`
function showMetrics() {
  document.getElementById('height-val').textContent = fmtHeight(+height.value)
  weight.disabled = !form.elements.shareWeight.checked
  document.getElementById('weight-val').textContent = weight.disabled ? 'Private' : `${weight.value} lb`
}

/* ---------- validation rules per step ---------- */
const NAME_RE = /^[A-Za-zÀ-ÿ' .-]{2,30}$/
const CITY_RE = /^[A-Za-zÀ-ÿ' .,-]{2,40}$/
const step1Rules = {
  displayName: (f) => (!val(f, 'displayName') ? 'Please enter a name.' : !NAME_RE.test(val(f, 'displayName')) ? 'Use 2–30 letters.' : ''),
  shape: () => (!checkedValues('shape').length ? 'Select the body shape closest to yours.' : ''),
  skin: () => (!checkedValues('skin').length ? 'Select a skin tone so we can tune your palette.' : ''),
}
const step2Rules = {
  picks: () => {
    const n = checkedValues('picks').length
    return n === 0 ? 'Pick at least one aesthetic.' : n > MAX_PICKS ? `Pick up to ${MAX_PICKS}.` : ''
  },
  occasions: () => (!checkedValues('occasions').length ? 'Choose at least one occasion.' : ''),
  city: (f) => (!val(f, 'city') ? 'Enter your city for weather-aware outfits.' : !CITY_RE.test(val(f, 'city')) ? 'Use letters only (2–40 characters).' : ''),
  budget: (f) => (!val(f, 'budget') ? 'Choose a budget range.' : ''),
  goals: (f) => {
    const v = val(f, 'goals')
    return v && v.length < 10 ? 'Add a little more detail (10+ characters) or leave it blank.' : ''
  },
}
liveValidate(form, { ...step1Rules, ...step2Rules })

/* ---------- live style result ---------- */
function computeResult() {
  const picks = checkedValues('picks')
  const types = (picks.length ? picks : ['Minimalist']).map((p) => ARCHETYPES[p])
  const lead = types[0]
  /* the first pick leads (double weight), the rest blend in */
  const weights = types.map((_, i) => (i === 0 ? 2 : 1))
  const total = weights.reduce((a, b) => a + b, 0)
  const scores = SCORE_LABELS.map((label, i) => ({
    label,
    v: Math.round(types.reduce((sum, t, j) => sum + t.s[i] * weights[j], 0) / total),
  }))
  const skin = +(checkedValues('skin')[0] ?? 2)
  const filled = [val(form, 'displayName'), checkedValues('shape').length, picks.length, checkedValues('occasions').length].filter(Boolean).length
  const score = Math.min(98, 78 + filled * 4 + (skin % 3))
  return { archetype: lead.arch, twin: lead.twin, vibe: lead.vibe, scores, score }
}

const resultEl = document.querySelector('.result')
let lastTwin = ''
function renderResult() {
  const r = computeResult()
  if (r.twin !== lastTwin && lastTwin) {
    resultEl.classList.add('updating')
    setTimeout(() => resultEl.classList.remove('updating'), 250)
  }
  lastTwin = r.twin
  document.getElementById('res-arch').textContent = `Style Archetype — ${r.archetype}`
  document.getElementById('res-twin').textContent = r.twin
  document.getElementById('res-score').textContent = r.score
  document.getElementById('res-desc').textContent = `Based on your metrics and aesthetic selections, your style archetype closely mirrors ${r.twin}'s ${r.vibe}.`
  document.getElementById('bars').innerHTML = r.scores
    .map(
      (s) =>
        `<div class="bar"><span class="blbl">${s.label}</span><div class="track"><div class="fill" style="width:${s.v}%"></div></div><span class="num">${s.v}</span></div>`
    )
    .join('')
}

/* ---------- steps ---------- */
let step = 1
let maxReached = 1
function goTo(n, focus = true) {
  step = n
  maxReached = Math.max(maxReached, n)
  form.querySelectorAll('[data-step]').forEach((s) => (s.hidden = +s.dataset.step !== n))
  document.querySelectorAll('#stepper li').forEach((li) => {
    const i = +li.dataset.goto
    li.classList.toggle('on', i === n)
    li.classList.toggle('ok', i < n || (i <= maxReached && i !== n))
  })
  document.getElementById('step-eyebrow').textContent = `Onboarding — Step 0${n}`
  document.getElementById('step-foot').textContent = `Step ${n} of 3`
  if (focus) form.querySelector(`[data-step="${n}"] input`)?.focus({ preventScroll: true })
}

form.addEventListener('click', (e) => {
  if (e.target.closest('[data-next]') && validate(form, step1Rules)) goTo(2)
  if (e.target.closest('[data-prev]')) goTo(1)
  const edit = e.target.closest('[data-goto-step]')
  if (edit) goTo(+edit.dataset.gotoStep)
  const li = e.target.closest('#stepper li.ok')
  if (li) {
    const n = +li.dataset.goto
    if (n === 1 || validate(form, step1Rules)) goTo(n)
  }
})

form.addEventListener('input', (e) => {
  if (e.target.name === 'goals') document.getElementById('goals-count').textContent = `${e.target.value.length} / 160`
  if (['height', 'weight'].includes(e.target.name)) showMetrics()
})
form.addEventListener('change', (e) => {
  if (e.target.name === 'shareWeight') showMetrics()
  syncChoiceStyles()
  renderResult()
})
form.addEventListener('keydown', (e) => {
  /* Enter on step 1 moves forward instead of submitting the whole form */
  if (e.key === 'Enter' && step === 1 && e.target.tagName === 'INPUT') {
    e.preventDefault()
    if (validate(form, step1Rules)) goTo(2)
  }
})

/* ---------- submit: save profile JSON ---------- */
form.addEventListener('submit', (e) => {
  e.preventDefault()
  if (!validate(form, step1Rules)) return goTo(1)
  if (!validate(form, step2Rules)) return

  const r = computeResult()
  const profile = {
    userId: session?.userId ?? null,
    displayName: val(form, 'displayName'),
    height: +height.value,
    heightLabel: fmtHeight(+height.value),
    weight: form.elements.shareWeight.checked ? +weight.value : null,
    shape: checkedValues('shape')[0],
    skinTone: SKIN[+checkedValues('skin')[0]],
    skinIndex: +checkedValues('skin')[0],
    aesthetics: checkedValues('picks'),
    occasions: checkedValues('occasions'),
    city: val(form, 'city'),
    budget: val(form, 'budget'),
    goals: val(form, 'goals'),
    archetype: r.archetype,
    styleTwin: r.twin,
    compatibility: r.score,
    scores: r.scores,
    savedAt: new Date().toISOString(),
  }
  store.set('ss.profile', profile)
  refreshCount()
  markSaved(profile)
  goTo(3)
  toast(`Style profile saved — you're a ${r.archetype}`)
  if (innerWidth < 1000) resultEl.scrollIntoView({ behavior: 'smooth' })
})

function markSaved(p) {
  document.getElementById('res-badge').textContent = '● SAVED TO PROFILE'
  document.getElementById('res-badge').classList.add('saved')
  document.getElementById('res-cta').textContent = 'Happy with your match? Continue to your digital wardrobe.'
  document.getElementById('done-name').textContent = `${p.displayName}.`
  document.getElementById('done-summary').textContent = `${p.archetype} · ${p.heightLabel} · ${p.shape} · ${p.aesthetics.join(', ')} · ${p.city}`
}

/* ---------- prefill from saved profile ---------- */
function fillForm(p) {
  if (!p) return
  form.elements.displayName.value = p.displayName ?? ''
  height.value = p.height ?? 67
  form.elements.shareWeight.checked = p.weight != null
  if (p.weight != null) weight.value = p.weight
  form.querySelectorAll('input[name=shape]').forEach((i) => (i.checked = i.value === p.shape))
  form.querySelectorAll('input[name=skin]').forEach((i) => (i.checked = +i.value === p.skinIndex))
  form.querySelectorAll('input[name=picks]').forEach((i) => (i.checked = (p.aesthetics ?? []).includes(i.value)))
  form.querySelectorAll('input[name=occasions]').forEach((i) => (i.checked = (p.occasions ?? []).includes(i.value)))
  form.elements.city.value = p.city ?? ''
  form.elements.budget.value = p.budget ?? ''
  form.elements.goals.value = p.goals ?? ''
  document.getElementById('goals-count').textContent = `${form.elements.goals.value.length} / 160`
  maxReached = 3
}

/* ---------- JSON export / import ---------- */
const refreshCount = wireDataBar({
  filename: 'stylesavvy-profile.json',
  count: () => (store.get('ss.profile', null) ? 1 : 0),
  exportData: () => ({ profile: store.get('ss.profile', null) }),
  importData: (data) => {
    const p = data.profile ?? data
    if (!p || !p.shape || !Array.isArray(p.aesthetics)) throw new Error('expected a profile with "shape" and "aesthetics"')
    store.set('ss.profile', p)
    fillForm(p)
    init()
    markSaved(p)
  },
})

function init() {
  showMetrics()
  syncChoiceStyles()
  renderResult()
}

const saved = store.get('ss.profile', null)
fillForm(saved)
if (!saved && session) form.elements.displayName.value = session.name.split(' ')[0]
init()
if (saved) markSaved(saved)
goTo(1, false)
