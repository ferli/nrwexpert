/**
 * CSV Parser for Zone Data Import
 * Handles quoted values, edge cases, and provides detailed error reporting
 */

/**
 * Parse CSV text into structured zone data
 * @param {string} csvText - Raw CSV content
 * @returns {Object} - { success: boolean, zones: Array, errors: Array, warnings: Array }
 */
export function parseZoneCSV(csvText) {
    const result = {
        success: false,
        zones: [],
        errors: [],
        warnings: []
    };

    if (!csvText || csvText.trim().length === 0) {
        result.errors.push('File CSV kosong');
        return result;
    }

    const lines = csvText.split(/\r?\n/);
    let startIndex = 0;

    // Detect header row (case-insensitive check for common column names)
    const firstLine = lines[0].toLowerCase();
    if (firstLine.includes('nama') || firstLine.includes('name') ||
        firstLine.includes('zone') || firstLine.includes('dma')) {
        startIndex = 1;
        result.warnings.push('Header terdeteksi dan dilewati');
    }

    let processedCount = 0;
    let skippedCount = 0;

    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();

        // Skip empty lines
        if (!line) {
            continue;
        }

        try {
            const cols = parseCSVLine(line);

            // Expected format: Name, SIV, Billed, [Customers], [PipeLength]
            if (cols.length < 3) {
                result.warnings.push(`Baris ${i + 1}: Kolom tidak lengkap (min: Nama, SIV, Terjual)`);
                skippedCount++;
                continue;
            }

            const name = cols[0] || `DMA-${String(processedCount + 1).padStart(2, '0')}`;
            const siv = cols[1];
            const billed = cols[2];
            const customers = cols[3] || '0';
            const pipeLength = cols[4] || '0';

            // Validate numeric values
            const sivNum = parseFloat(siv);
            const billedNum = parseFloat(billed);
            const custNum = parseFloat(customers);
            const pipeNum = parseFloat(pipeLength);

            if (isNaN(sivNum) || isNaN(billedNum)) {
                result.warnings.push(`Baris ${i + 1}: SIV atau Volume Terjual bukan angka valid`);
                skippedCount++;
                continue;
            }

            if (sivNum <= 0 || billedNum <= 0) {
                result.warnings.push(`Baris ${i + 1}: SIV dan Volume Terjual harus > 0`);
                skippedCount++;
                continue;
            }

            if (billedNum > sivNum) {
                result.warnings.push(`Baris ${i + 1}: Volume Terjual (${billedNum}) > SIV (${sivNum}) - Data mencurigakan`);
            }

            // Create zone object
            result.zones.push({
                id: `zone-import-${Date.now()}-${processedCount}`,
                name: name.trim(),
                data: {
                    systemInputVolume: sivNum.toString(),
                    billedMetered: billedNum.toString(),
                    numberOfCustomers: isNaN(custNum) ? '0' : custNum.toString(),
                    pipeLengthKm: isNaN(pipeNum) ? '0' : pipeNum.toString(),
                    // Defaults for quick analysis
                    averagePressure: '2.5',
                    unbilledMetered: '0',
                    unbilledUnmetered: '0',
                    unauthorizedPct: '3',
                    meterInaccuracyPct: '2'
                }
            });

            processedCount++;

        } catch (error) {
            result.warnings.push(`Baris ${i + 1}: Error parsing - ${error.message}`);
            skippedCount++;
        }
    }

    // Summary
    if (processedCount > 0) {
        result.success = true;
    } else {
        result.errors.push('Tidak ada data valid yang bisa diimport');
    }

    if (skippedCount > 0) {
        result.warnings.push(`Total ${skippedCount} baris dilewati karena data tidak valid`);
    }

    return result;
}

/**
 * Parse a single CSV line, handling quoted values
 * @param {string} line - Single CSV line
 * @returns {Array<string>} - Array of column values
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            // Handle escaped quotes ("")
            if (inQuotes && nextChar === '"') {
                current += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // Column separator (only if not inside quotes)
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    // Push last column
    result.push(current.trim());

    return result;
}

/**
 * Generate sample CSV template
 * @returns {string} - CSV template with headers and example data
 */
export function generateCSVTemplate() {
    return `Nama Zona,SIV (m³/bln),Terjual (m³/bln),Jumlah Pelanggan,Panjang Pipa (km)
DMA-01 Melati,50000,35000,1200,15.5
DMA-02 Mawar,75000,48000,1800,22.3
DMA-03 Anggrek,42000,28000,950,12.8`;
}

/**
 * Validate zone data structure
 * @param {Object} zone - Zone object to validate
 * @returns {Object} - { valid: boolean, errors: Array }
 */
export function validateZone(zone) {
    const errors = [];

    if (!zone.name || zone.name.trim().length === 0) {
        errors.push('Nama zona tidak boleh kosong');
    }

    if (!zone.data) {
        errors.push('Data zona tidak ada');
        return { valid: false, errors };
    }

    const siv = parseFloat(zone.data.systemInputVolume);
    const billed = parseFloat(zone.data.billedMetered);

    if (isNaN(siv) || siv <= 0) {
        errors.push('SIV harus berupa angka positif');
    }

    if (isNaN(billed) || billed <= 0) {
        errors.push('Volume Terjual harus berupa angka positif');
    }

    if (!isNaN(siv) && !isNaN(billed) && billed > siv) {
        errors.push('Volume Terjual tidak boleh lebih besar dari SIV');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}
