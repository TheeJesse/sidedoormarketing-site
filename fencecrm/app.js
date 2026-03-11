/* ═══════════════════════════════════════════
   FenceCRM — app.js
   Peace of Mind Maintenance LLC — Jesse Tegtmeier
   ═══════════════════════════════════════════ */

'use strict';

/* ══════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════ */
const STAGES = [
  'Lead',
  'Estimate Sent',
  'Follow-Up',
  'Deposit Paid',
  'Job Scheduled',
  'Complete',
  'Review Requested',
];

const STAGE_COLORS = {
  'Lead':              'stage-1',
  'Estimate Sent':     'stage-2',
  'Follow-Up':         'stage-3',
  'Deposit Paid':      'stage-4',
  'Job Scheduled':     'stage-5',
  'Complete':          'stage-6',
  'Review Requested':  'stage-7',
};

// Sheet column indices (0-based)
const COL = {
  PO: 0, CustomerName: 1, ContactName: 2, Phone: 3, Email: 4,
  Address: 5, LF: 6, FenceType: 7, EstimateTotal: 8, ReferralSource: 9,
  Stage: 10, EstimateSentDate: 11, DepositPaidDate: 12, JobDate: 13,
  CompletionDate: 14, Notes: 15, Draft1Sent: 16, Draft2Sent: 17,
  Draft3Sent: 18, ReviewSent: 19, CreatedAt: 20, UpdatedAt: 21,
};
const NUM_COLS = 22;
const SHEET_RANGE = 'Sheet1';

/* ══════════════════════════════════════════
   STATE
══════════════════════════════════════════ */
let settings = loadSettings();
let leads    = [];           // array of lead objects
let currentLead = null;      // lead being viewed in detail
let offlineQueue = [];        // rows to retry on next load
let currentView  = null;

/* ══════════════════════════════════════════
   INIT
══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  offlineQueue = loadOfflineQueue();
  applySettingsToForms();
  bindEvents();

  const urlLead = parseURLParams();

  if (!settings.sheetId || !settings.apiKey) {
    showView('setup');
    if (urlLead) prefillNewLead(urlLead);
  } else {
    loadLeadsFromSheets().then(() => {
      if (urlLead) {
        prefillNewLead(urlLead);
        showView('new-lead');
      } else {
        showView('pipeline');
      }
      retryOfflineQueue();
    });
  }
});

/* ══════════════════════════════════════════
   SETTINGS
══════════════════════════════════════════ */
function loadSettings() {
  try {
    const s = localStorage.getItem('fcrm_settings');
    if (s) return JSON.parse(s);
  } catch(e) {}
  return {
    ownerName:   'Jesse Tegtmeier',
    companyName: 'Peace of Mind Maintenance LLC',
    phone:       '850-776-4175',
    reviewLink:  '',
    sheetId:     '',
    apiKey:      '',
  };
}

function saveSettings() {
  localStorage.setItem('fcrm_settings', JSON.stringify(settings));
}

function applySettingsToForms() {
  setVal('s_ownerName',   settings.ownerName);
  setVal('s_companyName', settings.companyName);
  setVal('s_phone',       settings.phone);
  setVal('s_reviewLink',  settings.reviewLink);
  setVal('s_sheetId',     settings.sheetId);
  setVal('s_apiKey',      settings.apiKey);
  // Header subtitle
  el('headerSubtitle').textContent = settings.companyName || 'Peace of Mind Maintenance LLC';
}

/* ══════════════════════════════════════════
   VIEW ROUTING
══════════════════════════════════════════ */
function showView(viewId, skipNavHighlight) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  el(`view-${viewId}`).classList.add('active');
  currentView = viewId;

  // Bottom nav highlight (only for main nav views)
  document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.remove('active'));
  const navBtn = el(`nav-${viewId}`);
  if (navBtn && !skipNavHighlight) navBtn.classList.add('active');

  // Show/hide bottom nav for detail view
  document.querySelector('.bottom-nav').style.display =
    (viewId === 'setup' || viewId === 'detail') ? 'none' : 'flex';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ══════════════════════════════════════════
   EVENT BINDING
══════════════════════════════════════════ */
function bindEvents() {
  // Settings modal
  el('settingsBtn').addEventListener('click', () => {
    applySettingsToForms();
    el('settingsModal').classList.add('open');
  });
  el('closeSettings').addEventListener('click', () => el('settingsModal').classList.remove('open'));
  el('settingsModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) el('settingsModal').classList.remove('open');
  });
  el('saveSettingsBtn').addEventListener('click', onSaveSettings);
  el('settingsTestBtn').addEventListener('click', () => testConnection('settingsConnStatus'));
  el('reconfigureBtn').addEventListener('click', () => {
    el('settingsModal').classList.remove('open');
    showView('setup');
  });

  // Setup screen
  el('testConnectionBtn').addEventListener('click', () => testConnection('connectionStatus'));
  el('setupSaveBtn').addEventListener('click', onSetupSave);

  // New lead
  el('saveNewLeadBtn').addEventListener('click', onSaveNewLead);
  el('cancelNewLeadBtn').addEventListener('click', () => showView('pipeline'));

  // Detail back
  el('detailBack').addEventListener('click', () => showView('pipeline'));

  // Search
  el('searchInput').addEventListener('input', onSearch);
}

