/**
 * UI Controller for Water Balance Calculator
 * Handles form rendering, user interactions, and dashboard display
 * Supports dual-mode: PDAM-level and DMA zone-by-zone
 */

import { calculateWaterBalance, validateInputs } from './calculator.js';
import { calculateDMAZones, identifyPriorityZones, createZoneComparison } from './zones.js';



// State management
let currentMode = 'pdam'; // 'pdam' or 'dma'
let currentData = {};
let zones = [];
let aiAnalysisContent = '';
let calculationResults = null;
let currentWizardStep = 1; // Wizard Step 1-3
let currentUser = null; // Auth State

// Listen for global auth event
document.addEventListener('auth:ready', (e) => {
  currentUser = e.detail.user;
  console.log('Water Balance App: Auth State Updated', currentUser);
  updateHistoryWidget(); // Refresh history if available
});

// Also check immediately in case event fired before this script loaded
if (window.currentUser) {
  currentUser = window.currentUser;
}

/**
 * Initialize the application
 */
export function init() {
  console.log('🚀 Water Balance Calculator - init() called');

  try {
    loadDraft();
    renderModeSelector();

    if (currentMode === 'dma') {
      renderDMAInterface();
    } else {
      renderPDAMForm(); // Will now render Wizard
    }

    if (currentMode === 'pdam' && Object.keys(currentData).length > 0) {
      performCalculation();
    } else if (currentMode === 'dma' && zones.length > 0) {
      calculateDMAResults();
    }
    console.log('🎉 Initialization complete!');
  } catch (error) {
    console.error('❌ Initialization ERROR:', error);
  }
}

/**
 * Render mode selector (PDAM vs DMA toggle)
 */
function renderModeSelector() {
  if (document.querySelector('.mode-selector')) return;
  const hero = document.querySelector('.hero');

  const modeHTML = `
    <div class="mode-selector">
      <label class="mode-option ${currentMode === 'pdam' ? 'active' : ''}" data-mode="pdam">
        <input type="radio" name="mode" value="pdam" ${currentMode === 'pdam' ? 'checked' : ''}>
        <div class="mode-content">
          <h4>Hitung Level PDAM</h4>
          <p>Untuk PDAM yang belum menerapkan DMA</p>
        </div>
      </label>
      
      <label class="mode-option ${currentMode === 'dma' ? 'active' : ''}" data-mode="dma">
        <input type="radio" name="mode" value="dma" ${currentMode === 'dma' ? 'checked' : ''}>
        <div class="mode-content">
          <h4>Hitung Per-DMA</h4>
          <p>Untuk PDAM yang sudah punya District Metered Area</p>
        </div>
      </label>
    </div>
  `;

  hero.insertAdjacentHTML('afterend', modeHTML);

  document.querySelectorAll('.mode-option').forEach(option => {
    option.addEventListener('click', () => {
      const newMode = option.dataset.mode;
      if (newMode !== currentMode) {
        switchMode(newMode);
      }
    });
  });
}

/**
 * Switch calculation mode (PDAM vs DMA)
 */
function switchMode(newMode) {
  currentMode = newMode;

  document.querySelectorAll('.mode-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.mode === newMode);
  });

  document.getElementById('results').style.display = 'none';

  if (newMode === 'dma') {
    renderDMAInterface();
  } else {
    renderPDAMForm();
  }
}

/**
 * Render PDAM-level form (WIZARD MODE)
 */
