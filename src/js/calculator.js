/**
 * Water Balance Calculator - IWA Methodology
 * Implements standard IWA Water Balance calculations for PDAM Indonesia
 */

/**
 * Calculate Water Balance according to IWA standard
 * @param {Object} data - Input data from form
 * @returns {Object} Calculated results with all KPIs
 */
export function calculateWaterBalance(data) {
    // Extract inputs with defaults
    const siv = parseFloat(data.systemInputVolume) || 0;
    const billedMetered = parseFloat(data.billedMetered) || 0;
    const billedUnmetered = parseFloat(data.billedUnmetered) || 0;
    const unbilledMetered = parseFloat(data.unbilledMetered) || 0;
    const unbilledUnmetered = parseFloat(data.unbilledUnmetered) || 0;

    // Optional inputs
    const customers = parseInt(data.numberOfCustomers) || 0;
    const pipeLength = parseFloat(data.pipeLengthKm) || 0;
    const averagePressure = parseFloat(data.averagePressure) || 0;

    // Financial parameters
    const averageTariff = parseFloat(data.averageTariff) || 5000;
    const productionCost = parseFloat(data.productionCost) || 3000;

    // Apparent Losses components (estimated or inputted)
    const unauthorizedPct = parseFloat(data.unauthorizedPct) || 0;
    const meterInaccuracyPct = parseFloat(data.meterInaccuracyPct) || 0;
    const dataErrorsVolume = parseFloat(data.dataErrors) || 0;

    // === IWA WATER BALANCE CALCULATION ===

    // 1. Billed Authorized Consumption (Revenue Water)
    const billedAuthorized = billedMetered + billedUnmetered;

    // 2. Unbilled Authorized Consumption
    const unbilledAuthorized = unbilledMetered + unbilledUnmetered;

    // 3. Total Authorized Consumption
    const authorizedConsumption = billedAuthorized + unbilledAuthorized;

    // 4. Non-Revenue Water (NRW)
    const nrw = siv - billedAuthorized;
    const nrwPercent = siv > 0 ? (nrw / siv) * 100 : 0;

    // 5. Apparent Losses (Commercial Losses)
    const unauthorizedVolume = siv * (unauthorizedPct / 100);
    const meterInaccuracyVolume = billedMetered * (meterInaccuracyPct / 100);
    const apparentLosses = unauthorizedVolume + meterInaccuracyVolume + dataErrorsVolume;

    // 6. Water Losses (Total)
    const waterLosses = siv - authorizedConsumption;

    // 7. Real Losses (Physical Losses)
    const realLosses = waterLosses - apparentLosses;

    // === TECHNICAL KPIs ===

    // NRW per connection per day (L/connection/day)
    const nrwPerConnectionPerDay = customers > 0
        ? (nrw * 1000) / (customers * 365)
        : 0;

    // Real losses per km per day (m³/km/day)
    const realLossesPerKmPerDay = pipeLength > 0
        ? realLosses / (pipeLength * 365)
        : 0;

    // Infrastructure Leakage Index (ILI) - requires UARL calculation
    const ili = calculateILI(realLosses, pipeLength, customers, averagePressure);

    // CARL (Current Annual Real Losses) - in m³/year
    const carl = realLosses;

    // === BENCHMARK CLASSIFICATION ===
    const benchmark = classifyPerformance(nrwPercent, ili, realLossesPerKmPerDay, nrwPerConnectionPerDay);

    return {
        // Input summary
        input: {
            siv,
            billedMetered,
            billedUnmetered,
            customers,
            pipeLength
        },

        // IWA Components (m³)
        components: {
            systemInputVolume: siv,
            billedAuthorized,
            unbilledAuthorized,
            authorizedConsumption,
            nrw,
            waterLosses,
            apparentLosses,
            realLosses
        },

        // Percentages
        percentages: {
            nrw: nrwPercent,
            revenueWater: siv > 0 ? (billedAuthorized / siv) * 100 : 0,
            apparentLossesPercent: siv > 0 ? (apparentLosses / siv) * 100 : 0,
            realLossesPercent: siv > 0 ? (realLosses / siv) * 100 : 0
        },

        // Technical KPIs
        kpis: {
            nrwPercent,
            nrwPerConnectionPerDay,
            realLossesPerKmPerDay,
            ili,
            carl
        },

        // Benchmark classification
        benchmark,

        // Financial Impact (Rp)
        financialImpact: {
            lostRevenue: nrw * averageTariff,
            wastedProductionCost: nrw * productionCost,
            totalAnnualLoss: nrw * (averageTariff + productionCost),
            potentialRecovery50pct: nrw * 0.5 * averageTariff,
            averageTariff,
            productionCost
        },

        // Validation flags
        validation: {
            isValid: siv > 0 && billedMetered > 0,
            warnings: generateWarnings(siv, billedMetered, nrwPercent, realLosses)
        }
    };
}

/**
 * Calculate Infrastructure Leakage Index (ILI)
 * ILI = CARL / UARL
 * 
 * CARL = Current Annual Real Losses (m³/year) - from input
 * UARL = Unavoidable Annual Real Losses (m³/year)
 * 
 * UARL formula (IWA): (18 × Lm + 0.8 × Nc + 25 × Lp) × P
 * Where: Lm = mains length (km), Nc = number of connections, 
 *        Lp = private pipe length (km), P = pressure (m = bar × 10.2)
 * Output: liters/day
 */
