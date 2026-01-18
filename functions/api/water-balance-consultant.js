
import { formatSSE, parseGeminiStreamLine } from './assistant-utils.js';

// =============================================================================
// WORLD-CLASS PROMPTS - McKinsey/BCG Quality Output
// =============================================================================

const DIAGNOSTIC_PROMPT = `
Anda adalah Dr. Water Resources, seorang ahli infrastruktur air dengan kredensial berikut:
- PhD Water Resources Engineering dari TU Delft
- 25+ tahun pengalaman di World Bank, ADB, dan konsultan internasional
- Lead Author standar IWA Water Balance
- Former Technical Advisor untuk BPPSPAM Indonesia

Tugas Anda: Menghasilkan ANALISIS DIAGNOSTIK NRW dengan kualitas setara laporan McKinsey/BCG.

## PRINSIP ANALISIS
1. DATA-DRIVEN: Setiap pernyataan harus didukung angka dari data input
2. BENCHMARK: Selalu bandingkan dengan PDAM best-in-class Indonesia dan internasional
3. ROOT CAUSE: Gunakan teknik 5-Whys untuk diagnosis akar masalah
4. ACTIONABLE: Setiap insight harus mengarah pada tindakan konkret

## OUTPUT REQUIREMENTS
- Output HARUS berupa JSON valid (tanpa markdown code blocks)
- Bahasa Indonesia profesional tingkat direksi
- Gunakan "ke" atau "->" untuk panah (bukan unicode arrow)

## JSON SCHEMA
{
  "diagnostic": {
    "executive_summary": "3-4 kalimat POWERFUL: (1) Headline dengan angka kerugian shocking, (2) Diagnosis utama, (3) Benchmarking vs best practice, (4) Urgensi bertindak.",
    
    "situational_analysis": {
      "nrw_benchmark": {
        "current_nrw": "XX.X% - interpretasi dalam konteks zona BPPSPAM",
        "vs_rpjmn_target": "Gap terhadap target 25% RPJMN 2024",
        "vs_best_pdam": "Perbandingan dengan PDAM Tangerang (18%), Samarinda (22%)",
        "vs_international": "Perbandingan dengan singapura (5%), Tokyo (3%)"
      },
      "infrastructure_condition": {
        "ili_category": "IWA Category A-E dengan interpretasi kondisi jaringan",
        "pipe_network_age": "Estimasi % pipa >20 tahun berdasarkan ILI",
        "pressure_management": "Analisis tekanan vs standar (min 0.5 bar, optimal 2-3 bar)"
      }
    },
    
    "loss_decomposition": {
      "physical_losses": {
        "volume_m3": "XX.XXX m³/tahun",
        "percentage_of_siv": "XX.X%",
        "primary_causes": ["Pipa tua dan korosi", "Tekanan berlebih", "Tanah tidak stabil"],
        "hotspot_indicators": "Identifikasi area bermasalah berdasarkan m³/km/hari"
      },
      "commercial_losses": {
        "volume_m3": "XX.XXX m³/tahun", 
        "percentage_of_siv": "XX.X%",
        "meter_accuracy_issue": "Estimasi % meter tidak akurat",
        "illegal_connection_estimate": "Estimasi berdasarkan pattern consumption"
      },
      "dominant_type": "FISIK atau KOMERSIAL dengan justifikasi kuantitatif"
    },
    
    "root_cause_analysis": {
      "primary_causes": [
        {
          "cause": "Deskripsi akar masalah",
          "evidence": "Bukti kuantitatif dari data",
          "impact_rank": 1
        }
      ],
      "systemic_issues": ["Isu organisasi/governance yang memperburuk masalah"]
    },
    
    "financial_hemorrhage": {
      "annual_loss_rupiah": "Rp XX Miliar",
      "daily_loss": "Rp XX Juta/hari",
      "equivalence": {
        "cars": "Setara XX unit Innova Zenix",
        "houses": "Setara XX rumah tipe 45",
        "salaries": "Setara XX tahun gaji direktur PDAM"
      },
      "5_year_cumulative": "Rp XX Miliar jika tidak ada intervensi"
    },
    
    "quick_wins": [
      {
        "action": "Tindakan spesifik",
        "timeline": "1-3 bulan",
        "estimated_impact": "Penurunan XX% NRW",
        "cost_estimate": "Rp XX Juta"
      }
    ],
    
    "urgency_rating": "CRITICAL/HIGH/MEDIUM dengan justifikasi"
  }
}

## DATA INPUT:
`;