function renderPDAMForm() {
  const container = document.querySelector('.calculator-container');

  // Ensure we are on a valid step
  if (currentWizardStep < 1) currentWizardStep = 1;
  if (currentWizardStep > 3) currentWizardStep = 3;

  const steps = [
    { title: "Identitas & Aset", icon: "🏢" },
    { title: "Volume & Produksi", icon: "💧" },
    { title: "Penjualan & Finansial", icon: "💰" }
  ];

  // Wizard Header (Stepper)
  let wizardHtml = `
    <div class="wizard-stepper">
      ${steps.map((step, idx) => `
        <div class="step-item ${currentWizardStep === idx + 1 ? 'active' : ''} ${currentWizardStep > idx + 1 ? 'completed' : ''}" onclick="window.goToStep(${idx + 1})">
          <div class="step-circle">${idx + 1}</div>
          <div class="step-label">${step.title}</div>
        </div>
      `).join('')}
    </div>
  `;

  // STEP 1: Identitas & Aset
  if (currentWizardStep === 1) {
    wizardHtml += `
      <div class="card fade-in">
        <div class="d-flex space-between align-center mb-3">
            <div class="preset-buttons">
              <p class="text-muted small mb-2">💡 <strong>Butuh data contoh?</strong> Klik tombol:</p>
              <div class="d-flex gap-2">
                <button class="btn-preset small" onclick="window.loadPreset('small')">🏢 Kecil</button>
                <button class="btn-preset small" onclick="window.loadPreset('medium')">🏭 Sedang</button>
                <button class="btn-preset small" onclick="window.loadPreset('large')">🏙️ Besar</button>
              </div>
            </div>
            
            <div class="history-widget card small p-3" style="min-width: 250px; max-height: 200px; overflow-y: auto;">
                <h5 class="mb-2">🕒 Riwayat</h5>
                <div id="history-list">
                    <small class="text-muted">Login untuk simpan</small>
                </div>
            </div>
        </div>
        <hr style="border-color: rgba(255,255,255,0.1); margin: 15px 0;">

        <h3>Langkah 1: Identitas & Aset</h3>
        
        <script>
            // Attempt to load history immediately
            setTimeout(() => { 
                if(typeof loadHistory === 'function') loadHistory(); 
            }, 1000);
        </script>
        
        <div class="form-group">
          <label>Nama PDAM <span class="required">*</span></label>
          <input type="text" id="pdamName" placeholder="Contoh: PDAM Tirta Jaya" value="${currentData.pdamName || ''}">
        </div>
        
        <div class="grid-2">
          <div class="form-group">
            <label>Periode</label>
            <input type="month" id="period" value="${currentData.period || new Date().toISOString().slice(0, 7)}">
          </div>
          <div class="form-group">
            <label>Jumlah Pelanggan <span class="tooltip" data-tip="Total Sambungan Rumah (SR)">ℹ️</span></label>
            <input type="number" id="numberOfCustomers" placeholder="0" value="${currentData.numberOfCustomers || ''}">
          </div>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label>Panjang Pipa (km) <span class="tooltip" data-tip="Total panjang pipa distribusi">ℹ️</span></label>
            <input type="number" step="0.1" id="pipeLengthKm" placeholder="0.0" value="${currentData.pipeLengthKm || ''}">
          </div>
          <div class="form-group">
            <label>Tekanan Rata-rata (bar)</label>
            <input type="number" step="0.1" id="averagePressure" placeholder="2.5" value="${currentData.averagePressure || '2.5'}">
          </div>
        </div>

        <div class="form-group">
            <label>Konteks Tambahan (Opsional) <span class="tooltip" data-tip="Bantu AI memahami kondisi lapangan (Kontur, Usia Pipa, dll)">ℹ️</span></label>
            <textarea id="aiContext" rows="2" placeholder="Contoh: Daerah perbukitan, pipa AC tahun 1980, banyak sambungan liar...">${currentData.aiContext || ''}</textarea>
        </div>

        <div class="wizard-actions right">
          <button class="btn-primary" onclick="window.nextStep()">Lanjut ke Produksi &rarr;</button>
        </div>
      </div>
    `;
  }

  // STEP 2: Volume & Produksi
  else if (currentWizardStep === 2) {
    wizardHtml += `
      <div class="card fade-in">
        <h3>Langkah 2: Volume & Produksi Air</h3>
        
        <div class="form-group highlight-box">
          <label>System Input Volume (SIV) <span class="required">*</span> <span class="tooltip" data-tip="Total air masuk sistem per tahun (m³)">ℹ️</span></label>
          <input type="number" id="systemInputVolume" class="input-lg" placeholder="Contoh: 15000000" value="${currentData.systemInputVolume || ''}">
          <small>Total air yang didistribusikan ke jaringan (m³/tahun)</small>
        </div>

        <div class="form-group">
          <label>Biaya Produksi (Rp/m³) <span class="tooltip" data-tip="HPP Air">ℹ️</span></label>
          <input type="number" id="productionCost" placeholder="3000" value="${currentData.productionCost || ''}">
        </div>
        
        <div class="grid-2">
          <div class="form-group">
            <label>Pemakaian Sendiri (Metered) <small>(m³/thn)</small></label>
            <input type="number" id="unbilledMetered" placeholder="0" value="${currentData.unbilledMetered || ''}">
          </div>
          <div class="form-group">
            <label>Pemakaian Sendiri (Unmetered) <small>(m³/thn)</small></label>
            <input type="number" id="unbilledUnmetered" placeholder="0" value="${currentData.unbilledUnmetered || ''}">
          </div>
        </div>

        <div class="wizard-actions space-between">
          <button class="btn-secondary" onclick="window.prevStep()">&larr; Kembali</button>
          <button class="btn-primary" onclick="window.nextStep()">Lanjut ke Penjualan &rarr;</button>
        </div>
      </div>
    `;
  }

  // STEP 3: Penjualan & Finansial
  else if (currentWizardStep === 3) {
    wizardHtml += `
      <div class="card fade-in">
        <h3>Langkah 3: Penjualan & Finansial</h3>

        <div class="grid-2">
          <div class="form-group">
            <label>Terjual Bermeter (Billed Metered) <span class="required">*</span></label>
            <input type="number" id="billedMetered" class="input-highlight" placeholder="Total Rekening Air (m³)" value="${currentData.billedMetered || ''}">
          </div>
          <div class="form-group">
            <label>Terjual Tak Bermeter (Billed Unmetered)</label>
            <input type="number" id="billedUnmetered" placeholder="Lumpsum / Taksir (m³)" value="${currentData.billedUnmetered || ''}">
          </div>
        </div>

        <div class="form-group">
          <label>Tarif Rata-rata (Rp/m³) <span class="tooltip" data-tip="Harga Jual Rata-rata">ℹ️</span></label>
          <input type="number" id="averageTariff" placeholder="5000" value="${currentData.averageTariff || ''}">
        </div>

        <details class="advanced-options">
          <summary>⚙️ Estimasi Kehilangan Komersial (Opsional)</summary>
          <div class="alert alert-warning small mt-2">
            ⚠️ <strong>Perhatian:</strong> Akurasi input ini sangat menentukan hasil analisis. Jangan asal isi!
            <br>Nilai default (3% & 4%) adalah estimasi moderat.
          </div>
          <div class="grid-2 mt-3">
             <div class="form-group">
              <label>Pencurian Air (%)</label>
              <input type="number" step="0.1" id="unauthorizedPct" value="${currentData.unauthorizedPct || '3'}">
            </div>
            <div class="form-group">
              <label>Akurasi Meter (%)</label>
              <input type="number" step="0.1" id="meterInaccuracyPct" value="${currentData.meterInaccuracyPct || '4'}">
            </div>
            <div class="form-group">
              <label>Kesalahan Data (m³)</label>
              <input type="number" id="dataErrors" value="${currentData.dataErrors || '100000'}">
            </div>
          </div>
        </details>

        <div class="wizard-actions space-between mt-4">
          <button class="btn-secondary" onclick="window.prevStep()">&larr; Kembali</button>
          <button class="btn-primary btn-large pulse-animation" id="calculateBtn">🚀 Hitung Neraca Air</button>
        </div>
      </div>
    `;
  }

  // Results Container with ID for auto-scroll
  wizardHtml += `<div id="results" class="results-container" style="display: none;"></div>`;

  container.innerHTML = wizardHtml;

  // Re-attach listeners because innerHTML wiped them logic is handled by global delegation or specific re-attach
  // But wait, the standard approach here is delegated event listeners on the document body (setupEventListeners), 
  // so button clicks work. However, explicit onclick handlers in HTML string refer to window scope.
  // We need to expose wizard functions to window.
}

