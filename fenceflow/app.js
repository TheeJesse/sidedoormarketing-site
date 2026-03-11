/* ═══════════════════════════════════════════════
   FenceFlow — app.js
   Peace of Mind Maintenance LLC — Jesse Tegtmeier
   ═══════════════════════════════════════════════ */

'use strict';

/* ── DEFAULTS ── */
const DEFAULTS = {
  companyName: 'Peace of Mind Maintenance LLC',
  ownerName: 'Jesse Tegtmeier',
  phone: '850-776-4175',
  location: 'Navarre, FL',
  prices: {
    post:        18.00,
    rail:         5.50,
    picket:       3.20,
    concrete:     7.50,
    nails:       12.00,
    gatePed:    400.00,
    gateMower:  525.00,
    gateDrive:  800.00,
    labor:      100.00,
    landscaping: 50.00,
    hauling:     50.00,
    delivery:    50.00,
    commercial: 500.00,
  }
};

/* ── STATE ── */
let settings = loadSettings();
let gateCount = 0;
let jobData   = null;
let calcData  = null;

/* ══════════════════════════════════════════
   INIT
══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  applySettingsToForm();
  bindJobInfoEvents();
  bindSettingsEvents();
  bindNavEvents();
  updateTotalLF();
});

/* ══════════════════════════════════════════
   SETTINGS — persist to localStorage
══════════════════════════════════════════ */
function loadSettings() {
  try {
    const stored = localStorage.getItem('ff_settings');
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return JSON.parse(JSON.stringify(DEFAULTS));
}

function saveSettings() {
  const s = {
    companyName: val('s_companyName') || DEFAULTS.companyName,
    ownerName:   val('s_ownerName')   || DEFAULTS.ownerName,
    phone:       val('s_phone')       || DEFAULTS.phone,
    location:    val('s_location')    || DEFAULTS.location,
    prices: {
      post:        num('p_post'),
      rail:        num('p_rail'),
      picket:      num('p_picket'),
      concrete:    num('p_concrete'),
      nails:       num('p_nails'),
      gatePed:     num('p_gatePed'),
      gateMower:   num('p_gateMower'),
      gateDrive:   num('p_gateDrive'),
      labor:       num('p_labor'),
      landscaping: num('p_landscaping'),
      hauling:     num('p_hauling'),
      delivery:    num('p_delivery'),
      commercial:  num('p_commercial'),
    }
  };
  localStorage.setItem('ff_settings', JSON.stringify(s));
  settings = s;
}

function applySettingsToForm() {
  setVal('s_companyName', settings.companyName);
  setVal('s_ownerName',   settings.ownerName);
  setVal('s_phone',       settings.phone);
  setVal('s_location',    settings.location);
  const p = settings.prices;
  setVal('p_post',        p.post);
  setVal('p_rail',        p.rail);
  setVal('p_picket',      p.picket);
  setVal('p_concrete',    p.concrete);
  setVal('p_nails',       p.nails);
  setVal('p_gatePed',     p.gatePed);
  setVal('p_gateMower',   p.gateMower);
  setVal('p_gateDrive',   p.gateDrive);
  setVal('p_labor',       p.labor);
  setVal('p_landscaping', p.landscaping);
  setVal('p_hauling',     p.hauling);
  setVal('p_delivery',    p.delivery);
  setVal('p_commercial',  p.commercial);
}

function resetSettingsToDefaults() {
  settings = JSON.parse(JSON.stringify(DEFAULTS));
  localStorage.setItem('ff_settings', JSON.stringify(settings));
  applySettingsToForm();
  toast('Settings reset to defaults');
}

/* ══════════════════════════════════════════
   JOB INFO EVENTS
══════════════════════════════════════════ */
function bindJobInfoEvents() {
  // LF auto-sum
  ['sideA','sideB','sideC','sideD'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateTotalLF);
  });

  // Leased property warning
  document.getElementById('ownership').addEventListener('change', e => {
    const warn = document.getElementById('leaseWarn');
    warn.classList.toggle('visible', e.target.value === 'leased');
  });

  // Gate management
  document.getElementById('addGateBtn').addEventListener('click', addGate);

  // Calculate button
  document.getElementById('goToCalc').addEventListener('click', () => {
    if (collectJobData()) {
      calculate();
      renderCalculator();
      renderEstimate();
      switchTab('calc');
    }
  });
}

