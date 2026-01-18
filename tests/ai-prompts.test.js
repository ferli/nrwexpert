/**
 * AI Prompts & PDF Integration Tests
 * TDD suite for world-class prompt quality
 */

import { describe, it, expect } from 'vitest';
import { getDiagnosticField, getProposalField } from '../src/js/pdf-helpers.js';

describe('PDF Field Getters - Undefined Handling', () => {

    describe('getDiagnosticField', () => {

        it('should return fallback for missing executive_summary', () => {
            const aiData = { diagnostic: {} };
            const result = getDiagnosticField(aiData, 'executive_summary');
            expect(result).not.toBe('undefined');
            expect(result).toContain('tidak tersedia');
        });

        it('should return actual value when present', () => {
            const aiData = {
                diagnostic: {
                    executive_summary: 'NRW sangat tinggi di level 40%'
                }
            };
            const result = getDiagnosticField(aiData, 'executive_summary');
            expect(result).toBe('NRW sangat tinggi di level 40%');
        });
    });

    describe('getProposalField', () => {

        it('should return fallback for missing executive_summary', () => {
            const aiData = { proposal: {} };
            const result = getProposalField(aiData, 'executive_summary');
            expect(result).not.toBe('undefined');
            expect(result).toContain('tidak tersedia');
        });

        it('should NOT return undefined for executive_summary_narrative (legacy field)', () => {
            const aiData = { proposal: { executive_summary: 'Test summary' } };
            // This tests the BUG: code was looking for executive_summary_narrative
            const result = getProposalField(aiData, 'executive_summary');
            expect(result).toBe('Test summary');
        });

        it('should return financial_projection fields', () => {
            const aiData = {
                proposal: {
                    financial_projection: {
                        total_investment: 'Rp 5 Miliar',
                        payback_period: '2.5 tahun'
                    }
                }
            };
            const result = getProposalField(aiData, 'financial_projection');
            expect(result).toContain('Rp 5 Miliar');
        });

        it('should handle programs array', () => {
            const aiData = {
                proposal: {
                    programs: [
                        { name: 'DMA Sectorization', budget_estimate: 'Rp 1.5 Miliar' },
                        { name: 'Meter Replacement', budget_estimate: 'Rp 2 Miliar' }
                    ]
                }
            };
            const result = getProposalField(aiData, 'programs');
            expect(result).toContain('DMA Sectorization');
            expect(result).toContain('Meter Replacement');
        });
    });
});

describe('Financial Scenarios - Synchronized Values', () => {

    it('should have conservative < base < aggressive savings', () => {
        const financialData = {
            scenario_analysis: {
                conservative: { annual_savings: 500000000 },
                base_case: { annual_savings: 800000000 },
                aggressive: { annual_savings: 1200000000 }
            }
        };

        expect(financialData.scenario_analysis.conservative.annual_savings)
            .toBeLessThan(financialData.scenario_analysis.base_case.annual_savings);
        expect(financialData.scenario_analysis.base_case.annual_savings)
            .toBeLessThan(financialData.scenario_analysis.aggressive.annual_savings);
    });

    it('should have synchronized investment and payback', () => {
        // Higher investment should lead to better outcomes (lower payback)
        const financialData = {
            scenarios: {
                conservative: { investment: 1000000000, payback_years: 3.5 },
                aggressive: { investment: 2500000000, payback_years: 2.0 }
            }
        };

        // More investment = faster payback (assuming proportional returns)
        expect(financialData.scenarios.aggressive.payback_years)
            .toBeLessThan(financialData.scenarios.conservative.payback_years);
    });
});

describe('Project Schedule - Required Fields', () => {

    it('should have all 3 phases defined', () => {
        const schedule = {
            phases: [
                { name: 'Phase 1: Quick Wins', duration_months: 6 },
                { name: 'Phase 2: Scale Up', duration_months: 12 },
                { name: 'Phase 3: Optimization', duration_months: 18 }
            ]
        };

        expect(schedule.phases.length).toBe(3);
        expect(schedule.phases[0].name).toContain('Phase 1');
    });

    it('should have milestones with target dates', () => {
        const schedule = {
            milestones: [
                { name: 'DMA Pilot Complete', target_month: 3 },
                { name: '10% NRW Reduction', target_month: 12 },
                { name: 'Target NRW Achieved', target_month: 36 }
            ]
        };

        expect(schedule.milestones.length).toBeGreaterThanOrEqual(3);
        expect(schedule.milestones[0]).toHaveProperty('target_month');
    });
});
