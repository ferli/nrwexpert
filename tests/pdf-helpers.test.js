import { describe, it, expect } from 'vitest';
import { formatRupiah, getDiagnosticField } from '../src/js/pdf-helpers.js';

describe('PDF Helper Functions', () => {
    describe('formatRupiah', () => {
        it('should format zero as Rp 0', () => {
            expect(formatRupiah(0)).toBe('Rp 0');
            expect(formatRupiah(null)).toBe('Rp 0');
            expect(formatRupiah(undefined)).toBe('Rp 0');
        });

        it('should format millions correctly', () => {
            expect(formatRupiah(1000000)).toBe('Rp 1.00 Juta');
            expect(formatRupiah(5500000)).toBe('Rp 5.50 Juta');
            expect(formatRupiah(999999999)).toBe('Rp 1000.00 Juta');
        });

        it('should format billions correctly', () => {
            expect(formatRupiah(1000000000)).toBe('Rp 1.00 Miliar');
            expect(formatRupiah(2500000000)).toBe('Rp 2.50 Miliar');
            expect(formatRupiah(15750000000)).toBe('Rp 15.75 Miliar');
        });

        it('should format small numbers with locale', () => {
            expect(formatRupiah(500000)).toBe('Rp 500.000');
            expect(formatRupiah(50000)).toBe('Rp 50.000');
            expect(formatRupiah(5000)).toBe('Rp 5.000');
        });

        it('should handle edge case values', () => {
            expect(formatRupiah(999999)).toBe('Rp 999.999');
            expect(formatRupiah(1000000000000)).toBe('Rp 1000.00 Miliar');
        });
    });

    describe('getDiagnosticField', () => {
        it('should return data from new schema (flat structure)', () => {
            const aiData = {
                diagnostic: {
                    nrw_status: 'NRW tinggi mencapai 40%',
                    financial_impact: 'Kerugian Rp 5 Miliar per tahun'
                }
            };

            expect(getDiagnosticField(aiData, 'nrw_status')).toBe('NRW tinggi mencapai 40%');
            expect(getDiagnosticField(aiData, 'financial_impact')).toBe('Kerugian Rp 5 Miliar per tahun');
        });

        it('should fallback to old schema (nested structure)', () => {
            const aiData = {
                diagnostic: {
                    technical_analysis: {
                        nrw_status: 'Status NRW dari struktur lama',
                        infrastructure_condition: 'Kondisi infrastruktur buruk'
                    }
                }
            };

            expect(getDiagnosticField(aiData, 'nrw_status')).toBe('Status NRW dari struktur lama');
            expect(getDiagnosticField(aiData, 'infrastructure_condition')).toBe('Kondisi infrastruktur buruk');
        });

        it('should prefer new schema over old schema', () => {
            const aiData = {
                diagnostic: {
                    nrw_status: 'New schema value',
                    technical_analysis: {
                        nrw_status: 'Old schema value'
                    }
                }
            };

            expect(getDiagnosticField(aiData, 'nrw_status')).toBe('New schema value');
        });

        it('should handle root_causes array', () => {
            const aiData = {
                diagnostic: {
                    root_causes: [
                        'Kebocoran pipa utama',
                        'Meter tidak akurat',
                        'Sambungan liar'
                    ]
                }
            };

            const result = getDiagnosticField(aiData, 'root_causes');
            expect(result).toContain('Kebocoran pipa utama');
            expect(result).toContain('Meter tidak akurat');
            expect(result).toContain('Sambungan liar');
            expect(result).toMatch(/\n• /);
        });

        it('should handle quick_wins array', () => {
            const aiData = {
                diagnostic: {
                    quick_wins: [
                        'Perbaiki kebocoran visible',
                        'Update tarif'
                    ]
                }
            };

            const result = getDiagnosticField(aiData, 'quick_wins');
            expect(result).toContain('Perbaiki kebocoran visible');
            expect(result).toContain('Update tarif');
        });

        it('should handle loss_breakdown object', () => {
            const aiData = {
                diagnostic: {
                    loss_breakdown: {
                        physical_analysis: 'Kebocoran fisik 25%',
                        commercial_analysis: 'Kehilangan komersial 15%',
                        dominant_factor: 'Fisik dominan'
                    }
                }
            };

            const result = getDiagnosticField(aiData, 'loss_breakdown');
            expect(result).toContain('Kebocoran fisik 25%');
            expect(result).toContain('Kehilangan komersial 15%');
            expect(result).toContain('Fisik dominan');
        });

        it('should return "Data tidak tersedia" for missing field', () => {
            const aiData = {
                diagnostic: {
                    nrw_status: 'Some data'
                }
            };

            expect(getDiagnosticField(aiData, 'nonexistent_field')).toBe('Data tidak tersedia');
        });

        it('should return "Data tidak tersedia" for null/undefined aiData', () => {
            expect(getDiagnosticField(null, 'nrw_status')).toBe('Data tidak tersedia');
            expect(getDiagnosticField(undefined, 'nrw_status')).toBe('Data tidak tersedia');
            expect(getDiagnosticField({}, 'nrw_status')).toBe('Data tidak tersedia');
        });

        it('should handle empty arrays gracefully', () => {
            const aiData = {
                diagnostic: {
                    root_causes: []
                }
            };

            const result = getDiagnosticField(aiData, 'root_causes');
            expect(result).toBe('');
        });

        it('should handle partial loss_breakdown', () => {
            const aiData = {
                diagnostic: {
                    loss_breakdown: {
                        physical_analysis: 'Only physical data'
                    }
                }
            };

            const result = getDiagnosticField(aiData, 'loss_breakdown');
            expect(result).toContain('Only physical data');
        });
    });
});