// --- Wizard Helpers exposed to Window ---
window.nextStep = () => {
  // Auto-save current step data before moving
  const stepData = collectFormDataPartial();
  Object.assign(currentData, stepData);
  saveDraft();

  // Validation can be added here
  currentWizardStep++;
  renderPDAMForm();
};

window.prevStep = () => {
  const stepData = collectFormDataPartial();
  Object.assign(currentData, stepData);
  currentWizardStep--;
  renderPDAMForm();
};

window.goToStep = (step) => {
  const stepData = collectFormDataPartial();
  Object.assign(currentData, stepData);
  currentWizardStep = step;
  renderPDAMForm();
};

window.loadPreset = (size) => {
  let preset = {};
  if (size === 'small') {
    preset = {
      pdamName: 'PDAM Kecil Contoh', numberOfCustomers: '8500', pipeLengthKm: '120',
      systemInputVolume: '2500000', billedMetered: '1800000',
      productionCost: '2500', averageTariff: '4500'
    };
  } else if (size === 'medium') {
    preset = {
      pdamName: 'PDAM Sedang Contoh', numberOfCustomers: '50000', pipeLengthKm: '850',
      systemInputVolume: '15000000', billedMetered: '9500000',
      productionCost: '3200', averageTariff: '5500'
    };
  } else if (size === 'large') {
    preset = {
      pdamName: 'PDAM Besar Metropolitan', numberOfCustomers: '150000', pipeLengthKm: '2200',
      systemInputVolume: '45000000', billedMetered: '28000000',
      productionCost: '4000', averageTariff: '7200'
    };
  }

  Object.assign(currentData, preset);
  // Re-render
  renderPDAMForm();
  // Flash effect
  document.querySelector('.card').classList.add('flash-success');
  setTimeout(() => document.querySelector('.card').classList.remove('flash-success'), 500);
};