/* ══════════════════════════════════════════
   LF CALCULATOR
══════════════════════════════════════════ */
function updateTotalLF() {
  const total = ['sideA','sideB','sideC','sideD']
    .reduce((sum, id) => sum + (parseFloat(document.getElementById(id).value) || 0), 0);
  document.getElementById('totalLF').textContent = total > 0 ? `${total} ft` : '0 ft';
}

function getTotalLF() {
  return ['sideA','sideB','sideC','sideD']
    .reduce((sum, id) => sum + (parseFloat(document.getElementById(id).value) || 0), 0);
}

/* ══════════════════════════════════════════
   GATE MANAGEMENT
══════════════════════════════════════════ */
function addGate() {
  gateCount++;
  const id = gateCount;
  const list = document.getElementById('gatesList');
  const div = document.createElement('div');
  div.className = 'gate-row';
  div.id = `gate_${id}`;
  div.innerHTML = `
    <div class="gate-row-header">
      <span class="gate-label">Gate ${id}</span>
      <button class="remove-gate-btn" onclick="removeGate(${id})" aria-label="Remove gate">×</button>
    </div>
    <div class="field">
      <label>Gate Type</label>
      <select id="gtype_${id}">
        <option value="pedestrian">Pedestrian (walk-thru)</option>
        <option value="mower">Mower / Access (48"+ wide)</option>
        <option value="drive">Double Drive Gate</option>
      </select>
    </div>
    <div class="field">
      <label>Width (inches, approx)</label>
      <input type="number" id="gwidth_${id}" placeholder="e.g. 36, 48, 120" inputmode="decimal" min="0">
    </div>
  `;
  list.appendChild(div);
  renumberGates();
}

function removeGate(id) {
  const el = document.getElementById(`gate_${id}`);
  if (el) el.remove();
  renumberGates();
}

function renumberGates() {
  document.querySelectorAll('.gate-row').forEach((row, i) => {
    const label = row.querySelector('.gate-label');
    if (label) label.textContent = `Gate ${i + 1}`;
  });
}

function getGates() {
  const rows = document.querySelectorAll('.gate-row');
  const gates = [];
  rows.forEach(row => {
    const id = row.id.replace('gate_', '');
    const typeEl  = document.getElementById(`gtype_${id}`);
    const widthEl = document.getElementById(`gwidth_${id}`);
    if (typeEl) {
      gates.push({
        type:  typeEl.value,
        width: parseFloat(widthEl?.value) || 0,
      });
    }
  });
  return gates;
}

/* ══════════════════════════════════════════
   COLLECT JOB DATA
══════════════════════════════════════════ */
function collectJobData() {
  const totalLF = getTotalLF();
  if (totalLF <= 0) {
    toast('Enter at least one side measurement');
    return false;
  }
  const custName = val('custName').trim();
  if (!custName) {
    toast('Enter a customer or business name');
    document.getElementById('custName').focus();
    return false;
  }

  jobData = {
    custName,
    custAddress:  val('custAddress').trim(),
    contactName:  val('contactName').trim(),
    custPhone:    val('custPhone').trim(),
    custEmail:    val('custEmail').trim(),
    referral:     val('referral').trim(),
    jobType:      val('jobType'),
    ownership:    val('ownership'),
    fenceType:    val('fenceType'),
    demoNeeded:   val('demoNeeded'),
    sides: {
      a: parseFloat(document.getElementById('sideA').value) || 0,
      b: parseFloat(document.getElementById('sideB').value) || 0,
      c: parseFloat(document.getElementById('sideC').value) || 0,
      d: parseFloat(document.getElementById('sideD').value) || 0,
    },
    totalLF,
    gates: getGates(),
    addons: {
      landscaping:    document.getElementById('chk_landscaping').checked,
      hauling:        document.getElementById('chk_hauling').checked,
      delivery:       document.getElementById('chk_delivery').checked,
      grading:        document.getElementById('chk_grading').checked,
      roots:          document.getElementById('chk_roots').checked,
      concrete_cut:   document.getElementById('chk_concrete_cut').checked,
    },
    notes: val('jobNotes').trim(),
    date: new Date(),
  };
  return true;
}

