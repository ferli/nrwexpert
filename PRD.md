# PRD: Kalkulator Neraca Air (IWA Water Balance Calculator)

> **Versi:** 1.0  
> **Status:** Draft  
> **Tanggal:** Januari 2026  
> **Penulis:** FD Iskandar

---

## 1. Executive Summary

### 1.1 Problem Statement

PDAM di Indonesia menghadapi tantangan besar dalam mengelola Non-Revenue Water (NRW) dengan rata-rata nasional 33-35%, jauh di atas target 20%. Salah satu hambatan utama adalah **kurangnya pemahaman akurat tentang komposisi NRW** — apakah dominan kehilangan fisik (kebocoran) atau kehilangan komersial (pencurian, meter error).

Tanpa diagnosis yang tepat, investasi pengurangan NRW sering salah sasaran:
- PDAM dengan masalah utama di meter error membeli SCADA untuk deteksi kebocoran
- PDAM dengan masalah kebocoran fisik fokus pada penertiban pelanggan illegal

### 1.2 Solution

**Kalkulator Neraca Air** — aplikasi web berbasis standar IWA (International Water Association) yang membantu PDAM:
1. **Menghitung** NRW berdasarkan data operasional dengan metodologi terstandarisasi
2. **Memisahkan** komponen kehilangan fisik vs kehilangan komersial
3. **Mendiagnosa** prioritas intervensi berdasarkan data
4. **Membandingkan** kinerja dengan benchmark industri
5. **Menyajikan** laporan yang bisa dipertanggungjawabkan ke stakeholder

### 1.3 Success Metrics

| Metric | Target |
|--------|--------|
| PDAM yang menggunakan (MAU) | 100 dalam 6 bulan |
| Waktu pengisian form | < 15 menit |
| Response dari komunitas PERPAMSI | Positif, ada diskusi lanjutan |
| Digunakan dalam laporan resmi PDAM | 5 PDAM mengkonfirmasi penggunaan |

---

## 2. Stakeholder Analysis

### 2.1 Direktur Utama / Direktur Teknik

**Ekspektasi:**
- Dashboard ringkas: berapa NRW, breakdown-nya apa
- Perbandingan dengan PDAM lain / benchmark nasional
- Rekomendasi prioritas investasi
- Laporan yang bisa dipresentasikan ke DPRD / KPM

**Pain Point:**
- Data NRW sering "asal-asalan" dari bawahan
- Tidak ada standarisasi metodologi
- Sulit menjelaskan ke stakeholder non-teknis

### 2.2 Manajer Distribusi

**Ekspektasi:**
- Detail perhitungan kehilangan fisik per zona (jika data DMA tersedia)
- Infrastructure Leakage Index (ILI) untuk benchmark teknis
- Identifikasi zona prioritas deteksi kebocoran

**Pain Point:**
- Data produksi dan distribusi sering tidak sinkron
- Tidak ada baseline yang jelas untuk NRW fisik

### 2.3 Manajer Produksi

**Ekspektasi:**
- Validasi data volume air yang diproduksi (System Input Volume)
- Perhitungan pemakaian sendiri (flushing, backwash, dll)
- Losses di IPA (Instalasi Pengolahan Air) jika ada

**Pain Point:**
- Flow meter produksi sering tidak akurat
- Tidak ada standar untuk menghitung "pemakaian sendiri"

### 2.4 Manajer Pendapatan / Revenue

**Ekspektasi:**
- Detail perhitungan kehilangan komersial
- Breakdown: meter under-registration, pencurian, kesalahan admin
- Potensi pendapatan yang hilang (dalam Rupiah)
- Prioritas program: ganti meter atau penertiban?

**Pain Point:**
- Data billing dan meter reading tidak terintegrasi
- Tidak ada estimasi kerugian finansial yang kredibel

### 2.5 Manajer Operasional

**Ekspektasi:**
- Tool yang mudah digunakan tanpa training panjang
- Bisa input data dari Excel yang sudah ada
- Output yang bisa di-copy ke laporan bulanan

**Pain Point:**
- Sudah banyak tools tapi tidak terstandarisasi
- Data tersebar di berbagai format

---

## 3. Functional Requirements

### 3.1 Core Features

#### FR-01: Input Data Neraca Air (IWA Standard)

**Komponen Input:**

