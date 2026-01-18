# NRWExpert - Water Balance Calculator

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Bahasa](https://img.shields.io/badge/Bahasa-Indonesia-red.svg)]()

> Open Source NRW Decision Support Dashboard untuk PDAM Indonesia

## 🎯 Tentang NRWExpert

NRWExpert adalah platform open source untuk membantu praktisi utilitas air menganalisis Non-Revenue Water (NRW) menggunakan standar IWA (International Water Association).

## 📊 Fitur Utama

| Fitur | Status | Deskripsi |
|:------|:------:|:----------|
| **IWA Water Balance Calculator** | ✅ Live | Kalkulator neraca air standar IWA |
| **NRW Loss Estimator** | ✅ Live | Estimasi nilai kerugian finansial NRW |
| **AI-Powered Analysis** | ✅ Live | Diagnostic & investment proposal (Gemini) |
| **PDF Export** | ✅ Live | Technical report, diagnostic, proposal |
| **Multi-Zone DMA** | ✅ Live | District Metered Area aggregation |
| **DMA Profiling** | 🔄 Roadmap | Read-only profiling per zona |
| **Anomaly Detection** | 🔄 Roadmap | Deteksi anomali dari data meter |

**Privacy-First:** 100% browser-based, tidak ada data dikirim ke server.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## 📊 Test Coverage

| Module | Coverage | Tests | Status |
|--------|----------|-------|--------|
| `calculator.js` | 100% | 23 | ✅ |
| `zones.js` | 100% | 15 | ✅ |
| `pdf-helpers.js` | 83% | 15 | ✅ |
| **Total** | **95%+** | **53** | ✅ |

## 🏗️ Tech Stack

- **Frontend**: Vanilla JS + Vite
- **PDF Generation**: jsPDF + jspdf-autotable
- **Charts**: Chart.js
- **Testing**: Vitest
- **AI**: Google Gemini API
- **Deployment**: Cloudflare Pages

## 📖 Documentation

- [PRD.md](./PRD.md) - Product Requirements
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide

## 🤝 Contributing

Lihat [CONTRIBUTING.md](./CONTRIBUTING.md) untuk panduan kontribusi.

**Catatan:** Kami tidak menerima Pull Request. Silakan fork dan kembangkan versi Anda sendiri.

## 📄 License

Apache License 2.0 - lihat [LICENSE](./LICENSE)

## 🙏 Acknowledgments

- International Water Association (IWA) for water balance methodology
- BPPSPAM for Indonesian PDAM benchmarks

---

**Website**: [nrwexpert.com](https://nrwexpert.com)  
**Kontribusi untuk kemajuan industri utilitas air Indonesia**  
**Kontak**: me@fdiskandar.com
