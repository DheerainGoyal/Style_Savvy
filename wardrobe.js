/* ===== StyleSavvy — Wardrobe Dashboard Logic ===== */

/* --- Local Storage Helper --- */
const store = {
  get: (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
};

/* --- Utilities --- */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = (str) =>
  String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/* --- Toast Notification --- */
const toastEl = Object.assign(document.createElement('div'), { className: 'toast' });
toastEl.setAttribute('role', 'status');
toastEl.innerHTML = '<span></span><button type="button"></button>';
document.body.append(toastEl);
let toastTimer;

function toast(message, action) {
  toastEl.querySelector('span').textContent = message;
  const btn = toastEl.querySelector('button');
  btn.textContent = action?.label || '';
  btn.onclick = action ? () => { action.run(); toastEl.classList.remove('show'); } : null;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), action ? 5000 : 2800);
}

/* --- Form Validation --- */
function showError(form, name, msg) {
  const errContainer = form.querySelector(`[data-err="${name}"]`);
  if (errContainer) {
    errContainer.textContent = msg;
    errContainer.closest('.f-row')?.classList.toggle('invalid', !!msg);
  }
}

function validate(form, rules) {
  let firstInvalid = null;
  for (const [name, rule] of Object.entries(rules)) {
    const msg = rule(form);
    showError(form, name, msg);
    if (msg && !firstInvalid) firstInvalid = name;
  }
  if (firstInvalid) form.elements[firstInvalid]?.focus();
  return !firstInvalid;
}

const val = (form, name) => (form.elements[name]?.value ?? '').trim();

/* --- Garment Constants & SVG Helpers --- */
const SHAPE_PATHS = {
  top: 'M20 32 L34 22 L44 26 L56 26 L66 22 L80 32 L74 44 L26 44 Z',
  coat: 'M34 20 L66 20 L66 64 L58 58 L50 66 L42 58 L34 64 Z',
  trousers: 'M38 20 L62 20 L60 62 L52 62 L50 34 L48 62 L40 62 Z',
  dress: 'M40 20 L60 20 L72 68 L28 68 Z',
  blazer: 'M30 22 L50 30 L70 22 L70 60 L30 60 Z',
  skirt: 'M36 26 L64 26 L72 62 L28 62 Z',
  shoe: 'M22 50 L44 50 L54 38 L62 38 L78 52 L78 60 L22 60 Z',
};

const KIND_LABELS = { top: 'Top', coat: 'Coat', trousers: 'Trousers', dress: 'Dress', blazer: 'Blazer', skirt: 'Skirt', shoe: 'Shoe' };
const CAT_DEFAULT_KIND = { Tops: 'top', Bottoms: 'trousers', Dresses: 'dress', Outerwear: 'coat', Formal: 'blazer', Footwear: 'shoe' };
const PALETTE = ['#e9e0cf', '#c9a96e', '#8a6b3f', '#292524', '#3a3532', '#1f3a5f', '#e0c3ae', '#7b8a6a', '#a63d2f'];

function tint(hex) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c, b) => Math.round(c * 0.18 + b * 0.82);
  return `rgb(${mix(n >> 16, 0xf7)},${mix((n >> 8) & 255, 0xf5)},${mix(n & 255, 0xf2)})`;
}

const garment = (kind, color, bg = tint(color), imageSrc = '') => {
  if (imageSrc) {
    return `<div class="garment g" style="background:${bg}">
              <img src="${imageSrc}" alt="Clothing Item" style="width:100%; height:100%; object-fit:cover;" />
            </div>`;
  }
  return `<div class="garment g" style="background:${bg}">
            <svg viewBox="0 0 100 88" fill="${color}">
              <path d="${SHAPE_PATHS[kind] || SHAPE_PATHS.top}"/>
            </svg>
          </div>`;
};