function onSaveSettings() {
  settings.ownerName   = val('s_ownerName')   || settings.ownerName;
  settings.companyName = val('s_companyName') || settings.companyName;
  settings.phone       = val('s_phone')       || settings.phone;
  settings.reviewLink  = val('s_reviewLink');
  settings.sheetId     = val('s_sheetId').trim();
  settings.apiKey      = val('s_apiKey').trim();
  saveSettings();
  el('settingsModal').classList.remove('open');
  applySettingsToForms();
  toast('Settings saved');
}

function onSetupSave() {
  const sheetId = val('setup_sheetId').trim();
  const apiKey  = val('setup_apiKey').trim();
  if (!sheetId || !apiKey) {
    toast('Enter both Sheet ID and API Key');
    return;
  }
  settings.sheetId = sheetId;
  settings.apiKey  = apiKey;
  saveSettings();
  toast('Connecting…');
  loadLeadsFromSheets().then(() => {
    showView('pipeline');
    retryOfflineQueue();
  });
}

/* ══════════════════════════════════════════
   URL PARAMS — incoming from FenceFlow
══════════════════════════════════════════ */
function parseURLParams() {
  const p = new URLSearchParams(window.location.search);
  if (!p.get('po') && !p.get('name')) return null;
  return {
    po:          p.get('po')       || '',
    custName:    p.get('name')     || '',
    contactName: p.get('contact')  || '',
    phone:       p.get('phone')    || '',
    email:       p.get('email')    || '',
    address:     p.get('addr')     || '',
    lf:          p.get('lf')       || '',
    total:       p.get('total')    || '',
    referral:    p.get('referral') || '',
    stage:       stageFromParam(p.get('stage') || 'estimate_sent'),
    sentDate:    p.get('date')     || todayISO(),
    fenceType:   '6ft Treated Pine Privacy',
  };
}

function stageFromParam(s) {
  const map = {
    lead: 'Lead', estimate_sent: 'Estimate Sent',
    follow_up: 'Follow-Up', deposit_paid: 'Deposit Paid',
    job_scheduled: 'Job Scheduled', complete: 'Complete',
    review_requested: 'Review Requested',
  };
  return map[s] || 'Estimate Sent';
}

function prefillNewLead(data) {
  setVal('nl_custName',    data.custName);
  setVal('nl_contactName', data.contactName);
  setVal('nl_phone',       data.phone);
  setVal('nl_email',       data.email);
  setVal('nl_address',     data.address);
  setVal('nl_po',          data.po);
  setVal('nl_total',       data.total);
  setVal('nl_lf',          data.lf);
  setVal('nl_fenceType',   data.fenceType || '6ft Treated Pine Privacy');
  setVal('nl_referral',    data.referral);
  setVal('nl_stage',       data.stage);
  setVal('nl_sentDate',    data.sentDate);
}

/* ══════════════════════════════════════════
   GOOGLE SHEETS API
══════════════════════════════════════════ */
function sheetsBase() {
  return `https://sheets.googleapis.com/v4/spreadsheets/${settings.sheetId}`;
}

async function sheetsGet(range) {
  const url = `${sheetsBase()}/values/${encodeURIComponent(range)}?key=${settings.apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sheets GET ${res.status}: ${await res.text()}`);
  return res.json();
}

async function sheetsAppend(values) {
  const url = `${sheetsBase()}/values/${SHEET_RANGE}!A1:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS&key=${settings.apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ values }),
  });
  if (!res.ok) throw new Error(`Sheets APPEND ${res.status}: ${await res.text()}`);
  return res.json();
}

async function sheetsUpdate(range, values) {
  const url = `${sheetsBase()}/values/${encodeURIComponent(range)}?valueInputOption=RAW&key=${settings.apiKey}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ values }),
  });
  if (!res.ok) throw new Error(`Sheets PUT ${res.status}: ${await res.text()}`);
  return res.json();
}

