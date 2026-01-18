import { describe, it, expect } from 'vitest';
import { cleanJsonString } from '../src/js/ai-consultant.js';

describe('AI Consultant - Response Cleaning', () => {
    it('should strip markdown code blocks (json)', () => {
        const input = '```json\n{"key": "value"}\n```';
        const expected = '{"key": "value"}';
        expect(cleanJsonString(input)).toBe(expected);
    });

    it('should strip markdown code blocks (no lang)', () => {
        const input = '```\n{"key": "value"}\n```';
        const expected = '{"key": "value"}';
        expect(cleanJsonString(input)).toBe(expected);
    });

    it('should handle text without markdown', () => {
        const input = '{"key": "value"}';
        expect(cleanJsonString(input)).toBe(input);
    });

    it('should handle extra whitespace', () => {
        const input = '  ```json  \n{"key": "value"}\n  ```  ';
        const expected = '{"key": "value"}\n  ';
        expect(cleanJsonString(input).trim()).toBe('{"key": "value"}');
    });

    it('should handle numeric keys in JSON', () => {
        const input = '```json\n{"1": "value"}\n```';
        expect(JSON.parse(cleanJsonString(input))).toEqual({ "1": "value" });
    });

    // === TDD Test Cases from Production Bug: "Gagal parsing respons AI" ===

    it('should handle truncated/incomplete JSON response', () => {
        // AI sometimes returns truncated output when hitting token limit
        const truncatedInput = '```json\n{"diagnostic": {"status": "warning", "data": ';
        const result = cleanJsonString(truncatedInput);
        // Should extract whatever JSON-like content is there
        expect(result).toBeTruthy();
        // Should NOT be parseable as valid JSON (this is expected)
        expect(() => JSON.parse(result)).toThrow();
    });

    it('should handle empty response', () => {
        expect(cleanJsonString('')).toBe('');
        expect(cleanJsonString(null)).toBe('');
        expect(cleanJsonString(undefined)).toBe('');
    });

    it('should handle response with prefixed text before JSON', () => {
        // AI sometimes adds explanatory text before the JSON
        const input = 'Berikut adalah analisis Air untuk PDAM Anda:\n\n```json\n{"key": "value"}\n```';
        const result = cleanJsonString(input);
        expect(JSON.parse(result)).toEqual({ "key": "value" });
    });

    it('should handle response with trailing text after JSON', () => {
        // AI sometimes adds explanatory text after the JSON
        const input = '```json\n{"key": "value"}\n```\n\nSemoga analisis ini bermanfaat!';
        const result = cleanJsonString(input);
        expect(JSON.parse(result)).toEqual({ "key": "value" });
    });

    it('should handle nested markdown in JSON strings', () => {
        // AI might include markdown formatting inside JSON string values
        const input = '```json\n{"message": "The value is **important**"}\n```';
        const result = cleanJsonString(input);
        expect(JSON.parse(result)).toEqual({ "message": "The value is **important**" });
    });

    it('should handle JSON with Indonesian characters', () => {
        const input = '```json\n{"status": "Sangat Baik", "deskripsi": "NRW rendah untuk sistem distribusi air"}\n```';
        const result = cleanJsonString(input);
        expect(JSON.parse(result)).toEqual({
            "status": "Sangat Baik",
            "deskripsi": "NRW rendah untuk sistem distribusi air"
        });
    });

    it('should handle deeply nested JSON structure', () => {
        const input = '```json\n{"diagnostic": {"technical_analysis": {"nrw_status": "Kritis", "root_cause": {"pipes": "tua", "meters": "error"}}}}\n```';
        const result = cleanJsonString(input);
        const parsed = JSON.parse(result);
        expect(parsed.diagnostic.technical_analysis.nrw_status).toBe("Kritis");
        expect(parsed.diagnostic.technical_analysis.root_cause.pipes).toBe("tua");
    });

    it('should handle multiple JSON code blocks (use first valid one)', () => {
        // AI might mistakenly include multiple code blocks
        const input = '```json\n{"first": true}\n```\n\nOps, yang benar:\n```json\n{"second": true}\n```';
        const result = cleanJsonString(input);
        // Should use the FIRST code block found
        expect(JSON.parse(result)).toEqual({ "first": true });
    });

    it('should handle pure text response (no JSON)', () => {
        // AI might return plain text when confused
        const input = 'Maaf, saya tidak dapat menganalisis data yang diberikan karena format tidak sesuai.';
        const result = cleanJsonString(input);
        // Should return the text as-is, and NOT be valid JSON
        expect(() => JSON.parse(result)).toThrow();
    });
});