/* ══════════════════════════════════════════
   CORE CALCULATIONS
══════════════════════════════════════════ */
function calculate() {
  if (!jobData) return;
  const lf = jobData.totalLF;
  const p  = settings.prices;

  // Material quantities
  const posts    = Math.ceil(lf / 8) + 1;
  const bays     = posts - 1;
  const rails    = bays * 3;
  const pickets  = Math.ceil(lf / (5.5 / 12));   // 5.5" = 0.4583ft
  const concrete = posts;                          // 1 bag per post
  const picketNails = pickets * 6;
  const railNails   = rails * 8;

  // Nail boxes (5lb box ≈ 600 count for 2", ≈ 350 count for 3")
  const picketNailBoxes = Math.ceil(picketNails / 600);
  const railNailBoxes   = Math.ceil(railNails   / 350);

  // Gate totals
  let gateTotal = 0;
  jobData.gates.forEach(g => {
    if (g.type === 'pedestrian') gateTotal += p.gatePed;
    else if (g.type === 'mower') gateTotal += p.gateMower;
    else if (g.type === 'drive') gateTotal += p.gateDrive;
  });

  // Labor hours based on LF
  let laborHrs;
  if (lf < 50)        laborHrs = 8;
  else if (lf < 100)  laborHrs = 16;
  else if (lf < 150)  laborHrs = 24;
  else                laborHrs = 32;

  // Material costs (no overage, no markup — toggles applied later in render)
  const matBase = {
    posts:    posts    * p.post,
    rails:    rails    * p.rail,
    pickets:  pickets  * p.picket,
    concrete: concrete * p.concrete,
    nails:    (picketNailBoxes + railNailBoxes) * p.nails,
  };
  const matSubtotal = Object.values(matBase).reduce((s, v) => s + v, 0);

  // Add-ons
  const addons = {};
  if (jobData.addons.landscaping)  addons.landscaping = p.landscaping;
  if (jobData.addons.hauling)      addons.hauling     = p.hauling;
  if (jobData.addons.delivery)     addons.delivery    = p.delivery;
  if (jobData.addons.grading)      addons.grading     = p.labor * 2; // est 2hr
  if (jobData.addons.roots)        addons.roots       = p.labor * 2; // est 2hr
  if (jobData.addons.concrete_cut) addons.concrete_cut = p.labor * 3; // est 3hr
  const addonTotal = Object.values(addons).reduce((s, v) => s + v, 0);

  // Commercial
  const commAdj = jobData.jobType === 'commercial' ? p.commercial : 0;

  // Labor
  const laborTotal = laborHrs * p.labor;

  calcData = {
    // Quantities
    lf, posts, bays, rails, pickets, concrete,
    picketNails, railNails, picketNailBoxes, railNailBoxes,
    laborHrs,
    // Costs
    matBase, matSubtotal,
    gateTotal,
    laborTotal,
    commAdj,
    addons, addonTotal,
    // PO
    po: generatePO(jobData.custName, jobData.date),
  };
}