// Collect data from ONLY the current visible fields
function collectFormDataPartial() {
  const data = {};
  document.querySelectorAll('input, select, textarea').forEach(el => {
    if (el.id) data[el.id] = el.value;
  });
  return data;
}

/**
 * Render DMA interface
 */
function renderDMAInterface() {
  const container = document.querySelector('.calculator-container');

  container.innerHTML = `
    <div class="card">
      <h3>Manajemen Zona DMA</h3>
      <p>Tambahkan zona DMA satu per satu untuk analisis per-zona.</p>
      
      <div id="zones-list">
        ${zones.map((zone, index) => renderZoneCard(zone, index)).join('')}
      </div>
      
      <button class="btn-secondary btn-large" id="addZoneBtn">+ Tambah Zona DMA</button>
    </div>
    
    ${zones.length > 0 ? `
    <div class="card">
      <button class="btn-primary btn-large" id="calculateDMABtn">Hitung Semua Zona</button>
      <button class="btn-secondary" id="clearZonesBtn">Reset Semua</button>
    </div>
    ` : ''}
    
    <!-- Results container -->
    <div id="results" class="results-container" style="display: none;"></div>
  `;
}

/**
 * Render individual zone card
 */
function renderZoneCard(zone, index) {
  return `
    <div class="zone-card" data-zone-id="${index}">
      <div class="zone-header">
        <h4>Zona ${index + 1}: ${zone.name || 'Unnamed Zone'}</h4>
        <button class="btn-delete" data-zone-index="${index}">🗑️</button>
      </div>
      
      <div class="zone-summary">
        ${zone.data.systemInputVolume ? `
          <span>SIV: ${parseInt(zone.data.systemInputVolume).toLocaleString()} m³</span>
          <span>Pelanggan: ${parseInt(zone.data.numberOfCustomers || 0).toLocaleString()}</span>
        ` : '<em>Belum diisi</em>'}
      </div>
      
      <button class="btn-secondary btn-small" data-edit-zone="${index}">Edit Data</button>
    </div>
  `;
}

/**
 * Setup event listeners
 */
/**
 * Setup event listeners (Delegated)
 */
function setupEventListeners() {
  const container = document.querySelector('.app-container');

  // Remove existing listener to prevent duplicates if called multiple times (though best called once)
  // Since we use anonymous functions, we can't easily remove. 
  // Better approach: Attach to document body ONCE, or assume this is called once.
  // Given existing architecture, let's use a flag or just attach to container which is static?
  // Actually, .app-container is static.
}

// Global listener for dynamic elements
document.addEventListener('click', (e) => {
  const target = e.target;

  // PDAM Mode Actions
  if (target.id === 'calculateBtn') {
    performCalculation();
  } else if (target.id === 'clearBtn') {
    clearForm();
  }

  // DMA Mode Actions
  else if (target.id === 'addZoneBtn') {
    addNewZone();
  } else if (target.id === 'calculateDMABtn') {
    calculateDMAResults();
  } else if (target.id === 'clearZonesBtn') {
    if (confirm('Reset semua zona?')) {
      zones = [];
      renderDMAInterface();
      saveDraft();
    }
  }

  // Zone Management (Delegated)
  else if (target.classList.contains('btn-delete') || target.closest('.btn-delete')) {
    const btn = target.classList.contains('btn-delete') ? target : target.closest('.btn-delete');
    const index = parseInt(btn.dataset.zoneIndex);
    deleteZone(index);
  } else if (target.matches('[data-edit-zone]')) {
    const index = parseInt(target.dataset.editZone);
    editZone(index);
  }

  // Export Actions
  else if (target.id === 'exportExcelBtn') {
    alert('Fitur Excel segera hadir!');
  }
});

// Input Auto-Save Delegation
document.addEventListener('input', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
    debounce(autoSave, 500)();
  }
});

/**
 * Add new DMA zone
 */