| Kategori | Field | Unit | Wajib? | Keterangan |
|----------|-------|------|--------|------------|
| **Identitas** | Nama PDAM | Text | Ya | |
| | Periode | Bulan/Tahun | Ya | |
| | Jumlah Pelanggan | Angka | Ya | Untuk hitung NRW per sambungan |
| | Panjang Pipa | km | Tidak | Untuk hitung ILI |
| **Volume Produksi** | System Input Volume (SIV) | m³ | Ya | Total air masuk sistem |
| | Pemakaian Sendiri (Metered) | m³ | Tidak | Flushing, backwash, kantor |
| | Pemakaian Sendiri (Estimated) | m³ | Tidak | Jika tidak diukur |
| **Konsumsi Resmi** | Billed Metered | m³ | Ya | Penjualan terukur meter |
| | Billed Unmetered | m³ | Tidak | Pelanggan flat rate |
| | Unbilled Metered | m³ | Tidak | Instansi gratis, terukur |
| | Unbilled Unmetered | m³ | Tidak | Pemadam, maintenance |
| **Kehilangan Komersial** | Unauthorized Consumption (Est) | m³ atau % | Tidak | Pencurian/illegal |
| | Meter Inaccuracy (Est) | % | Tidak | Under-registration rate |
| | Data Handling Error (Est) | m³ | Tidak | Kesalahan admin |
| **Keuangan** | Tarif Rata-rata | Rp/m³ | Tidak | Untuk valuasi kerugian |
| | Biaya Produksi | Rp/m³ | Tidak | Variable cost |

#### FR-02: Kalkulasi Otomatis (IWA Methodology)

**Perhitungan yang Dilakukan:**

```
System Input Volume (SIV)
├── Authorized Consumption
│   ├── Billed Authorized Consumption (Revenue Water)
│   │   ├── Billed Metered
│   │   └── Billed Unmetered
│   └── Unbilled Authorized Consumption
│       ├── Unbilled Metered
│       └── Unbilled Unmetered
└── Water Losses (NRW)
    ├── Apparent Losses (Komersial)
    │   ├── Unauthorized Consumption
    │   ├── Customer Meter Inaccuracies
    │   └── Data Handling Errors
    └── Real Losses (Fisik)
        ├── Leakage on Transmission
        ├── Leakage on Distribution
        ├── Leakage on Service Connections
        └── Overflow at Storage
```

**Formula Utama:**
```
NRW (m³) = SIV - Billed Authorized Consumption
NRW (%) = NRW / SIV × 100

Real Losses = NRW - Unbilled Authorized - Apparent Losses
```

#### FR-03: Output Dashboard

**Untuk Direksi:**
- NRW Percentage (headline metric)
- Pie chart breakdown: Revenue Water vs NRW
- Sub-breakdown: Real vs Apparent Losses
- Kerugian finansial (Rp/tahun)
- Benchmark: posisi vs rata-rata nasional (33%)

**Untuk Manajer Distribusi:**
- Real Losses volume (m³/km/hari)
- Infrastructure Leakage Index (ILI) jika data lengkap
- Prioritas: apakah perlu deteksi kebocoran intensif?

**Untuk Manajer Revenue:**
- Apparent Losses breakdown
- Potensi recovery revenue jika meter diganti / penertiban dilakukan
- Prioritas: ganti meter vs penertiban?

#### FR-04: Technical Performance Indicators (Beyond NRW %)

**Mengapa NRW % Saja Tidak Cukup:**
NRW % adalah financial indicator yang bisa turun karena tarif naik atau produksi turun, BUKAN karena kebocoran berkurang. Untuk analisis teknis yang akurat, perlu KPI tambahan.

**KPI Teknis yang Dihitung:**

| Indikator | Formula | Mengapa Penting |
|-----------|---------|------------------|
| **NRW %** | NRW / SIV × 100 | Financial indicator, mudah dipahami |
| **m³/km/hari** | Real Losses / Panjang Pipa / 365 | Tidak terpengaruh tarif/produksi |
| **Liter/sambungan/hari** | Real Losses / Jml Sambungan / 365 | Normalisasi untuk PDAM berbeda ukuran |
| **ILI** | CARL / UARL | Benchmark internasional paling kredibel |
| **CARL** | Real Losses (m³/tahun) | Angka absolut volume kehilangan |

**Output Dashboard Wajib Menampilkan SEMUA Indikator Ini**

#### FR-05: Benchmark Comparison