async function testConnection(statusElId) {
  const sid = statusElId === 'connectionStatus'
    ? val('setup_sheetId').trim()  : val('s_sheetId').trim();
  const key = statusElId === 'connectionStatus'
    ? val('setup_apiKey').trim()   : val('s_apiKey').trim();

  const statusEl = el(statusElId);
  statusEl.className = 'connection-status';
  statusEl.textContent = 'Testing…';
  statusEl.style.display = 'block';

  if (!sid || !key) {
    statusEl.className = 'connection-status err';
    statusEl.textContent = '❌ Enter both Sheet ID and API Key first.';
    return;
  }

  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sid}/values/Sheet1!A1:V1?key=${key}`;
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `HTTP ${res.status}`);
    }
    statusEl.className = 'connection-status ok';
    statusEl.textContent = '✅ Connected! Google Sheets is ready.';
  } catch(e) {
    statusEl.className = 'connection-status err';
    statusEl.textContent = `❌ ${e.message}`;
  }
}

/* ══════════════════════════════════════════
   LOAD LEADS
══════════════════════════════════════════ */
async function loadLeadsFromSheets() {
  if (!settings.sheetId || !settings.apiKey) return;
  try {
    const data = await sheetsGet(`${SHEET_RANGE}!A1:V`);
    const rows = data.values || [];
    leads = rows
      .filter((r, i) => i > 0 && r[COL.PO])  // skip header row
      .map(rowToLead);
    renderPipeline();
  } catch(e) {
    console.error('Load leads error:', e);
    toast('Could not load from Sheets — check connection');
  }
}

function rowToLead(row) {
  return {
    po:              row[COL.PO]             || '',
    custName:        row[COL.CustomerName]   || '',
    contactName:     row[COL.ContactName]    || '',
    phone:           row[COL.Phone]          || '',
    email:           row[COL.Email]          || '',
    address:         row[COL.Address]        || '',
    lf:              row[COL.LF]             || '',
    fenceType:       row[COL.FenceType]      || '',
    total:           row[COL.EstimateTotal]  || '',
    referral:        row[COL.ReferralSource] || '',
    stage:           row[COL.Stage]          || 'Lead',
    sentDate:        row[COL.EstimateSentDate]  || '',
    depositDate:     row[COL.DepositPaidDate]   || '',
    jobDate:         row[COL.JobDate]            || '',
    completionDate:  row[COL.CompletionDate]     || '',
    notes:           row[COL.Notes]              || '',
    draft1Sent:      row[COL.Draft1Sent]  === 'TRUE',
    draft2Sent:      row[COL.Draft2Sent]  === 'TRUE',
    draft3Sent:      row[COL.Draft3Sent]  === 'TRUE',
    reviewSent:      row[COL.ReviewSent]  === 'TRUE',
    createdAt:       row[COL.CreatedAt]   || '',
    updatedAt:       row[COL.UpdatedAt]   || '',
    _rowIndex:       null,  // filled after we know the row
  };
}

function leadToRow(lead) {
  const row = new Array(NUM_COLS).fill('');
  row[COL.PO]              = lead.po;
  row[COL.CustomerName]    = lead.custName;
  row[COL.ContactName]     = lead.contactName;
  row[COL.Phone]           = lead.phone;
  row[COL.Email]           = lead.email;
  row[COL.Address]         = lead.address;
  row[COL.LF]              = lead.lf;
  row[COL.FenceType]       = lead.fenceType;
  row[COL.EstimateTotal]   = lead.total;
  row[COL.ReferralSource]  = lead.referral;
  row[COL.Stage]           = lead.stage;
  row[COL.EstimateSentDate]= lead.sentDate;
  row[COL.DepositPaidDate] = lead.depositDate;
  row[COL.JobDate]         = lead.jobDate;
  row[COL.CompletionDate]  = lead.completionDate;
  row[COL.Notes]           = lead.notes;
  row[COL.Draft1Sent]      = lead.draft1Sent ? 'TRUE' : 'FALSE';
  row[COL.Draft2Sent]      = lead.draft2Sent ? 'TRUE' : 'FALSE';
  row[COL.Draft3Sent]      = lead.draft3Sent ? 'TRUE' : 'FALSE';
  row[COL.ReviewSent]      = lead.reviewSent ? 'TRUE' : 'FALSE';
  row[COL.CreatedAt]       = lead.createdAt;
  row[COL.UpdatedAt]       = lead.updatedAt;
  return row;
}

/* ══════════════════════════════════════════
   ENSURE HEADER ROW
══════════════════════════════════════════ */
async function ensureHeaderRow() {
  try {
    const data = await sheetsGet(`${SHEET_RANGE}!A1:V1`);
    if (!data.values || !data.values[0] || data.values[0][0] !== 'PO') {
      await sheetsUpdate(`${SHEET_RANGE}!A1:V1`, [[
        'PO','CustomerName','ContactName','Phone','Email','Address',
        'LF','FenceType','EstimateTotal','ReferralSource','Stage',
        'EstimateSentDate','DepositPaidDate','JobDate','CompletionDate',
        'Notes','Draft1Sent','Draft2Sent','Draft3Sent','ReviewSent',
        'CreatedAt','UpdatedAt',
      ]]);
    }
  } catch(e) {
    console.warn('Could not ensure header:', e);
  }
}

/* ══════════════════════════════════════════
   SAVE NEW LEAD
══════════════════════════════════════════ */
async function onSaveNewLead() {
  const custName = val('nl_custName').trim();
  if (!custName) {
    toast('Customer name is required');
    return;
  }
  let po = val('nl_po').trim();
  if (!po) po = generatePO(custName);

  // Check duplicate PO
  if (leads.find(l => l.po === po)) {
    toast(`PO ${po} already exists — opening existing lead`);
    const existing = leads.find(l => l.po === po);
    openDetail(existing);
    return;
  }

  const now = nowISO();
  const lead = {
    po,
    custName,
    contactName:   val('nl_contactName').trim(),
    phone:         val('nl_phone').trim(),
    email:         val('nl_email').trim(),
    address:       val('nl_address').trim(),
    lf:            val('nl_lf').trim(),
    fenceType:     val('nl_fenceType').trim() || '6ft Treated Pine Privacy',
    total:         val('nl_total').trim(),
    referral:      val('nl_referral').trim(),
    stage:         val('nl_stage') || 'Lead',
    sentDate:      val('nl_sentDate'),
    depositDate:   '',
    jobDate:       '',
    completionDate:'',
    notes:         val('nl_notes').trim()
      ? `[${now}]\n${val('nl_notes').trim()}` : '',
    draft1Sent: false,
    draft2Sent: false,
    draft3Sent: false,
    reviewSent: false,
    createdAt:  now,
    updatedAt:  now,
  };

  leads.unshift(lead);
  renderPipeline();

  try {
    await ensureHeaderRow();
    await sheetsAppend([leadToRow(lead)]);
    toast(`Lead saved — ${lead.po}`);
  } catch(e) {
    console.error('Save lead error:', e);
    toast('Saved locally — will sync when online');
    addToOfflineQueue({ action: 'append', lead });
  }

  clearNewLeadForm();
  showView('pipeline');
}

function clearNewLeadForm() {
  ['nl_custName','nl_contactName','nl_phone','nl_email','nl_address',
   'nl_po','nl_total','nl_lf','nl_referral','nl_notes'].forEach(id => setVal(id, ''));
  setVal('nl_fenceType', '6ft Treated Pine Privacy');
  setVal('nl_stage', 'Estimate Sent');
  setVal('nl_sentDate', '');
}

/* ══════════════════════════════════════════
   UPDATE LEAD IN SHEETS
══════════════════════════════════════════ */
async function updateLead(lead) {
  lead.updatedAt = nowISO();
  // Find row index in sheet (row 1 = header, row 2 = first data row)
  const idx = leads.findIndex(l => l.po === lead.po);
  if (idx === -1) return;
  const sheetRow = idx + 2;  // 1-indexed + 1 for header
  const range = `${SHEET_RANGE}!A${sheetRow}:V${sheetRow}`;

  try {
    await sheetsUpdate(range, [leadToRow(lead)]);
  } catch(e) {
    console.error('Update error:', e);
    toast('Update saved locally — will sync when online');
    addToOfflineQueue({ action: 'update', lead, range });
  }
}

/* ══════════════════════════════════════════
   PIPELINE RENDER
══════════════════════════════════════════ */
function renderPipeline() {
  const board  = el('pipelineBoard');
  const summary = el('pipelineSummary');

  // Summary chips
  const totalValue = leads.reduce((s, l) => s + (parseFloat(l.total) || 0), 0);
  summary.innerHTML = `
    <div class="summary-chip">Total Leads: <span>${leads.length}</span></div>
    <div class="summary-chip">Pipeline: <span>${money(totalValue)}</span></div>
    ${STAGES.map(s => {
      const count = leads.filter(l => l.stage === s).length;
      return count ? `<div class="summary-chip">${s}: <span>${count}</span></div>` : '';
    }).join('')}
  `;

  board.innerHTML = STAGES.map((stage, i) => {
    const stageLeads = leads.filter(l => l.stage === stage);
    const colorClass = STAGE_COLORS[stage] || 'stage-2';
    const cardsHTML  = stageLeads.length
      ? stageLeads.map(l => leadCardHTML(l)).join('')
      : '<div class="stage-empty">No leads</div>';

    return `
      <div class="pipeline-stage">
        <div class="stage-header ${colorClass}">
          <span class="stage-name">${stage}</span>
          <span class="stage-count">${stageLeads.length}</span>
        </div>
        <div class="stage-cards">${cardsHTML}</div>
      </div>
    `;
  }).join('');

  // Bind card taps
  board.querySelectorAll('.lead-card').forEach(card => {
    card.addEventListener('click', () => {
      const lead = leads.find(l => l.po === card.dataset.po);
      if (lead) openDetail(lead);
    });
  });
}

function leadCardHTML(lead) {
  const daysInStage = daysSince(lead.updatedAt || lead.createdAt);
  const followUpInfo = getFollowUpInfo(lead);
  let badgeHTML = '';
  if (followUpInfo) {
    const overdue = followUpInfo.overdue;
    const todayDue = followUpInfo.today;
    const cls = overdue ? 'overdue' : todayDue ? 'today' : '';
    badgeHTML = `<span class="due-badge ${cls}">${followUpInfo.label}</span>`;
  }

  return `
    <div class="lead-card" data-po="${lead.po}">
      <div class="lead-card-top">
        <span class="lead-name">${esc(lead.custName)}</span>
        <span class="lead-total">${lead.total ? money(parseFloat(lead.total)) : '—'}</span>
      </div>
      <div class="lead-card-meta">
        <span class="lead-po">${esc(lead.po)}</span>
        <span class="lead-days">${daysInStage}d in stage</span>
        ${badgeHTML}
      </div>
    </div>
  `;
}

function getFollowUpInfo(lead) {
  if (lead.stage !== 'Estimate Sent' && lead.stage !== 'Follow-Up') return null;
  if (!lead.sentDate) return null;

  const sent = new Date(lead.sentDate);
  const now  = new Date();
  const days = Math.floor((now - sent) / 86400000);

  if (!lead.draft1Sent && days >= 2) {
    return { label: `Day ${days} — Send #1`, overdue: days > 4, today: days === 2 };
  }
  if (!lead.draft2Sent && days >= 7) {
    return { label: `Day ${days} — Send #2`, overdue: days > 9, today: days === 7 };
  }
  if (!lead.draft3Sent && days >= 13) {
    return { label: `Day ${days} — Send #3`, overdue: days > 14, today: days === 13 };
  }
  return null;
}

