'use strict';

/* ══════════════════════════════════════════
   SUPABASE CLIENT
══════════════════════════════════════════ */
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ══════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════ */
const CATEGORIES = ['Furniture','Electronics','Clothing','Tools','Vehicles','Appliances','Collectibles','Sports','Other'];
const IRS_RATE_DEFAULT = 0.70;

/* ══════════════════════════════════════════
   STATE
══════════════════════════════════════════ */
let currentUser  = null;
let items        = [];      // in-memory cache of items with nested parts/trips/photos
let currentItem  = null;    // item open in detail view
let editingItem  = null;    // null = new item, object = editing existing
let settings     = loadSettings();
let activeFilter = 'all';
let toastTimer   = null;

/* ══════════════════════════════════════════
   INIT
══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  db.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      currentUser = session.user;
      showApp();
      loadItems();
    } else {
      currentUser = null;
      items = [];
      currentItem = null;
      showAuthScreen();
    }
  });

  bindAuthEvents();
  bindAppEvents();
  updateCalcRateNote();
});

/* ══════════════════════════════════════════
   AUTH
══════════════════════════════════════════ */
function showApp() {
  el('auth-screen').style.display = 'none';
  el('app-header').style.display  = 'flex';
  el('app-body').style.display    = 'block';
  el('user-email-display').textContent = currentUser.email || '';
  el('s_mileage_rate').value = settings.mileageRate ?? IRS_RATE_DEFAULT;
  showView('dashboard');
}

function showAuthScreen() {
  el('auth-screen').style.display = 'flex';
  el('app-header').style.display  = 'none';
  el('app-body').style.display    = 'none';
}

function bindAuthEvents() {
  el('btn-signin').addEventListener('click', onSignIn);
  el('btn-signup').addEventListener('click', onSignUp);
  el('btn-google').addEventListener('click', onGoogleSignIn);

  el('auth-email').addEventListener('keydown', e => { if (e.key === 'Enter') onSignIn(); });
  el('auth-password').addEventListener('keydown', e => { if (e.key === 'Enter') onSignIn(); });
}

async function onSignIn() {
  const email    = val('auth-email').trim();
  const password = val('auth-password');
  if (!email || !password) { showAuthError('Email and password required'); return; }
  setAuthLoading(true);
  const { error } = await db.auth.signInWithPassword({ email, password });
  setAuthLoading(false);
  if (error) showAuthError(error.message);
}

async function onSignUp() {
  const email    = val('auth-email').trim();
  const password = val('auth-password');
  if (!email || !password) { showAuthError('Email and password required'); return; }
  if (password.length < 6) { showAuthError('Password must be at least 6 characters'); return; }
  setAuthLoading(true);
  const { error } = await db.auth.signUp({ email, password });
  setAuthLoading(false);
  if (error) showAuthError(error.message);
  else showAuthError('Check your email to confirm your account', 'info');
}

async function onGoogleSignIn() {
  const { error } = await db.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/flipper/' },
  });
  if (error) showAuthError(error.message);
}

async function onSignOut() {
  await db.auth.signOut();
  el('user-modal').classList.remove('open');
}

function showAuthError(msg, type = 'error') {
  const e = el('auth-error');
  e.textContent = msg;
  e.className = `auth-error ${type}`;
  e.style.display = 'block';
}

function setAuthLoading(on) {
  el('btn-signin').disabled = on;
  el('btn-signup').disabled = on;
  el('btn-signin').textContent = on ? 'Signing in…' : 'Sign In';
}

/* ══════════════════════════════════════════
   SETTINGS (localStorage — local preference)
══════════════════════════════════════════ */
function loadSettings() {
  try {
    const s = localStorage.getItem('flipper_settings');
    if (s) return JSON.parse(s);
  } catch(e) {}
  return { mileageRate: IRS_RATE_DEFAULT };
}

function saveSettings() {
  localStorage.setItem('flipper_settings', JSON.stringify(settings));
}

