/* ===== StyleSavvy — Page 5: AI Stylist Notes (chat, feedback, refinements) ===== */

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

const SHAPE_PATHS = {
  top: 'M20 32 L34 22 L44 26 L56 26 L66 22 L80 32 L74 44 L26 44 Z',
  coat: 'M34 20 L66 20 L66 64 L58 58 L50 66 L42 58 L34 64 Z',
  blazer: 'M30 22 L50 30 L70 22 L70 60 L30 60 Z',
  dress: 'M40 20 L60 20 L72 68 L28 68 Z',
}
const garment = (kind, bg, color) =>
  `<div class="garment" style="background:${bg}"><svg viewBox="0 0 100 88" fill="${color}"><path d="${SHAPE_PATHS[kind] || SHAPE_PATHS.blazer}"/></svg></div>`

const profile = store.get('ss.profile', null)
const latestLook = store.get('ss.looks', [])[0] || null
const twin = profile?.styleTwin || 'Zendaya'

/* ---------- look summary (latest saved look from Try-On) ---------- */
if (latestLook) {
  const top = latestLook.items.top
  document.getElementById('look-thumb').innerHTML = garment(top.kind, '#efe6d3', top.color)
  document.getElementById('look-kicker').textContent = `LATEST SAVED LOOK · ${latestLook.occasion.toUpperCase()}`
  document.getElementById('look-name').textContent = latestLook.name
  document.getElementById('look-meta').textContent = `3 items · ${twin}-inspired · ${'★'.repeat(latestLook.rating)}`
  document.getElementById('look-score').textContent = Math.min(99, 80 + latestLook.rating * 3 + (latestLook.styling?.necklace ? 2 : 0))
} else {
  document.getElementById('look-thumb').innerHTML = garment('blazer', '#efe6d3', '#c9a96e')
  document.getElementById('look-meta').textContent = `3 items · ${twin}-inspired`
}

/* ---------- further refinements (checklist, saved) ---------- */
const REFINEMENTS = [
  { n: 1, t: 'Tuck One Corner', d: 'Slightly tucking the front-left of the blazer into the waistband creates a deliberate, editorial asymmetry that signals style intention.' },
  { n: 2, t: 'Cuff the Trousers', d: 'A single, clean 1.5-inch cuff at the ankle reveals the tan of your mules, creating a colour echo that ties the look together.' },
  { n: 3, t: 'Swap to a Slim Clutch', d: 'A minimal structured clutch in black or tan maintains the editorial proportions without adding visual bulk.' },
]
let done = store.get('ss.refinements', [])
const refineEl = document.getElementById('refinements')
function renderRefinements() {
  refineEl.innerHTML = REFINEMENTS.map(
    (r) => `<label class="refine ${done.includes(r.n) ? 'done' : ''}">
      <input type="checkbox" value="${r.n}" ${done.includes(r.n) ? 'checked' : ''} />
      <span class="n">${done.includes(r.n) ? '✓' : r.n}</span>
      <div><span class="t" style="font-size:14px;font-weight:500">${r.t}</span><p>${r.d}</p></div>
    </label>`
  ).join('')
  document.getElementById('refine-progress').textContent = `${done.length} / ${REFINEMENTS.length} TRIED`
}
refineEl.addEventListener('change', (e) => {
  const n = +e.target.value
  done = e.target.checked ? [...done, n] : done.filter((x) => x !== n)
  store.set('ss.refinements', done)
  renderRefinements()
  refreshCount()
  if (done.length === REFINEMENTS.length) toast('All refinements tried — look perfected')
})

/* ---------- AI chat (canned stylist replies, history saved) ---------- */
let chat = store.get('ss.chat', [])
const logEl = document.getElementById('chat-log')
const chatForm = document.getElementById('chat-form')
const inputEl = chatForm.elements.question
const sendBtn = chatForm.querySelector('.send')