/* --- Initial Closet Data Seed --- */
const FILTERS = ['All', 'Favourites', 'Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Formal', 'Footwear'];
const SEED = [
  { cat: 'Tops', name: 'Silk Blouse — Ivory', kind: 'top', color: '#e9e0cf' },
  { cat: 'Outerwear', name: 'Wool Overcoat — Black', kind: 'coat', color: '#292524' },
  { cat: 'Bottoms', name: 'Tailored Trousers — Stone', kind: 'trousers', color: '#3a3532' },
  { cat: 'Dresses', name: 'Wrap Dress — Camel', kind: 'dress', color: '#c9a96e' },
  { cat: 'Outerwear', name: 'Suede Blazer — Tan', kind: 'blazer', color: '#8a6b3f' },
].map((it, i) => ({ id: 'seed' + i, worn: false, fav: false, notes: '', addedAt: new Date().toISOString(), ...it }));

let closet = store.get('ss.closet', SEED);
const saveCloset = () => {
  store.set('ss.closet', closet);
  document.getElementById('data-count').textContent = closet.length;
};

const state = { filter: 'All', query: '' };

/* --- Profile & Header Initializer --- */
const profile = store.get('ss.profile', null);
const session = store.get('ss.session', null);

if (session) {
  const avatar = document.getElementById('user-avatar');
  avatar.textContent = session.name[0].toUpperCase();
  avatar.href = 'index.html#account';
}

document.getElementById('today').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

if (profile) {
  document.getElementById('city').textContent = profile.city;
  document.getElementById('style-tag').textContent = `STYLE: ${profile.archetype.toUpperCase()}`;
  document.getElementById('look-match').textContent = `● Matches ${profile.compatibility}% twin`;
  document.getElementById('twin-title').textContent = `${profile.styleTwin}'s Look This Week`;
}

/* --- AI Look Generator --- */
const byId = (id) => closet.find((c) => c.id === id);

function generateLook() {
  const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)]?.id;
  return {
    top: getRandom(closet.filter((c) => ['Tops', 'Outerwear', 'Formal'].includes(c.cat))),
    bottom: getRandom(closet.filter((c) => ['Bottoms', 'Dresses'].includes(c.cat))),
    extra: getRandom(closet.filter((c) => ['Footwear', 'Outerwear'].includes(c.cat))),
  };
}

let look = store.get('ss.todayLook', generateLook());

function renderLook() {
  const top = byId(look.top);
  const bottom = byId(look.bottom);
  const extra = byId(look.extra);

  document.getElementById('look-hero').innerHTML = top
    ? `${garment(top.kind, top.color, '#fff')}<button type="button" class="star">★</button>
       <div class="look-meta"><small>${esc(top.cat)}</small><span>${esc(top.name)}</span></div>`
    : '<div class="look-meta"><small>Add items to generate look</small></div>';

  document.getElementById('look-pair').innerHTML = [bottom, extra].filter(Boolean)
    .map((it) => `<div class="item">${garment(it.kind, it.color)}<div class="t"><small>${esc(it.cat)}</small><span>${esc(it.name)}</span></div></div>`)
    .join('');
}

document.getElementById('regenerate').addEventListener('click', () => {
  look = generateLook();
  store.set('ss.todayLook', look);
  renderLook();
});

/* --- Filter & Grid Rendering --- */
const filtersEl = document.getElementById('filters');
const gridEl = document.getElementById('grid');

function renderFilters() {
  filtersEl.innerHTML = FILTERS.map(
    (f) => `<button type="button" class="pill ${state.filter === f ? 'on' : ''}" data-filter="${f}">${f === 'Favourites' ? '♥ ' : ''}${f}</button>`
  ).join('');
}

filtersEl.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-filter]');
  if (btn) {
    state.filter = btn.dataset.filter;
    renderFilters();
    renderGrid();
  }
});

document.getElementById('search').addEventListener('input', (e) => {
  state.query = e.target.value.trim().toLowerCase();
  renderGrid();
});

