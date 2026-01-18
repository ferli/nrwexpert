/**
 * Validation & Sanity Check Test Suite
 * 
 * Tests for logical impossibilities and data quality issues
 * that should be caught BEFORE calculation proceeds.
 * 
 * Bug Report: User saw NRW of -49950% due to Billed > SIV
 */

import { describe, it, expect } from 'vitest';
import { calculateWaterBalance, validateInputs } from '../src/js/calculator.js';

describe('Input Validation - Sanity Checks', () => {

    describe('Logical Impossibilities', () => {

        it('should REJECT when Billed Metered > SIV', () => {
            const input = {
                systemInputVolume: 1000, // Only 1000 m³
                billedMetered: 5000,     // Billed 5000 m³ - IMPOSSIBLE
                billedUnmetered: 0,
                unbilledMetered: 0,
                unbilledUnmetered: 0
            };

            const validation = validateInputs(input);
            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContain('Billed Metered tidak boleh melebihi System Input Volume');
        });

        it('should REJECT when Billed Unmetered > SIV', () => {
            const input = {
                systemInputVolume: 1000,
                billedMetered: 500,
                billedUnmetered: 500000, // Way more than SIV
                unbilledMetered: 0,
                unbilledUnmetered: 0
            };

            const validation = validateInputs(input);
            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContain('Billed Unmetered tidak boleh melebihi System Input Volume');
        });

        it('should REJECT when Total Authorized Consumption > SIV', () => {
            const input = {
                systemInputVolume: 1000,
                billedMetered: 400,
                billedUnmetered: 400,
                unbilledMetered: 300, // Total = 1100 > 1000
                unbilledUnmetered: 0
            };

            const validation = validateInputs(input);
            expect(validation.isValid).toBe(false);
            expect(validation.errors.some(e => e.includes('Total konsumsi resmi'))).toBe(true);
        });

        it('should REJECT when Apparent Losses > Water Losses', () => {
            const input = {
                systemInputVolume: 1000,
                billedMetered: 800,
                billedUnmetered: 100,
                unbilledMetered: 0,
                unbilledUnmetered: 0,
                meterUnderRegistration: 50,
                unauthorizedConsumption: 100 // Total apparent = 150, but NRW = 100
            };

            const validation = validateInputs(input);
            // Either reject or show warning
            expect(validation.warnings?.length || !validation.isValid).toBeTruthy();
        });
    });

    describe('Result Sanity Checks', () => {

        it('should NEVER return negative NRW percentage', () => {
            const input = {
                systemInputVolume: 1000,
                billedMetered: 500,
                billedUnmetered: 0,
                unbilledMetered: 200,
                unbilledUnmetered: 150
            };

            const result = calculateWaterBalance(input);
            expect(result.percentages.nrw).toBeGreaterThanOrEqual(0);
        });

        it('should NEVER return NRW percentage > 100%', () => {
            const input = {
                systemInputVolume: 1000,
                billedMetered: 100,
                billedUnmetered: 0,
                unbilledMetered: 0,
                unbilledUnmetered: 0
            };

            const result = calculateWaterBalance(input);
            expect(result.percentages.nrw).toBeLessThanOrEqual(100);
        });

        it('should NEVER return negative ILI', () => {
            const input = {
                systemInputVolume: 1000,
                billedMetered: 700,
                billedUnmetered: 0,
                unbilledMetered: 0,
                unbilledUnmetered: 0,
                numberOfCustomers: 100,
                pipeLengthKm: 10,
                averagePressure: 2.5
            };

            const result = calculateWaterBalance(input);
            expect(result.kpis.ili).toBeGreaterThanOrEqual(0);
        });

        it('should NEVER return negative Real Losses', () => {
            const input = {
                systemInputVolume: 1000,
                billedMetered: 700,
                billedUnmetered: 0,
                meterUnderRegistration: 50,
                unauthorizedConsumption: 100
            };

            const result = calculateWaterBalance(input);
            expect(result.components.realLosses).toBeGreaterThanOrEqual(0);
        });

        it('should NEVER return negative financial losses', () => {
            const input = {
                systemInputVolume: 1000,
                billedMetered: 700,
                billedUnmetered: 0,
                averageTariff: 5000,
                productionCost: 3000
            };

            const result = calculateWaterBalance(input);
            expect(result.financialImpact.lostRevenue).toBeGreaterThanOrEqual(0);
            expect(result.financialImpact.wastedProductionCost).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Data Quality Warnings', () => {

        it('should WARN when SIV is unrealistically low for customer count', () => {
            const input = {
                systemInputVolume: 1000, // 1000 m³/year
                numberOfCustomers: 50000, // 50,000 customers
                billedMetered: 500
            };

            // Expected: ~150 L/day/customer = ~2,737,500,000 L/year = 2,737,500 m³/year
            // 1000 m³ for 50,000 customers = 0.02 m³/customer/year = IMPOSSIBLE

            const validation = validateInputs(input);
            expect(validation.warnings?.some(w => w.includes('SIV terlalu rendah')) ||
                validation.errors?.some(e => e.includes('SIV'))).toBeTruthy();
        });

        it('should WARN when NRW% is unrealistically low (< 5%)', () => {
            const input = {
                systemInputVolume: 1000000,
                billedMetered: 970000, // 97% billed = 3% NRW (suspicious)
                billedUnmetered: 0
            };

            const result = calculateWaterBalance(input);
            expect(result.warnings?.some(w => w.includes('NRW sangat rendah')) ||
                result.percentages.nrw < 5).toBeTruthy();
        });

        it('should WARN when revenue water > 100%', () => {
            // This shouldn't happen with proper validation
            const input = {
                systemInputVolume: 1000,
                billedMetered: 1100, // More billed than input!
                billedUnmetered: 0
            };

            // Either validation fails OR result has warning
            const validation = validateInputs(input);
            const result = validation.isValid ? calculateWaterBalance(input) : null;

            expect(
                !validation.isValid ||
                (result && result.warnings?.length > 0)
            ).toBe(true);
        });
    });

    describe('Edge Cases - The User Bug', () => {

        it('should handle the exact user bug case gracefully', () => {
            // Exact data from user's screenshot
            const input = {
                systemInputVolume: 1000,
                billedMetered: 500,
                billedUnmetered: 500000, // WAY more than SIV
                unbilledMetered: 200000,
                unbilledUnmetered: 150000,
                numberOfCustomers: 50000,
                pipeLengthKm: 300,
                averagePressure: 2.5,
                waterTariff: 5000,
                productionCost: 3000
            };

            const validation = validateInputs(input);

            // MUST fail validation - this data is impossible
            expect(validation.isValid).toBe(false);
            expect(validation.errors.length).toBeGreaterThan(0);
        });

        it('should provide clear error message for impossible data', () => {
            const input = {
                systemInputVolume: 1000,
                billedMetered: 500,
                billedUnmetered: 500000
            };

            const validation = validateInputs(input);

            // Error should be human-readable in Indonesian
            const hasIndonesianError = validation.errors?.some(e =>
                e.includes('tidak boleh') ||
                e.includes('melebihi') ||
                e.includes('terlalu')
            );
            expect(hasIndonesianError).toBe(true);
        });
    });
});