/* ══════════════════════════════════════════
   APP EVENT BINDING
══════════════════════════════════════════ */
function bindAppEvents() {
  el('user-btn').addEventListener('click', () => {
    el('s_mileage_rate').value = settings.mileageRate ?? IRS_RATE_DEFAULT;
    el('user-modal').classList.add('open');
  });
  el('close-user-modal').addEventListener('click', () => el('user-modal').classList.remove('open'));
  el('user-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) el('user-modal').classList.remove('open');
  });
  el('btn-save-settings').addEventListener('click', () => {
    const rate = parseFloat(val('s_mileage_rate'));
    if (rate > 0) settings.mileageRate = rate;
    saveSettings();
    el('user-modal').classList.remove('open');
    updateCalcRateNote();
    toast('Settings saved');
    if (currentItem) renderDetail(currentItem);
    renderDashboard();
  });
  el('btn-signout').addEventListener('click', onSignOut);

  el('btn-save-item').addEventListener('click', onSaveItem);
  el('btn-cancel-item').addEventListener('click', onCancelItem);

  el('detail-back').addEventListener('click', () => showView('items'));

  el('lightbox').addEventListener('click', e => {
    if (e.target === e.currentTarget || e.target.id === 'lightbox-close') closeLightbox();
  });
  el('lightbox-close').addEventListener('click', closeLightbox);

  el('items-filter-bar').addEventListener('click', e => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    activeFilter = chip.dataset.status;
    el('items-filter-bar').querySelectorAll('.filter-chip').forEach(c =>
      c.classList.toggle('active', c.dataset.status === activeFilter));
    renderItemsList();
  });
}

/* ══════════════════════════════════════════
   VIEW ROUTING
══════════════════════════════════════════ */
function showView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  el(`view-${viewId}`).classList.add('active');

  const tabViews = ['dashboard','items','add-item','calc','archive'];
  document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.remove('active'));
  if (tabViews.includes(viewId)) {
    const btn = el(`nav-${viewId}`);
    if (btn) btn.classList.add('active');
  }
  el('bottom-nav').style.display = viewId === 'detail' ? 'none' : 'flex';
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (viewId === 'archive') renderArchive();
  if (viewId === 'calc') populateCalcDropdown();
}

/* ══════════════════════════════════════════
   DATA LAYER — LOAD
══════════════════════════════════════════ */
async function loadItems() {
  el('spinner-dashboard').style.display = 'block';
  el('dashboard-content').innerHTML = '';

  const { data, error } = await db
    .from('items')
    .select('*, parts(*), trips(*), photos(*)')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false });

  el('spinner-dashboard').style.display = 'none';

  if (error) {
    el('dashboard-content').innerHTML = `
      <div class="empty-state">
        <div class="icon">📡</div>
        <p>Could not load your data.<br>Check your connection.</p>
        <button class="btn btn-secondary" style="width:auto;padding:0 24px;margin:16px auto 0;" onclick="loadItems()">Retry</button>
      </div>`;
    return;
  }

  items = data || [];
  renderDashboard();
  renderItemsList();
}

/* ══════════════════════════════════════════
   DATA LAYER — ITEMS CRUD
══════════════════════════════════════════ */
async function addItem(payload) {
  const { data, error } = await db.from('items').insert({
    user_id:        currentUser.id,
    name:           payload.name,
    category:       payload.category,
    description:    payload.description,
    status:         payload.status,
    date_added:     payload.date_added,
    date_sold:      payload.date_sold || null,
    purchase_price: payload.purchase_price,
    sell_price:     payload.sell_price || null,
  }).select('*, parts(*), trips(*), photos(*)').single();

  if (error) { toast('Failed to save — check your connection'); return null; }
  data.parts = data.parts || [];
  data.trips = data.trips || [];
  data.photos = data.photos || [];
  items.unshift(data);
  renderDashboard();
  renderItemsList();
  toast('Flip saved!');
  return data;
}

async function updateItemFields(id, changes) {
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return;
  const prev = { ...items[idx] };
  Object.assign(items[idx], changes);
  renderDashboard();
  if (currentItem?.id === id) renderDetail(items[idx]);

  const { error } = await db.from('items').update(changes).eq('id', id).eq('user_id', currentUser.id);
  if (error) {
    Object.assign(items[idx], prev);
    if (currentItem?.id === id) renderDetail(prev);
    toast('Update failed — changes not saved');
  }
}

async function archiveItem(id) {
  await updateItemFields(id, { status: 'archived' });
  items = items.filter(i => i.id !== id || i.status === 'archived');
  renderItemsList();
  renderDashboard();
  showView('items');
  toast('Item archived');
}

async function restoreItem(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  await updateItemFields(id, { status: 'active' });
  renderArchive();
  toast('Item restored');
}