**Benchmark Multi-Level:**

| Indikator | Sangat Baik | Baik | Perlu Perhatian | Kritis |
|-----------|-------------|------|-----------------|--------|
| **NRW %** | < 20% | 20-30% | 30-40% | > 40% |
| **ILI** | < 2 | 2-4 | 4-8 | > 8 |
| **m³/km/hari** | < 5 | 5-10 | 10-20 | > 20 |
| **L/sambungan/hari** | < 50 | 50-100 | 100-200 | > 200 |

**Konteks Regional:**
- Rata-rata nasional Indonesia: 33%
- PDAM "sehat" Indonesia: 20-25%
- Best practice Asia Tenggara: 15-20%
- Best practice global: < 10%

#### FR-06: Laporan Export

**Format Output:**
- **PDF Report**: Siap print untuk rapat Direksi/DPRD
- **Excel Data**: Raw data + formula untuk analisis lanjutan
- **PNG Chart**: Untuk presentasi PowerPoint

**Konten Laporan PDF:**
1. Ringkasan Eksekutif (1 halaman)
2. Tabel Neraca Air lengkap (IWA format)
3. **KPI Teknis (NRW %, m³/km/hari, ILI)** ← BARU
4. Visualisasi Pie/Bar Chart
5. Analisis Perbandingan Benchmark
6. Rekomendasi Prioritas Intervensi
7. Catatan Metodologi (untuk akuntabilitas)

#### FR-07: Scenario Analysis ("What-If")

**Skenario yang Bisa Disimulasikan:**
- "Jika NRW turun 5%, berapa penghematan per tahun?"
- "Jika ganti 1000 meter rusak, berapa recovery revenue?"
- "Jika investasi Rp X untuk DMA, berapa ROI-nya?"

---

### 3.2 Data Quality & Validation Features

#### FR-08: Data Quality Checklist

**Problem:** Garbage in, garbage out. Jika data produksi atau billing tidak akurat, hasil perhitungan tidak berguna.

**Solution:** Checklist interaktif sebelum kalkulasi final:

```
□ Apakah flow meter produksi dikalibrasi dalam 12 bulan terakhir?
□ Apakah data billing sudah termasuk SEMUA pelanggan (termasuk flat rate)?
□ Apakah ada perubahan signifikan dalam periode ini (ekspansi, shutdown)?
□ Apakah periode billing dan periode produksi sudah sinkron?
□ Berapa confidence level untuk estimasi unauthorized consumption?
  ○ Tinggi (berdasarkan survey lapangan)
  ○ Sedang (estimasi dari data historis)
  ○ Rendah (tebakan kasar)
```

**AI Validation:**
Jika data tidak konsisten, AI akan warning:
> "Data Anda menunjukkan NRW hanya 12%. Ini sangat rendah untuk PDAM Indonesia. 
> Kemungkinan: (a) data billing tidak lengkap, atau (b) SIV under-metered. 
> Cek apakah flow meter produksi berfungsi dengan baik."

#### FR-09: Apparent Losses Breakdown Detail

**Problem:** Apparent Losses perlu dibreakdown lebih detail agar actionable.

**Komponen Input Terpisah:**

| Komponen | Default Estimasi | Cara Validasi |
|----------|------------------|---------------|
| **Customer Meter Under-registration** | 3-8% | Sampel test meter lama |
| **Data Handling Errors** | 0.5-2% | Audit billing database |
| **Unauthorized Consumption** | 1-5% | Survey sambungan liar |
| **Timing Errors** | Variable | Sinkronisasi baca meter vs produksi |

**Tooltip untuk Setiap Komponen:**
- Definisi teknis
- Cara mendapatkan data
- Default jika tidak tersedia

---

### 3.3 Intervention Recommendation Engine

#### FR-10: Intervention Matrix

**Problem:** AI diagnostic memberikan rekomendasi umum. PDAM butuh **HOW** yang spesifik.

**Solution:** Matrix intervensi berdasarkan hasil analisis:

| Kondisi | Intervensi Prioritas | Estimasi Biaya | Payback |
|---------|---------------------|----------------|----------|
| ILI > 8, budget rendah | Pressure management | Rp 100-300 juta | 6-12 bulan |
| ILI > 8, budget tinggi | Active leak detection + repair | Rp 500 juta - 1 miliar | 1-2 tahun |
| ILI 4-8, tekanan tinggi | Pressure management zones | Rp 200-400 juta | 12-18 bulan |
| Apparent > Real Losses | Meter replacement program | Rp 300-500/meter × jumlah | 2-3 tahun |
| Unauthorized > 5% | Penertiban + legalisasi | Rp 50-100 juta | 6 bulan |
| Meter > 10 tahun | Accelerated meter replacement | Rp 200-400/meter | 18-24 bulan |

**Output:**
- Top 3 rekomendasi berdasarkan data user
- Estimasi investasi vs return
- Link ke referensi teknis (jika ada)

#### FR-11: Cost-Benefit Analysis Detail

**Input Tambahan (Opsional):**
- Biaya produksi variabel (Rp/m³) — listrik, kimia
- Tarif rata-rata (Rp/m³) — opportunity cost
- Kapasitas produksi vs actual — apakah bisa jual lebih?

**Output:**
- "Kerugian biaya produksi: Rp X/tahun (air sudah diproduksi tapi hilang)"
- "Opportunity cost: Rp Y/tahun (pendapatan yang bisa diperoleh)"
- "Total value of losses: Rp Z/tahun"

---

### 3.4 AI-Powered Features ✨

#### FR-12: AI Smart Estimation (Gemini-Powered)

**Problem:** Banyak field opsional yang PDAM tidak punya datanya. Tanpa estimasi, perhitungan tidak lengkap.

**Solution:** AI membantu estimasi field yang kosong berdasarkan:
- Data yang sudah diisi user
- Pola umum PDAM Indonesia (dari literatur / BPPSPAM)
- Karakteristik PDAM (ukuran, wilayah)

**Cara Kerja:**
```
User: [Mengisi SIV, Billed Metered, Jumlah Pelanggan]
AI: "Berdasarkan data Anda, saya estimasikan:
     - Pemakaian Sendiri: ~2% dari SIV (20,000 m³)
     - Meter Inaccuracy: ~5-8% (umum untuk PDAM skala menengah)
     - Unauthorized Consumption: ~3% (estimasi konservatif)
     
     Apakah Anda ingin menggunakan estimasi ini?"
```

**Trigger:**
- Tombol "Bantu Estimasi dengan AI" di setiap section
- Auto-suggest saat user stuck di field kosong

**Privacy:**
- Data dikirim ke Gemini API untuk estimasi
- Disclaimer jelas: "Data Anda akan diproses oleh AI untuk estimasi"
- Option untuk skip AI dan isi manual

#### FR-13: AI Diagnostic Narrative

**Problem:** Dashboard angka saja sulit diinterpretasi oleh Direksi non-teknis.

**Solution:** AI menghasilkan **narasi diagnostik** dalam bahasa natural berdasarkan hasil perhitungan.

**Contoh Output:**

```markdown
## Ringkasan Analisis AI

Berdasarkan data yang Anda masukkan untuk PDAM Kabupaten X periode Januari 2026:

### 📊 Temuan Utama
NRW Anda sebesar **38%** berada di atas rata-rata nasional (33%). 
Ini berarti dari setiap 100 liter air yang diproduksi, 38 liter tidak menghasilkan pendapatan.

### 🔍 Komposisi Kehilangan
- **Kehilangan Fisik (Real Losses):** 25% — DOMINAN
- **Kehilangan Komersial (Apparent Losses):** 13%

Kondisi ini menunjukkan bahwa masalah utama Anda adalah **kebocoran pipa**, 
bukan pencurian atau meter error.

### 💡 Rekomendasi Prioritas
1. **Prioritas Tinggi:** Investasi pada deteksi kebocoran aktif (acoustic logger, 
   pressure management). Ini akan memberikan dampak lebih besar dibanding ganti meter.
2. **Prioritas Sedang:** Evaluasi umur pipa distribusi. Jika >30 tahun, 
   pertimbangkan program penggantian bertahap.
3. **Prioritas Rendah (saat ini):** Penggantian meter pelanggan dapat ditunda 
   sampai kehilangan fisik terkendali.

### 💰 Estimasi Dampak Finansial
Jika NRW berhasil turun 5% dalam 12 bulan:
- Penghematan air: ~50,000 m³/bulan
- Potensi pendapatan tambahan: Rp 250 juta/tahun (dengan tarif Rp 5,000/m³)

---
*Analisis ini dihasilkan oleh AI berdasarkan metodologi IWA Water Balance. 
Untuk keputusan investasi besar, disarankan validasi dengan audit lapangan.*
```

