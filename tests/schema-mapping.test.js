/**
 * Schema Mapping Tests
 * TDD for getDiagnosticField and getProposalField with nested world-class schemas
 */

import { describe, it, expect } from 'vitest';
import { getDiagnosticField, getProposalField } from '../src/js/pdf-helpers.js';

describe('getDiagnosticField - Nested Schema Mapping', () => {

    describe('nrw_status -> situational_analysis.nrw_benchmark', () => {
        it('should extract nrw_benchmark from nested schema', () => {
            const aiData = {
                diagnostic: {
                    situational_analysis: {
                        nrw_benchmark: {
                            current_nrw: '40% - Zona MERAH',
                            vs_rpjmn_target: 'Gap 15 persen poin',
                            vs_best_pdam: 'Lebih buruk dari Tangerang (18%)'
                        }
                    }
                }
            };
            const result = getDiagnosticField(aiData, 'nrw_status');
            expect(result).toContain('40%');
            expect(result).toContain('Gap');
        });

        it('should fallback to flat nrw_status if present', () => {
            const aiData = {
                diagnostic: {
                    nrw_status: 'NRW di level 40% zona merah'
                }
            };
            const result = getDiagnosticField(aiData, 'nrw_status');
            expect(result).toBe('NRW di level 40% zona merah');
        });
    });

    describe('infrastructure_assessment -> situational_analysis.infrastructure_condition', () => {
        it('should extract infrastructure_condition from nested schema', () => {
            const aiData = {
                diagnostic: {
                    situational_analysis: {
                        infrastructure_condition: {
                            ili_category: 'IWA Category D - Buruk',
                            pipe_network_age: '60% pipa > 20 tahun',
                            pressure_management: 'Tekanan 2.5 bar - Normal'
                        }
                    }
                }
            };
            const result = getDiagnosticField(aiData, 'infrastructure_assessment');
            expect(result).toContain('IWA Category');
            expect(result).toContain('60%');
        });
    });

    describe('root_causes -> root_cause_analysis.primary_causes[]', () => {
        it('should extract primary_causes with evidence', () => {
            const aiData = {
                diagnostic: {
                    root_cause_analysis: {
                        primary_causes: [
                            { cause: 'Pipa tua korosi', evidence: 'ILI 9.23', impact_rank: 1 },
                            { cause: 'Meter tidak akurat', evidence: '35% meter > 5 tahun', impact_rank: 2 }
                        ]
                    }
                }
            };
            const result = getDiagnosticField(aiData, 'root_causes');
            expect(result).toContain('Pipa tua korosi');
            expect(result).toContain('ILI 9.23');
        });

        it('should handle flat root_causes array', () => {
            const aiData = {
                diagnostic: {
                    root_causes: ['Pipa tua', 'Meter rusak', 'Pencurian air']
                }
            };
            const result = getDiagnosticField(aiData, 'root_causes');
            expect(result).toContain('Pipa tua');
            expect(result).toContain('Meter rusak');
        });
    });

    describe('financial_impact -> financial_hemorrhage', () => {
        it('should extract financial_hemorrhage data', () => {
            const aiData = {
                diagnostic: {
                    financial_hemorrhage: {
                        annual_loss_rupiah: 'Rp 48 Miliar',
                        daily_loss: 'Rp 131 Juta/hari',
                        equivalence: { cars: '76 unit Innova Zenix' },
                        '5_year_cumulative': 'Rp 240 Miliar'
                    }
                }
            };
            const result = getDiagnosticField(aiData, 'financial_impact');
            expect(result).toContain('Rp 48 Miliar');
            expect(result).toContain('76 unit');
        });
    });

    describe('loss_breakdown -> loss_decomposition', () => {
        it('should extract loss_decomposition data', () => {
            const aiData = {
                diagnostic: {
                    loss_decomposition: {
                        physical_losses: { volume_m3: '4.800.000', percentage_of_siv: '32%' },
                        commercial_losses: { volume_m3: '900.000', percentage_of_siv: '6%' },
                        dominant_type: 'FISIK - 84% dari total kehilangan'
                    }
                }
            };
            const result = getDiagnosticField(aiData, 'loss_breakdown');
            expect(result).toContain('Fisik');
            expect(result).toContain('FISIK');
        });
    });

    describe('quick_wins with object format', () => {
        it('should handle quick_wins as array of objects', () => {
            const aiData = {
                diagnostic: {
                    quick_wins: [
                        { action: 'Active Leak Detection', timeline: '1-3 bulan', estimated_impact: '2% NRW' },
                        { action: 'Pressure Management', timeline: '2-4 bulan', estimated_impact: '3% NRW' }
                    ]
                }
            };
            const result = getDiagnosticField(aiData, 'quick_wins');
            expect(result).toContain('Active Leak Detection');
            expect(result).toContain('1-3 bulan');
        });
    });
});