async function deleteItem(id) {
  if (!confirm('Permanently delete this flip and all its data?')) return;
  items = items.filter(i => i.id !== id);
  renderDashboard();
  renderItemsList();
  showView('items');

  const { error } = await db.from('items').delete().eq('id', id).eq('user_id', currentUser.id);
  if (error) { toast('Delete failed'); loadItems(); }
  else toast('Flip deleted');
}

/* ══════════════════════════════════════════
   DATA LAYER — PARTS
══════════════════════════════════════════ */
async function addPart(itemId, name, cost, date) {
  const { data, error } = await db.from('parts').insert({
    item_id: itemId, user_id: currentUser.id,
    name, cost: parseFloat(cost) || 0, date: date || todayISO(),
  }).select().single();
  if (error) { toast('Failed to save part'); return; }
  const item = items.find(i => i.id === itemId);
  if (item) { item.parts = item.parts || []; item.parts.push(data); renderDetail(item); renderDashboard(); }
}

async function deletePart(itemId, partId) {
  const item = items.find(i => i.id === itemId);
  if (!item) return;
  const prev = [...(item.parts || [])];
  item.parts = item.parts.filter(p => p.id !== partId);
  renderDetail(item);
  renderDashboard();
  const { error } = await db.from('parts').delete().eq('id', partId).eq('user_id', currentUser.id);
  if (error) { item.parts = prev; renderDetail(item); toast('Delete failed'); }
}

/* ══════════════════════════════════════════
   DATA LAYER — TRIPS
══════════════════════════════════════════ */
async function addTrip(itemId, purpose, miles, date, notes) {
  const { data, error } = await db.from('trips').insert({
    item_id: itemId, user_id: currentUser.id,
    purpose, miles: parseFloat(miles) || 0, date: date || todayISO(), notes: notes || '',
  }).select().single();
  if (error) { toast('Failed to save trip'); return; }
  const item = items.find(i => i.id === itemId);
  if (item) { item.trips = item.trips || []; item.trips.push(data); renderDetail(item); renderDashboard(); }
}

async function deleteTrip(itemId, tripId) {
  const item = items.find(i => i.id === itemId);
  if (!item) return;
  const prev = [...(item.trips || [])];
  item.trips = item.trips.filter(t => t.id !== tripId);
  renderDetail(item);
  renderDashboard();
  const { error } = await db.from('trips').delete().eq('id', tripId).eq('user_id', currentUser.id);
  if (error) { item.trips = prev; renderDetail(item); toast('Delete failed'); }
}

/* ══════════════════════════════════════════
   DATA LAYER — PHOTOS
══════════════════════════════════════════ */
async function addPhoto(itemId, dataUrl) {
  const item = items.find(i => i.id === itemId);
  if (!item) return;
  if ((item.photos || []).length >= 6) { toast('Max 6 photos per item'); return; }

  const { data, error } = await db.from('photos').insert({
    item_id: itemId, user_id: currentUser.id, data_url: dataUrl,
  }).select().single();
  if (error) { toast('Photo save failed'); return; }
  item.photos = item.photos || [];
  item.photos.push(data);
  renderDetail(item);
}

async function deletePhoto(itemId, photoId) {
  const item = items.find(i => i.id === itemId);
  if (!item) return;
  const prev = [...(item.photos || [])];
  item.photos = item.photos.filter(p => p.id !== photoId);
  renderDetail(item);
  const { error } = await db.from('photos').delete().eq('id', photoId).eq('user_id', currentUser.id);
  if (error) { item.photos = prev; renderDetail(item); toast('Delete failed'); }
  else toast('Photo removed');
}