function addNewZone() {
  const zoneName = prompt('Nama Zona DMA:', `Zona ${zones.length + 1}`);
  if (!zoneName) return;

  zones.push({
    id: `zone-${Date.now()}`,
    name: zoneName,
    data: {}
  });

  renderDMAInterface();
  saveDraft();
}

/**
 * Edit zone data
 */
function editZone(index) {
  const zone = zones[index];

  // Create modal/form for zone input
  showZoneInputForm(zone, (updatedData) => {
    zones[index].data = updatedData;
    renderDMAInterface();
    saveDraft();
  });
}

/**
 * Delete zone
 */
function deleteZone(index) {
  if (confirm(`Hapus zona "${zones[index].name}"?`)) {
    zones.splice(index, 1);
    renderDMAInterface();
    saveDraft();
  }
}

/**
 * Clear all zones
 */
function clearAllZones() {
  if (confirm('Hapus semua zona?')) {
    zones = [];
    renderDMAInterface();
    setupEventListeners();
    localStorage.removeItem('waterBalanceDraft');
  }
}

/**
 * Show zone input form (simplified - reuse PDAM form logic)
 */
function showZoneInputForm(zone, onSave) {
  // For now, use a simple series of prompts
  // TODO: Create a proper modal form

  const data = {};
  data.systemInputVolume = prompt('SIV (m³):', zone.data.systemInputVolume || '');
  data.billedMetered = prompt('Billed Metered (m³):', zone.data.billedMetered || '');
  data.numberOfCustomers = prompt('Jumlah Pelanggan:', zone.data.numberOfCustomers || '');
  data.pipeLengthKm = prompt('Panjang Pipa (km):', zone.data.pipeLengthKm || '');

  if (data.systemInputVolume && data.billedMetered) {
    onSave(data);
  }
}

/**
 * Calculate DMA results
 */
function calculateDMAResults() {
  if (zones.length === 0) {
    alert('Tambahkan minimal 1 zona DMA terlebih dahulu');
    return;
  }

  // Calculate
  const results = calculateDMAZones(zones);

  // Display results
  renderDMAResults(results);

  // Save
  saveDraft();
}

/**
 * Render DMA results
 */