describe('getProposalField - Nested Schema Mapping', () => {

    describe('programs -> program_portfolio', () => {
        it('should extract program_portfolio with CAPEX', () => {
            const aiData = {
                proposal: {
                    program_portfolio: [
                        { program_id: 'P1', name: 'DMA Sectorization', capex_estimate: 'Rp 2 Miliar', nrw_reduction_target: '5 persen poin' },
                        { program_id: 'P2', name: 'AMR Implementation', capex_estimate: 'Rp 3 Miliar', nrw_reduction_target: '3 persen poin' }
                    ]
                }
            };
            const result = getProposalField(aiData, 'programs');
            expect(result).toContain('DMA Sectorization');
            expect(result).toContain('Rp 2 Miliar');
            expect(result).toContain('5 persen poin');
        });
    });

    describe('financial_projection -> financial_model.scenario_analysis', () => {
        it('should extract base_case from scenario_analysis', () => {
            const aiData = {
                proposal: {
                    financial_model: {
                        scenario_analysis: {
                            conservative: { total_investment: 'Rp 4 Miliar', payback_period: '4 tahun' },
                            base_case: { total_investment: 'Rp 6 Miliar', annual_savings_year3: 'Rp 3 Miliar', payback_period: '2.5 tahun', irr: '35%' },
                            aggressive: { total_investment: 'Rp 10 Miliar', payback_period: '1.8 tahun' }
                        }
                    }
                }
            };
            const result = getProposalField(aiData, 'financial_projection');
            expect(result).toContain('Rp 6 Miliar');
            expect(result).toContain('2.5 tahun');
            expect(result).toContain('35%');
        });
    });

    describe('implementation_roadmap -> phases[]', () => {
        it('should extract phases from nested roadmap', () => {
            const aiData = {
                proposal: {
                    implementation_roadmap: {
                        phases: [
                            { phase_id: 'Y1', name: 'Foundation & Quick Wins', expected_nrw_reduction: '3-5 persen poin' },
                            { phase_id: 'Y2', name: 'Scale & Optimize', expected_nrw_reduction: '5-7 persen poin' },
                            { phase_id: 'Y3', name: 'Sustain & Excel', expected_nrw_reduction: '2-3 persen poin' }
                        ]
                    }
                }
            };
            const result = getProposalField(aiData, 'implementation_roadmap');
            expect(result).toContain('Foundation');
            expect(result).toContain('Scale');
            expect(result).toContain('Sustain');
        });
    });

    describe('risk_mitigation -> risk_register[]', () => {
        it('should extract risk_register with probability/impact', () => {
            const aiData = {
                proposal: {
                    risk_register: [
                        { risk: 'Keterlambatan pengadaan', probability: 'MEDIUM', impact: 'HIGH', mitigation: 'Early procurement' },
                        { risk: 'Resistensi SDM', probability: 'LOW', impact: 'MEDIUM', mitigation: 'Change management' }
                    ]
                }
            };
            const result = getProposalField(aiData, 'risk_mitigation');
            expect(result).toContain('Keterlambatan');
            expect(result).toContain('MEDIUM/HIGH');
            expect(result).toContain('Early procurement');
        });
    });

    describe('strategic_recommendations -> governance_recommendations', () => {
        it('should extract governance_recommendations', () => {
            const aiData = {
                proposal: {
                    governance_recommendations: {
                        organization: 'Bentuk Tim NRW dedicated',
                        kpis: ['NRW turun 3 persen/tahun', 'ILI < 4 dalam 3 tahun'],
                        reporting: 'Dashboard bulanan ke Direksi'
                    }
                }
            };
            const result = getProposalField(aiData, 'strategic_recommendations');
            expect(result).toContain('Tim NRW');
            expect(result).toContain('Dashboard');
        });
    });
});
