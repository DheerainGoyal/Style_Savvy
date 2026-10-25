/* ===== StyleSavvy — Page 1: Landing / Sign In / Create Account / Account ===== */

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

/* ---------- rotating headline ---------- */
const words = ['style twin.', 'best self.', 'own icon.', 'daily muse.']
let wordIndex = 0
const rotatingEl = document.getElementById('rotating')
setInterval(() => {
  if (!rotatingEl) return
  rotatingEl.style.opacity = '0'
  setTimeout(() => {
    wordIndex = (wordIndex + 1) % words.length
    rotatingEl.textContent = words[wordIndex]
    rotatingEl.style.opacity = '1'
  }, 400)
}, 2800)

/* ---------- accounts data ---------- */
const getUsers = () => store.get('ss.users', [])
const getSession = () => store.get('ss.session', null)
const currentUser = () => {
  const s = getSession()
  return s ? getUsers().find((u) => u.id === s.userId) || null : null
}

/* passwords are hashed before saving (demo only — real apps hash on a server) */
async function hashPassword(pw) {
  if (window.crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('ss:' + pw))
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
  }
  let h = 5381
  for (const c of 'ss:' + pw) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0
  return 'djb2-' + h.toString(16)
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const NAME_RE = /^[A-Za-zÀ-ÿ' .-]{2,40}$/

function startSession(user) {
  store.set('ss.session', { userId: user.id, name: user.name, email: user.email, signedInAt: new Date().toISOString() })
}

/* ---------- dialog + tabs ---------- */
const modal = document.getElementById('auth-modal')
const tabsEl = document.getElementById('auth-tabs')
let nextPage = 'wardrobe.html'

function showView(view) {
  modal.querySelectorAll('[data-view]').forEach((v) => (v.hidden = v.dataset.view !== view))
  tabsEl.hidden = view === 'account'
  tabsEl.querySelectorAll('[data-tab]').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === view)))
  if (view === 'account') renderAccount()
}
function openAuth(view, next) {
  if (next) nextPage = next
  if (currentUser() && view !== 'account') view = 'account'
  showView(view)
  if (!modal.open) modal.showModal()
  modal.querySelector(`[data-view="${view}"] input`)?.focus()
}

modal.addEventListener('click', (e) => {
  if (e.target === modal || e.target.closest('[data-close]')) modal.close()
  const tab = e.target.closest('[data-tab]')
  if (tab) showView(tab.dataset.tab)
  const pw = e.target.closest('[data-pw]')
  if (pw) {
    const input = pw.previousElementSibling
    input.type = input.type === 'password' ? 'text' : 'password'
    pw.textContent = input.type === 'password' ? 'Show' : 'Hide'
  }
})
modal.addEventListener('close', () => history.replaceState(null, '', location.pathname))

/* links with data-auth open the dialog (or go straight through when signed in) */
document.addEventListener('click', (e) => {
  const link = e.target.closest('[data-auth]')
  if (!link) return
  if (currentUser() && link.dataset.next) return // already signed in: follow the link
  e.preventDefault()
  openAuth(link.dataset.auth, link.dataset.next)
})

/* deep links from other pages: index.html#signin, #signup, #account */
function openFromHash() {
  const view = location.hash.slice(1)
  if (['signin', 'signup', 'account'].includes(view)) openAuth(view)
}
window.addEventListener('hashchange', openFromHash)

/* ---------- sign in ---------- */
const signinForm = document.getElementById('signin-form')
const signinRules = {
  email: (f) => (!val(f, 'email') ? 'Email is required.' : !EMAIL_RE.test(val(f, 'email')) ? 'Enter a valid email address.' : ''),
  password: (f) => (!f.elements.password.value ? 'Password is required.' : ''),
}
liveValidate(signinForm, signinRules)

signinForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  const msg = signinForm.querySelector('[data-msg]')
  msg.textContent = ''
  if (!validate(signinForm, signinRules)) return

  const email = val(signinForm, 'email').toLowerCase()
  const user = getUsers().find((u) => u.email === email)
  if (!user) {
    msg.innerHTML = 'No account found for that email. <button type="button" class="link" data-tab="signup">Create one?</button>'
    return
  }
  if ((await hashPassword(signinForm.elements.password.value)) !== user.passwordHash) {
    showError(signinForm, 'password', 'That password doesn’t match. Try again.')
    signinForm.elements.password.select()
    return
  }
  startSession(user)
  signinForm.reset()
  toast(`Welcome back, ${user.name.split(' ')[0]}`)
  setTimeout(() => (location.href = nextPage), 700)
})