function calculateILI(realLosses, pipeLength, customers, pressure) {
    if (!pipeLength || !customers || !pressure) {
        return null; // Insufficient data for ILI
    }

    // Convert pressure from bar to meters (1 bar ≈ 10.2 m head)
    const pressureM = pressure * 10.2;

    // Estimate private pipe length as 8m per connection = 0.008 km × customers
    const privatePipeLengthKm = 0.008 * customers;

    // UARL = (18 × Lm + 0.8 × Nc + 25 × Lp) × P
    // Result is in liters/day
    const uarlLitersPerDay = (18 * pipeLength + 0.8 * customers + 25 * privatePipeLengthKm) * pressureM;

    // Convert UARL to m³/year: liters/day × 365 / 1000
    const uarlM3PerYear = uarlLitersPerDay * 365 / 1000;

    // ILI = CARL (m³/year) / UARL (m³/year)
    const ili = uarlM3PerYear > 0 ? realLosses / uarlM3PerYear : null;

    return ili;
}

/**
 * Classify performance based on benchmarks
 */
function classifyPerformance(nrwPercent, ili, m3PerKmPerDay, lPerConnectionPerDay) {
    const classifications = {
        nrw: classifyMetric(nrwPercent, [20, 30, 40]),
        ili: ili ? classifyMetric(ili, [2, 4, 8]) : null,
        m3PerKmPerDay: classifyMetric(m3PerKmPerDay, [5, 10, 20]),
        lPerConnectionPerDay: classifyMetric(lPerConnectionPerDay, [50, 100, 200])
    };

    // Overall classification (worst of available metrics)
    const levels = Object.values(classifications).filter(v => v !== null);
    const overall = levels.length > 0 ? Math.max(...levels) : 2;

    return {
        overall,
        details: classifications,
        labels: ['Sangat Baik', 'Baik', 'Perlu Perhatian', 'Kritis']
    };
}

/**
 * Classify individual metric
 * @returns {number} 0 = Excellent, 1 = Good, 2 = Attention, 3 = Critical
 */
function classifyMetric(value, thresholds) {
    if (value < thresholds[0]) return 0; // Excellent
    if (value < thresholds[1]) return 1; // Good
    if (value < thresholds[2]) return 2; // Needs attention
    return 3; // Critical
}

/**
 * Generate validation warnings
 */
function generateWarnings(siv, billedMetered, nrwPercent, realLosses) {
    const warnings = [];

    if (billedMetered > siv) {
        warnings.push({
            level: 'error',
            message: 'Billed metered consumption tidak boleh lebih besar dari System Input Volume'
        });
    }

    if (nrwPercent < 12) {
        warnings.push({
            level: 'warning',
            message: 'NRW sangat rendah untuk standar Indonesia (< 12%). Periksa data billing dan produksi.'
        });
    }

    if (nrwPercent > 60) {
        warnings.push({
            level: 'warning',
            message: 'NRW sangat tinggi (> 60%). Periksa akurasi data flow meter produksi.'
        });
    }

    if (realLosses < 0) {
        warnings.push({
            level: 'error',
            message: 'Real losses bernilai negatif. Data apparent losses mungkin terlalu tinggi.'
        });
    }

    return warnings;
}

/**
 * Validate input data with comprehensive sanity checks
 * Prevents impossible calculations like negative NRW
 */
export function validateInputs(data) {
    const errors = [];
    const warnings = [];

    // Parse values for comparison
    const siv = parseFloat(data.systemInputVolume) || 0;
    const billedMetered = parseFloat(data.billedMetered) || 0;
    const billedUnmetered = parseFloat(data.billedUnmetered) || 0;
    const unbilledMetered = parseFloat(data.unbilledMetered) || 0;
    const unbilledUnmetered = parseFloat(data.unbilledUnmetered) || 0;
    const customers = parseInt(data.numberOfCustomers) || 0;

    // === REQUIRED FIELD CHECKS ===
    if (!data.systemInputVolume || siv <= 0) {
        errors.push('System Input Volume wajib diisi dan harus lebih dari 0');
    }

    if (billedMetered < 0) {
        errors.push('Billed Metered Consumption tidak boleh negatif');
    }

    if (!data.numberOfCustomers || customers <= 0) {
        errors.push('Jumlah Pelanggan wajib diisi');
    }

    // === LOGICAL IMPOSSIBILITY CHECKS ===
    // These MUST fail because they produce nonsensical results

    // Check: Billed Metered cannot exceed SIV
    if (billedMetered > siv && siv > 0) {
        errors.push('Billed Metered tidak boleh melebihi System Input Volume');
    }

    // Check: Billed Unmetered cannot exceed SIV
    if (billedUnmetered > siv && siv > 0) {
        errors.push('Billed Unmetered tidak boleh melebihi System Input Volume');
    }

    // Check: Total Authorized Consumption cannot exceed SIV
    const totalAuthorized = billedMetered + billedUnmetered + unbilledMetered + unbilledUnmetered;
    if (totalAuthorized > siv && siv > 0) {
        errors.push('Total konsumsi resmi tidak boleh melebihi System Input Volume');
    }

    // === DATA QUALITY WARNINGS ===

    // Check: SIV per customer should be realistic
    // Typical: 150 L/customer/day = 54.75 m³/customer/year
    // Minimum realistic: 10 m³/customer/year
    if (siv > 0 && customers > 0) {
        const sivPerCustomerPerYear = siv / customers;
        if (sivPerCustomerPerYear < 10) {
            warnings.push('SIV terlalu rendah untuk jumlah pelanggan. Periksa satuan data.');
        }
        if (sivPerCustomerPerYear > 500) {
            warnings.push('SIV terlalu tinggi per pelanggan. Periksa satuan data.');
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