const REPLIES = [
  [/belt/, () => `A slim tan leather belt (about 2.5 cm wide) will define your waist without competing with the blazer. Match the buckle to your jewellery — gold here.`],
  [/shoe|heel|mule|sneaker|boot|footwear/, (q) =>
      /evening|night|dinner|date/.test(q)
        ? 'For evening, switch the mules for a pointed slingback or a strappy heeled sandal in black or metallic gold — it lengthens the leg and dresses up the trousers instantly.'
        : 'Pointed-toe flats or loafers in tan keep the line clean by day. White leather sneakers work if you want to dress the look down.'],
  [/bag|clutch|purse|tote/, () => 'Go structured and compact: a tan or black top-handle bag or slim clutch. Avoid slouchy totes, which soften the sharp shoulder line.'],
  [/dress (it )?down|casual|weekend|relaxed/, () => 'Swap the trousers for straight-leg denim, add a white tee under the blazer, and finish with clean sneakers. Push the sleeves up for ease.'],
  [/colou?r|palette|match/, () => `Your palette works best with warm neutrals — camel, cream, chocolate, and gold. For contrast, try deep olive or burgundy rather than bright cool tones.`],
  [/weather|rain|cold|hot|warm|winter|summer/, () =>
      `For ${profile?.city || 'your city'}, layer a lightweight trench over the blazer on cooler days, and swap to linen trousers when it heats up.`],
  [/jewel|necklace|earring|ring|accessor/, () => 'Keep it fine and gold: one delicate chain at collarbone length, plus small hoops. Let the blazer stay the statement.'],
  [/work|office|meeting|interview/, () => 'For work, keep the blazer buttoned, add a silk shell underneath, and choose a low block heel. Polished, but still unmistakably you.'],
  [/twin|celebrit|inspir/, () => `${twin} often pairs a strong shoulder with a slim leg and one statement accessory. Copy that formula and swap in pieces you already own.`],
]
function aiReply(question) {
  const q = question.toLowerCase()
  const hit = REPLIES.find(([re]) => re.test(q))
  return hit
    ? hit[1](q)
    : `Good question. Based on your ${profile?.archetype || 'Elegant Minimalist'} profile, keep proportions balanced — volume on top, a slim line below — and repeat one colour from head to toe to tie it together.`
}

const fmtTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
function renderChat(typing = false) {
  logEl.innerHTML =
    (chat.length
      ? chat.map((m) => `<div class="msg ${m.role}">${esc(m.text)}<time>${fmtTime(m.at)}</time></div>`).join('')
      : '<p class="chat-empty">Ask a question below — answers are saved with your notes.</p>') +
    (typing ? '<div class="msg ai typing" aria-label="Stylist is typing"><span></span><span></span><span></span></div>' : '')
  document.getElementById('clear-chat').hidden = !chat.length
}

const chatRules = {
  question: (f) => {
    const v = val(f, 'question')
    if (!v) return 'Type a question first.'
    if (v.length < 4) return 'Ask a little more (at least 4 characters).'
    if (v.length > 200) return 'Keep questions under 200 characters.'
    return ''
  },
}
inputEl.addEventListener('input', () => showError(chatForm, 'question', ''))

chatForm.addEventListener('submit', (e) => {
  e.preventDefault()
  if (!validate(chatForm, chatRules)) return
  const text = val(chatForm, 'question')
  chat.push({ role: 'user', text, at: new Date().toISOString() })
  saveChat()
  chatForm.reset()
  sendBtn.disabled = true
  renderChat(true)
  logEl.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  setTimeout(() => {
    chat.push({ role: 'ai', text: aiReply(text), at: new Date().toISOString() })
    saveChat()
    renderChat()
    sendBtn.disabled = false
    logEl.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    inputEl.focus()
  }, 900)
})

function saveChat() {
  store.set('ss.chat', chat)
  refreshCount()
}
document.getElementById('clear-chat').addEventListener('click', () => {
  const backup = chat
  chat = []
  saveChat()
  renderChat()
  toast('Conversation cleared', {
    label: 'Undo',
    run: () => {
      chat = backup
      saveChat()
      renderChat()
    },
  })
})

