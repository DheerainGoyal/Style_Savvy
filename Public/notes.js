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
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      console.warn('localStorage set failed:', e)
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key)
    } catch {}
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

/* =========================================================================
   GROUND RULE 3: Keep Graceful Fallbacks!
   If GET /api/notes returns an empty collection during someone else's demo,
   keep your FALLBACK array/objects so the notes page NEVER renders blank!
   ========================================================================= */
const FALLBACK_NOTE = {
  id: 'default-note',
  title: 'Stylist Notes.',
  lookName: 'Elevated Casual',
  lookKicker: "TODAY'S LOOK",
  lookMeta: '3 items · Zendaya-inspired',
  score: 91,
  top: { kind: 'blazer', bg: '#efe6d3', color: '#c9a96e' },
  whyItWorks: {
    title: 'Why This Works',
    text: 'The <strong>structured, broad shoulders of the golden blazer</strong> create an inverted triangle silhouette, balancing the slimmer cut of the tailored trousers below. This contrast between <strong>volume on top and precision below</strong> is a cornerstone of power dressing — elongating your frame and drawing the eye upward.',
    calloutTitle: 'Inverted Triangle Silhouette',
    calloutText: 'Broad shoulders taper to slim ankles — universally flattering. Creates visual height and an elongated, editorial proportion.'
  },
  colors: [
    { name: 'Warm Gold', hex: '#c9a96e', desc: 'Adds richness & depth — complements warm skin undertones.' },
    { name: 'Deep Charcoal', hex: '#292524', desc: 'Grounds the palette — creates contrast & elongates legs.' }
  ],
  tip: {
    badge: '✦ AI Recommendation',
    quote: '"Try adding a delicate gold chain to break up the neckline of the blazer. A single fine chain at collarbone length will introduce jewelry as a counterpoint to the bold structure above."'
  }
}

const FALLBACK_REFINEMENTS = [
  { n: 1, t: 'Tuck One Corner', d: 'Slightly tucking the front-left of the blazer into the waistband creates a deliberate, editorial asymmetry that signals style intention.' },
  { n: 2, t: 'Cuff the Trousers', d: 'A single, clean 1.5-inch cuff at the ankle reveals the tan of your mules, creating a colour echo that ties the look together.' },
  { n: 3, t: 'Swap to a Slim Clutch', d: 'A minimal structured clutch in black or tan maintains the editorial proportions without adding visual bulk.' },
]

const FALLBACK_CHAT = [
  { role: 'ai', text: 'Hello! I am your AI Stylist. Ask me anything about tailoring, pairings, color balance, or elevating this look.', at: new Date().toISOString() }
]

/* Local State */
const profile = store.get('ss.profile', null)
const latestLook = store.get('ss.looks', [])[0] || null
const twin = profile?.styleTwin || 'Zendaya'

let currentNote = FALLBACK_NOTE
let refinementsList = FALLBACK_REFINEMENTS
let done = store.get('ss.refinements', [])
let chat = store.get('ss.chat', FALLBACK_CHAT)
let feedback = store.get('ss.feedback', [])

