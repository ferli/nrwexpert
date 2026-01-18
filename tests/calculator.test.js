import { describe, it, expect } from 'vitest';
import { calculateWaterBalance, validateInputs } from '../src/js/calculator.js';

describe('Water Balance Calculator - Core Calculations', () => {
    describe('calculateWaterBalance', () => {
        it('should calculate basic NRW correctly', () => {
            const input = {
                systemInputVolume: 1000000,
                billedMetered: 600000,
                billedUnmetered: 50000,
                unbilledMetered: 20000,
                unbilledUnmetered: 30000,
                numberOfCustomers: 10000,
                pipeLengthKm: 100,
                averagePressure: 3,
                averageTariff: 5000,
                productionCost: 3000
            };

            const result = calculateWaterBalance(input);

            // NRW = SIV - Billed Authorized
            // NRW = 1000000 - (600000 + 50000) = 350000
            expect(result.components.nrw).toBe(350000);

            // NRW% = (350000 / 1000000) * 100 = 35%
            expect(result.percentages.nrw).toBe(35);
        });

        it('should calculate authorized consumption correctly', () => {
            const input = {
                systemInputVolume: 1000000,
                billedMetered: 600000,
                billedUnmetered: 50000,
                unbilledMetered: 20000,
                unbilledUnmetered: 30000,
                numberOfCustomers: 5000,
                pipeLengthKm: 50
            };

            const result = calculateWaterBalance(input);

            // Total Authorized = Billed + Unbilled
            // = (600000 + 50000) + (20000 + 30000) = 700000
            expect(result.components.authorizedConsumption).toBe(700000);
        });

        it('should calculate water losses correctly', () => {
            const input = {
                systemInputVolume: 1000000,
                billedMetered: 600000,
                billedUnmetered: 50000,
                unbilledMetered: 20000,
                unbilledUnmetered: 30000,
                numberOfCustomers: 5000,
                pipeLengthKm: 50,
                unauthorizedPct: 2,
                meterInaccuracyPct: 3,
                dataErrors: 5000
            };

            const result = calculateWaterBalance(input);

            // Apparent Losses = Unauthorized + Meter Inaccuracy + Data Errors
            // Unauthorized = 1000000 * 0.02 = 20000
            // Meter Inaccuracy = 600000 * 0.03 = 18000
            // Data Errors = 5000
            // Total Apparent = 20000 + 18000 + 5000 = 43000
            expect(result.components.apparentLosses).toBe(43000);

            // Water Losses = SIV - Authorized Consumption
            // = 1000000 - 700000 = 300000
            expect(result.components.waterLosses).toBe(300000);

            // Real Losses = Water Losses - Apparent Losses
            // = 300000 - 43000 = 257000
            expect(result.components.realLosses).toBe(257000);
        });

        it('should handle zero system input volume', () => {
            const input = {
                systemInputVolume: 0,
                billedMetered: 0,
                billedUnmetered: 0,
                unbilledMetered: 0,
                unbilledUnmetered: 0,
                numberOfCustomers: 1000,
                pipeLengthKm: 10
            };

            const result = calculateWaterBalance(input);

            expect(result.percentages.nrw).toBe(0);
            expect(result.validation.isValid).toBe(false);
        });

        it('should calculate NRW per connection per day correctly', () => {
            const input = {
                systemInputVolume: 365000, // 1000 m³/day
                billedMetered: 182500, // 500 m³/day
                billedUnmetered: 0,
                unbilledMetered: 0,
                unbilledUnmetered: 0,
                numberOfCustomers: 100,
                pipeLengthKm: 10
            };

            const result = calculateWaterBalance(input);

            // NRW = 365000 - 182500 = 182500 m³/year
            // NRW per connection per day = (182500 * 1000) / (100 * 365) = 5000 L/connection/day
            expect(result.kpis.nrwPerConnectionPerDay).toBeCloseTo(5000, 1);
        });

        it('should calculate real losses per km per day correctly', () => {
            const input = {
                systemInputVolume: 365000,
                billedMetered: 182500,
                billedUnmetered: 0,
                unbilledMetered: 0,
                unbilledUnmetered: 0,
                numberOfCustomers: 100,
                pipeLengthKm: 50,
                unauthorizedPct: 1,
                meterInaccuracyPct: 1,
                dataErrors: 0
            };

            const result = calculateWaterBalance(input);

            // Real losses per km per day = Real Losses / (pipe length * 365)
            const expectedRealLossesPerKmPerDay = result.components.realLosses / (50 * 365);
            expect(result.kpis.realLossesPerKmPerDay).toBeCloseTo(expectedRealLossesPerKmPerDay, 2);
        });

        it('should calculate financial impact correctly', () => {
            const input = {
                systemInputVolume: 1000000,
                billedMetered: 700000,
                billedUnmetered: 0,
                unbilledMetered: 0,
                unbilledUnmetered: 0,
                numberOfCustomers: 10000,
                pipeLengthKm: 100,
                averageTariff: 5000,
                productionCost: 3000
            };

            const result = calculateWaterBalance(input);

            // NRW = 300000 m³
            // Lost Revenue = 300000 * 5000 = 1,500,000,000
            expect(result.financialImpact.lostRevenue).toBe(1500000000);

            // Wasted Production Cost = 300000 * 3000 = 900,000,000
            expect(result.financialImpact.wastedProductionCost).toBe(900000000);

            // Total Annual Loss = 1,500,000,000 + 900,000,000 = 2,400,000,000
            expect(result.financialImpact.totalAnnualLoss).toBe(2400000000);
        });

        it('should calculate ILI when all required data is present', () => {
            const input = {
                systemInputVolume: 1000000,
                billedMetered: 600000,
                billedUnmetered: 50000,
                unbilledMetered: 20000,
                unbilledUnmetered: 30000,
                numberOfCustomers: 5000,
                pipeLengthKm: 100,
                averagePressure: 3.5, // bar
                unauthorizedPct: 2,
                meterInaccuracyPct: 3,
                dataErrors: 5000
            };

            const result = calculateWaterBalance(input);

            // ILI should be calculated and be a number
            expect(result.kpis.ili).not.toBeNull();
            expect(typeof result.kpis.ili).toBe('number');
            expect(result.kpis.ili).toBeGreaterThan(0);
        });

        it('should return null ILI when pressure data is missing', () => {
            const input = {
                systemInputVolume: 1000000,
                billedMetered: 600000,
                billedUnmetered: 0,
                unbilledMetered: 0,
                unbilledUnmetered: 0,
                numberOfCustomers: 5000,
                pipeLengthKm: 100,
                averagePressure: 0 // Missing
            };

            const result = calculateWaterBalance(input);

            expect(result.kpis.ili).toBeNull();
        });
    });

    describe('Performance Classification', () => {
        it('should classify excellent NRW performance', () => {
            const input = {
                systemInputVolume: 1000000,
                billedMetered: 850000,
                billedUnmetered: 0,
                unbilledMetered: 0,
                unbilledUnmetered: 0,
                numberOfCustomers: 10000,
                pipeLengthKm: 100,
                averagePressure: 3
            };

            const result = calculateWaterBalance(input);

            // NRW = 15% (Excellent, < 20%)
            expect(result.benchmark.details.nrw).toBe(0); // 0 = Excellent
        });

        it('should classify critical NRW performance', () => {
            const input = {
                systemInputVolume: 1000000,
                billedMetered: 500000,
                billedUnmetered: 0,
                unbilledMetered: 0,
                unbilledUnmetered: 0,
                numberOfCustomers: 10000,
                pipeLengthKm: 100
            };

            const result = calculateWaterBalance(input);

            // NRW = 50% (Critical, > 40%)
            expect(result.benchmark.details.nrw).toBe(3); // 3 = Critical
        });
    });

    describe('Validation and Warnings', () => {
        it('should generate warning for very low NRW', () => {
            const input = {
                systemInputVolume: 1000000,
                billedMetered: 900000,
                billedUnmetered: 0,
                unbilledMetered: 0,
                unbilledUnmetered: 0,
                numberOfCustomers: 10000,
                pipeLengthKm: 100
            };

            const result = calculateWaterBalance(input);

            // NRW = 10% (very low for Indonesia)
            const lowNrwWarning = result.validation.warnings.find(
                w => w.message.includes('NRW sangat rendah')
            );
            expect(lowNrwWarning).toBeDefined();
            expect(lowNrwWarning.level).toBe('warning');
        });

        it('should generate warning for very high NRW', () => {
            const input = {
                systemInputVolume: 1000000,
                billedMetered: 350000,
                billedUnmetered: 0,
                unbilledMetered: 0,
                unbilledUnmetered: 0,
                numberOfCustomers: 10000,
                pipeLengthKm: 100
            };

            const result = calculateWaterBalance(input);

            // NRW = 65% (very high)
            const highNrwWarning = result.validation.warnings.find(
                w => w.message.includes('NRW sangat tinggi')
            );
            expect(highNrwWarning).toBeDefined();
            expect(highNrwWarning.level).toBe('warning');
        });

        it('should generate error when billed > SIV', () => {
            const input = {
                systemInputVolume: 1000000,
                billedMetered: 1100000, // More than SIV
                billedUnmetered: 0,
                unbilledMetered: 0,
                unbilledUnmetered: 0,
                numberOfCustomers: 10000,
                pipeLengthKm: 100
            };

            const result = calculateWaterBalance(input);

            const error = result.validation.warnings.find(
                w => w.level === 'error' && w.message.includes('tidak boleh lebih besar')
            );
            expect(error).toBeDefined();
        });
    });

    describe('validateInputs', () => {
        it('should pass validation for complete valid data', () => {
            const input = {
                systemInputVolume: '1000000',
                billedMetered: '600000',
                numberOfCustomers: '10000'
            };

            const result = validateInputs(input);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should fail validation when SIV is missing', () => {
            const input = {
                systemInputVolume: '',
                billedMetered: '600000',
                numberOfCustomers: '10000'
            };

            const result = validateInputs(input);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('System Input Volume wajib diisi dan harus lebih dari 0');
        });

        it('should fail validation when SIV is zero', () => {
            const input = {
                systemInputVolume: '0',
                billedMetered: '600000',
                numberOfCustomers: '10000'
            };

            const result = validateInputs(input);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.includes('System Input Volume'))).toBe(true);
        });

        it('should fail validation when numberOfCustomers is missing', () => {
            const input = {
                systemInputVolume: '1000000',
                billedMetered: '600000',
                numberOfCustomers: ''
            };

            const result = validateInputs(input);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.includes('Jumlah Pelanggan'))).toBe(true);
        });

        it('should fail validation for multiple missing fields', () => {
            const input = {
                systemInputVolume: '',
                billedMetered: '',
                numberOfCustomers: ''
            };

            const result = validateInputs(input);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('Edge Cases and Boundary Conditions', () => {
        it('should handle maximum realistic values', () => {
            const input = {
                systemInputVolume: 100000000, // 100 million m³
                billedMetered: 60000000,
                billedUnmetered: 0,
                unbilledMetered: 0,
                unbilledUnmetered: 0,
                numberOfCustomers: 1000000,
                pipeLengthKm: 5000
            };

            const result = calculateWaterBalance(input);

            expect(result.components.nrw).toBe(40000000);
            expect(result.percentages.nrw).toBe(40);
        });

        it('should handle zero customers gracefully', () => {
            const input = {
                systemInputVolume: 1000000,
                billedMetered: 600000,
                billedUnmetered: 0,
                unbilledMetered: 0,
                unbilledUnmetered: 0,
                numberOfCustomers: 0,
                pipeLengthKm: 100
            };

            const result = calculateWaterBalance(input);

            expect(result.kpis.nrwPerConnectionPerDay).toBe(0);
        });

        it('should handle zero pipe length gracefully', () => {
            const input = {
                systemInputVolume: 1000000,
                billedMetered: 600000,
                billedUnmetered: 0,
                unbilledMetered: 0,
                unbilledUnmetered: 0,
                numberOfCustomers: 10000,
                pipeLengthKm: 0
            };

            const result = calculateWaterBalance(input);

            expect(result.kpis.realLossesPerKmPerDay).toBe(0);
            expect(result.kpis.ili).toBeNull();
        });

        it('should handle default values for optional parameters', () => {
            const input = {
                systemInputVolume: 1000000,
                billedMetered: 600000
                // All other fields missing
            };

            const result = calculateWaterBalance(input);

            expect(result.financialImpact.averageTariff).toBe(5000); // Default
            expect(result.financialImpact.productionCost).toBe(3000); // Default
        });
    });
});