/* ══════════════════════════════════════════
   LEAD DETAIL
══════════════════════════════════════════ */
function openDetail(lead) {
  currentLead = lead;
  renderDetail(lead);
  showView('detail', true);
}

function renderDetail(lead) {
  const sentDays = lead.sentDate ? daysSince(lead.sentDate) : null;
  const stagePillStyle = getStagePillStyle(lead.stage);

  el('detailContent').innerHTML = `
    <!-- Stage pill -->
    <div style="margin-top:14px;">
      <span class="stage-pill" style="${stagePillStyle}">${esc(lead.stage)}</span>
    </div>

    <!-- Contact Info -->
    <div class="card">
      <div class="card-title">Contact Info</div>
      <div class="field"><label>Customer / Business Name</label>
        <input type="text" id="d_custName" value="${esc(lead.custName)}"></div>
      <div class="field"><label>Contact Name</label>
        <input type="text" id="d_contactName" value="${esc(lead.contactName)}"></div>
      <div class="field"><label>Phone</label>
        <input type="tel" id="d_phone" value="${esc(lead.phone)}"></div>
      <div class="field"><label>Email</label>
        <input type="email" id="d_email" value="${esc(lead.email)}"></div>
      <div class="field"><label>Property Address</label>
        <input type="text" id="d_address" value="${esc(lead.address)}"></div>
    </div>

    <!-- Job Info -->
    <div class="card">
      <div class="card-title">Job Info</div>
      <div class="field"><label>PO Number</label>
        <input type="text" id="d_po" value="${esc(lead.po)}" readonly style="background:var(--bg);"></div>
      <div class="field"><label>Estimate Total ($)</label>
        <input type="number" id="d_total" value="${esc(lead.total)}" inputmode="decimal"></div>
      <div class="field"><label>Linear Feet</label>
        <input type="number" id="d_lf" value="${esc(lead.lf)}" inputmode="decimal"></div>
      <div class="field"><label>Fence Type</label>
        <input type="text" id="d_fenceType" value="${esc(lead.fenceType)}"></div>
      <div class="field"><label>Referral Source</label>
        <input type="text" id="d_referral" value="${esc(lead.referral)}"></div>
    </div>

    <!-- Stage -->
    <div class="card">
      <div class="card-title">Pipeline Stage</div>
      <div class="stage-selector" id="stageSelectorGrid">
        ${STAGES.map(s => `
          <div class="stage-opt${s === lead.stage ? ' active' : ''}"
               onclick="selectStage('${s}')" data-stage="${s}">${s}</div>
        `).join('')}
      </div>
    </div>

    <!-- Dates -->
    <div class="card">
      <div class="card-title">Key Dates</div>
      <div class="date-grid">
        <div class="field"><label>Estimate Sent</label>
          <input type="date" id="d_sentDate" value="${lead.sentDate}"></div>
        <div class="field"><label>Deposit Paid</label>
          <input type="date" id="d_depositDate" value="${lead.depositDate}"></div>
        <div class="field"><label>Job Date</label>
          <input type="date" id="d_jobDate" value="${lead.jobDate}"></div>
        <div class="field"><label>Completion Date</label>
          <input type="date" id="d_completionDate" value="${lead.completionDate}"></div>
      </div>
    </div>

    <!-- Notes -->
    <div class="card">
      <div class="card-title">Notes</div>
      ${renderNotesHistory(lead.notes)}
      <div class="field" style="margin-top:12px;">
        <label>Add Note</label>
        <textarea id="d_newNote" placeholder="Add a note…" style="min-height:70px;"></textarea>
      </div>
    </div>

    <!-- Follow-Up Drafts -->
    <div class="card">
      <div class="card-title">Follow-Up Drafts</div>
      ${sentDays !== null ? `<p class="section-sub">${sentDays} days since estimate sent</p>` : ''}
      ${renderDraft(lead, 1)}
      ${renderDraft(lead, 2)}
      ${renderDraft(lead, 3)}
    </div>

    ${lead.stage === 'Complete' || lead.stage === 'Review Requested' ? `
    <div class="card">
      <div class="card-title">Review Request</div>
      ${renderReviewDraft(lead)}
    </div>` : ''}

    <!-- Save -->
    <button class="btn btn-primary" onclick="saveDetail()">💾 Save Changes</button>
    <button class="btn btn-ghost" onclick="showView('pipeline')">Cancel</button>
  `;
}