/* ---------- Render Stylist Note Breakdown ---------- */
function renderNote(note) {
  if (!note) note = FALLBACK_NOTE

  // Prefer latest saved look from Try-On if available, otherwise use note's look
  if (latestLook) {
    const top = latestLook.items?.top || note.top
    document.getElementById('look-thumb').innerHTML = garment(top.kind || 'blazer', '#efe6d3', top.color || '#c9a96e')
    document.getElementById('look-kicker').textContent = `LATEST SAVED LOOK · ${(latestLook.occasion || 'CASUAL').toUpperCase()}`
    document.getElementById('look-name').textContent = latestLook.name
    document.getElementById('look-meta').textContent = `3 items · ${twin}-inspired · ${'★'.repeat(latestLook.rating || 5)}`
    document.getElementById('look-score').textContent = Math.min(99, 80 + (latestLook.rating || 3) * 3 + (latestLook.styling?.necklace ? 2 : 0))
  } else {
    const top = note.top || { kind: 'blazer', bg: '#efe6d3', color: '#c9a96e' }
    document.getElementById('look-thumb').innerHTML = garment(top.kind, top.bg, top.color)
    document.getElementById('look-kicker').textContent = note.lookKicker || "TODAY'S LOOK"
    document.getElementById('look-name').textContent = note.lookName || 'Elevated Casual'
    document.getElementById('look-meta').textContent = note.lookMeta || `3 items · ${twin}-inspired`
    document.getElementById('look-score').textContent = note.score || 91
  }

  // Why this works section
  const whyTitleEl = document.getElementById('why-title')
  const whyTextEl = document.getElementById('why-text')
  const calloutTitleEl = document.getElementById('callout-title')
  const calloutTextEl = document.getElementById('callout-text')
  if (whyTitleEl && note.whyItWorks?.title) whyTitleEl.textContent = note.whyItWorks.title
  if (whyTextEl && note.whyItWorks?.text) whyTextEl.innerHTML = note.whyItWorks.text
  if (calloutTitleEl && note.whyItWorks?.calloutTitle) calloutTitleEl.textContent = note.whyItWorks.calloutTitle
  if (calloutTextEl && note.whyItWorks?.calloutText) calloutTextEl.textContent = note.whyItWorks.calloutText

  // Color theory section
  const colorsContainer = document.getElementById('colors-list')
  if (colorsContainer && Array.isArray(note.colors) && note.colors.length) {
    colorsContainer.innerHTML = note.colors
      .map(
        (c) => `<div class="colcard">
          <div class="sw" style="background: ${esc(c.hex)}"></div>
          <div class="t"><span style="font-size: 14px; font-weight: 500">${esc(c.name)}</span><small>${esc(c.desc)}</small></div>
        </div>`
      )
      .join('')
  }

  // Styling tip section
  const tipBadgeEl = document.getElementById('tip-badge')
  const tipQuoteEl = document.getElementById('tip-quote')
  if (tipBadgeEl && note.tip?.badge) tipBadgeEl.textContent = note.tip.badge
  if (tipQuoteEl && note.tip?.quote) tipQuoteEl.textContent = note.tip.quote
}

/* ---------- further refinements (checklist, saved) ---------- */
const refineEl = document.getElementById('refinements')
function renderRefinements() {
  refineEl.innerHTML = refinementsList
    .map(
      (r) => `<label class="refine ${done.includes(r.n) ? 'done' : ''}">
      <input type="checkbox" value="${r.n}" ${done.includes(r.n) ? 'checked' : ''} />
      <span class="n">${done.includes(r.n) ? '✓' : r.n}</span>
      <div><span class="t" style="font-size:14px;font-weight:500">${esc(r.t)}</span><p>${esc(r.d)}</p></div>
    </label>`
    )
    .join('')
  document.getElementById('refine-progress').textContent = `${done.length} / ${refinementsList.length} TRIED`
}

refineEl.addEventListener('change', async (e) => {
  const n = +e.target.value
  done = e.target.checked ? [...done, n] : done.filter((x) => x !== n)
  store.set('ss.refinements', done)
  renderRefinements()
  refreshCount()

  /* GROUND RULE 2: Relative URL fetch('/api/notes/refinements') */
  try {
    await fetch('/api/notes/refinements', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done }),
    })
  } catch (err) {
    console.warn('Backend offline, refinement saved locally:', err)
  }

  if (done.length === refinementsList.length) toast('All refinements tried — look perfected')
})

/* ---------- AI chat (canned stylist replies, history saved) ---------- */
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
      ? chat.map((m) => `<div class="msg ${m.role}">${esc(m.text)}<time>${fmtTime(m.at || m.createdAt)}</time></div>`).join('')
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

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  if (!validate(chatForm, chatRules)) return
  const text = val(chatForm, 'question')
  const userMsg = { role: 'user', text, at: new Date().toISOString() }
  chat.push(userMsg)
  saveChat()
  chatForm.reset()
  sendBtn.disabled = true
  renderChat(true)
  logEl.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

  /* GROUND RULE 2: Relative URL fetch('/api/notes/chat') */
  try {
    fetch('/api/notes/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userMsg),
    }).catch(() => {})
  } catch {}

  setTimeout(async () => {
    const aiMsg = { role: 'ai', text: aiReply(text), at: new Date().toISOString() }
    chat.push(aiMsg)
    saveChat()
    renderChat()
    sendBtn.disabled = false
    logEl.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    inputEl.focus()

    /* GROUND RULE 2: Relative URL fetch('/api/notes/chat') */
    try {
      fetch('/api/notes/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiMsg),
      }).catch(() => {})
    } catch {}
  }, 900)
})

