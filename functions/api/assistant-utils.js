/**
 * Utility functions for Tira Assistant
 * Extracted for testability
 */

/**
 * Build conversation contents for Gemini API
 * Converts frontend history format to Gemini format
 *
 * @param {string} message - Current user message
 * @param {Array} history - Conversation history [{role: 'user'|'assistant', content: string}]
 * @returns {Array} Contents array for Gemini API [{role: 'user'|'model', parts: [{text: string}]}]
 */
export function buildContents(message, history = []) {
    const contents = [];

    // Validate inputs
    if (!message || typeof message !== 'string') {
        throw new Error('Message is required and must be a string');
    }

    // If history has messages, check if current message is already included
    if (Array.isArray(history) && history.length > 0) {
        // Take last 6 messages for context
        const recentHistory = history.slice(-6);

        // Check if the last message in history is the current message
        const lastMsg = recentHistory[recentHistory.length - 1];
        const historyIncludesCurrentMsg = lastMsg?.role === 'user' && lastMsg?.content === message;

        for (const msg of recentHistory) {
            if (!msg || !msg.content) continue;

            contents.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: String(msg.content) }]
            });
        }

        // If history doesn't include current message, add it
        if (!historyIncludesCurrentMsg) {
            contents.push({
                role: 'user',
                parts: [{ text: message }]
            });
        }
    } else {
        // No history, just add the current message
        contents.push({
            role: 'user',
            parts: [{ text: message }]
        });
    }

    return contents;
}

/**
 * Format SSE (Server-Sent Events) message
 *
 * @param {string} type - Message type: 'chunk', 'done', 'error'
 * @param {string} content - Message content (optional for 'done')
 * @returns {string} Formatted SSE message
 */
export function formatSSE(type, content = '') {
    const data = JSON.stringify({ type, content });
    return `data: ${data}\n\n`;
}

/**
 * Validate history array format
 *
 * @param {Array} history - History to validate
 * @returns {{valid: boolean, error?: string}} Validation result
 */
export function validateHistory(history) {
    if (!Array.isArray(history)) {
        return { valid: false, error: 'History must be an array' };
    }

    for (let i = 0; i < history.length; i++) {
        const msg = history[i];
        if (!msg || typeof msg !== 'object') {
            return { valid: false, error: `History item ${i} must be an object` };
        }
        if (!msg.role || !['user', 'assistant'].includes(msg.role)) {
            return { valid: false, error: `History item ${i} must have role 'user' or 'assistant'` };
        }
        if (!msg.content || typeof msg.content !== 'string') {
            return { valid: false, error: `History item ${i} must have content string` };
        }
    }

    return { valid: true };
}

/**
 * Parse Gemini streaming response line
 *
 * @param {string} line - Single line from SSE stream
 * @returns {string | null} Parsed text or null if not a data line
 */
export function parseGeminiStreamLine(line) {
    if (!line.startsWith('data:')) {
        return null;
    }

    try {
        // Handle both "data: " and "data:"
        const jsonStr = line.startsWith('data: ') ? line.slice(6) : line.slice(5);
        if (!jsonStr.trim()) return null; // Empty data

        const json = JSON.parse(jsonStr);
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
            return text; // Return string directly, not {text: ...} object
        }
        // Check for errors
        if (json.error) {
            throw new Error(json.error.message || 'Unknown API error');
        }
        return null;
    } catch (e) {
        return null; // Invalid JSON, skip
    }
}