**Personalisasi:**
- Menyebut nama PDAM dan periode
- Menyesuaikan rekomendasi berdasarkan dominasi loss type
- Menyertakan angka spesifik dari data user

#### FR-14: AI Interactive Q&A

**Problem:** User punya pertanyaan spesifik yang tidak terjawab oleh dashboard statis.

**Solution:** Chat interface untuk tanya jawab tentang hasil neraca air.

**Contoh Interaksi:**
```
User: "Kenapa real losses saya tinggi?"

AI: "Real losses Anda (25%) tergolong tinggi. Beberapa kemungkinan penyebab:
     
     1. **Usia infrastruktur** — Jika pipa distribusi >25 tahun, korosi 
        dan joint failure meningkat signifikan.
     2. **Tekanan berlebih** — Tekanan >4 bar di malam hari memperbesar 
        volume kebocoran.
     3. **Tanah agresif** — Wilayah pesisir atau tanah asam mempercepat 
        korosi pipa.
     
     Apakah Anda tahu rata-rata usia pipa di jaringan Anda?"
```

```
User: "Berapa target NRW yang realistis untuk tahun depan?"

AI: "Berdasarkan baseline Anda (38%) dan benchmark PDAM yang berhasil:
     
     - **Target konservatif:** 35% (turun 3 poin) — feasible tanpa investasi besar
     - **Target moderat:** 32% (turun 6 poin) — butuh program DMA dan deteksi aktif
     - **Target agresif:** 28% (turun 10 poin) — butuh investasi signifikan + 
       perubahan budaya kerja
     
     Saya sarankan mulai dengan target 35% untuk membangun momentum."
```

**Context Awareness:**
- AI memiliki akses ke semua data yang sudah diinput
- Bisa refer ke hasil kalkulasi spesifik
- Menjawab dalam konteks PDAM Indonesia

---

### 3.5 Data Persistence Features

#### FR-15: Auto-Save ke LocalStorage

**Problem:** User mengisi banyak field, lalu browser crash atau tidak sengaja close tab. Data hilang.

**Solution:** Auto-save setiap perubahan ke LocalStorage browser.

**Cara Kerja:**
- Setiap field change → save ke localStorage dengan debounce 500ms
- Key: `water_balance_draft_{pdam_name}_{period}`
- Saat buka aplikasi → check localStorage → prompt "Lanjutkan data sebelumnya?"

**Data yang Disimpan:**
```json
{
  "pdamName": "PDAM Kabupaten X",
  "period": "2026-01",
  "lastSaved": "2026-01-10T23:15:00+07:00",
  "status": "draft",
  "data": {
    "siv": 1000000,
    "billedMetered": 550000,
    "billedUnmetered": null,
    // ... semua field
  },
  "aiEstimates": {
    "meterInaccuracy": { "value": 0.05, "source": "ai", "accepted": true }
  }
}
```

**User Control:**
- Tombol "Simpan Draft" (manual save)
- Tombol "Hapus Draft" (clear localStorage)
- Indikator "Terakhir disimpan: 5 menit lalu"

#### FR-16: Multiple Draft Support

**Problem:** PDAM mungkin ingin hitung untuk beberapa periode berbeda.

**Solution:** Support multiple drafts dengan list/picker.

**UI:**
- Dropdown "Pilih Draft" di header
- List semua draft yang tersimpan
- Option: "Buat Perhitungan Baru"
- Option: "Duplikat dari Draft Lain" (untuk bandingkan periode)

#### FR-17: Export/Import Draft (JSON)

**Problem:** User ingin pindahkan draft ke device lain atau backup.

**Solution:** Export draft sebagai file JSON, import dari file.

**Format:**
- Export: Download `neraca_air_pdamx_202601.json`
- Import: Upload JSON → validasi struktur → restore ke draft

**Use Case:**
- Manajer bikin draft di laptop kantor, lanjutkan di rumah
- Backup sebelum clear browser data
- Share draft ke rekan untuk review

#### FR-18: Cloud Sync (Optional, Authenticated)

**Problem:** LocalStorage terbatas pada satu browser/device.

**Solution:** Jika user login (Google Auth), sync draft ke cloud (D1 database).