function renderNotesHistory(notesStr) {
  if (!notesStr) return '<p style="font-size:13px;color:var(--muted);">No notes yet.</p>';
  const entries = notesStr.split(/(?=\[\d{4}-\d{2}-\d{2})/).filter(Boolean);
  if (entries.length === 0) return `<div class="notes-entry">${esc(notesStr)}</div>`;
  return entries.map(entry => {
    const tsMatch = entry.match(/^\[([^\]]+)\]\n?/);
    if (tsMatch) {
      const ts   = tsMatch[1];
      const body = entry.slice(tsMatch[0].length).trim();
      return `<div class="notes-entry"><div class="notes-ts">${ts}</div>${esc(body)}</div>`;
    }
    return `<div class="notes-entry">${esc(entry)}</div>`;
  }).join('');
}

function getStagePillStyle(stage) {
  const colors = {
    'Lead':             'background:#607d8b;',
    'Estimate Sent':    'background:#1B4F8A;',
    'Follow-Up':        'background:#e65100;',
    'Deposit Paid':     'background:#7b1fa2;',
    'Job Scheduled':    'background:#1565c0;',
    'Complete':         'background:#2e7d32;',
    'Review Requested': 'background:#f57c00;',
  };
  return colors[stage] || 'background:#1B4F8A;';
}

