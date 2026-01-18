(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))i(a);new MutationObserver(a=>{for(const s of a)if(s.type==="childList")for(const r of s.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&i(r)}).observe(document,{childList:!0,subtree:!0});function n(a){const s={};return a.integrity&&(s.integrity=a.integrity),a.referrerPolicy&&(s.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?s.credentials="include":a.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(a){if(a.ep)return;a.ep=!0;const s=n(a);fetch(a.href,s)}})();function R(t){const e=parseFloat(t.systemInputVolume)||0,n=parseFloat(t.billedMetered)||0,i=parseFloat(t.billedUnmetered)||0,a=parseFloat(t.unbilledMetered)||0,s=parseFloat(t.unbilledUnmetered)||0,r=parseInt(t.numberOfCustomers)||0,o=parseFloat(t.pipeLengthKm)||0,b=parseFloat(t.averagePressure)||0,y=parseFloat(t.averageTariff)||5e3,f=parseFloat(t.productionCost)||3e3,O=parseFloat(t.unauthorizedPct)||0,E=parseFloat(t.meterInaccuracyPct)||0,U=parseFloat(t.dataErrors)||0,k=n+i,x=a+s,M=k+x,m=e-k,P=e>0?m/e*100:0,j=e*(O/100),Z=n*(E/100),I=j+Z+U,S=e-M,g=S-I,D=r>0?m*1e3/(r*365):0,C=o>0?g/(o*365):0,T=q(g,o,r,b),W=g,H=J(P,T,C,D);return{input:{siv:e,billedMetered:n,billedUnmetered:i,customers:r,pipeLength:o},components:{systemInputVolume:e,billedAuthorized:k,unbilledAuthorized:x,authorizedConsumption:M,nrw:m,waterLosses:S,apparentLosses:I,realLosses:g},percentages:{nrw:P,revenueWater:e>0?k/e*100:0,apparentLossesPercent:e>0?I/e*100:0,realLossesPercent:e>0?g/e*100:0},kpis:{nrwPercent:P,nrwPerConnectionPerDay:D,realLossesPerKmPerDay:C,ili:T,carl:W},benchmark:H,financialImpact:{lostRevenue:m*y,wastedProductionCost:m*f,totalAnnualLoss:m*(y+f),potentialRecovery50pct:m*.5*y,averageTariff:y,productionCost:f},validation:{isValid:e>0&&n>0,warnings:Y(e,n,P,g)}}}function q(t,e,n,i){if(!e||!n||!i)return null;const a=i*10.2,s=.008*n,o=(18*e+.8*n+25*s)*a*365/1e3;return o>0?t/o:null}function J(t,e,n,i){const a={nrw:w(t,[20,30,40]),ili:e?w(e,[2,4,8]):null,m3PerKmPerDay:w(n,[5,10,20]),lPerConnectionPerDay:w(i,[50,100,200])},s=Object.values(a).filter(o=>o!==null);return{overall:s.length>0?Math.max(...s):2,details:a,labels:["Sangat Baik","Baik","Perlu Perhatian","Kritis"]}}function w(t,e){return t<e[0]?0:t<e[1]?1:t<e[2]?2:3}function Y(t,e,n,i){const a=[];return e>t&&a.push({level:"error",message:"Billed metered consumption tidak boleh lebih besar dari System Input Volume"}),n<12&&a.push({level:"warning",message:"NRW sangat rendah untuk standar Indonesia (< 12%). Periksa data billing dan produksi."}),n>60&&a.push({level:"warning",message:"NRW sangat tinggi (> 60%). Periksa akurasi data flow meter produksi."}),i<0&&a.push({level:"error",message:"Real losses bernilai negatif. Data apparent losses mungkin terlalu tinggi."}),a}function G(t){const e=[],n=[],i=parseFloat(t.systemInputVolume)||0,a=parseFloat(t.billedMetered)||0,s=parseFloat(t.billedUnmetered)||0,r=parseFloat(t.unbilledMetered)||0,o=parseFloat(t.unbilledUnmetered)||0,b=parseInt(t.numberOfCustomers)||0;if((!t.systemInputVolume||i<=0)&&e.push("System Input Volume wajib diisi dan harus lebih dari 0"),a<0&&e.push("Billed Metered Consumption tidak boleh negatif"),(!t.numberOfCustomers||b<=0)&&e.push("Jumlah Pelanggan wajib diisi"),a>i&&i>0&&e.push("Billed Metered tidak boleh melebihi System Input Volume"),s>i&&i>0&&e.push("Billed Unmetered tidak boleh melebihi System Input Volume"),a+s+r+o>i&&i>0&&e.push("Total konsumsi resmi tidak boleh melebihi System Input Volume"),i>0&&b>0){const f=i/b;f<10&&n.push("SIV terlalu rendah untuk jumlah pelanggan. Periksa satuan data."),f>500&&n.push("SIV terlalu tinggi per pelanggan. Periksa satuan data.")}return{isValid:e.length===0,errors:e,warnings:n}}function Q(t){const e=t.map((a,s)=>{const r=R(a.data);return{id:a.id||`zone-${s}`,name:a.name,...r}}),n=X(e),i=[...e].sort((a,s)=>s.percentages.nrw-a.percentages.nrw);return{zones:e,rankedZones:i,pdamAggregate:n,zoneCount:t.length}}function X(t){const e=t.reduce((r,o)=>({siv:r.siv+o.components.systemInputVolume,billedAuthorized:r.billedAuthorized+o.components.billedAuthorized,unbilledAuthorized:r.unbilledAuthorized+o.components.unbilledAuthorized,nrw:r.nrw+o.components.nrw,realLosses:r.realLosses+o.components.realLosses,apparentLosses:r.apparentLosses+o.components.apparentLosses,customers:r.customers+(o.input.customers||0),pipeLength:r.pipeLength+(o.input.pipeLength||0)}),{siv:0,billedAuthorized:0,unbilledAuthorized:0,nrw:0,realLosses:0,apparentLosses:0,customers:0,pipeLength:0}),n=e.siv>0?e.nrw/e.siv*100:0,i=e.siv>0?e.billedAuthorized/e.siv*100:0,a=e.pipeLength>0?e.realLosses/(e.pipeLength*365):0,s=e.customers>0?e.nrw*1e3/(e.customers*365):0;return{components:e,percentages:{nrw:n,revenueWater:i,apparentLossesPercent:e.siv>0?e.apparentLosses/e.siv*100:0,realLossesPercent:e.siv>0?e.realLosses/e.siv*100:0},kpis:{nrwPercent:n,realLossesPerKmPerDay:a,nrwPerConnectionPerDay:s}}}function _(t){return t.slice(0,5).map((e,n)=>{const i=n===0?"Kritis":n===1?"Tinggi":"Sedang",{realLossesPercent:a,apparentLossesPercent:s}=e.percentages;let r;return a>s*2?r="Deteksi kebocoran aktif & pressure management":s>a?r="Penggantian meter & penertiban pelanggan":r="Kombinasi: perbaikan pipa & audit meter",{rank:n+1,zoneName:e.name,nrwPercent:e.percentages.nrw,priority:i,intervention:r,estimatedLoss:e.components.nrw}})}let c="pdam",l={},u=[],B=null,d=1,$=null;document.addEventListener("auth:ready",t=>{$=t.detail.user,console.log("Water Balance App: Auth State Updated",$),updateHistoryWidget()});window.currentUser&&($=window.currentUser);function z(){console.log("🚀 Water Balance Calculator - init() called");try{be(),ee(),c==="dma"?h():v(),c==="pdam"&&Object.keys(l).length>0?N():c==="dma"&&u.length>0&&F(),console.log("🎉 Initialization complete!")}catch(t){console.error("❌ Initialization ERROR:",t)}}function ee(){if(document.querySelector(".mode-selector"))return;const t=document.querySelector(".hero"),e=`
    <div class="mode-selector">
      <label class="mode-option ${c==="pdam"?"active":""}" data-mode="pdam">
        <input type="radio" name="mode" value="pdam" ${c==="pdam"?"checked":""}>
        <div class="mode-content">
          <h4>Hitung Level PDAM</h4>
          <p>Untuk PDAM yang belum menerapkan DMA</p>
        </div>
      </label>
      
      <label class="mode-option ${c==="dma"?"active":""}" data-mode="dma">
        <input type="radio" name="mode" value="dma" ${c==="dma"?"checked":""}>
        <div class="mode-content">
          <h4>Hitung Per-DMA</h4>
          <p>Untuk PDAM yang sudah punya District Metered Area</p>
        </div>
      </label>
    </div>
  `;t.insertAdjacentHTML("afterend",e),document.querySelectorAll(".mode-option").forEach(n=>{n.addEventListener("click",()=>{const i=n.dataset.mode;i!==c&&te(i)})})}function te(t){c=t,document.querySelectorAll(".mode-option").forEach(e=>{e.classList.toggle("active",e.dataset.mode===t)}),document.getElementById("results").style.display="none",t==="dma"?h():v()}function v(){const t=document.querySelector(".calculator-container");d<1&&(d=1),d>3&&(d=3);let n=`
    <div class="wizard-stepper">
      ${[{title:"Identitas & Aset",icon:"🏢"},{title:"Volume & Produksi",icon:"💧"},{title:"Penjualan & Finansial",icon:"💰"}].map((i,a)=>`
        <div class="step-item ${d===a+1?"active":""} ${d>a+1?"completed":""}" onclick="window.goToStep(${a+1})">
          <div class="step-circle">${a+1}</div>
          <div class="step-label">${i.title}</div>
        </div>
      `).join("")}
    </div>
  `;d===1?n+=`
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
        <\/script>
        
        <div class="form-group">
          <label>Nama PDAM <span class="required">*</span></label>
          <input type="text" id="pdamName" placeholder="Contoh: PDAM Tirta Jaya" value="${l.pdamName||""}">
        </div>
        
        <div class="grid-2">
          <div class="form-group">
            <label>Periode</label>
            <input type="month" id="period" value="${l.period||new Date().toISOString().slice(0,7)}">
          </div>
          <div class="form-group">
            <label>Jumlah Pelanggan <span class="tooltip" data-tip="Total Sambungan Rumah (SR)">ℹ️</span></label>
            <input type="number" id="numberOfCustomers" placeholder="0" value="${l.numberOfCustomers||""}">
          </div>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label>Panjang Pipa (km) <span class="tooltip" data-tip="Total panjang pipa distribusi">ℹ️</span></label>
            <input type="number" step="0.1" id="pipeLengthKm" placeholder="0.0" value="${l.pipeLengthKm||""}">
          </div>
          <div class="form-group">
            <label>Tekanan Rata-rata (bar)</label>
            <input type="number" step="0.1" id="averagePressure" placeholder="2.5" value="${l.averagePressure||"2.5"}">
          </div>
        </div>

        <div class="form-group">
            <label>Konteks Tambahan (Opsional) <span class="tooltip" data-tip="Bantu AI memahami kondisi lapangan (Kontur, Usia Pipa, dll)">ℹ️</span></label>
            <textarea id="aiContext" rows="2" placeholder="Contoh: Daerah perbukitan, pipa AC tahun 1980, banyak sambungan liar...">${l.aiContext||""}</textarea>
        </div>

        <div class="wizard-actions right">
          <button class="btn-primary" onclick="window.nextStep()">Lanjut ke Produksi &rarr;</button>
        </div>
      </div>
    `:d===2?n+=`
      <div class="card fade-in">
        <h3>Langkah 2: Volume & Produksi Air</h3>
        
        <div class="form-group highlight-box">
          <label>System Input Volume (SIV) <span class="required">*</span> <span class="tooltip" data-tip="Total air masuk sistem per tahun (m³)">ℹ️</span></label>
          <input type="number" id="systemInputVolume" class="input-lg" placeholder="Contoh: 15000000" value="${l.systemInputVolume||""}">
          <small>Total air yang didistribusikan ke jaringan (m³/tahun)</small>
        </div>

        <div class="form-group">
          <label>Biaya Produksi (Rp/m³) <span class="tooltip" data-tip="HPP Air">ℹ️</span></label>
          <input type="number" id="productionCost" placeholder="3000" value="${l.productionCost||""}">
        </div>
        
        <div class="grid-2">
          <div class="form-group">
            <label>Pemakaian Sendiri (Metered) <small>(m³/thn)</small></label>
            <input type="number" id="unbilledMetered" placeholder="0" value="${l.unbilledMetered||""}">
          </div>
          <div class="form-group">
            <label>Pemakaian Sendiri (Unmetered) <small>(m³/thn)</small></label>
            <input type="number" id="unbilledUnmetered" placeholder="0" value="${l.unbilledUnmetered||""}">
          </div>
        </div>

        <div class="wizard-actions space-between">
          <button class="btn-secondary" onclick="window.prevStep()">&larr; Kembali</button>
          <button class="btn-primary" onclick="window.nextStep()">Lanjut ke Penjualan &rarr;</button>
        </div>
      </div>
    `:d===3&&(n+=`
      <div class="card fade-in">
        <h3>Langkah 3: Penjualan & Finansial</h3>

        <div class="grid-2">
          <div class="form-group">
            <label>Terjual Bermeter (Billed Metered) <span class="required">*</span></label>
            <input type="number" id="billedMetered" class="input-highlight" placeholder="Total Rekening Air (m³)" value="${l.billedMetered||""}">
          </div>
          <div class="form-group">
            <label>Terjual Tak Bermeter (Billed Unmetered)</label>
            <input type="number" id="billedUnmetered" placeholder="Lumpsum / Taksir (m³)" value="${l.billedUnmetered||""}">
          </div>
        </div>

        <div class="form-group">
          <label>Tarif Rata-rata (Rp/m³) <span class="tooltip" data-tip="Harga Jual Rata-rata">ℹ️</span></label>
          <input type="number" id="averageTariff" placeholder="5000" value="${l.averageTariff||""}">
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
              <input type="number" step="0.1" id="unauthorizedPct" value="${l.unauthorizedPct||"3"}">
            </div>
            <div class="form-group">
              <label>Akurasi Meter (%)</label>
              <input type="number" step="0.1" id="meterInaccuracyPct" value="${l.meterInaccuracyPct||"4"}">
            </div>
            <div class="form-group">
              <label>Kesalahan Data (m³)</label>
              <input type="number" id="dataErrors" value="${l.dataErrors||"100000"}">
            </div>
          </div>
        </details>

        <div class="wizard-actions space-between mt-4">
          <button class="btn-secondary" onclick="window.prevStep()">&larr; Kembali</button>
          <button class="btn-primary btn-large pulse-animation" id="calculateBtn">🚀 Hitung Neraca Air</button>
        </div>
      </div>
    `),n+='<div id="results" class="results-container" style="display: none;"></div>',t.innerHTML=n}window.nextStep=()=>{const t=A();Object.assign(l,t),p(),d++,v()};window.prevStep=()=>{const t=A();Object.assign(l,t),d--,v()};window.goToStep=t=>{const e=A();Object.assign(l,e),d=t,v()};window.loadPreset=t=>{let e={};t==="small"?e={pdamName:"PDAM Kecil Contoh",numberOfCustomers:"8500",pipeLengthKm:"120",systemInputVolume:"2500000",billedMetered:"1800000",productionCost:"2500",averageTariff:"4500"}:t==="medium"?e={pdamName:"PDAM Sedang Contoh",numberOfCustomers:"50000",pipeLengthKm:"850",systemInputVolume:"15000000",billedMetered:"9500000",productionCost:"3200",averageTariff:"5500"}:t==="large"&&(e={pdamName:"PDAM Besar Metropolitan",numberOfCustomers:"150000",pipeLengthKm:"2200",systemInputVolume:"45000000",billedMetered:"28000000",productionCost:"4000",averageTariff:"7200"}),Object.assign(l,e),v(),document.querySelector(".card").classList.add("flash-success"),setTimeout(()=>document.querySelector(".card").classList.remove("flash-success"),500)};function A(){const t={};return document.querySelectorAll("input, select, textarea").forEach(e=>{e.id&&(t[e.id]=e.value)}),t}function h(){const t=document.querySelector(".calculator-container");t.innerHTML=`
    <div class="card">
      <h3>Manajemen Zona DMA</h3>
      <p>Tambahkan zona DMA satu per satu untuk analisis per-zona.</p>
      
      <div id="zones-list">
        ${u.map((e,n)=>ae(e,n)).join("")}
      </div>
      
      <button class="btn-secondary btn-large" id="addZoneBtn">+ Tambah Zona DMA</button>
    </div>
    
    ${u.length>0?`
    <div class="card">
      <button class="btn-primary btn-large" id="calculateDMABtn">Hitung Semua Zona</button>
      <button class="btn-secondary" id="clearZonesBtn">Reset Semua</button>
    </div>
    `:""}
    
    <!-- Results container -->
    <div id="results" class="results-container" style="display: none;"></div>
  `}function ae(t,e){return`
    <div class="zone-card" data-zone-id="${e}">
      <div class="zone-header">
        <h4>Zona ${e+1}: ${t.name||"Unnamed Zone"}</h4>
        <button class="btn-delete" data-zone-index="${e}">🗑️</button>
      </div>
      
      <div class="zone-summary">
        ${t.data.systemInputVolume?`
          <span>SIV: ${parseInt(t.data.systemInputVolume).toLocaleString()} m³</span>
          <span>Pelanggan: ${parseInt(t.data.numberOfCustomers||0).toLocaleString()}</span>
        `:"<em>Belum diisi</em>"}
      </div>
      
      <button class="btn-secondary btn-small" data-edit-zone="${e}">Edit Data</button>
    </div>
  `}function ne(){document.querySelector(".app-container")}document.addEventListener("click",t=>{const e=t.target;if(e.id==="calculateBtn")N();else if(e.id==="clearBtn")me();else if(e.id==="addZoneBtn")ie();else if(e.id==="calculateDMABtn")F();else if(e.id==="clearZonesBtn")confirm("Reset semua zona?")&&(u=[],h(),p());else if(e.classList.contains("btn-delete")||e.closest(".btn-delete")){const n=e.classList.contains("btn-delete")?e:e.closest(".btn-delete"),i=parseInt(n.dataset.zoneIndex);re(i)}else if(e.matches("[data-edit-zone]")){const n=parseInt(e.dataset.editZone);se(n)}else e.id==="exportExcelBtn"&&alert("Fitur Excel segera hadir!")});document.addEventListener("input",t=>{(t.target.tagName==="INPUT"||t.target.tagName==="SELECT")&&fe(ve,500)()});function ie(){const t=prompt("Nama Zona DMA:",`Zona ${u.length+1}`);t&&(u.push({id:`zone-${Date.now()}`,name:t,data:{}}),h(),p())}function se(t){const e=u[t];le(e,n=>{u[t].data=n,h(),p()})}function re(t){confirm(`Hapus zona "${u[t].name}"?`)&&(u.splice(t,1),h(),p())}function le(t,e){const n={};n.systemInputVolume=prompt("SIV (m³):",t.data.systemInputVolume||""),n.billedMetered=prompt("Billed Metered (m³):",t.data.billedMetered||""),n.numberOfCustomers=prompt("Jumlah Pelanggan:",t.data.numberOfCustomers||""),n.pipeLengthKm=prompt("Panjang Pipa (km):",t.data.pipeLengthKm||""),n.systemInputVolume&&n.billedMetered&&e(n)}function F(){if(u.length===0){alert("Tambahkan minimal 1 zona DMA terlebih dahulu");return}const t=Q(u);oe(t),p()}function oe(t){const e=document.getElementById("results");if(!e)return;const{pdamAggregate:n,rankedZones:i}=t,a=_(i);e.innerHTML=`
    <div class="card dashboard">
      <h2>Hasil Analisis Per-DMA</h2>
      
      <!-- PDAM Aggregate -->
      <div class="metric-headline metric-${K(ce(n.percentages.nrw))}">
        <div class="metric-value">${n.percentages.nrw.toFixed(1)}%</div>
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
          ${a.map(s=>`
            <tr class="priority-${s.priority.toLowerCase()}">
              <td>${s.rank}</td>
              <td>${s.zoneName}</td>
              <td>${s.nrwPercent.toFixed(1)}%</td>
              <td><span class="badge badge-${s.priority.toLowerCase()}">${s.priority}</span></td>
              <td>${s.intervention}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      
      <!-- Zone Comparison -->
      <h3>Perbandingan Semua Zona</h3>
      <div class="zone-comparison">
        ${i.map(s=>`
          <div class="zone-bar">
            <div class="zone-name">${s.name}</div>
            <div class="zone-nrw-bar">
              <div class="zone-nrw-fill fill-${de(s.percentages.nrw)}" 
                   style="width: ${s.percentages.nrw}%">
                ${s.percentages.nrw.toFixed(1)}%
              </div>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `,e.style.display="block",e.scrollIntoView({behavior:"smooth"})}function de(t){return t<20?"excellent":t<30?"good":t<40?"attention":"critical"}function ce(t){return t<20?0:t<30?1:t<40?2:3}function N(){const t=V();l={...l,...t};const e=G(l);if(!e.isValid){pe(e.errors);return}B=R(l),ue(B),p(),setTimeout(()=>{document.getElementById("results").style.display="block",document.getElementById("results").scrollIntoView({behavior:"smooth"})},100)}function V(){const t={},e=n=>document.getElementById(n)?.value;return e("pdamName")&&(t.pdamName=e("pdamName")),e("period")&&(t.period=e("period")),e("numberOfCustomers")&&(t.numberOfCustomers=e("numberOfCustomers")),e("pipeLengthKm")&&(t.pipeLengthKm=e("pipeLengthKm")),e("averagePressure")&&(t.averagePressure=e("averagePressure")),e("averageTariff")&&(t.averageTariff=e("averageTariff")),e("productionCost")&&(t.productionCost=e("productionCost")),e("systemInputVolume")&&(t.systemInputVolume=e("systemInputVolume")),e("billedMetered")&&(t.billedMetered=e("billedMetered")),e("billedUnmetered")&&(t.billedUnmetered=e("billedUnmetered")),e("unbilledMetered")&&(t.unbilledMetered=e("unbilledMetered")),e("unbilledUnmetered")&&(t.unbilledUnmetered=e("unbilledUnmetered")),e("unauthorizedPct")&&(t.unauthorizedPct=e("unauthorizedPct")),e("meterInaccuracyPct")&&(t.meterInaccuracyPct=e("meterInaccuracyPct")),e("dataErrors")&&(t.dataErrors=e("dataErrors")),e("aiContext")&&(t.aiContext=e("aiContext")),t}function ue(t){const e=document.getElementById("results");if(!e)return;const{components:n,percentages:i,kpis:a,benchmark:s}=t;e.innerHTML=`
    <div class="card dashboard">
      <h2>Hasil Analisis Neraca Air</h2>
      
      <div class="metric-headline metric-${K(s.details.nrw)}">
        <div class="metric-value">${i.nrw.toFixed(1)}%</div>
        <div class="metric-label">Non-Revenue Water (NRW)</div>
        <div class="metric-status">${s.labels[s.details.nrw]}</div>
        <div class="metric-subtext" style="font-size: 0.75rem; color: #9ca3af; margin-top: 4px;">Status keseluruhan: ${s.labels[s.overall]} (berdasarkan metrik terburuk)</div>
      </div>
      
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-value" style="color: ${a.realLossesPerKmPerDay<5?"#22c55e":a.realLossesPerKmPerDay<10?"#3b82f6":a.realLossesPerKmPerDay<20?"#f59e0b":"#ef4444"}">${a.realLossesPerKmPerDay.toFixed(2)}</div>
          <div class="kpi-label">m³/km/hari</div>
          <div style="font-size: 0.75rem; color: #9ca3af; margin-top: 4px;">
            Benchmark: <5 Baik | 5-10 Sedang | >20 Kritis
          </div>
        </div>
        
        <div class="kpi-card">
          <div class="kpi-value" style="color: ${a.nrwPerConnectionPerDay<50?"#22c55e":a.nrwPerConnectionPerDay<100?"#3b82f6":a.nrwPerConnectionPerDay<200?"#f59e0b":"#ef4444"}">${a.nrwPerConnectionPerDay.toFixed(1)}</div>
          <div class="kpi-label">L/sambungan/hari</div>
          <div style="font-size: 0.75rem; color: #9ca3af; margin-top: 4px;">
            Benchmark: <50 Baik | 50-100 Sedang | >200 Kritis
          </div>
        </div>
        
        ${a.ili?`
        <div class="kpi-card">
          <div class="kpi-value" style="color: ${a.ili<2?"#22c55e":a.ili<4?"#3b82f6":a.ili<8?"#f59e0b":"#ef4444"}">${a.ili.toFixed(2)}</div>
          <div class="kpi-label">ILI (Infrastructure Leakage Index)</div>
          <div style="font-size: 0.75rem; color: #9ca3af; margin-top: 4px;">
            Benchmark IWA: <2 Baik | 2-4 Sedang | >8 Kritis
          </div>
        </div>
        `:""}
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
            <div class="kpi-value" style="color: #ef4444; font-size: 1.5rem;">Rp ${L(t.financialImpact.lostRevenue)}</div>
            <div class="kpi-label">Potensi Pendapatan Hilang/Tahun</div>
            <small style="color: #9ca3af;">NRW × Tarif Air</small>
          </div>
          
          <div class="kpi-card" style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3);">
            <div class="kpi-value" style="color: #fbbf24; font-size: 1.5rem;">Rp ${L(t.financialImpact.wastedProductionCost)}</div>
            <div class="kpi-label">Biaya Produksi Terbuang/Tahun</div>
            <small style="color: #9ca3af;">NRW × Biaya Produksi</small>
          </div>
          
          <div class="kpi-card" style="background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.5);">
            <div class="kpi-value" style="color: #ef4444; font-size: 1.8rem; font-weight: bold;">Rp ${L(t.financialImpact.totalAnnualLoss)}</div>
            <div class="kpi-label">TOTAL KERUGIAN/TAHUN</div>
            <small style="color: #9ca3af;">Pendapatan Hilang + Biaya Terbuang</small>
          </div>
          
          <div class="kpi-card" style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3);">
            <div class="kpi-value" style="color: #22c55e; font-size: 1.5rem;">Rp ${L(t.financialImpact.potentialRecovery50pct)}</div>
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
              Setara dengan membakar ${(t.financialImpact.totalAnnualLoss/63e7).toFixed(1)} unit Kijang Innova Zenix (Tipe Tertinggi) setiap tahun!
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
          <div class="breakdown-item" style="flex: ${i.revenueWater};">
            <span>Revenue Water: ${i.revenueWater.toFixed(1)}%</span>
          </div>
          <div class="breakdown-item breakdown-loss" style="flex: ${i.nrw};">
            <span>NRW: ${i.nrw.toFixed(1)}%</span>
          </div>
        </div>
        
        <h3>Komposisi NRW</h3>
        <div class="breakdown-simple">
          <div class="breakdown-item breakdown-real" style="flex: ${i.realLossesPercent}; ${i.realLossesPercent<5?"min-width: 0;":""}">
            ${i.realLossesPercent>=5?`<span>Physical: ${i.realLossesPercent.toFixed(1)}%</span>`:""}
          </div>
          <div class="breakdown-item breakdown-apparent" style="flex: ${i.apparentLossesPercent}; ${i.apparentLossesPercent<5?"min-width: 0;":""}">
            ${i.apparentLossesPercent>=5?`<span>Commercial: ${i.apparentLossesPercent.toFixed(1)}%</span>`:""}
          </div>
        </div>
      </div>
      
      ${t.validation.warnings.length>0?`
      <div class="warnings">
        ${t.validation.warnings.map(r=>`
          <div class="warning warning-${r.level}">${r.message}</div>
        `).join("")}
      </div>
      `:""}
      

    </div>
  `,e.style.display="block",e.scrollIntoView({behavior:"smooth"})}function K(t){return["excellent","good","attention","critical"][t]||"good"}function L(t){return t>=1e12?(t/1e12).toFixed(2)+" T":t>=1e9?(t/1e9).toFixed(2)+" M":t>=1e6?(t/1e6).toFixed(2)+" Jt":t.toLocaleString("id-ID")}function pe(t){alert(`Terjadi kesalahan:

`+t.join(`
`))}function me(){confirm("Yakin ingin reset form?")&&(l={},localStorage.removeItem("waterBalanceDraft"),v(),ne(),document.getElementById("results").style.display="none")}function ve(){l=V(),p()}function p(){const t={version:"1.2",timestamp:new Date().toISOString(),mode:c,data:c==="pdam"?l:null,zones:c==="dma"?u:null,wizardStep:d};localStorage.setItem("waterBalanceDraft",JSON.stringify(t)),console.log("Draft auto-saved")}function be(){const t=localStorage.getItem("waterBalanceDraft");if(t)try{const e=JSON.parse(t);c=e.mode||"pdam",c==="pdam"?(l=e.data||{},d=e.wizardStep||1):u=e.zones||[],console.log("Draft loaded:",c,"Step:",d)}catch(e){console.error("Failed to load draft:",e)}}function fe(t,e){let n;return function(...a){const s=()=>{clearTimeout(n),t(...a)};clearTimeout(n),n=setTimeout(s,e)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",z):z();