**Cara Kerja:**
- User login dengan Google → identitas tersimpan
- Drafts sync ke server (encrypted at rest)
- Bisa akses dari device manapun setelah login

**Privacy Controls:**
- Opt-in: "Simpan ke cloud" toggle
- User bisa hapus data cloud kapan saja
- Data tersimpan per-user, tidak bisa diakses oleh lain

---

## 4. Non-Functional Requirements

### NFR-01: Accessibility
- PWA (Progressive Web App) — offline capable
- Responsive design (mobile-friendly)
- Tidak perlu login untuk basic calculation
- Bahasa Indonesia sepenuhnya

### NFR-02: Privacy & Data Handling

**Tier 1: Anonymous Mode (Default)**
- Kalkulasi dilakukan **client-side** (browser)
- Data disimpan di **LocalStorage** (browser user)
- Tidak ada data yang dikirim ke server
- Tidak ada tracking pengguna

**Tier 2: AI-Assisted Mode**
- Jika user mengaktifkan fitur AI (estimasi, diagnostik, Q&A)
- Data dikirim ke **Gemini API** untuk diproses
- Disclaimer jelas sebelum aktivasi
- Data tidak disimpan oleh server (stateless API call)

**Tier 3: Cloud Sync Mode (Authenticated)**
- Jika user login dan mengaktifkan cloud sync
- Data disimpan di **D1 database** terenkripsi
- User punya kontrol penuh: hapus, export, revoke access
- Isolasi data per-user

**Transparency:**
- Indicator jelas di UI: "Mode: Offline" / "Mode: AI Aktif" / "Mode: Cloud Sync"
- Privacy policy page yang menjelaskan tiap mode

### NFR-03: Trust & Credibility
- Cite sumber: IWA Water Balance Methodology
- Referensi: BPPSPAM Indonesia, Permen PUPR
- Link ke panduan metodologi
- Disclaimer: "Untuk edukasi dan perencanaan internal"

### NFR-04: Performance
- First load < 3 detik
- Kalkulasi real-time saat input berubah
- No server dependency

---

## 5. User Interface Design

### 5.1 Page Structure

```
Landing Page
├── Hero: "Ketahui Komposisi NRW Anda dengan Metodologi IWA"
├── Benefit pills: Gratis, Offline, Standar IWA
└── CTA: "Mulai Hitung"

Calculator Page (Single Page App)
├── Step 1: Identitas PDAM (Nama, Periode, Jumlah Pelanggan)
├── Step 2: Volume Produksi (SIV, Pemakaian Sendiri)
├── Step 3: Konsumsi Resmi (Billed/Unbilled)
├── Step 4: Estimasi Kehilangan Komersial (Optional)
├── Step 5: Data Keuangan (Optional)
└── Result: Dashboard + Export Options

Methodology Page
├── Penjelasan IWA Water Balance
├── Diagram alir komponen
├── Referensi BPPSPAM
└── FAQ teknis
```

### 5.2 Input Experience

**Progressive Disclosure:**
- Tampilkan field wajib dulu (SIV, Billed Consumption)
- Field opsional di-collapse, bisa expand jika tersedia
- Tooltip untuk setiap field menjelaskan "apa ini?"
- Auto-calculate saat user pindah field

**Validation:**
- Warning jika NRW > 60% (kemungkinan data salah)
- Warning jika Billed > SIV (tidak mungkin)
- Suggestion jika field kosong tapi bisa diestimasi

### 5.3 Output Experience

**Dashboard View:**
- Gauge meter besar: NRW %
- Color coded: hijau/kuning/merah
- Breakdown pie chart
- Table summary

**Action-Oriented Insights:**
- "NRW Anda didominasi oleh Kehilangan Fisik (65%). Pertimbangkan investasi deteksi kebocoran sebelum ganti meter."
- "Meter inaccuracy Anda tinggi. Evaluasi umur meter pelanggan."

---

## 6. Technical Architecture

### 6.1 Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | HTML + Vanilla JS | Simplicity, no build step |
| Styling | CSS (custom) | Match fdiskandar.com design |
| Charts | Chart.js | Lightweight, offline-capable |
| PDF Export | jsPDF + html2canvas | Client-side generation |
| Hosting | Cloudflare Pages | Free, fast, edge-delivered |

### 6.2 Data Flow

```
User Input → Validation → Calculation Engine → Dashboard Render → Export
    ↓                          ↓
 LocalStorage              No server call
 (optional save)
```