function selectStage(stage) {
  document.querySelectorAll('.stage-opt').forEach(o => {
    o.classList.toggle('active', o.dataset.stage === stage);
  });
}

/* ══════════════════════════════════════════
   SAVE DETAIL
══════════════════════════════════════════ */
function saveDetail() {
  if (!currentLead) return;
  const lead = currentLead;

  lead.custName    = val('d_custName').trim()    || lead.custName;
  lead.contactName = val('d_contactName').trim();
  lead.phone       = val('d_phone').trim();
  lead.email       = val('d_email').trim();
  lead.address     = val('d_address').trim();
  lead.total       = val('d_total').trim();
  lead.lf          = val('d_lf').trim();
  lead.fenceType   = val('d_fenceType').trim();
  lead.referral    = val('d_referral').trim();
  lead.sentDate    = val('d_sentDate');
  lead.depositDate = val('d_depositDate');
  lead.jobDate     = val('d_jobDate');
  lead.completionDate = val('d_completionDate');

  // Stage
  const activeStageEl = document.querySelector('.stage-opt.active');
  if (activeStageEl) lead.stage = activeStageEl.dataset.stage;

  // Append new note
  const newNote = val('d_newNote').trim();
  if (newNote) {
    const ts = nowISO();
    lead.notes = lead.notes
      ? `${lead.notes}\n[${ts}]\n${newNote}`
      : `[${ts}]\n${newNote}`;
  }

  // Update local array
  const idx = leads.findIndex(l => l.po === lead.po);
  if (idx !== -1) leads[idx] = lead;

  updateLead(lead).then(() => {
    toast('Lead updated');
    renderPipeline();
    renderDetail(lead);
  });
}

/* ══════════════════════════════════════════
   FOLLOW-UP DRAFT RENDERING
══════════════════════════════════════════ */
function renderDraft(lead, num) {
  const sentProp = `draft${num}Sent`;
  const isSent   = lead[sentProp];
  const config   = getDraftConfig(lead, num);

  return `
    <div class="draft-card${isSent ? ' sent' : ''}" id="draft-card-${num}">
      <div class="draft-header">
        <span class="draft-label">Draft ${num} — ${config.dayLabel}</span>
        ${isSent ? '<span class="draft-sent-badge">✓ Sent</span>' : ''}
      </div>
      <div class="draft-subject">Subject: ${esc(config.subject)}</div>
      <div class="draft-preview">${esc(config.bodyPreview)}</div>
      <div class="draft-actions">
        <button class="btn btn-secondary btn-sm" onclick="sendDraft(${num})">📨 Send</button>
        ${!isSent
          ? `<button class="btn btn-ghost btn-sm" onclick="markDraftSent(${num})">Mark Sent</button>`
          : `<button class="btn btn-ghost btn-sm" onclick="markDraftUnsent(${num})">Undo</button>`}
      </div>
    </div>
  `;
}