/* ---------- create account ---------- */
const signupForm = document.getElementById('signup-form')
function passwordScore(pw) {
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Za-z]/.test(pw) && /\d/.test(pw)) s++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) s++
  return pw ? Math.max(1, s) : 0
}
const signupRules = {
  name: (f) =>
    !val(f, 'name') ? 'Please tell us your name.' : !NAME_RE.test(val(f, 'name')) ? 'Use 2–40 letters (spaces, hyphens and apostrophes are fine).' : '',
  email: (f) => {
    const v = val(f, 'email').toLowerCase()
    if (!v) return 'Email is required.'
    if (!EMAIL_RE.test(v)) return 'Enter a valid email address.'
    if (getUsers().some((u) => u.email === v)) return 'An account with this email already exists.'
    return ''
  },
  password: (f) => {
    const v = f.elements.password.value
    if (!v) return 'Choose a password.'
    if (v.length < 8) return 'Password must be at least 8 characters.'
    if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return 'Include at least one letter and one number.'
    return ''
  },
  confirm: (f) =>
    !f.elements.confirm.value ? 'Please confirm your password.' : f.elements.confirm.value !== f.elements.password.value ? 'Passwords don’t match.' : '',
  terms: (f) => (!f.elements.terms.checked ? 'You need to accept the terms to continue.' : ''),
}
liveValidate(signupForm, signupRules)

const strengthEl = document.getElementById('strength')
const strengthLabel = document.getElementById('strength-label')
signupForm.elements.password.addEventListener('input', (e) => {
  const score = passwordScore(e.target.value)
  strengthEl.dataset.score = score
  strengthLabel.textContent = ['Use 8+ characters with a letter and a number.', 'Weak', 'Fair', 'Good', 'Strong'][score]
})

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  if (!validate(signupForm, signupRules)) return
  const btn = signupForm.querySelector('[type=submit]')
  btn.disabled = true

  const user = {
    id: uid(),
    name: val(signupForm, 'name'),
    email: val(signupForm, 'email').toLowerCase(),
    passwordHash: await hashPassword(signupForm.elements.password.value),
    createdAt: new Date().toISOString(),
  }
  store.set('ss.users', [...getUsers(), user])
  startSession(user)
  refreshCount()
  signupForm.reset()
  strengthEl.dataset.score = 0
  btn.disabled = false
  toast(`Account created — welcome, ${user.name.split(' ')[0]}`)
  setTimeout(() => (location.href = nextPage === 'wardrobe.html' ? 'onboarding.html' : nextPage), 800)
})

/* ---------- account view ---------- */
const accountForm = document.getElementById('account-form')
const accountRules = {
  name: (f) =>
    !val(f, 'name') ? 'Display name can’t be empty.' : !NAME_RE.test(val(f, 'name')) ? 'Use 2–40 letters.' : '',
}
liveValidate(accountForm, accountRules)

function renderAccount() {
  const user = currentUser()
  if (!user) return showView('signin')
  document.getElementById('acct-initial').textContent = user.name[0].toUpperCase()
  document.getElementById('acct-name').textContent = user.name
  const since = new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  document.getElementById('acct-meta').textContent = `${user.email} · Member since ${since}`
  accountForm.elements.name.value = user.name
}

accountForm.addEventListener('submit', (e) => {
  e.preventDefault()
  if (!validate(accountForm, accountRules)) return
  const user = currentUser()
  const name = val(accountForm, 'name')
  store.set('ss.users', getUsers().map((u) => (u.id === user.id ? { ...u, name, updatedAt: new Date().toISOString() } : u)))
  store.set('ss.session', { ...getSession(), name })
  renderAccount()
  renderSigninLine()
  toast('Profile updated')
})

document.getElementById('sign-out').addEventListener('click', () => {
  store.remove('ss.session')
  modal.close()
  renderSigninLine()
  toast('Signed out')
})

document.getElementById('delete-account').addEventListener('click', () => {
  const user = currentUser()
  if (!user || !confirm(`Delete the account for ${user.email}? This removes it from this browser.`)) return
  store.set('ss.users', getUsers().filter((u) => u.id !== user.id))
  store.remove('ss.session')
  modal.close()
  renderSigninLine()
  refreshCount()
  toast('Account deleted')
})

/* ---------- signed-in state on the landing hero ---------- */
const signinLine = document.getElementById('signin-line')
function renderSigninLine() {
  const user = currentUser()
  signinLine.innerHTML = user
    ? `Signed in as <span class="who">${esc(user.name)}</span> · <button type="button" data-auth="account">Account</button>`
    : 'Already have an account? <a href="#signin" data-auth="signin">Sign in</a>'
}

/* ---------- JSON export / import ---------- */
const refreshCount = wireDataBar({
  filename: 'stylesavvy-accounts.json',
  count: () => getUsers().length,
  exportData: () => ({ users: getUsers(), session: getSession() }),
  importData: (data) => {
    if (!Array.isArray(data.users)) throw new Error('expected a "users" array')
    const ok = data.users.every((u) => u.id && u.email && u.name && u.passwordHash)
    if (!ok) throw new Error('each user needs id, name, email and passwordHash')
    store.set('ss.users', data.users)
    if (data.session) store.set('ss.session', data.session)
    renderSigninLine()
  },
})

renderSigninLine()
openFromHash()
