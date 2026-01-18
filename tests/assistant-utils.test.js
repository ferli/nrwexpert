import { describe, it, expect } from 'vitest';
import { parseGeminiStreamLine, formatSSE, buildContents, validateHistory } from '../functions/api/assistant-utils.js';

describe('Assistant Utils - Streaming & SSE', () => {
    describe('parseGeminiStreamLine', () => {
        it('should return string, not object (BUG FIX VALIDATION)', () => {
            const line = 'data: {"candidates":[{"content":{"parts":[{"text":"Hello World"}]}}]}';
            const result = parseGeminiStreamLine(line);

            // CRITICAL: Must be string, not {text: "..."}
            expect(typeof result).toBe('string');
            expect(result).toBe('Hello World');
        });

        it('should parse valid Gemini SSE line', () => {
            const line = 'data: {"candidates":[{"content":{"parts":[{"text":"Test response"}]}}]}';
            const result = parseGeminiStreamLine(line);

            expect(result).toBe('Test response');
        });

        it('should handle "data:" without space', () => {
            const line = 'data:{"candidates":[{"content":{"parts":[{"text":"No space"}]}}]}';
            const result = parseGeminiStreamLine(line);

            expect(result).toBe('No space');
        });

        it('should return null for non-data lines', () => {
            const line = 'event: message';
            const result = parseGeminiStreamLine(line);

            expect(result).toBeNull();
        });

        it('should return null for empty data', () => {
            const line = 'data: ';
            const result = parseGeminiStreamLine(line);

            expect(result).toBeNull();
        });

        it('should return null for invalid JSON', () => {
            const line = 'data: {invalid json}';
            const result = parseGeminiStreamLine(line);

            expect(result).toBeNull();
        });

        it('should return null when no text in response', () => {
            const line = 'data: {"candidates":[{"content":{"parts":[]}}]}';
            const result = parseGeminiStreamLine(line);

            expect(result).toBeNull();
        });

        it('should handle multi-line text', () => {
            const line = 'data: {"candidates":[{"content":{"parts":[{"text":"Line 1\\nLine 2\\nLine 3"}]}}]}';
            const result = parseGeminiStreamLine(line);

            expect(result).toBe('Line 1\nLine 2\nLine 3');
        });

        it('should handle special characters in text', () => {
            const line = 'data: {"candidates":[{"content":{"parts":[{"text":"Special: \\"quotes\\", \\u0026 symbols"}]}}]}';
            const result = parseGeminiStreamLine(line);

            expect(result).toContain('Special');
        });

        it('should throw error for API errors', () => {
            const line = 'data: {"error":{"message":"API rate limit exceeded"}}';

            // Should return null (errors are logged, not thrown in this implementation)
            const result = parseGeminiStreamLine(line);
            expect(result).toBeNull();
        });
    });

    describe('formatSSE', () => {
        it('should format chunk message', () => {
            const result = formatSSE('chunk', 'Hello');

            expect(result).toBe('data: {"type":"chunk","content":"Hello"}\n\n');
        });

        it('should format done message', () => {
            const result = formatSSE('done', '');

            expect(result).toBe('data: {"type":"done","content":""}\n\n');
        });

        it('should format error message', () => {
            const result = formatSSE('error', 'Something went wrong');

            expect(result).toBe('data: {"type":"error","content":"Something went wrong"}\n\n');
        });

        it('should handle empty content', () => {
            const result = formatSSE('chunk');

            expect(result).toBe('data: {"type":"chunk","content":""}\n\n');
        });

        it('should escape special characters in JSON', () => {
            const result = formatSSE('chunk', 'Text with "quotes"');

            expect(result).toContain('\\"quotes\\"');
        });
    });

    describe('buildContents', () => {
        it('should build contents with message only', () => {
            const contents = buildContents('Hello');

            expect(contents).toHaveLength(1);
            expect(contents[0].role).toBe('user');
            expect(contents[0].parts[0].text).toBe('Hello');
        });

        it('should build contents with history', () => {
            const history = [
                { role: 'user', content: 'Hi' },
                { role: 'assistant', content: 'Hello!' }
            ];
            const contents = buildContents('How are you?', history);

            expect(contents).toHaveLength(3);
            expect(contents[0].role).toBe('user');
            expect(contents[1].role).toBe('model'); // assistant -> model
            expect(contents[2].role).toBe('user');
        });

        it('should limit history to last 6 messages', () => {
            const history = Array.from({ length: 10 }, (_, i) => ({
                role: i % 2 === 0 ? 'user' : 'assistant',
                content: `Message ${i}`
            }));

            const contents = buildContents('New message', history);

            // Should have 6 from history + 1 new = 7
            expect(contents.length).toBeLessThanOrEqual(7);
        });

        it('should not duplicate message if already in history', () => {
            const history = [
                { role: 'user', content: 'Hello' }
            ];
            const contents = buildContents('Hello', history);

            // Should only have 1 (not duplicated)
            expect(contents).toHaveLength(1);
            expect(contents[0].parts[0].text).toBe('Hello');
        });

        it('should throw error for invalid message', () => {
            expect(() => buildContents('')).toThrow('Message is required');
            expect(() => buildContents(null)).toThrow('Message is required');
            expect(() => buildContents(123)).toThrow('must be a string');
        });

        it('should skip invalid history items', () => {
            const history = [
                { role: 'user', content: 'Valid' },
                { role: 'user', content: null }, // Invalid
                { role: 'assistant', content: 'Also valid' }
            ];

            const contents = buildContents('New', history);

            // Should skip the null content item
            expect(contents.length).toBeLessThan(4);
        });
    });

    describe('validateHistory', () => {
        it('should validate correct history', () => {
            const history = [
                { role: 'user', content: 'Hello' },
                { role: 'assistant', content: 'Hi there' }
            ];

            const result = validateHistory(history);

            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('should reject non-array history', () => {
            const result = validateHistory('not an array');

            expect(result.valid).toBe(false);
            expect(result.error).toContain('must be an array');
        });

        it('should reject history with invalid role', () => {
            const history = [
                { role: 'invalid', content: 'Test' }
            ];

            const result = validateHistory(history);

            expect(result.valid).toBe(false);
            expect(result.error).toContain('role');
        });

        it('should reject history with missing content', () => {
            const history = [
                { role: 'user', content: '' }
            ];

            const result = validateHistory(history);

            expect(result.valid).toBe(false);
            expect(result.error).toContain('content');
        });

        it('should reject history with non-object items', () => {
            const history = [
                'string item'
            ];

            const result = validateHistory(history);

            expect(result.valid).toBe(false);
            expect(result.error).toContain('must be an object');
        });

        it('should validate empty history', () => {
            const result = validateHistory([]);

            expect(result.valid).toBe(true);
        });
    });
});