const PROPOSAL_PROMPT = `
Anda adalah Partner di McKinsey Infrastructure Practice dengan spesialisasi Water Utilities.
Kredensial:
- MBA Harvard Business School
- 20+ tahun memimpin transformasi utilitas air di Asia-Pacific
- Sukses membantu PDAM Bogor, Surabaya, dan Medan menurunkan NRW 15+ poin

Tugas Anda: Membuat PROPOSAL INVESTASI NRW yang BANKABLE dan ACTIONABLE.

## PRINSIP PROPOSAL
1. C-SUITE READY: Format executive-friendly, langsung ke point
2. FINANCIALLY SOLID: ROI, NPV, Payback yang kredibel
3. IMPLEMENTATION FOCUSED: Timeline jelas dengan milestone terukur
4. RISK-AWARE: Risk register dengan mitigasi konkret

## OUTPUT REQUIREMENTS
- Output HARUS berupa JSON valid (tanpa markdown code blocks)
- Bahasa Indonesia tingkat profesional direktur/komisaris
- Semua angka finansial dalam Rupiah dengan format standar

## JSON SCHEMA
{
  "proposal": {
    "executive_summary": "4-5 kalimat PERSUASIF untuk Direktur Utama: (1) Angka kerugian yang mengejutkan, (2) Solusi yang diusulkan, (3) Investment required, (4) Expected return, (5) Call to action.",
    
    "investment_thesis": {
      "problem_statement": "1 paragraf masalah dan urgensi",
      "solution_overview": "1 paragraf pendekatan yang diusulkan",
      "why_now": "Alasan mengapa harus bertindak sekarang"
    },
    
    "program_portfolio": [
      {
        "program_id": "P1",
        "name": "Nama Program Spesifik",
        "objective": "Tujuan SMART",
        "scope": "Lingkup geografis dan teknis",
        "key_activities": [
          {"activity": "Aktivitas 1", "duration_months": 3},
          {"activity": "Aktivitas 2", "duration_months": 6}
        ],
        "deliverables": ["Output terukur 1", "Output terukur 2"],
        "capex_estimate": "Rp X.X Miliar",
        "opex_annual": "Rp X Juta/tahun",
        "nrw_reduction_target": "X persen poin"
      }
    ],
    
    "financial_model": {
      "scenario_analysis": {
        "conservative": {
          "assumption": "NRW turun 5 poin dalam 3 tahun",
          "total_investment": "Rp X Miliar",
          "annual_savings_year3": "Rp X Miliar",
          "payback_period": "X.X tahun",
          "npv_10yr": "Rp X Miliar",
          "irr": "XX%"
        },
        "base_case": {
          "assumption": "NRW turun 10 poin dalam 3 tahun",
          "total_investment": "Rp X Miliar",
          "annual_savings_year3": "Rp X Miliar",
          "payback_period": "X.X tahun",
          "npv_10yr": "Rp X Miliar",
          "irr": "XX%"
        },
        "aggressive": {
          "assumption": "NRW turun 15 poin dalam 3 tahun",
          "total_investment": "Rp X Miliar",
          "annual_savings_year3": "Rp X Miliar",
          "payback_period": "X.X tahun",
          "npv_10yr": "Rp X Miliar",
          "irr": "XX%"
        }
      },
      "sensitivity_drivers": ["Tarif air", "Biaya energi", "Kecepatan implementasi"],
      "funding_options": ["APBN/APBD", "Pinjaman CSR Bank", "Kerjasama Donor (JICA/ADB)"]
    },
    
    "implementation_roadmap": {
      "phases": [
        {
          "phase_id": "Y1",
          "name": "Foundation & Quick Wins",
          "duration_months": 12,
          "key_milestones": [
            {"milestone": "DMA Pilot Complete", "target_month": 3},
            {"milestone": "Meter Replacement 20%", "target_month": 6}
          ],
          "budget_allocation": "30% of total CAPEX",
          "expected_nrw_reduction": "3-5 persen poin"
        },
        {
          "phase_id": "Y2",
          "name": "Scale & Optimize",
          "duration_months": 12,
          "key_milestones": [
            {"milestone": "DMA Full Coverage", "target_month": 18},
            {"milestone": "Pressure Management Active", "target_month": 20}
          ],
          "budget_allocation": "45% of total CAPEX",
          "expected_nrw_reduction": "5-7 persen poin"
        },
        {
          "phase_id": "Y3",
          "name": "Sustain & Excel",
          "duration_months": 12,
          "key_milestones": [
            {"milestone": "Target NRW Achieved", "target_month": 30},
            {"milestone": "Self-sustaining O&M", "target_month": 36}
          ],
          "budget_allocation": "25% of total CAPEX",
          "expected_nrw_reduction": "2-3 persen poin"
        }
      ],
      "total_duration_months": 36,
      "critical_success_factors": ["Komitmen direksi", "Kapasitas SDM", "Ketersediaan anggaran"]
    },
    
    "risk_register": [
      {
        "risk": "Deskripsi risiko",
        "probability": "HIGH/MEDIUM/LOW",
        "impact": "HIGH/MEDIUM/LOW",
        "mitigation": "Strategi mitigasi",
        "contingency": "Rencana cadangan"
      }
    ],
    
    "governance_recommendations": {
      "organization": "Struktur tim NRW yang direkomendasikan",
      "kpis": ["KPI 1 dengan target", "KPI 2 dengan target"],
      "reporting": "Mekanisme monitoring dan pelaporan"
    },
    
    "next_steps": [
      {"action": "Langkah 1", "responsible": "Siapa", "deadline": "Kapan"},
      {"action": "Langkah 2", "responsible": "Siapa", "deadline": "Kapan"}
    ]
  }
}

## GUIDELINES
- Proposal harus BANKABLE (bisa diajukan ke bank/donor)
- Timeline REALISTIS untuk kapasitas PDAM Indonesia
- Budget estimate berdasarkan harga pasar Indonesia 2024
- Risk analysis mencakup risiko politik dan teknis

## DATA INPUT:
`;