function getDraftConfig(lead, num) {
  const firstName = firstNameOf(lead);
  const s = settings;
  const sentDate  = lead.sentDate ? new Date(lead.sentDate) : new Date();
  const expiry    = new Date(sentDate.getTime() + 14 * 86400000);
  const expiryStr = expiry.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const totalStr  = lead.total ? money(parseFloat(lead.total)) : '[amount]';

  if (num === 1) {
    return {
      dayLabel: 'Day 2 (48hr check-in)',
      subject:  `Quick check-in — ${lead.custName} fence quote`,
      bodyPreview: `Hi ${firstName}, just wanted to make sure you received the estimate for your fence project (PO# ${lead.po}). Happy to answer any questions — let me know! ${s.ownerName} | ${s.companyName} | ${s.phone}`,
    };
  }
  if (num === 2) {
    return {
      dayLabel: 'Day 7',
      subject:  `Your fence quote — still good through ${expiryStr}`,
      bodyPreview: `Hi ${firstName}, wanted to touch base on your fence estimate (PO# ${lead.po}, ${totalStr}). The quote is valid through ${expiryStr}. Ready to get started when you are. ${s.ownerName} | ${s.companyName} | ${s.phone}`,
    };
  }
  return {
    dayLabel: 'Day 13 (final nudge)',
    subject:  `Last chance — fence quote expires tomorrow`,
    bodyPreview: `Hi ${firstName}, your fence estimate (PO# ${lead.po}) expires tomorrow. If you'd like to move forward, just reply and we'll get you on the schedule. ${s.ownerName} | ${s.companyName} | ${s.phone}`,
  };
}

function sendDraft(num) {
  if (!currentLead) return;
  const lead   = currentLead;
  const config = getDraftConfig(lead, num);
  const body   = config.bodyPreview;

  const mailto = `mailto:${encodeURIComponent(lead.email)}`
    + `?subject=${encodeURIComponent(config.subject)}`
    + `&body=${encodeURIComponent(body)}`;
  window.open(mailto, '_blank');
}

function markDraftSent(num) {
  if (!currentLead) return;
  currentLead[`draft${num}Sent`] = true;
  const idx = leads.findIndex(l => l.po === currentLead.po);
  if (idx !== -1) leads[idx] = currentLead;
  updateLead(currentLead).then(() => {
    toast(`Draft ${num} marked as sent`);
    renderDetail(currentLead);
    renderPipeline();
  });
}

function markDraftUnsent(num) {
  if (!currentLead) return;
  currentLead[`draft${num}Sent`] = false;
  const idx = leads.findIndex(l => l.po === currentLead.po);
  if (idx !== -1) leads[idx] = currentLead;
  updateLead(currentLead).then(() => {
    renderDetail(currentLead);
  });
}

/* ══════════════════════════════════════════
   REVIEW DRAFT
══════════════════════════════════════════ */
function renderReviewDraft(lead) {
  const s = settings;
  const firstName = firstNameOf(lead);
  const reviewLink = s.reviewLink || '[Google Review Link]';

  const subject = `Thanks for choosing ${s.companyName}!`;
  const body    = `Hi ${firstName}, it was a pleasure working on your fence project. If you're happy with the work, would you mind leaving us a quick review? It means a lot.\n${reviewLink}\n— ${s.ownerName}`;

  return `
    <div class="draft-card${lead.reviewSent ? ' sent' : ''}">
      <div class="draft-header">
        <span class="draft-label">Review Request</span>
        ${lead.reviewSent ? '<span class="draft-sent-badge">✓ Sent</span>' : ''}
      </div>
      <div class="draft-subject">Subject: ${esc(subject)}</div>
      <div class="draft-preview">${esc(body)}</div>
      <div class="draft-actions">
        <button class="btn btn-secondary btn-sm" onclick="sendReviewDraft()">📨 Send</button>
        ${!lead.reviewSent
          ? `<button class="btn btn-ghost btn-sm" onclick="markReviewSent()">Mark Sent</button>`
          : `<button class="btn btn-ghost btn-sm" onclick="markReviewUnsent()">Undo</button>`}
      </div>
    </div>
  `;
}

