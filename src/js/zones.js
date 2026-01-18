/**
 * Water Balance Calculator - Zone Management
 * Handles DMA (District Metered Area) zone calculations
 */

import { calculateWaterBalance } from './calculator.js';

/**
 * Calculate water balance for multiple DMA zones
 * @param {Array} zones - Array of zone data objects
 * @returns {Object} Zone results and PDAM aggregate
 */
export function calculateDMAZones(zones) {
    // Calculate each zone
    const zoneResults = zones.map((zone, index) => {
        const result = calculateWaterBalance(zone.data);
        return {
            id: zone.id || `zone-${index}`,
            name: zone.name,
            ...result
        };
    });

    // Aggregate to PDAM level
    const pdamAggregate = aggregateZonesToPDAM(zoneResults);

    // Rank zones by NRW percentage
    const rankedZones = [...zoneResults].sort((a, b) =>
        b.percentages.nrw - a.percentages.nrw
    );

    return {
        zones: zoneResults,
        rankedZones,
        pdamAggregate,
        zoneCount: zones.length
    };
}

/**
 * Aggregate zone results to PDAM level
 */
function aggregateZonesToPDAM(zoneResults) {
    // Sum all volumes
    const totals = zoneResults.reduce((acc, zone) => {
        return {
            siv: acc.siv + zone.components.systemInputVolume,
            billedAuthorized: acc.billedAuthorized + zone.components.billedAuthorized,
            unbilledAuthorized: acc.unbilledAuthorized + zone.components.unbilledAuthorized,
            nrw: acc.nrw + zone.components.nrw,
            realLosses: acc.realLosses + zone.components.realLosses,
            apparentLosses: acc.apparentLosses + zone.components.apparentLosses,
            customers: acc.customers + (zone.input.customers || 0),
            pipeLength: acc.pipeLength + (zone.input.pipeLength || 0)
        };
    }, {
        siv: 0,
        billedAuthorized: 0,
        unbilledAuthorized: 0,
        nrw: 0,
        realLosses: 0,
        apparentLosses: 0,
        customers: 0,
        pipeLength: 0
    });

    // Calculate PDAM-level percentages
    const nrwPercent = totals.siv > 0 ? (totals.nrw / totals.siv) * 100 : 0;
    const revenueWaterPercent = totals.siv > 0 ? (totals.billedAuthorized / totals.siv) * 100 : 0;

    // Calculate PDAM-level KPIs
    const realLossesPerKmPerDay = totals.pipeLength > 0
        ? totals.realLosses / (totals.pipeLength * 365)
        : 0;

    const nrwPerConnectionPerDay = totals.customers > 0
        ? (totals.nrw * 1000) / (totals.customers * 365)
        : 0;

    return {
        components: totals,
        percentages: {
            nrw: nrwPercent,
            revenueWater: revenueWaterPercent,
            apparentLossesPercent: totals.siv > 0 ? (totals.apparentLosses / totals.siv) * 100 : 0,
            realLossesPercent: totals.siv > 0 ? (totals.realLosses / totals.siv) * 100 : 0
        },
        kpis: {
            nrwPercent,
            realLossesPerKmPerDay,
            nrwPerConnectionPerDay
        }
    };
}

/**
 * Identify priority zones for intervention
 * @param {Array} rankedZones - Zones sorted by NRW
 * @returns {Array} Top priority zones with recommendations
 */
export function identifyPriorityZones(rankedZones) {
    return rankedZones.slice(0, 5).map((zone, index) => {
        const priority = index === 0 ? 'Kritis' : index === 1 ? 'Tinggi' : 'Sedang';

        // Determine intervention type
        const { realLossesPercent, apparentLossesPercent } = zone.percentages;
        let intervention;

        if (realLossesPercent > apparentLossesPercent * 2) {
            intervention = 'Deteksi kebocoran aktif & pressure management';
        } else if (apparentLossesPercent > realLossesPercent) {
            intervention = 'Penggantian meter & penertiban pelanggan';
        } else {
            intervention = 'Kombinasi: perbaikan pipa & audit meter';
        }

        return {
            rank: index + 1,
            zoneName: zone.name,
            nrwPercent: zone.percentages.nrw,
            priority,
            intervention,
            estimatedLoss: zone.components.nrw
        };
    });
}

/**
 * Create zone comparison data for visualization
 */
export function createZoneComparison(zones) {
    return zones.map(zone => ({
        name: zone.name,
        nrw: zone.percentages.nrw,
        real: zone.percentages.realLossesPercent,
        apparent: zone.percentages.apparentLossesPercent,
        customers: zone.input.customers,
        severity: getSeverityLevel(zone.percentages.nrw)
    }));
}

/**
 * Get severity level for color coding
 */
function getSeverityLevel(nrwPercent) {
    if (nrwPercent < 20) return 'excellent';
    if (nrwPercent < 30) return 'good';
    if (nrwPercent < 40) return 'attention';
    return 'critical';
}
