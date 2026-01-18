import { describe, it, expect } from 'vitest';
import { calculateDMAZones, identifyPriorityZones, createZoneComparison } from '../src/js/zones.js';

describe('Zone Management - DMA Calculations', () => {
    describe('calculateDMAZones', () => {
        it('should calculate water balance for multiple zones', () => {
            const zones = [
                {
                    id: 'zone-1',
                    name: 'DMA Zona A',
                    data: {
                        systemInputVolume: 100000,
                        billedMetered: 60000,
                        billedUnmetered: 5000,
                        unbilledMetered: 2000,
                        unbilledUnmetered: 3000,
                        numberOfCustomers: 1000,
                        pipeLengthKm: 10
                    }
                },
                {
                    id: 'zone-2',
                    name: 'DMA Zona B',
                    data: {
                        systemInputVolume: 150000,
                        billedMetered: 90000,
                        billedUnmetered: 10000,
                        unbilledMetered: 3000,
                        unbilledUnmetered: 2000,
                        numberOfCustomers: 1500,
                        pipeLengthKm: 15
                    }
                }
            ];

            const result = calculateDMAZones(zones);

            expect(result.zones).toHaveLength(2);
            expect(result.zoneCount).toBe(2);
            expect(result.zones[0].name).toBe('DMA Zona A');
            expect(result.zones[1].name).toBe('DMA Zona B');
        });

        it('should aggregate zones to PDAM level correctly', () => {
            const zones = [
                {
                    id: 'zone-1',
                    name: 'Zona A',
                    data: {
                        systemInputVolume: 100000,
                        billedMetered: 70000,
                        billedUnmetered: 0,
                        unbilledMetered: 0,
                        unbilledUnmetered: 0,
                        numberOfCustomers: 1000,
                        pipeLengthKm: 10
                    }
                },
                {
                    id: 'zone-2',
                    name: 'Zona B',
                    data: {
                        systemInputVolume: 200000,
                        billedMetered: 140000,
                        billedUnmetered: 0,
                        unbilledMetered: 0,
                        unbilledUnmetered: 0,
                        numberOfCustomers: 2000,
                        pipeLengthKm: 20
                    }
                }
            ];

            const result = calculateDMAZones(zones);

            // Total SIV should be sum of both zones
            expect(result.pdamAggregate.components.siv).toBe(300000);

            // Total customers should be sum
            expect(result.pdamAggregate.components.customers).toBe(3000);

            // Total pipe length should be sum
            expect(result.pdamAggregate.components.pipeLength).toBe(30);

            // Total NRW should be sum
            // Zone 1: NRW = 100000 - 70000 = 30000
            // Zone 2: NRW = 200000 - 140000 = 60000
            // Total: 90000
            expect(result.pdamAggregate.components.nrw).toBe(90000);

            // PDAM-level NRW% = (90000 / 300000) * 100 = 30%
            expect(result.pdamAggregate.percentages.nrw).toBe(30);
        });

        it('should rank zones by NRW percentage', () => {
            const zones = [
                {
                    id: 'zone-1',
                    name: 'Low NRW Zone',
                    data: {
                        systemInputVolume: 100000,
                        billedMetered: 80000,
                        billedUnmetered: 0,
                        unbilledMetered: 0,
                        unbilledUnmetered: 0,
                        numberOfCustomers: 1000,
                        pipeLengthKm: 10
                    }
                },
                {
                    id: 'zone-2',
                    name: 'High NRW Zone',
                    data: {
                        systemInputVolume: 100000,
                        billedMetered: 50000,
                        billedUnmetered: 0,
                        unbilledMetered: 0,
                        unbilledUnmetered: 0,
                        numberOfCustomers: 1000,
                        pipeLengthKm: 10
                    }
                },
                {
                    id: 'zone-3',
                    name: 'Medium NRW Zone',
                    data: {
                        systemInputVolume: 100000,
                        billedMetered: 65000,
                        billedUnmetered: 0,
                        unbilledMetered: 0,
                        unbilledUnmetered: 0,
                        numberOfCustomers: 1000,
                        pipeLengthKm: 10
                    }
                }
            ];

            const result = calculateDMAZones(zones);

            // Should be ranked from highest to lowest NRW
            expect(result.rankedZones[0].name).toBe('High NRW Zone');
            expect(result.rankedZones[1].name).toBe('Medium NRW Zone');
            expect(result.rankedZones[2].name).toBe('Low NRW Zone');

            expect(result.rankedZones[0].percentages.nrw).toBe(50);
            expect(result.rankedZones[1].percentages.nrw).toBe(35);
            expect(result.rankedZones[2].percentages.nrw).toBe(20);
        });

        it('should handle empty zone array', () => {
            const zones = [];
            const result = calculateDMAZones(zones);

            expect(result.zones).toHaveLength(0);
            expect(result.zoneCount).toBe(0);
            expect(result.pdamAggregate.components.siv).toBe(0);
            expect(result.pdamAggregate.percentages.nrw).toBe(0);
        });

        it('should calculate PDAM-level KPIs correctly', () => {
            const zones = [
                {
                    id: 'zone-1',
                    name: 'Zona A',
                    data: {
                        systemInputVolume: 365000,
                        billedMetered: 182500,
                        billedUnmetered: 0,
                        unbilledMetered: 0,
                        unbilledUnmetered: 0,
                        numberOfCustomers: 100,
                        pipeLengthKm: 50
                    }
                }
            ];

            const result = calculateDMAZones(zones);

            // NRW per connection per day should be calculated
            expect(result.pdamAggregate.kpis.nrwPerConnectionPerDay).toBeGreaterThan(0);

            // Real losses per km per day should be calculated
            expect(result.pdamAggregate.kpis.realLossesPerKmPerDay).toBeGreaterThan(0);
        });
    });

    describe('identifyPriorityZones', () => {
        it('should identify top 5 priority zones', () => {
            const rankedZones = [
                {
                    name: 'Zone 1',
                    percentages: { nrw: 60, realLossesPercent: 40, apparentLossesPercent: 20 },
                    components: { nrw: 50000 }
                },
                {
                    name: 'Zone 2',
                    percentages: { nrw: 55, realLossesPercent: 30, apparentLossesPercent: 25 },
                    components: { nrw: 45000 }
                },
                {
                    name: 'Zone 3',
                    percentages: { nrw: 50, realLossesPercent: 20, apparentLossesPercent: 30 },
                    components: { nrw: 40000 }
                },
                {
                    name: 'Zone 4',
                    percentages: { nrw: 45, realLossesPercent: 25, apparentLossesPercent: 20 },
                    components: { nrw: 35000 }
                },
                {
                    name: 'Zone 5',
                    percentages: { nrw: 40, realLossesPercent: 22, apparentLossesPercent: 18 },
                    components: { nrw: 30000 }
                },
                {
                    name: 'Zone 6',
                    percentages: { nrw: 35, realLossesPercent: 20, apparentLossesPercent: 15 },
                    components: { nrw: 25000 }
                }
            ];

            const priorities = identifyPriorityZones(rankedZones);

            expect(priorities).toHaveLength(5);
            expect(priorities[0].rank).toBe(1);
            expect(priorities[0].priority).toBe('Kritis');
            expect(priorities[1].priority).toBe('Tinggi');
            expect(priorities[2].priority).toBe('Sedang');
        });

        it('should recommend leakage detection when real losses dominate', () => {
            const rankedZones = [
                {
                    name: 'High Real Losses Zone',
                    percentages: { nrw: 50, realLossesPercent: 40, apparentLossesPercent: 10 },
                    components: { nrw: 50000 }
                }
            ];

            const priorities = identifyPriorityZones(rankedZones);

            expect(priorities[0].intervention).toBe('Deteksi kebocoran aktif & pressure management');
        });

        it('should recommend meter replacement when apparent losses dominate', () => {
            const rankedZones = [
                {
                    name: 'High Apparent Losses Zone',
                    percentages: { nrw: 50, realLossesPercent: 15, apparentLossesPercent: 35 },
                    components: { nrw: 50000 }
                }
            ];

            const priorities = identifyPriorityZones(rankedZones);

            expect(priorities[0].intervention).toBe('Penggantian meter & penertiban pelanggan');
        });

        it('should recommend combination when losses are balanced', () => {
            const rankedZones = [
                {
                    name: 'Balanced Losses Zone',
                    percentages: { nrw: 50, realLossesPercent: 25, apparentLossesPercent: 25 },
                    components: { nrw: 50000 }
                }
            ];

            const priorities = identifyPriorityZones(rankedZones);

            expect(priorities[0].intervention).toBe('Kombinasi: perbaikan pipa & audit meter');
        });

        it('should handle fewer than 5 zones', () => {
            const rankedZones = [
                {
                    name: 'Zone 1',
                    percentages: { nrw: 40, realLossesPercent: 20, apparentLossesPercent: 20 },
                    components: { nrw: 40000 }
                },
                {
                    name: 'Zone 2',
                    percentages: { nrw: 35, realLossesPercent: 18, apparentLossesPercent: 17 },
                    components: { nrw: 35000 }
                }
            ];

            const priorities = identifyPriorityZones(rankedZones);

            expect(priorities).toHaveLength(2);
        });
    });

    describe('createZoneComparison', () => {
        it('should create comparison data for visualization', () => {
            const zones = [
                {
                    name: 'Zone A',
                    percentages: { nrw: 15, realLossesPercent: 10, apparentLossesPercent: 5 },
                    input: { customers: 1000 }
                },
                {
                    name: 'Zone B',
                    percentages: { nrw: 35, realLossesPercent: 20, apparentLossesPercent: 15 },
                    input: { customers: 1500 }
                },
                {
                    name: 'Zone C',
                    percentages: { nrw: 50, realLossesPercent: 30, apparentLossesPercent: 20 },
                    input: { customers: 2000 }
                }
            ];

            const comparison = createZoneComparison(zones);

            expect(comparison).toHaveLength(3);
            expect(comparison[0]).toHaveProperty('name');
            expect(comparison[0]).toHaveProperty('nrw');
            expect(comparison[0]).toHaveProperty('real');
            expect(comparison[0]).toHaveProperty('apparent');
            expect(comparison[0]).toHaveProperty('customers');
            expect(comparison[0]).toHaveProperty('severity');
        });

        it('should classify severity levels correctly', () => {
            const zones = [
                {
                    name: 'Excellent Zone',
                    percentages: { nrw: 15, realLossesPercent: 10, apparentLossesPercent: 5 },
                    input: { customers: 1000 }
                },
                {
                    name: 'Good Zone',
                    percentages: { nrw: 25, realLossesPercent: 15, apparentLossesPercent: 10 },
                    input: { customers: 1000 }
                },
                {
                    name: 'Attention Zone',
                    percentages: { nrw: 35, realLossesPercent: 20, apparentLossesPercent: 15 },
                    input: { customers: 1000 }
                },
                {
                    name: 'Critical Zone',
                    percentages: { nrw: 50, realLossesPercent: 30, apparentLossesPercent: 20 },
                    input: { customers: 1000 }
                }
            ];

            const comparison = createZoneComparison(zones);

            expect(comparison[0].severity).toBe('excellent');
            expect(comparison[1].severity).toBe('good');
            expect(comparison[2].severity).toBe('attention');
            expect(comparison[3].severity).toBe('critical');
        });
    });

    describe('Edge Cases and Integration', () => {
        it('should handle zones with missing optional fields', () => {
            const zones = [
                {
                    id: 'zone-1',
                    name: 'Minimal Data Zone',
                    data: {
                        systemInputVolume: 100000,
                        billedMetered: 60000,
                        billedUnmetered: 0,
                        unbilledMetered: 0,
                        unbilledUnmetered: 0
                        // Missing: numberOfCustomers, pipeLengthKm
                    }
                }
            ];

            const result = calculateDMAZones(zones);

            expect(result.zones).toHaveLength(1);
            expect(result.pdamAggregate.components.customers).toBe(0);
            expect(result.pdamAggregate.components.pipeLength).toBe(0);
        });

        it('should handle single zone (no aggregation needed)', () => {
            const zones = [
                {
                    id: 'zone-1',
                    name: 'Single Zone',
                    data: {
                        systemInputVolume: 100000,
                        billedMetered: 70000,
                        billedUnmetered: 0,
                        unbilledMetered: 0,
                        unbilledUnmetered: 0,
                        numberOfCustomers: 1000,
                        pipeLengthKm: 10
                    }
                }
            ];

            const result = calculateDMAZones(zones);

            // PDAM aggregate should match single zone
            expect(result.pdamAggregate.components.siv).toBe(100000);
            expect(result.pdamAggregate.percentages.nrw).toBe(result.zones[0].percentages.nrw);
        });

        it('should maintain calculation accuracy with many zones', () => {
            const zones = Array.from({ length: 10 }, (_, i) => ({
                id: `zone-${i}`,
                name: `Zone ${i + 1}`,
                data: {
                    systemInputVolume: 10000,
                    billedMetered: 7000,
                    billedUnmetered: 0,
                    unbilledMetered: 0,
                    unbilledUnmetered: 0,
                    numberOfCustomers: 100,
                    pipeLengthKm: 5
                }
            }));

            const result = calculateDMAZones(zones);

            expect(result.zones).toHaveLength(10);
            expect(result.pdamAggregate.components.siv).toBe(100000);
            expect(result.pdamAggregate.components.customers).toBe(1000);
        });
    });
});