function renderGrid() {
  const items = closet.filter((c) => {
    const matchFilter = state.filter === 'All' || (state.filter === 'Favourites' ? c.fav : c.cat === state.filter);
    const matchQuery = !state.query || `${c.name} ${c.cat} ${c.notes}`.toLowerCase().includes(state.query);
    return matchFilter && matchQuery;
  });

  document.getElementById('count').textContent = `${items.length} of ${closet.length} pieces`;

  gridEl.innerHTML = items.map((it) => `
    <div class="piece" tabindex="0" data-id="${it.id}">
      <div class="g">
        ${garment(it.kind, it.color)}
        ${it.worn ? '<span class="worn">WORN TODAY</span>' : ''}
        <span class="edit">EDIT</span>
        <button type="button" class="fav ${it.fav ? 'on' : ''}" data-fav="${it.id}">${it.fav ? '♥' : '♡'}</button>
      </div>
      <div class="t"><small>${esc(it.cat)}</small><span class="nm">${esc(it.name)}</span></div>
    </div>
  `).join('');
}

gridEl.addEventListener('click', (e) => {
  const favBtn = e.target.closest('[data-fav]');
  if (favBtn) {
    const item = byId(favBtn.dataset.fav);
    item.fav = !item.fav;
    saveCloset();
    renderGrid();
    toast(item.fav ? 'Added to favourites' : 'Removed from favourites');
    return;
  }
  const piece = e.target.closest('[data-id]');
  if (piece) openItem(byId(piece.dataset.id));
});

/* --- Add/Edit Modal Controls --- */
const modal = document.getElementById('item-modal');
const form = document.getElementById('item-form');
let editingId = null;

// Populate Silhouettes & Swatches
document.getElementById('kinds').innerHTML = Object.entries(KIND_LABELS)
  .map(([k, label]) => `<label><input type="radio" name="kind" value="${k}" /><svg viewBox="0 0 100 88"><path d="${SHAPE_PATHS[k]}"/></svg>${label}</label>`)
  .join('');

document.getElementById('colors').innerHTML = PALETTE.map(
  (c) => `<label style="background:${c}"><input type="radio" name="color" value="${c}" /></label>`
).join('');

function openItem(item) {
  editingId = item?.id ?? null;
  form.reset();
  document.getElementById('item-title').innerHTML = item ? `Edit <em>${esc(item.name)}.</em>` : 'Add to your <em>closet.</em>';
  document.getElementById('delete-item').hidden = !item;

  if (item) {
    form.elements.name.value = item.name;
    form.elements.cat.value = item.cat;
    form.elements.notes.value = item.notes || '';
    form.elements.worn.checked = !!item.worn;
    const kindRadio = form.querySelector(`input[name=kind][value="${item.kind}"]`);
    if (kindRadio) kindRadio.checked = true;
  }

  document.getElementById('item-preview').innerHTML = garment(item?.kind || 'top', item?.color || '#c9a96e');
  modal.showModal();
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const itemData = {
    name: val(form, 'name'),
    cat: val(form, 'cat'),
    kind: form.querySelector('input[name=kind]:checked')?.value || 'top',
    color: form.querySelector('input[name=color]:checked')?.value || '#c9a96e',
    notes: val(form, 'notes'),
    worn: form.elements.worn.checked,
  };

  if (editingId) {
    closet = closet.map((c) => (c.id === editingId ? { ...c, ...itemData } : c));
  } else {
    closet.unshift({ id: uid(), fav: false, ...itemData });
  }

  saveCloset();
  modal.close();
  renderGrid();
  renderLook();
  toast('Closet updated successfully!');
});

document.getElementById('add-item').addEventListener('click', () => openItem(null));
modal.addEventListener('click', (e) => {
  if (e.target === modal || e.target.closest('[data-close]')) modal.close();
});



/* --- Initialize Page --- */
saveCloset();
renderFilters();
renderGrid();
renderLook();