/* ══════════════════════════════════════════
   PO NUMBER
══════════════════════════════════════════ */
function generatePO(custName, date) {
  const d  = date || new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  // Job code: first letter of each word, uppercase, max 6 chars
  const code = custName
    .replace(/[^a-zA-Z\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w[0].toUpperCase())
    .join('')
    .slice(0, 6);
  return `${mm}${dd}${yy}-${code}`;
}

/* ══════════════════════════════════════════
   RENDER CALCULATOR TAB
══════════════════════════════════════════ */
function renderCalculator() {
  if (!calcData || !jobData) return;
  const c = calcData;
  const p = settings.prices;

  const container = document.getElementById('calcContent');
  container.innerHTML = `
    <div class="card">
      <div class="card-title">Material Quantities — ${c.lf} LF</div>

      <div class="calc-row">
        <span class="calc-label">4×4×10 Posts</span>
        <span class="calc-qty">${c.posts}</span>
        <span class="calc-subtotal">${money(c.matBase.posts)}</span>
      </div>
      <div class="calc-row">
        <span class="calc-label">2×4×8 Rails</span>
        <span class="calc-qty">${c.rails}</span>
        <span class="calc-subtotal">${money(c.matBase.rails)}</span>
      </div>
      <div class="calc-row">
        <span class="calc-label">5/8" Pickets</span>
        <span class="calc-qty">${c.pickets}</span>
        <span class="calc-subtotal">${money(c.matBase.pickets)}</span>
      </div>
      <div class="calc-row">
        <span class="calc-label">80lb Concrete Bags</span>
        <span class="calc-qty">${c.concrete}</span>
        <span class="calc-subtotal">${money(c.matBase.concrete)}</span>
      </div>
      <div class="calc-row">
        <span class="calc-label">2" Ring Shank Nails</span>
        <span class="calc-qty">${c.picketNailBoxes} box</span>
        <span class="calc-subtotal">${money(c.picketNailBoxes * p.nails)}</span>
      </div>
      <div class="calc-row">
        <span class="calc-label">3" Ring Shank Nails</span>
        <span class="calc-qty">${c.railNailBoxes} box</span>
        <span class="calc-subtotal">${money(c.railNailBoxes * p.nails)}</span>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Estimate Options</div>

      <div class="toggle-row">
        <span class="toggle-label">10% Materials Markup</span>
        <label class="toggle-switch">
          <input type="checkbox" id="tog_markup" checked onchange="recalcTotal()">
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="toggle-row">
        <span class="toggle-label">10% Material Overage Buffer</span>
        <label class="toggle-switch">
          <input type="checkbox" id="tog_overage" checked onchange="recalcTotal()">
          <span class="toggle-slider"></span>
        </label>
      </div>

      <div class="field" style="margin-top:14px;">
        <label>Labor Hours (editable)</label>
        <input type="number" id="laborHrsInput" value="${c.laborHrs}" min="1" max="999"
          inputmode="decimal" onchange="recalcTotal()">
      </div>
    </div>

    <div class="card" id="pricingBreakdown">
      <!-- filled by recalcTotal() -->
    </div>

    <button class="next-btn" onclick="switchTab('estimate')">View Estimate →</button>
  `;

  recalcTotal();
}

function recalcTotal() {
  if (!calcData) return;
  const c = calcData;

  const markup  = document.getElementById('tog_markup')?.checked  ?? true;
  const overage = document.getElementById('tog_overage')?.checked ?? true;
  const laborHrsEdited = parseFloat(document.getElementById('laborHrsInput')?.value) || c.laborHrs;

  const p = settings.prices;

  // Overage multiplier (adds 10% to quantities → cost)
  const overageMult = overage ? 1.10 : 1.0;
  const matCost = c.matSubtotal * overageMult;
  const markupAmt = markup ? matCost * 0.10 : 0;

  const laborCost = laborHrsEdited * p.labor;
  const addonTotal = c.addonTotal;
  const gateTotal  = c.gateTotal;
  const commAdj    = c.commAdj;

  const grandTotal = matCost + markupAmt + laborCost + addonTotal + gateTotal + commAdj;

  // Store for estimate render
  calcData._render = { markup, overage, overageMult, matCost, markupAmt, laborCost, addonTotal, gateTotal, commAdj, grandTotal, laborHrs: laborHrsEdited };

  const addonLines = Object.entries(c.addons).map(([k, v]) => `
    <div class="calc-row">
      <span class="calc-label">${addonLabel(k)}</span>
      <span class="calc-qty"></span>
      <span class="calc-subtotal">${money(v)}</span>
    </div>
  `).join('');

  const gateLines = jobData.gates.map((g, i) => `
    <div class="calc-row">
      <span class="calc-label">Gate ${i+1} — ${gateTypeLabel(g.type)}${g.width ? ` (${g.width}")` : ''}</span>
      <span class="calc-qty"></span>
      <span class="calc-subtotal">${money(gatePrice(g.type))}</span>
    </div>
  `).join('');

  document.getElementById('pricingBreakdown').innerHTML = `
    <div class="card-title">Pricing Summary</div>

    <div class="calc-row">
      <span class="calc-label">Materials${overage ? ' (w/ 10% overage)' : ''}</span>
      <span class="calc-qty"></span>
      <span class="calc-subtotal">${money(matCost)}</span>
    </div>
    ${markup ? `<div class="calc-row">
      <span class="calc-label">10% Markup</span>
      <span class="calc-qty"></span>
      <span class="calc-subtotal">${money(markupAmt)}</span>
    </div>` : ''}
    <div class="calc-row">
      <span class="calc-label">Labor (${laborHrsEdited}hrs @ ${money(p.labor)}/hr)</span>
      <span class="calc-qty"></span>
      <span class="calc-subtotal">${money(laborCost)}</span>
    </div>
    ${gateLines}
    ${addonLines}
    ${commAdj > 0 ? `<div class="calc-row">
      <span class="calc-label">Commercial Adjustment</span>
      <span class="calc-qty"></span>
      <span class="calc-subtotal">${money(commAdj)}</span>
    </div>` : ''}

    <div class="total-row">
      <span class="total-label">Estimate Total</span>
      <span class="total-value">${money(grandTotal)}</span>
    </div>
  `;

  // Re-render estimate in background
  renderEstimate();
}

function addonLabel(key) {
  const labels = {
    landscaping: 'Landscaping Prep (1hr)',
    hauling:     'Debris Haul-Off',
    delivery:    'Material Delivery',
    grading:     'Grade / Slope Work (est. 2hr)',
    roots:       'Root / Obstacle Digging (est. 2hr)',
    concrete_cut:'Concrete Cutting (est. 3hr)',
  };
  return labels[key] || key;
}

function gateTypeLabel(type) {
  if (type === 'pedestrian') return 'Pedestrian';
  if (type === 'mower')      return 'Mower / Access (48"+)';
  if (type === 'drive')      return 'Double Drive';
  return type;
}

function gatePrice(type) {
  const p = settings.prices;
  if (type === 'pedestrian') return p.gatePed;
  if (type === 'mower')      return p.gateMower;
  if (type === 'drive')      return p.gateDrive;
  return 0;
}

/* ══════════════════════════════════════════
   RENDER ESTIMATE TAB
══════════════════════════════════════════ */
function renderEstimate() {
  if (!calcData || !jobData) return;
  const c  = calcData;
  const r  = c._render;
  const s  = settings;

  // Dates
  const today    = formatDate(jobData.date);
  const validThru = formatDate(new Date(jobData.date.getTime() + 14 * 86400000));
  const days = estimateDays(r ? r.laborHrs : c.laborHrs);

  // Build line items
  const lineItems = [];
  const fenceLabel = `6ft Treated Pine Privacy Fence — ${c.lf} LF`;
  const fenceAmt   = r ? (r.matCost + r.markupAmt + r.laborCost) : (c.matSubtotal + c.laborTotal);
  lineItems.push({ label: fenceLabel, amount: fenceAmt });

  if (jobData.gates.length > 0) {
    const gateLabel = jobData.gates.length === 1
      ? `Gate — ${gateTypeLabel(jobData.gates[0].type)}`
      : `Gates (×${jobData.gates.length})`;
    lineItems.push({ label: gateLabel, amount: r ? r.gateTotal : c.gateTotal });
  }

  if (r && r.addonTotal > 0) {
    lineItems.push({ label: 'Site Prep & Add-Ons', amount: r.addonTotal });
  } else if (c.addonTotal > 0) {
    lineItems.push({ label: 'Site Prep & Add-Ons', amount: c.addonTotal });
  }

  const commAdj = r ? r.commAdj : c.commAdj;
  if (commAdj > 0) {
    lineItems.push({ label: 'Commercial Property Adjustment', amount: commAdj });
  }

  const grandTotal = r ? r.grandTotal : (fenceAmt + (r?.gateTotal||c.gateTotal) + c.addonTotal + c.commAdj);

  const lineHTML = lineItems.map(li => `
    <div class="est-line-item">
      <span>${li.label}</span>
      <span>${money(li.amount)}</span>
    </div>
  `).join('');

  // Scope sentence
  const scopeText = buildScopeText(jobData, c, days);

  // Next step text
  const nextStep = jobData.addons.grading || jobData.addons.concrete_cut
    ? 'site preparation'
    : 'your deposit and locate services';

  const container = document.getElementById('estimateContent');
  container.innerHTML = `
    <div class="estimate-preview" id="printEstimate">
      <div class="est-header">
        <div class="est-co-name">${s.companyName}</div>
        <div class="est-co-sub">${s.ownerName} &nbsp;|&nbsp; ${s.phone} &nbsp;|&nbsp; ${s.location}</div>
      </div>

      <hr class="est-divider">

      <div class="est-meta-grid">
        <span class="est-meta-label">Estimate #</span>
        <span class="est-meta-value">${c.po}</span>
        <span class="est-meta-label">Date</span>
        <span class="est-meta-value">${today}</span>
        <span class="est-meta-label">Valid Through</span>
        <span class="est-meta-value">${validThru}</span>
      </div>

      <div class="est-section-label">Prepared For</div>
      <div class="est-prepared">
        <strong>${jobData.custName}</strong><br>
        ${jobData.contactName ? `Attn: ${jobData.contactName}<br>` : ''}
        ${jobData.custAddress || ''}
      </div>

      <div class="est-section-label">Scope of Work</div>
      <div class="est-scope">${scopeText}</div>

      <div class="est-section-label">Pricing</div>
      ${lineHTML}
      <div class="est-total-row">
        <span>TOTAL</span>
        <span>${money(grandTotal)}</span>
      </div>

      <div class="est-terms">
        <strong>Terms:</strong> 50% deposit due to schedule. Balance due upon completion.
        This estimate is valid for 14 days from the date above.
        All materials and labor provided by Peace of Mind Maintenance LLC.
        <br><br>
        <div class="est-sig-block">
          <div>
            <div class="est-sig-line">Authorized Signature &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Date</div>
          </div>
          <div>
            <div class="est-sig-line">Customer Signature &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Date</div>
          </div>
        </div>
      </div>
    </div>

    <button class="action-btn primary" onclick="printEstimate()">
      🖨 Save / Print as PDF
    </button>
    <p class="pdf-tip">iPhone: tap Share → Print → press &amp; hold preview → Save to Files</p>

    <button class="action-btn secondary" onclick="copyDeliveryEmail()">
      📧 Copy Customer Email
    </button>
    <button class="action-btn green" onclick="copySupplierQuote()">
      📦 Copy Supplier Quote
    </button>
    <button class="action-btn secondary" onclick="copySupplierQuoteBFS()">
      📦 Copy Quote (BFS)
    </button>
    <button class="action-btn secondary" onclick="saveLeadToCRM()">
      💾 Save Lead to CRM →
    </button>
  `;
}

function buildScopeText(job, calc, days) {
  const gateText = job.gates.length === 0
    ? ''
    : job.gates.length === 1
      ? `, including one ${gateTypeLabel(job.gates[0].type).toLowerCase()} gate`
      : `, including ${job.gates.length} gates`;

  const prepText = job.addons.landscaping || job.addons.grading || job.addons.roots
    ? ' Minor site preparation is included.'
    : '';

  const demoText = job.demoNeeded === 'yes'
    ? ' Existing fence removal and disposal is included.'
    : '';

  return `Furnish and install approximately ${calc.lf} linear feet of 6-foot treated pine privacy fence${gateText}. ` +
    `Build is estimated at ${days}. All posts set in concrete, 3 rails per bay, dog-ear pickets installed tight.` +
    prepText + demoText;
}

function estimateDays(hrs) {
  if (hrs <= 8)  return '1 day';
  if (hrs <= 16) return '2 days';
  if (hrs <= 24) return '3 days';
  return `${Math.ceil(hrs / 8)} days`;
}

/* ══════════════════════════════════════════
   PRINT / PDF
══════════════════════════════════════════ */
function printEstimate() {
  window.print();
}

/* ══════════════════════════════════════════
   COPY EMAIL — CUSTOMER DELIVERY
══════════════════════════════════════════ */
function copyDeliveryEmail() {
  if (!jobData || !calcData) return;
  const firstName = jobData.contactName
    ? jobData.contactName.split(' ')[0]
    : jobData.custName.split(' ')[0];
  const days = estimateDays(calcData._render?.laborHrs || calcData.laborHrs);
  const nextStep = 'your deposit and locate services are completed';
  const s = settings;

  const subject = `Your Fence Quote — ${s.companyName}`;
  const body = `Hi ${firstName},

It was a pleasure meeting you today.

Please see the attached fence quote (Estimate #${calcData.po}).

The build should take ${days}. As soon as ${nextStep} we can get started.

Please let me know if you have any questions.

Sincerely,
${s.ownerName}
${s.companyName}
${s.phone}`;

  copyToClipboard(`Subject: ${subject}\n\n${body}`, 'Customer email copied!');
}

/* ══════════════════════════════════════════
   COPY SUPPLIER QUOTE — GENERIC
══════════════════════════════════════════ */
function copySupplierQuote() {
  buildAndCopySupplierQuote('Hi,');
}

function copySupplierQuoteBFS() {
  buildAndCopySupplierQuote('Hi,\nBuilders FirstSource — Pro Desk');
}

function buildAndCopySupplierQuote(greeting) {
  if (!calcData || !jobData) return;
  const c = calcData;
  const r = c._render;
  const overage = r?.overage ?? true;
  const mult = overage ? 1.10 : 1.0;
  const s = settings;

  // Quantities (with overage if toggled)
  const posts    = Math.ceil(c.posts    * mult);
  const rails    = Math.ceil(c.rails    * mult);
  const pickets  = Math.ceil(c.pickets  * mult);
  const concrete = Math.ceil(c.concrete * mult);
  const nail2box = Math.ceil(c.picketNailBoxes * mult);
  const nail3box = Math.ceil(c.railNailBoxes   * mult);

  const today = formatDate(new Date());
  const subject = `Material Quote Request — ${c.lf} LF Fence Build`;
  const body = `${greeting}

Jesse Tegtmeier here from ${s.companyName}.
Please quote the below materials list. Let me know if you have any questions.

PO#: ${c.po}
Date: ${today}

${c.lf} LF privacy fence build:
• ${posts} — 4×4×10 Treated Pine Posts
• ${rails} — 2×4×8 Treated Pine
• ${pickets} — 5/8" × 5.5" × 6ft Treated Dog Ear Pickets
• ${concrete} — 80lb Concrete Bags
• ${nail2box} — 5lb Box 2" Ring Shank Nails
• ${nail3box} — 5lb Box 3" Ring Shank Nails

Thanks,
${s.ownerName}
${s.companyName}
${s.phone}`;

  copyToClipboard(`Subject: ${subject}\n\n${body}`, 'Supplier quote copied!');
}

/* ══════════════════════════════════════════
   TAB NAVIGATION
══════════════════════════════════════════ */
function bindNavEvents() {
  // also handled by inline onclick in HTML but replicated here for robustness
}

function switchTab(tabId) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-nav button').forEach(b => b.classList.remove('active'));

  const tabEl  = document.getElementById(`tab-${tabId}`);
  const navBtn = document.querySelector(`.tab-nav button[data-tab="${tabId}"]`);
  if (tabEl)  tabEl.classList.add('active');
  if (navBtn) navBtn.classList.add('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ══════════════════════════════════════════
   SETTINGS MODAL
══════════════════════════════════════════ */
function bindSettingsEvents() {
  document.getElementById('settingsBtn').addEventListener('click', () => {
    applySettingsToForm();
    document.getElementById('settingsModal').classList.add('open');
  });
  document.getElementById('closeSettings').addEventListener('click', closeSettingsModal);
  document.getElementById('settingsModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeSettingsModal();
  });
  document.getElementById('saveSettingsBtn').addEventListener('click', () => {
    saveSettings();
    closeSettingsModal();
    toast('Settings saved');
    // Recalc if we have data
    if (calcData) { recalcTotal(); renderEstimate(); }
  });
  document.getElementById('resetSettingsBtn').addEventListener('click', resetSettingsToDefaults);
}

function closeSettingsModal() {
  document.getElementById('settingsModal').classList.remove('open');
}

/* ══════════════════════════════════════════
   UTILITIES
══════════════════════════════════════════ */
function val(id)     { return document.getElementById(id)?.value || ''; }
function num(id)     { return parseFloat(document.getElementById(id)?.value) || 0; }
function setVal(id, v) {
  const el = document.getElementById(id);
  if (el) el.value = v;
}

function money(n) {
  return '$' + (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(d) {
  return (d || new Date()).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
}

function copyToClipboard(text, successMsg) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text)
      .then(() => toast(successMsg || 'Copied!'))
      .catch(() => fallbackCopy(text, successMsg));
  } else {
    fallbackCopy(text, successMsg);
  }
}

function fallbackCopy(text, successMsg) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;opacity:0;';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    toast(successMsg || 'Copied!');
  } catch (e) {
    toast('Copy failed — select text manually');
  }
  document.body.removeChild(ta);
}

/* ══════════════════════════════════════════
   SAVE LEAD TO CRM
══════════════════════════════════════════ */
function saveLeadToCRM() {
  if (!jobData || !calcData) return;
  const r = calcData._render;
  const params = new URLSearchParams({
    po:      calcData.po,
    name:    jobData.custName,
    contact: jobData.contactName || '',
    phone:   jobData.custPhone   || '',
    email:   jobData.custEmail   || '',
    addr:    jobData.custAddress || '',
    lf:      calcData.lf,
    total:   r ? r.grandTotal : (calcData.matSubtotal + calcData.laborTotal),
    referral:jobData.referral || '',
    stage:   'estimate_sent',
    date:    new Date().toISOString().slice(0, 10),
  });
  window.open(`/fencecrm/index.html?${params.toString()}`, '_blank');
}

let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}