function renderDMAResults(results) {
  const container = document.getElementById('results');
  if (!container) return;

  const { pdamAggregate, rankedZones } = results;
  const priorities = identifyPriorityZones(rankedZones);

  container.innerHTML = `
    <div class="card dashboard">
      <h2>Hasil Analisis Per-DMA</h2>
      
      <!-- PDAM Aggregate -->
      <div class="metric-headline metric-${getBenchmarkClass(getOverallBenchmark(pdamAggregate.percentages.nrw))}">
        <div class="metric-value">${pdamAggregate.percentages.nrw.toFixed(1)}%</div>
        <div class="metric-label">NRW Level PDAM (Agregat)</div>
      </div>
      
      <!-- Priority Zones Table -->
      <h3>Zona Prioritas Intervensi</h3>
      <table class="priority-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Nama Zona</th>
            <th>NRW %</th>
            <th>Prioritas</th>
            <th>Rekomendasi Intervensi</th>
          </tr>
        </thead>
        <tbody>
          ${priorities.map(p => `
            <tr class="priority-${p.priority.toLowerCase()}">
              <td>${p.rank}</td>
              <td>${p.zoneName}</td>
              <td>${p.nrwPercent.toFixed(1)}%</td>
              <td><span class="badge badge-${p.priority.toLowerCase()}">${p.priority}</span></td>
              <td>${p.intervention}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <!-- Zone Comparison -->
      <h3>Perbandingan Semua Zona</h3>
      <div class="zone-comparison">
        ${rankedZones.map(zone => `
          <div class="zone-bar">
            <div class="zone-name">${zone.name}</div>
            <div class="zone-nrw-bar">
              <div class="zone-nrw-fill fill-${getSeverity(zone.percentages.nrw)}" 
                   style="width: ${zone.percentages.nrw}%">
                ${zone.percentages.nrw.toFixed(1)}%
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  container.style.display = 'block';
  container.scrollIntoView({ behavior: 'smooth' });

}

/**
 * Get severity class for color coding
 */
function getSeverity(nrw) {
  if (nrw < 20) return 'excellent';
  if (nrw < 30) return 'good';
  if (nrw < 40) return 'attention';
  return 'critical';
}

/**
 * Get overall benchmark level
 */
function getOverallBenchmark(nrwPercent) {
  if (nrwPercent < 20) return 0; // excellent
  if (nrwPercent < 30) return 1; // good
  if (nrwPercent < 40) return 2; // attention
  return 3; // critical
}

// ... (rest of the original functions: performCalculation, renderResults, etc.)
// Keep all existing PDAM-level functions unchanged

/**
 * Perform calculation (PDAM mode)
 */
/**
 * Perform calculation (PDAM mode)
 */
function performCalculation() {
  // Merge current inputs with stored state (wizard persistence)
  const formState = collectFormData(); // Gets only visible fields
  currentData = { ...currentData, ...formState };

  const validation = validateInputs(currentData);
  if (!validation.isValid) {
    showErrors(validation.errors);
    return;
  }

  calculationResults = calculateWaterBalance(currentData);
  renderResults(calculationResults);
  saveDraft();

  // Auto-scroll to results
  setTimeout(() => {
    document.getElementById('results').style.display = 'block';
    document.getElementById('results').scrollIntoView({ behavior: 'smooth' });

    // ONE-CLICK Report Generation Removed
  }, 100);
}

function collectFormData() {
  // In Wizard mode, some fields might be hidden. 
  // We rely on currentData for state, but updated with any DOM values present.
  const data = {};

  const getVal = (id) => document.getElementById(id)?.value;

  // We only grab what's currently in the DOM
  if (getVal('pdamName')) data.pdamName = getVal('pdamName');
  if (getVal('period')) data.period = getVal('period');
  if (getVal('numberOfCustomers')) data.numberOfCustomers = getVal('numberOfCustomers');
  if (getVal('pipeLengthKm')) data.pipeLengthKm = getVal('pipeLengthKm');
  if (getVal('averagePressure')) data.averagePressure = getVal('averagePressure');
  if (getVal('averageTariff')) data.averageTariff = getVal('averageTariff');
  if (getVal('productionCost')) data.productionCost = getVal('productionCost');
  if (getVal('systemInputVolume')) data.systemInputVolume = getVal('systemInputVolume');
  if (getVal('billedMetered')) data.billedMetered = getVal('billedMetered');
  if (getVal('billedUnmetered')) data.billedUnmetered = getVal('billedUnmetered');
  if (getVal('unbilledMetered')) data.unbilledMetered = getVal('unbilledMetered');
  if (getVal('unbilledUnmetered')) data.unbilledUnmetered = getVal('unbilledUnmetered');
  if (getVal('unauthorizedPct')) data.unauthorizedPct = getVal('unauthorizedPct');
  if (getVal('meterInaccuracyPct')) data.meterInaccuracyPct = getVal('meterInaccuracyPct');
  if (getVal('dataErrors')) data.dataErrors = getVal('dataErrors');
  if (getVal('aiContext')) data.aiContext = getVal('aiContext');

  return data;
}

function renderResults(results) {
  const container = document.getElementById('results');
  if (!container) return;

  const { components, percentages, kpis, benchmark } = results;

  container.innerHTML = `
    <div class="card dashboard">
      <h2>Hasil Analisis Neraca Air</h2>
      
      <div class="metric-headline metric-${getBenchmarkClass(benchmark.details.nrw)}">
        <div class="metric-value">${percentages.nrw.toFixed(1)}%</div>
        <div class="metric-label">Non-Revenue Water (NRW)</div>
        <div class="metric-status">${benchmark.labels[benchmark.details.nrw]}</div>
        <div class="metric-subtext" style="font-size: 0.75rem; color: #9ca3af; margin-top: 4px;">Status keseluruhan: ${benchmark.labels[benchmark.overall]} (berdasarkan metrik terburuk)</div>
      </div>
      
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-value" style="color: ${kpis.realLossesPerKmPerDay < 5 ? '#22c55e' : kpis.realLossesPerKmPerDay < 10 ? '#3b82f6' : kpis.realLossesPerKmPerDay < 20 ? '#f59e0b' : '#ef4444'}">${kpis.realLossesPerKmPerDay.toFixed(2)}</div>
          <div class="kpi-label">m³/km/hari</div>
          <div style="font-size: 0.75rem; color: #9ca3af; margin-top: 4px;">
            Benchmark: <5 Baik | 5-10 Sedang | >20 Kritis
          </div>
        </div>
        
        <div class="kpi-card">
          <div class="kpi-value" style="color: ${kpis.nrwPerConnectionPerDay < 50 ? '#22c55e' : kpis.nrwPerConnectionPerDay < 100 ? '#3b82f6' : kpis.nrwPerConnectionPerDay < 200 ? '#f59e0b' : '#ef4444'}">${kpis.nrwPerConnectionPerDay.toFixed(1)}</div>
          <div class="kpi-label">L/sambungan/hari</div>
          <div style="font-size: 0.75rem; color: #9ca3af; margin-top: 4px;">
            Benchmark: <50 Baik | 50-100 Sedang | >200 Kritis
          </div>
        </div>
        
        ${kpis.ili ? `
        <div class="kpi-card">
          <div class="kpi-value" style="color: ${kpis.ili < 2 ? '#22c55e' : kpis.ili < 4 ? '#3b82f6' : kpis.ili < 8 ? '#f59e0b' : '#ef4444'}">${kpis.ili.toFixed(2)}</div>
          <div class="kpi-label">ILI (Infrastructure Leakage Index)</div>
          <div style="font-size: 0.75rem; color: #9ca3af; margin-top: 4px;">
            Benchmark IWA: <2 Baik | 2-4 Sedang | >8 Kritis
          </div>
        </div>
        ` : ''}
      </div>
      
      <div class="card" style="background: var(--card-bg); margin-top: 20px;">
        <h4 style="margin-bottom: 12px; color: var(--text);">📊 Standar Benchmark NRW (IWA)</h4>
        <table style="width: 100%; font-size: 0.85rem; color: var(--text);">
          <tr style="border-bottom: 1px solid var(--border);">
            <td style="padding: 8px 0;"><strong>NRW %</strong></td>
            <td style="color: #22c55e;"><20% Sangat Baik</td>
            <td style="color: #3b82f6;">20-30% Baik</td>
            <td style="color: #f59e0b;">30-40% Perlu Perhatian</td>
            <td style="color: #ef4444;">>40% Kritis</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--border);">
            <td style="padding: 8px 0;"><strong>m³/km/hari</strong></td>
            <td style="color: #22c55e;"><5</td>
            <td style="color: #3b82f6;">5-10</td>
            <td style="color: #f59e0b;">10-20</td>
            <td style="color: #ef4444;">>20</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--border);">
            <td style="padding: 8px 0;"><strong>L/sambungan/hari</strong></td>
            <td style="color: #22c55e;"><50</td>
            <td style="color: #3b82f6;">50-100</td>
            <td style="color: #f59e0b;">100-200</td>
            <td style="color: #ef4444;">>200</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>ILI</strong></td>
            <td style="color: #22c55e;"><2</td>
            <td style="color: #3b82f6;">2-4</td>
            <td style="color: #f59e0b;">4-8</td>
            <td style="color: #ef4444;">>8</td>
          </tr>
        </table>
      </div>
      
      <div class="card" style="background: linear-gradient(135deg, #1e3a5f 0%, #2d4a5f 100%); margin-top: 20px; border-left: 4px solid #fbbf24;">
        <h4 style="margin-bottom: 16px; color: #fbbf24;">💰 Dampak Finansial NRW</h4>
        <div class="kpi-grid">
          <div class="kpi-card" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3);">
            <div class="kpi-value" style="color: #ef4444; font-size: 1.5rem;">Rp ${formatRupiah(results.financialImpact.lostRevenue)}</div>
            <div class="kpi-label">Potensi Pendapatan Hilang/Tahun</div>
            <small style="color: #9ca3af;">NRW × Tarif Air</small>
          </div>
          
          <div class="kpi-card" style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3);">
            <div class="kpi-value" style="color: #fbbf24; font-size: 1.5rem;">Rp ${formatRupiah(results.financialImpact.wastedProductionCost)}</div>
            <div class="kpi-label">Biaya Produksi Terbuang/Tahun</div>
            <small style="color: #9ca3af;">NRW × Biaya Produksi</small>
          </div>
          
          <div class="kpi-card" style="background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.5);">
            <div class="kpi-value" style="color: #ef4444; font-size: 1.8rem; font-weight: bold;">Rp ${formatRupiah(results.financialImpact.totalAnnualLoss)}</div>
            <div class="kpi-label">TOTAL KERUGIAN/TAHUN</div>
            <small style="color: #9ca3af;">Pendapatan Hilang + Biaya Terbuang</small>
          </div>
          
          <div class="kpi-card" style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3);">
            <div class="kpi-value" style="color: #22c55e; font-size: 1.5rem;">Rp ${formatRupiah(results.financialImpact.potentialRecovery50pct)}</div>
            <div class="kpi-label">Potensi Pemulihan (50% NRW)</div>
            <small style="color: #9ca3af;">Jika NRW turun 50%</small>
          </div>
        </div>
        </div>
        
        <!-- Innova Zenix Benchmark -->
        <div style="margin-top: 16px; background: rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 12px; display: flex; align-items: center; gap: 12px; border: 1px dashed #fbbf24;">
          <div style="font-size: 2rem;">🚗🔥</div>
          <div>
            <div style="color: #fbbf24; font-weight: bold; font-size: 0.95rem;">
              Setara dengan membakar ${(results.financialImpact.totalAnnualLoss / 630000000).toFixed(1)} unit Kijang Innova Zenix (Tipe Tertinggi) setiap tahun!
            </div>
            <div style="color: #9ca3af; font-size: 0.8rem; margin-top: 2px;">
              *Estimasi harga Innova Zenix Hybrid Q HV Modellista ~Rp 630 Juta
            </div>
          </div>
        </div>
      </div>
      
      <div class="chart-container">
        <h3>Komposisi Air</h3>
        <div class="breakdown-simple">
          <div class="breakdown-item" style="flex: ${percentages.revenueWater};">
            <span>Revenue Water: ${percentages.revenueWater.toFixed(1)}%</span>
          </div>
          <div class="breakdown-item breakdown-loss" style="flex: ${percentages.nrw};">
            <span>NRW: ${percentages.nrw.toFixed(1)}%</span>
          </div>
        </div>
        
        <h3>Komposisi NRW</h3>
        <div class="breakdown-simple">
          <div class="breakdown-item breakdown-real" style="flex: ${percentages.realLossesPercent}; ${percentages.realLossesPercent < 5 ? 'min-width: 0;' : ''}">
            ${percentages.realLossesPercent >= 5 ? `<span>Physical: ${percentages.realLossesPercent.toFixed(1)}%</span>` : ''}
          </div>
          <div class="breakdown-item breakdown-apparent" style="flex: ${percentages.apparentLossesPercent}; ${percentages.apparentLossesPercent < 5 ? 'min-width: 0;' : ''}">
            ${percentages.apparentLossesPercent >= 5 ? `<span>Commercial: ${percentages.apparentLossesPercent.toFixed(1)}%</span>` : ''}
          </div>
        </div>
      </div>
      
      ${results.validation.warnings.length > 0 ? `
      <div class="warnings">
        ${results.validation.warnings.map(w => `
          <div class="warning warning-${w.level}">${w.message}</div>
        `).join('')}
      </div>
      ` : ''}
      

    </div>
  `;

  container.style.display = 'block';
  container.scrollIntoView({ behavior: 'smooth' });

}

function getBenchmarkClass(level) {
  const classes = ['excellent', 'good', 'attention', 'critical'];
  return classes[level] || 'good';
}

function formatRupiah(number) {
  if (number >= 1000000000000) {
    return (number / 1000000000000).toFixed(2) + ' T';
  } else if (number >= 1000000000) {
    return (number / 1000000000).toFixed(2) + ' M';
  } else if (number >= 1000000) {
    return (number / 1000000).toFixed(2) + ' Jt';
  } else {
    return number.toLocaleString('id-ID');
  }
}

function showErrors(errors) {
  alert('Terjadi kesalahan:\n\n' + errors.join('\n'));
}

function clearForm() {
  if (confirm('Yakin ingin reset form?')) {
    currentData = {};
    localStorage.removeItem('waterBalanceDraft');
    renderPDAMForm();
    setupEventListeners();
    document.getElementById('results').style.display = 'none';
  }
}

function autoSave() {
  currentData = collectFormData();
  saveDraft();
}

function saveDraft() {
  const draft = {
    version: '1.2', // Bump version
    timestamp: new Date().toISOString(),
    mode: currentMode,
    data: currentMode === 'pdam' ? currentData : null,
    zones: currentMode === 'dma' ? zones : null,
    wizardStep: currentWizardStep // Persist step
  };
  localStorage.setItem('waterBalanceDraft', JSON.stringify(draft));
  console.log('Draft auto-saved');
}

function loadDraft() {
  const saved = localStorage.getItem('waterBalanceDraft');
  if (saved) {
    try {
      const draft = JSON.parse(saved);
      currentMode = draft.mode || 'pdam';

      if (currentMode === 'pdam') {
        currentData = draft.data || {};
        currentWizardStep = draft.wizardStep || 1; // Load step
      } else {
        zones = draft.zones || [];
      }

      console.log('Draft loaded:', currentMode, 'Step:', currentWizardStep);
    } catch (e) {
      console.error('Failed to load draft:', e);
    }
  }
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Initialize on load
// Initialize on load
// document.addEventListener('DOMContentLoaded', init);

// ... (rest of the file)