### 6.3 File Structure

```
apps-dev/water-balance/
├── index.html          # Main SPA
├── css/
│   └── style.css
├── js/
│   ├── calculator.js   # Core calculation logic
│   ├── ui.js           # DOM manipulation
│   ├── export.js       # PDF/Excel export
│   └── benchmark.js    # Comparison logic
├── assets/
│   └── images/
└── docs/
    └── methodology.md   # IWA reference
```

---

## 7. Content Requirements

### 7.1 Methodology Explanation

Perlu halaman terpisah yang menjelaskan:
- Apa itu IWA Water Balance
- Diagram komponen (visualisasi)
- Bagaimana PDAM Indonesia biasanya menghitung NRW
- Keterbatasan kalkulasi sederhana
- Kapan perlu audit lebih detail

### 7.2 Tooltip Content

Setiap field input harus punya tooltip yang menjelaskan:
- Definisi field
- Satuan yang digunakan
- Contoh cara mendapatkan data ini
- Default/estimasi jika tidak tersedia

### 7.3 Disclaimer

Di setiap output:
> "Kalkulator ini menggunakan metodologi IWA Standard Water Balance untuk tujuan edukasi dan perencanaan internal. Hasil perhitungan bergantung pada akurasi data yang dimasukkan. Untuk analisis menyeluruh, disarankan melakukan audit neraca air dengan konsultan profesional."

---

## 8. Rollout Plan

### Phase 1: MVP (Week 1-2)
- Basic calculator dengan field wajib
- Dashboard sederhana (NRW %, breakdown)
- PDF export (format sederhana)

### Phase 2: Enhancement (Week 3-4)
- Field opsional lengkap
- Benchmark comparison
- What-if scenario simulator
- Export Excel

### Phase 3: Polish (Week 5-6)
- Methodology page
- Mobile optimization
- Integration ke fdiskandar.com
- Share ke PERPAMSI

---

## 9. Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data PDAM tidak akurat → hasil misleading | High | Disclaimer jelas, guidance input, warning untuk data anomali |
| Terlalu teknis untuk Direksi | Medium | Executive summary dashboard, hide technical details |
| Terlalu simple untuk Manajer Teknis | Medium | Optional advanced fields, ILI calculation |
| Disalahartikan sebagai "audit resmi" | High | Disclaimer: "untuk perencanaan internal, bukan audit resmi" |

---

## 10. Success Criteria

### 10.1 Launch Criteria
- [ ] Kalkulasi akurat sesuai IWA methodology
- [ ] Mobile responsive
- [ ] PDF export berfungsi
- [ ] Tested oleh minimal 3 orang (internal review)

### 10.2 Post-Launch Success
- [ ] 50 unique users dalam bulan pertama
- [ ] Minimal 1 feedback positif dari praktisi PDAM
- [ ] Tidak ada bug report terkait kalkulasi

---

## 11. Appendix

### A. Referensi

1. IWA Water Losses Task Force - "Best Practice Manual"
2. BPPSPAM - "Petunjuk Teknis Pengurangan Kehilangan Air"
3. Permen PUPR tentang SPAM
4. jurnal.undip.ac.id - penelitian NRW Indonesia

### B. Contoh Water Balance Table

| Component | Volume (m³) | % of SIV |
|-----------|-------------|----------|
| System Input Volume | 1,000,000 | 100% |
| Billed Metered Consumption | 550,000 | 55% |
| Billed Unmetered | 10,000 | 1% |
| Unbilled Authorized | 40,000 | 4% |
| **Revenue Water** | **560,000** | **56%** |
| **Non-Revenue Water** | **440,000** | **44%** |
| - Apparent Losses | 120,000 | 12% |
| - Real Losses | 280,000 | 28% |

### C. ILI Calculation (Optional Advanced)

```
ILI = CARL / UARL

Where:
CARL = Current Annual Real Losses (m³/year)
UARL = Unavoidable Annual Real Losses
     = (18 × Lm + 0.8 × Nc + 25 × Lp) × P

Lm = Length of mains (km)
Nc = Number of service connections
Lp = Total length of private pipes (km)
P = Average pressure (m)
```

---

*Disclaimer: Dokumen ini adalah pandangan pribadi penulis sebagai praktisi profesional dan tidak mewakili sikap atau kebijakan resmi dari institusi/perusahaan tempat penulis bekerja.*