/* ══════════════════════════════════════════
   PHOTO COMPRESSION
══════════════════════════════════════════ */
function compressImage(file, maxPx = 800, quality = 0.75) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const ratio  = Math.min(maxPx / img.width, maxPx / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function handlePhotoInput(itemId, input) {
  const files = Array.from(input.files || []);
  for (const file of files) {
    const dataUrl = await compressImage(file);
    if (dataUrl.length > 400000) { toast('Image too large — try a smaller photo'); continue; }
    await addPhoto(itemId, dataUrl);
  }
  input.value = '';
}

/* ══════════════════════════════════════════
   LIGHTBOX
══════════════════════════════════════════ */
function openLightbox(dataUrl) {
  el('lightbox-img').src = dataUrl;
  el('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  el('lightbox').classList.remove('open');
  el('lightbox-img').src = '';
  document.body.style.overflow = '';
}

/* ══════════════════════════════════════════
   COMPUTED FINANCIALS
══════════════════════════════════════════ */
function computeFinancials(item) {
  const rate        = settings.mileageRate ?? IRS_RATE_DEFAULT;
  const partsCost   = (item.parts  || []).reduce((s, p) => s + (parseFloat(p.cost)  || 0), 0);
  const totalMiles  = (item.trips  || []).reduce((s, t) => s + (parseFloat(t.miles) || 0), 0);
  const mileageCost = totalMiles * rate;
  const totalIn     = (parseFloat(item.purchase_price) || 0) + partsCost + mileageCost;
  const sellPrice   = parseFloat(item.sell_price) || 0;
  const profit      = sellPrice > 0 ? sellPrice - totalIn : null;
  const margin      = (profit !== null && sellPrice > 0) ? (profit / sellPrice * 100) : null;
  return { partsCost, totalMiles, mileageCost, totalIn, sellPrice, profit, margin };
}

/* ══════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════ */
function renderDashboard() {
  const visible = items.filter(i => i.status !== 'archived');
  const active  = visible.filter(i => i.status !== 'sold');
  const sold    = visible.filter(i => i.status === 'sold');

  const totalInvested = active.reduce((s, i) => s + computeFinancials(i).totalIn, 0);
  const totalRevenue  = sold.reduce((s, i) => s + (parseFloat(i.sell_price) || 0), 0);
  const totalCOGS     = sold.reduce((s, i) => s + computeFinancials(i).totalIn, 0);
  const totalProfit   = totalRevenue - totalCOGS;

  const recentItems = [...visible].slice(0, 5);

  el('dashboard-content').innerHTML = `
    <div class="summary-chips">
      <div class="summary-chip">
        <span class="chip-val">${active.length}</span>Active
      </div>
      <div class="summary-chip">
        <span class="chip-val">${money(totalInvested)}</span>Invested
      </div>
      <div class="summary-chip">
        <span class="chip-val green">${money(totalRevenue)}</span>Revenue
      </div>
      <div class="summary-chip">
        <span class="chip-val ${totalProfit >= 0 ? 'green' : 'red'}">${money(totalProfit)}</span>Profit
      </div>
      <div class="summary-chip">
        <span class="chip-val">${sold.length}</span>Sold
      </div>
    </div>

    ${recentItems.length ? `
      <div class="section-title">Recent Flips</div>
      ${recentItems.map(i => itemCardHTML(i)).join('')}
    ` : `
      <div class="empty-state">
        <div class="icon">📦</div>
        <p>No flips yet.<br>Tap <strong>Add</strong> to track your first item.</p>
      </div>
    `}
  `;

  el('dashboard-content').querySelectorAll('.item-card').forEach(card => {
    card.addEventListener('click', () => {
      const item = items.find(i => i.id === card.dataset.id);
      if (item) openDetail(item);
    });
  });
}

/* ══════════════════════════════════════════
   ITEMS LIST
══════════════════════════════════════════ */
function renderItemsList() {
  const filtered = items.filter(i => {
    if (i.status === 'archived') return false;
    if (activeFilter === 'all') return true;
    return i.status === activeFilter;
  });

  if (!filtered.length) {
    el('items-list').innerHTML = `
      <div class="empty-state">
        <div class="icon">📦</div>
        <p>No items here yet.</p>
      </div>`;
    return;
  }

  el('items-list').innerHTML = filtered.map(i => itemCardHTML(i)).join('');
  el('items-list').querySelectorAll('.item-card').forEach(card => {
    card.addEventListener('click', () => {
      const item = items.find(i => i.id === card.dataset.id);
      if (item) openDetail(item);
    });
  });
}

function itemCardHTML(item) {
  const fin         = computeFinancials(item);
  const statusClass = `status-${item.status}`;
  const statusLabel = item.status.charAt(0).toUpperCase() + item.status.slice(1);

  let financialHTML = '';
  if (item.status === 'sold' && fin.profit !== null) {
    const cls = fin.profit >= 0 ? 'profit-positive' : 'profit-negative';
    financialHTML = `<span class="${cls}">${fin.profit >= 0 ? '+' : ''}${money(fin.profit)}</span>`;
  } else {
    financialHTML = `<span class="invested-label">in: ${money(fin.totalIn)}</span>`;
  }

  const firstPhoto = (item.photos || [])[0];
  const thumbHTML  = firstPhoto
    ? `<img src="${esc(firstPhoto.data_url)}" alt="">`
    : (item.category === 'Vehicles' ? '🚗' : item.category === 'Electronics' ? '📱'
       : item.category === 'Furniture' ? '🪑' : item.category === 'Clothing' ? '👕'
       : item.category === 'Tools' ? '🔧' : '📦');

  return `
    <div class="item-card" data-id="${esc(item.id)}">
      <div class="item-thumb">${firstPhoto ? thumbHTML : `<span>${thumbHTML}</span>`}</div>
      <div class="item-info">
        <div class="item-name">${esc(item.name)}</div>
        <div class="item-meta">
          <span class="status-pill ${statusClass}">${statusLabel}</span>
          <span class="item-category">${esc(item.category)}</span>
        </div>
        <div class="item-financials">
          ${financialHTML}
          ${item.status === 'sold' && fin.margin !== null
            ? `<span style="color:var(--muted);font-size:12px;">${fin.margin.toFixed(0)}% margin</span>`
            : ''}
        </div>
      </div>
    </div>
  `;
}

/* ══════════════════════════════════════════
   ARCHIVE
══════════════════════════════════════════ */
function renderArchive() {
  const archived = items.filter(i => i.status === 'archived');
  if (!archived.length) {
    el('archive-list').innerHTML = `
      <div class="empty-state">
        <div class="icon">🗂</div>
        <p>No archived flips.</p>
      </div>`;
    return;
  }
  el('archive-list').innerHTML = archived.map(item => {
    const fin = computeFinancials(item);
    return `
      <div class="card" style="display:flex;align-items:center;gap:12px;">
        <div style="flex:1;min-width:0;">
          <div style="font-weight:700;font-size:15px;margin-bottom:4px;">${esc(item.name)}</div>
          <div style="font-size:13px;color:var(--muted);">${esc(item.category)} · in: ${money(fin.totalIn)}</div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="restoreItem('${esc(item.id)}')">Restore</button>
      </div>
    `;
  }).join('');
}

/* ══════════════════════════════════════════
   ADD / EDIT FORM
══════════════════════════════════════════ */
function openAddForm(item) {
  editingItem = item || null;
  el('add-item-title').textContent = item ? 'Edit Flip' : 'New Flip';

  if (item) {
    setVal('fi_name',           item.name);
    setVal('fi_category',       item.category);
    setVal('fi_description',    item.description || '');
    setVal('fi_status',         item.status);
    setVal('fi_date_added',     item.date_added || todayISO());
    setVal('fi_purchase_price', item.purchase_price || '');
    setVal('fi_sell_price',     item.sell_price || '');
    setVal('fi_date_sold',      item.date_sold || '');
  } else {
    setVal('fi_name',           '');
    setVal('fi_category',       'Furniture');
    setVal('fi_description',    '');
    setVal('fi_status',         'active');
    setVal('fi_date_added',     todayISO());
    setVal('fi_purchase_price', '');
    setVal('fi_sell_price',     '');
    setVal('fi_date_sold',      '');
  }
  toggleSoldFields();
  showView('add-item');
}

function toggleSoldFields() {
  const sold = val('fi_status') === 'sold';
  el('sold-fields').style.display = sold ? 'block' : 'none';
  if (sold && !val('fi_date_sold')) setVal('fi_date_sold', todayISO());
}

async function onSaveItem() {
  const name = val('fi_name').trim();
  if (!name) { toast('Item name is required'); return; }

  const payload = {
    name,
    category:       val('fi_category'),
    description:    val('fi_description').trim(),
    status:         val('fi_status'),
    date_added:     val('fi_date_added') || todayISO(),
    purchase_price: parseFloat(val('fi_purchase_price')) || 0,
    sell_price:     parseFloat(val('fi_sell_price')) || null,
    date_sold:      val('fi_status') === 'sold' ? (val('fi_date_sold') || todayISO()) : null,
  };

  el('btn-save-item').disabled = true;
  el('btn-save-item').textContent = 'Saving…';

  if (editingItem) {
    await updateItemFields(editingItem.id, payload);
    const updated = items.find(i => i.id === editingItem.id);
    editingItem = null;
    if (updated) openDetail(updated);
    else showView('items');
  } else {
    const created = await addItem(payload);
    if (created) openDetail(created);
    else showView('items');
  }

  el('btn-save-item').disabled = false;
  el('btn-save-item').textContent = 'Save Flip';
}

function onCancelItem() {
  if (editingItem) { openDetail(editingItem); editingItem = null; }
  else showView('items');
}

/* ══════════════════════════════════════════
   DETAIL VIEW
══════════════════════════════════════════ */
function openDetail(item) {
  currentItem = item;
  renderDetail(item);
  showView('detail');
}

function renderDetail(item) {
  currentItem = item;
  const fin = computeFinancials(item);
  const rate = settings.mileageRate ?? IRS_RATE_DEFAULT;

  const photoInputId = `photo-input-${item.id}`;
  const photos = item.photos || [];
  const parts  = item.parts  || [];
  const trips  = item.trips  || [];

  el('detail-content').innerHTML = `
    <!-- STATUS PILL -->
    <div style="margin-top:14px;margin-bottom:4px;">
      <span class="status-pill status-${item.status}" style="font-size:13px;padding:4px 14px;">
        ${item.status.charAt(0).toUpperCase() + item.status.slice(1)}
      </span>
    </div>
    <h2 style="font-size:20px;font-weight:800;margin-bottom:16px;">${esc(item.name)}</h2>

    <!-- FINANCIAL SUMMARY -->
    <div class="card">
      <div class="card-title">Financials</div>
      <div class="fin-summary">
        <div class="fin-box">
          <div class="fin-label">Purchase</div>
          <div class="fin-val">${money(item.purchase_price)}</div>
        </div>
        <div class="fin-box">
          <div class="fin-label">Parts &amp; Repairs</div>
          <div class="fin-val">${money(fin.partsCost)}</div>
        </div>
        <div class="fin-box">
          <div class="fin-label">Mileage (${fin.totalMiles.toFixed(1)} mi)</div>
          <div class="fin-val">${money(fin.mileageCost)}</div>
        </div>
        <div class="fin-box">
          <div class="fin-label">Total Invested</div>
          <div class="fin-val">${money(fin.totalIn)}</div>
        </div>
        ${item.status === 'sold' ? `
        <div class="fin-box">
          <div class="fin-label">Sell Price</div>
          <div class="fin-val">${money(fin.sellPrice)}</div>
        </div>
        <div class="fin-box">
          <div class="fin-label">Net Profit</div>
          <div class="fin-val ${fin.profit >= 0 ? 'green' : 'red'}">${fin.profit !== null ? money(fin.profit) : '—'}</div>
        </div>
        ` : ''}
      </div>
      ${item.status !== 'sold' ? `
        <p style="font-size:12px;color:var(--muted);margin-bottom:10px;">Break-even sell price: <strong>${money(fin.totalIn)}</strong></p>
      ` : ''}
      <button class="btn btn-secondary btn-sm" style="width:100%;" onclick="openAddForm(items.find(i=>i.id==='${esc(item.id)}'))">✏️ Edit Item Info</button>
    </div>

    <!-- PHOTOS -->
    <div class="card">
      <div class="card-title">Photos</div>
      <div class="photo-strip" id="photo-strip-${esc(item.id)}">
        ${photos.map(p => `
          <div class="photo-thumb-wrap">
            <img class="photo-thumb" src="${esc(p.data_url)}" alt="" onclick="openLightbox('${esc(p.data_url)}')">
            <button class="photo-del" onclick="deletePhoto('${esc(item.id)}','${esc(p.id)}')" aria-label="Remove photo">×</button>
          </div>
        `).join('')}
        ${photos.length < 6 ? `
          <div class="photo-add-btn" onclick="el('${photoInputId}').click()">
            <span class="icon">📷</span><span>Add</span>
          </div>
        ` : ''}
      </div>
      <input type="file" id="${photoInputId}" accept="image/*" capture="environment" multiple style="display:none;"
        onchange="handlePhotoInput('${esc(item.id)}', this)">
      <p style="font-size:11px;color:var(--muted);margin-top:8px;">${photos.length}/6 photos</p>
    </div>

    <!-- PARTS -->
    <div class="card">
      <div class="card-title">Parts &amp; Repairs</div>
      <div id="parts-list-${esc(item.id)}">
        ${parts.length ? parts.map(p => `
          <div class="line-item-row">
            <div class="line-item-info">
              <div class="line-item-name">${esc(p.name)}</div>
              <div class="line-item-sub">${p.date || ''}</div>
            </div>
            <span class="line-item-cost">${money(p.cost)}</span>
            <button class="del-btn" onclick="deletePart('${esc(item.id)}','${esc(p.id)}')">×</button>
          </div>
        `).join('') : '<p style="font-size:13px;color:var(--muted);padding:8px 0;">No parts logged yet.</p>'}
      </div>
      <div style="margin-top:10px;">
        <button class="btn btn-ghost btn-sm" style="width:100%;" onclick="toggleInlineForm('add-part-form-${esc(item.id)}')">+ Add Part / Repair</button>
      </div>
      <div class="inline-form" id="add-part-form-${esc(item.id)}" style="display:none;">
        <div class="field"><label>Part Name</label><input type="text" id="pf_name_${esc(item.id)}" placeholder="e.g. Drawer pulls"></div>
        <div class="form-row">
          <div class="field"><label>Cost ($)</label><input type="number" id="pf_cost_${esc(item.id)}" placeholder="0.00" inputmode="decimal" step="0.01" min="0"></div>
          <div class="field"><label>Date</label><input type="date" id="pf_date_${esc(item.id)}" value="${todayISO()}"></div>
        </div>
        <button class="btn btn-primary btn-sm" style="width:100%;margin-top:6px;"
          onclick="onAddPart('${esc(item.id)}')">Save Part</button>
      </div>
    </div>

    <!-- MILEAGE LOG -->
    <div class="card">
      <div class="card-title">Mileage Log</div>
      <p class="section-sub">Rate: $${rate.toFixed(2)}/mile — adjust in Account settings</p>
      <div id="trips-list-${esc(item.id)}">
        ${trips.length ? trips.map(t => `
          <div class="line-item-row">
            <div class="line-item-info">
              <div class="line-item-name">${esc(t.purpose)}</div>
              <div class="line-item-sub">${t.date || ''} · ${t.miles} mi${t.notes ? ' · ' + esc(t.notes) : ''}</div>
            </div>
            <span class="line-item-cost">${money((parseFloat(t.miles)||0) * rate)}</span>
            <button class="del-btn" onclick="deleteTrip('${esc(item.id)}','${esc(t.id)}')">×</button>
          </div>
        `).join('') : '<p style="font-size:13px;color:var(--muted);padding:8px 0;">No trips logged yet.</p>'}
      </div>
      <div style="margin-top:10px;">
        <button class="btn btn-ghost btn-sm" style="width:100%;" onclick="toggleInlineForm('add-trip-form-${esc(item.id)}')">+ Log Trip</button>
      </div>
      <div class="inline-form" id="add-trip-form-${esc(item.id)}" style="display:none;">
        <div class="field"><label>Purpose</label><input type="text" id="tf_purpose_${esc(item.id)}" placeholder="e.g. Pickup, Parts run, Dropoff"></div>
        <div class="form-row">
          <div class="field"><label>Miles Driven</label><input type="number" id="tf_miles_${esc(item.id)}" placeholder="0" inputmode="decimal" step="0.1" min="0"></div>
          <div class="field"><label>Date</label><input type="date" id="tf_date_${esc(item.id)}" value="${todayISO()}"></div>
        </div>
        <div class="field"><label>Notes (optional)</label><input type="text" id="tf_notes_${esc(item.id)}" placeholder="e.g. 45 min drive"></div>
        <button class="btn btn-primary btn-sm" style="width:100%;margin-top:6px;"
          onclick="onAddTrip('${esc(item.id)}')">Save Trip</button>
      </div>
    </div>

    <!-- ACTIONS -->
    <div class="card">
      <div class="card-title">Actions</div>
      ${item.status !== 'archived' ? `
        <button class="btn btn-ghost" onclick="archiveItem('${esc(item.id)}')">🗂 Archive Item</button>
      ` : `
        <button class="btn btn-secondary" onclick="restoreItem('${esc(item.id)}')">↩️ Restore Item</button>
      `}
      <button class="btn btn-warn" onclick="deleteItem('${esc(item.id)}')">🗑 Delete Permanently</button>
    </div>
  `;
}

function toggleInlineForm(id) {
  const f = el(id);
  if (!f) return;
  f.style.display = f.style.display === 'none' ? 'block' : 'none';
}

async function onAddPart(itemId) {
  const name = val(`pf_name_${itemId}`).trim();
  const cost = val(`pf_cost_${itemId}`);
  const date = val(`pf_date_${itemId}`);
  if (!name) { toast('Part name required'); return; }
  await addPart(itemId, name, cost, date);
  el(`add-part-form-${itemId}`).style.display = 'none';
}

async function onAddTrip(itemId) {
  const purpose = val(`tf_purpose_${itemId}`).trim();
  const miles   = val(`tf_miles_${itemId}`);
  const date    = val(`tf_date_${itemId}`);
  const notes   = val(`tf_notes_${itemId}`).trim();
  if (!purpose) { toast('Purpose is required'); return; }
  if (!miles || parseFloat(miles) <= 0) { toast('Enter miles driven'); return; }
  await addTrip(itemId, purpose, miles, date, notes);
  el(`add-trip-form-${itemId}`).style.display = 'none';
}

/* ══════════════════════════════════════════
   PROFIT CALCULATOR
══════════════════════════════════════════ */
function populateCalcDropdown() {
  const visible = items.filter(i => i.status !== 'archived');
  const select  = el('calc-item-select');
  select.innerHTML = '<option value="">— scratch pad —</option>'
    + visible.map(i => `<option value="${esc(i.id)}">${esc(i.name)}</option>`).join('');
}

function loadItemIntoCalc() {
  const id   = val('calc-item-select');
  const item = items.find(i => i.id === id);
  if (!item) { clearCalc(); return; }
  const fin = computeFinancials(item);
  setVal('calc-purchase', item.purchase_price || '');
  setVal('calc-parts',    fin.partsCost.toFixed(2));
  setVal('calc-miles',    fin.totalMiles.toFixed(1));
  setVal('calc-sell',     item.sell_price || '');
  recalcQuick();
}

function clearCalc() {
  ['calc-purchase','calc-parts','calc-miles','calc-sell'].forEach(id => setVal(id, ''));
  recalcQuick();
}

function recalcQuick() {
  const rate     = settings.mileageRate ?? IRS_RATE_DEFAULT;
  const purchase = parseFloat(val('calc-purchase')) || 0;
  const parts    = parseFloat(val('calc-parts'))    || 0;
  const miles    = parseFloat(val('calc-miles'))    || 0;
  const sell     = parseFloat(val('calc-sell'))     || 0;

  const mileageCost = miles * rate;
  const totalCost   = purchase + parts + mileageCost;
  const profit      = sell > 0 ? sell - totalCost : null;
  const margin      = (profit !== null && sell > 0) ? (profit / sell * 100) : null;

  el('calc-res-mileage').textContent   = money(mileageCost);
  el('calc-res-cost').textContent      = money(totalCost);
  el('calc-res-breakeven').textContent = money(totalCost);

  const profitRow = el('calc-profit-row');
  if (profit !== null) {
    el('calc-res-profit').textContent = (profit >= 0 ? '+' : '') + money(profit);
    el('calc-res-profit').style.color = profit >= 0 ? 'var(--accent)' : 'var(--warn)';
    profitRow.className = `calc-result-row total ${profit < 0 ? 'loss' : ''}`;
  } else {
    el('calc-res-profit').textContent = '—';
    el('calc-res-profit').style.color = '';
  }
  el('calc-res-margin').textContent = margin !== null ? margin.toFixed(1) + '%' : '—';
  el('calc-res-margin').style.color = margin !== null
    ? (margin >= 0 ? 'var(--accent)' : 'var(--warn)') : '';
}

function updateCalcRateNote() {
  const rate = settings.mileageRate ?? IRS_RATE_DEFAULT;
  const noteEl = el('calc-rate-note');
  if (noteEl) noteEl.textContent = `IRS mileage rate: $${rate.toFixed(2)}/mile. Update in Account settings.`;
}

/* ══════════════════════════════════════════
   UTILITIES
══════════════════════════════════════════ */
function el(id)        { return document.getElementById(id); }
function val(id)       { return el(id)?.value || ''; }
function setVal(id, v) { const e = el(id); if (e) e.value = v ?? ''; }

function money(n) {
  return '$' + (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function esc(s) {
  return String(s || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

function todayISO() { return new Date().toISOString().slice(0, 10); }

function toast(msg) {
  const t = el('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}