function sendReviewDraft() {
  if (!currentLead) return;
  const lead = currentLead;
  const s    = settings;
  const firstName = firstNameOf(lead);
  const reviewLink = s.reviewLink || '[Google Review Link]';
  const subject = `Thanks for choosing ${s.companyName}!`;
  const body    = `Hi ${firstName}, it was a pleasure working on your fence project. If you're happy with the work, would you mind leaving us a quick review? It means a lot.\n${reviewLink}\n— ${s.ownerName}`;
  const mailto = `mailto:${encodeURIComponent(lead.email)}`
    + `?subject=${encodeURIComponent(subject)}`
    + `&body=${encodeURIComponent(body)}`;
  window.open(mailto, '_blank');
}

function markReviewSent() {
  if (!currentLead) return;
  currentLead.reviewSent = true;
  if (currentLead.stage !== 'Review Requested') {
    currentLead.stage = 'Review Requested';
    document.querySelectorAll('.stage-opt').forEach(o => {
      o.classList.toggle('active', o.dataset.stage === 'Review Requested');
    });
  }
  const idx = leads.findIndex(l => l.po === currentLead.po);
  if (idx !== -1) leads[idx] = currentLead;
  updateLead(currentLead).then(() => {
    toast('Review request marked sent');
    renderDetail(currentLead);
    renderPipeline();
  });
}

function markReviewUnsent() {
  if (!currentLead) return;
  currentLead.reviewSent = false;
  const idx = leads.findIndex(l => l.po === currentLead.po);
  if (idx !== -1) leads[idx] = currentLead;
  updateLead(currentLead).then(() => renderDetail(currentLead));
}

/* ══════════════════════════════════════════
   SEARCH
══════════════════════════════════════════ */
function onSearch() {
  const q = val('searchInput').toLowerCase().trim();
  if (!q) {
    el('searchResults').innerHTML = '';
    el('searchCount').textContent = '';
    return;
  }
  const results = leads.filter(l =>
    l.custName.toLowerCase().includes(q) ||
    l.po.toLowerCase().includes(q) ||
    l.phone.toLowerCase().includes(q) ||
    l.email.toLowerCase().includes(q) ||
    l.address.toLowerCase().includes(q)
  );
  el('searchCount').textContent = `${results.length} result${results.length !== 1 ? 's' : ''}`;

  if (!results.length) {
    el('searchResults').innerHTML = '<div class="empty-state"><div class="icon">🔍</div><p>No leads found</p></div>';
    return;
  }

  const container = document.createElement('div');
  container.className = 'card';
  container.style.padding = '0';
  results.forEach(lead => {
    const div = document.createElement('div');
    div.innerHTML = leadCardHTML(lead);
    div.querySelector('.lead-card').addEventListener('click', () => openDetail(lead));
    container.appendChild(div);
  });
  el('searchResults').innerHTML = '';
  el('searchResults').appendChild(container);
}

/* ══════════════════════════════════════════
   OFFLINE QUEUE
══════════════════════════════════════════ */
function loadOfflineQueue() {
  try { return JSON.parse(localStorage.getItem('fcrm_queue') || '[]'); } catch(e) { return []; }
}

function saveOfflineQueue() {
  localStorage.setItem('fcrm_queue', JSON.stringify(offlineQueue));
}

function addToOfflineQueue(item) {
  offlineQueue.push(item);
  saveOfflineQueue();
}

async function retryOfflineQueue() {
  if (!offlineQueue.length) return;
  const pending = [...offlineQueue];
  offlineQueue = [];
  saveOfflineQueue();

  for (const item of pending) {
    try {
      if (item.action === 'append') {
        await sheetsAppend([leadToRow(item.lead)]);
      } else if (item.action === 'update') {
        await sheetsUpdate(item.range, [leadToRow(item.lead)]);
      }
    } catch(e) {
      offlineQueue.push(item);
    }
  }
  saveOfflineQueue();
  if (offlineQueue.length === 0 && pending.length > 0) {
    toast('Offline changes synced!');
  }
}

/* ══════════════════════════════════════════
   UTILITIES
══════════════════════════════════════════ */
function el(id)       { return document.getElementById(id); }
function val(id)      { return el(id)?.value || ''; }
function setVal(id,v) { const e = el(id); if (e) e.value = v ?? ''; }

function money(n) {
  return '$' + (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function nowISO() {
  return new Date().toLocaleString('en-US', {
    month: '2-digit', day: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function daysSince(dateStr) {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  if (isNaN(d)) return 0;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
}

function firstNameOf(lead) {
  const src = lead.contactName || lead.custName || '';
  return src.split(' ')[0] || 'there';
}

function generatePO(custName) {
  const d  = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  const code = (custName || 'XX')
    .replace(/[^a-zA-Z\s]/g, '')
    .split(/\s+/).filter(Boolean)
    .map(w => w[0].toUpperCase()).join('').slice(0, 6);
  return `${mm}${dd}${yy}-${code}`;
}

let toastTimer;
function toast(msg) {
  const t = el('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}