function saveChat() {
  store.set('ss.chat', chat)
  refreshCount()
}

document.getElementById('clear-chat').addEventListener('click', async () => {
  const backup = chat
  chat = []
  saveChat()
  renderChat()

  /* GROUND RULE 2: Relative URL DELETE fetch('/api/notes/chat') */
  try {
    await fetch('/api/notes/chat', { method: 'DELETE' })
  } catch {}

  toast('Conversation cleared', {
    label: 'Undo',
    run: async () => {
      chat = backup
      saveChat()
      renderChat()
      try {
        for (const m of backup) {
          await fetch('/api/notes/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(m),
          })
        }
      } catch {}
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

fbForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  if (!validate(fbForm, fbRules)) return
  const entry = {
    id: uid(),
    rating: +fbForm.elements.rating.value,
    tryTip: fbForm.elements.tryTip.value,
    comment: val(fbForm, 'comment'),
    lookId: latestLook?.id ?? null,
    lookName: latestLook?.name ?? currentNote?.lookName ?? 'Elevated Casual',
    at: new Date().toISOString(),
  }

  /* GROUND RULE 2: Relative URL POST fetch('/api/notes/feedback') */
  try {
    const res = await fetch('/api/notes/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    })
    if (res.ok) {
      const saved = await res.json()
      feedback = [saved, ...feedback]
    } else {
      feedback = [entry, ...feedback]
    }
  } catch (err) {
    console.warn('Backend unavailable, saved feedback locally:', err)
    feedback = [entry, ...feedback]
  }

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

/* =========================================================================
   INITIAL DATA LOAD VIA RELATIVE URL FETCH WITH GRACEFUL FALLBACKS
   ========================================================================= */
async function loadNotesData() {
  // 1. Fetch Stylist Notes with Graceful Fallback
  try {
    const res = await fetch('/api/notes')
    if (res.ok) {
      const data = await res.json()
      // If collection is empty during someone else's demo, keep FALLBACK_NOTE!
      if (Array.isArray(data) && data.length > 0) {
        currentNote = data[0]
      } else if (data && typeof data === 'object' && data.lookName) {
        currentNote = data
      } else {
        console.info('Empty MongoDB notes collection received, falling back to graceful default.');
        currentNote = FALLBACK_NOTE
      }
    } else {
      currentNote = FALLBACK_NOTE
    }
  } catch (err) {
    console.warn('Backend unavailable, using graceful fallback note:', err)
    currentNote = FALLBACK_NOTE
  }
  renderNote(currentNote)

  // 2. Fetch Refinements State
  try {
    const res = await fetch('/api/notes/refinements')
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) {
        done = data
      } else if (data?.done && Array.isArray(data.done)) {
        done = data.done
      } else {
        done = store.get('ss.refinements', [])
      }
    } else {
      done = store.get('ss.refinements', [])
    }
  } catch {
    done = store.get('ss.refinements', [])
  }
  renderRefinements()

  // 3. Fetch Chat History
  try {
    const res = await fetch('/api/notes/chat')
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        chat = data
      } else {
        chat = store.get('ss.chat', FALLBACK_CHAT)
      }
    } else {
      chat = store.get('ss.chat', FALLBACK_CHAT)
    }
  } catch {
    chat = store.get('ss.chat', FALLBACK_CHAT)
  }
  renderChat()

  // 4. Fetch Feedback
  try {
    const res = await fetch('/api/notes/feedback')
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) {
        feedback = data
      } else {
        feedback = store.get('ss.feedback', [])
      }
    } else {
      feedback = store.get('ss.feedback', [])
    }
  } catch {
    feedback = store.get('ss.feedback', [])
  }

  refreshCount()
}

// Initial render with fallbacks immediately, then sync with backend
renderNote(FALLBACK_NOTE)
renderRefinements()
renderChat()
loadNotesData()