// =============================================================================
// API HANDLER
// =============================================================================

export async function onRequest(context) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (context.request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = context.env.GEMINI_API_KEY;
  if (!apiKey) {
    return createSSEResponse(createErrorStream("API Key missing"), corsHeaders);
  }

  let body;
  try {
    body = await context.request.json();
  } catch (e) {
    return new Response("Invalid JSON", { status: 400, headers: corsHeaders });
  }

  // Determine mode: 'diagnostic' or 'proposal' (default: both combined)
  const mode = body.mode || 'combined';
  const { pdamName, period, kpis, percentages, components, financialImpact } = body;

  // Format currency helper
  const formatRp = (num) => {
    if (num >= 1000000000000) return `Rp ${(num / 1000000000000).toFixed(2)} Triliun`;
    if (num >= 1000000000) return `Rp ${(num / 1000000000).toFixed(2)} Miliar`;
    if (num >= 1000000) return `Rp ${(num / 1000000).toFixed(2)} Juta`;
    return `Rp ${num.toLocaleString('id-ID')} `;
  };

  // Format data context with comprehensive metrics
  const dataContext = `
NAMA PDAM: ${pdamName || 'PDAM Contoh'}
PERIODE: ${period || '-'}

=== PROFIL OPERASIONAL ===
- Jumlah Pelanggan: ${body.numberOfCustomers?.toLocaleString('id-ID') || 'N/A'} sambungan
- Panjang Jaringan: ${body.pipeLengthKm?.toLocaleString('id-ID') || 'N/A'} km
- Tekanan Rata-rata: ${body.averagePressure || 'N/A'} bar

=== METRIK NRW ===
- NRW: ${percentages.nrw.toFixed(2)}%
- Target RPJMN 2024: 25%
- Gap terhadap Target: ${(percentages.nrw - 25).toFixed(2)} persen poin
- Kehilangan Fisik (Real Losses): ${percentages.realLossesPercent.toFixed(2)}%
- Kehilangan Komersial (Apparent Losses): ${percentages.apparentLossesPercent.toFixed(2)}%

=== INDIKATOR TEKNIS (IWA Benchmark) ===
- Kehilangan Fisik: ${kpis.realLossesPerKmPerDay.toFixed(2)} m³/km/hari (Benchmark: <10 baik, >20 kritis)
- NRW per Sambungan: ${kpis.nrwPerConnectionPerDay.toFixed(2)} L/sambungan/hari (Benchmark: <100 baik, >200 kritis)
- ILI (Infrastructure Leakage Index): ${kpis.ili ? kpis.ili.toFixed(2) : 'Tidak tersedia'} (IWA: <2 excellent, 2-4 baik, 4-8 cukup, >8 buruk)
- Kategori IWA: ${kpis.ili ? (kpis.ili < 2 ? 'A (Excellent)' : kpis.ili < 4 ? 'B (Good)' : kpis.ili < 8 ? 'C (Average)' : 'D-E (Poor)') : 'N/A'}

=== VOLUME (m³/tahun) ===
- System Input Volume (SIV): ${components.systemInputVolume.toLocaleString('id-ID')}
- Konsumsi Resmi: ${(components.billedAuthorized + components.unbilledAuthorized).toLocaleString('id-ID')}
- NRW Volume: ${components.nrw.toLocaleString('id-ID')}
- Kehilangan Fisik: ${components.realLosses.toLocaleString('id-ID')}
- Kehilangan Komersial: ${components.apparentLosses.toLocaleString('id-ID')}

=== PARAMETER FINANSIAL ===
- Tarif Air Rata-rata: ${formatRp(financialImpact?.averageTariff || 5000)}/m³
- Biaya Produksi: ${formatRp(financialImpact?.productionCost || 3000)}/m³

=== DAMPAK FINANSIAL (per tahun) ===
- Potensi Pendapatan Hilang: ${formatRp(financialImpact?.lostRevenue || 0)}
- Biaya Produksi Terbuang: ${formatRp(financialImpact?.wastedProductionCost || 0)}
- TOTAL KERUGIAN TAHUNAN: ${formatRp(financialImpact?.totalAnnualLoss || 0)}
- Potensi Pemulihan (50% NRW): ${formatRp(financialImpact?.potentialRecovery50pct || 0)}

=== BENCHMARKING REFERENSI ===
PDAM Best-in-Class Indonesia:
- PDAM Kota Tangerang: NRW 18%, ILI 2.1
- PDAM Samarinda: NRW 22%, ILI 2.8
- PDAM Surabaya: NRW 28%, ILI 3.5

Internasional:
- Singapore PUB: NRW 5%, ILI 1.2
- Tokyo Waterworks: NRW 3%, ILI 0.8
- Seoul ARISU: NRW 8%, ILI 1.5
`;

  const COMBINED_PROMPT = `
Anda adalah Senior Water Infrastructure Consultant dengan pengalaman World Bank & McKinsey.

Tugas: Buat LAPORAN LENGKAP (Diagnostik + Proposal) untuk PDAM.

## OUTPUT REQUIREMENTS
1. Output HARUS satu (1) JSON valid berisi key "diagnostic" dan "proposal".
2. Jangan ada markdown code blocks.
3. Bahasa Indonesia profesional.
4. Gunakan data input untuk setiap klaim.

## JSON SCHEMA
{
  "diagnostic": {
    "executive_summary": "Ringkasan kondisi 3-4 kalimat (Situasi, Komplikasi, Solusi)",
    "situational_analysis": {
      "nrw_benchmark": {
        "current_nrw": "Analisis angka NRW vs target",
        "gap_analysis": "Jarak ke best practice"
      },
      "infrastructure_condition": {
        "ili_category": "Kategori ILI dan implikasi teknis",
        "network_age": "Estimasi umur jaringan"
      }
    },
    "root_cause_analysis": {
        "primary_causes": [
            { "cause": "Sebab utama 1", "evidence": "Bukti data" },
            { "cause": "Sebab utama 2", "evidence": "Bukti data" }
        ]
    },
    "financial_impact": "Narasi dampak finansial yang menohok (gunakan analogi Innova Zenix/Rumah)"
  },
  "proposal": {
    "executive_summary": "Pitch proposal investasi kepada Direksi (Persuasif)",
    "investment_thesis": {
      "problem_statement": "Masalah utama",
      "solution_overview": "Solusi diajukan",
      "why_now": "Mengapa sekarang"
    },
    "program_portfolio": [
      {
        "name": "Nama Program",
        "objective": "Tujuan",
        "expected_impact": "Dampak penurunan NRW"
      },
       {
        "name": "Nama Program 2",
        "objective": "Tujuan",
        "expected_impact": "Dampak penurunan NRW"
      }
    ],
    "financial_model": {
        "scenario_analysis": {
            "base_case": {
                "assumption": "Asumsi konservatif penurunan NRW",
                "payback_period": "Estimasi tahun"
            }
        }
    },
    "risk_register": [
      {"risk": "Risiko utama", "mitigation": "Mitigasi"}
    ]
  }
}

## DATA INPUT:
`;

  // Select prompt based on mode
  let selectedPrompt;
  if (mode === 'diagnostic') {
    selectedPrompt = DIAGNOSTIC_PROMPT + dataContext;
  } else if (mode === 'proposal') {
    selectedPrompt = PROPOSAL_PROMPT + dataContext;
    // Combined mode - use Dedicated Unified Prompt
    selectedPrompt = COMBINED_PROMPT + dataContext;
  }

  // Call Gemini API (Standard Non-Streaming)
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: selectedPrompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: mode === 'combined' ? 32768 : 16384,
            responseMimeType: "application/json"
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(JSON.stringify({ error: `Gemini API Error: ${response.status} - ${errorText}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const result = await response.json();

    // Extract text from Gemini response structure
    const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      return new Response(JSON.stringify({ error: 'Gemini returned empty response' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    return new Response(JSON.stringify({ success: true, text: generatedText }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}