/* suggestion chips fill the chat input */
const SUGG = ['What belt should I add?', 'How to dress this down?', 'Best bag for this look?', 'Shoes for evening?']
const suggEl = document.getElementById('sugg')
suggEl.innerHTML = SUGG.map((s) => `<button type="button" data-q="${s}">${s}</button>`).join('')
suggEl.addEventListener('click', (e) => {
  const b = e.target.closest('[data-q]')
  if (!b) return
  inputEl.value = b.dataset.q
  inputEl.focus()
})

/* ---------- feedback form ---------- */
let feedback = store.get('ss.feedback', [])
const fbForm = document.getElementById('feedback-form')
const fbRules = {
  rating: (f) => (!f.elements.rating.value ? 'Please choose a star rating.' : ''),
  tryTip: (f) => (!f.elements.tryTip.value ? 'Let us know if you’ll try the tip.' : ''),
  comment: (f) => {
    const v = val(f, 'comment')
    const low = +f.elements.rating.value && +f.elements.rating.value <= 2
    if (low && v.length < 10) return 'Tell us what went wrong (10+ characters) so we can improve.'
    if (v && v.length < 10) return 'Add a few more words (10+ characters) or leave it blank.'
    return ''
  },
}
liveValidate(fbForm, fbRules)
fbForm.elements.comment.addEventListener('input', (e) => (document.getElementById('fb-count').textContent = `${e.target.value.length} / 300`))
fbForm.addEventListener('change', (e) => {
  if (e.target.name !== 'rating') return
  const low = +e.target.value <= 2
  document.getElementById('fb-hint').textContent = low ? 'Required — help us understand what missed the mark.' : 'Optional — required if you rate 2 stars or fewer.'
})

fbForm.addEventListener('submit', (e) => {
  e.preventDefault()
  if (!validate(fbForm, fbRules)) return
  const entry = {
    id: uid(),
    rating: +fbForm.elements.rating.value,
    tryTip: fbForm.elements.tryTip.value,
    comment: val(fbForm, 'comment'),
    lookId: latestLook?.id ?? null,
    lookName: latestLook?.name ?? 'Elevated Casual',
    at: new Date().toISOString(),
  }
  feedback = [entry, ...feedback]
  store.set('ss.feedback', feedback)
  refreshCount()
  fbForm.reset()
  document.getElementById('fb-count').textContent = '0 / 300'
  showThanks(entry)
  toast('Feedback saved — thank you')
})
function showThanks(entry) {
  fbForm.querySelector('.fb-body').hidden = true
  fbForm.querySelector('.fb-thanks').hidden = false
  document.getElementById('fb-summary').textContent = `You rated “${entry.lookName}” ${entry.rating}/5. ${feedback.length} response${feedback.length === 1 ? '' : 's'} saved.`
}
document.getElementById('fb-again').addEventListener('click', () => {
  fbForm.querySelector('.fb-body').hidden = false
  fbForm.querySelector('.fb-thanks').hidden = true
})

/* ---------- JSON export / import ---------- */
const refreshCount = wireDataBar({
  filename: 'stylesavvy-notes.json',
  count: () => chat.length + feedback.length + done.length,
  exportData: () => ({ chat, feedback, refinements: done }),
  importData: (data) => {
    if (!Array.isArray(data.chat) && !Array.isArray(data.feedback)) throw new Error('expected "chat" and/or "feedback" arrays')
    if (Array.isArray(data.chat)) {
      if (!data.chat.every((m) => ['user', 'ai'].includes(m.role) && m.text)) throw new Error('chat messages need role and text')
      chat = data.chat
      store.set('ss.chat', chat)
    }
    if (Array.isArray(data.feedback)) {
      feedback = data.feedback
      store.set('ss.feedback', feedback)
    }
    if (Array.isArray(data.refinements)) {
      done = data.refinements
      store.set('ss.refinements', done)
    }
    renderChat()
    renderRefinements()
  },
})

renderRefinements()
renderChat()
