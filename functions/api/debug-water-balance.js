/**
 * Debug endpoint for Water Balance AI Consultant
 * Shows detailed request/response for troubleshooting
 */

import { parseGeminiStreamLine } from './assistant-utils.js';

export async function onRequest(context) {
    const { request, env } = context;

    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        const payload = await request.json();
        const apiKey = env.GEMINI_API_KEY;

        if (!apiKey) {
            return Response.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
        }

        // Build prompt (simplified for debugging)
        const mode = payload.mode || 'diagnostic';
        const dataContext = JSON.stringify(payload, null, 2);

        const debugPrompt = `You are a water infrastructure analyst. Return ONLY valid JSON (NO markdown, NO code blocks).

Mode: ${mode}

JSON Schema:
{
  "diagnostic": {
    "summary": "Brief summary",
    "nrw_status": "NRW analysis"
  }
}

Data: ${dataContext}

Return ONLY the JSON object, nothing else.`;

        const debugLog = {
            step: 'initial',
            mode,
            promptLength: debugPrompt.length,
            apiKeyConfigured: !!apiKey,
            timestamp: new Date().toISOString()
        };

        // Call Gemini API
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:streamGenerateContent?alt=sse&key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: debugPrompt }] }],
                    generationConfig: {
                        temperature: 0.2,
                        maxOutputTokens: 2048
                    }
                })
            }
        );

        debugLog.step = 'gemini_response_received';
        debugLog.status = geminiResponse.status;
        debugLog.statusText = geminiResponse.statusText;

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            return Response.json({
                error: 'Gemini API Error',
                debugLog,
                geminiError: errorText
            }, { status: 500, headers: corsHeaders });
        }

        // Parse streaming response
        const reader = geminiResponse.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';
        const chunks = [];
        const rawLines = [];

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                rawLines.push(line); // Capture raw line

                if (!line.trim() || line.startsWith(':')) continue;

                const result = parseGeminiStreamLine(line);
                if (result) {
                    chunks.push({
                        raw: line.substring(0, 100) + '...', // First 100 chars
                        parsed: result.substring(0, 100) + '...', // First 100 chars
                        type: typeof result
                    });
                    fullText += result;
                }
            }
        }

        // Final buffer
        if (buffer.trim() && !buffer.startsWith(':')) {
            const result = parseGeminiStreamLine(buffer);
            if (result) {
                fullText += result;
                chunks.push({
                    raw: buffer.substring(0, 100) + '...',
                    parsed: result.substring(0, 100) + '...',
                    type: typeof result
                });
            }
        }

        // Try to parse as JSON
        let parsedJSON = null;
        let parseError = null;
        try {
            parsedJSON = JSON.parse(fullText);
        } catch (e) {
            parseError = e.message;
        }

        // Return detailed debug info
        return Response.json({
            success: !!parsedJSON,
            debugLog,
            streaming: {
                totalChunks: chunks.length,
                sampleChunks: chunks.slice(0, 5), // First 5 chunks
                fullTextLength: fullText.length,
                fullTextPreview: fullText.substring(0, 500), // First 500 chars
                fullTextLast200: fullText.slice(-200) // Last 200 chars
            },
            parsing: {
                success: !!parsedJSON,
                error: parseError,
                parsedJSON: parsedJSON ? Object.keys(parsedJSON) : null
            },
            raw: {
                firstLine: rawLines[0],
                lastLine: rawLines[rawLines.length - 1],
                totalLines: rawLines.length
            }
        }, { headers: corsHeaders });

    } catch (error) {
        return Response.json({
            error: error.message,
            stack: error.stack
        }, { status: 500, headers: corsHeaders });
    }
}
