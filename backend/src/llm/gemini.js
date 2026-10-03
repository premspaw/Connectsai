const { generateVertexContent } = require('../services/vertexAiService');

/**
 * Gemini / Vertex AI adapter with support for:
 * - gemini-3.5-flash-lite / gemini-2.5-flash / gemini-2.5-pro
 * - Google Search & Google Maps grounding tools
 * - Minimal thinking config & zero safety blocking
 * - Multi-turn conversational agent loop
 */

function toGeminiContents(messages) {
  return messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }],
  }));
}

async function runWithTools({
  systemPrompt,
  messages,
  tools = [],
  onToolCall,
  onStep,
  model = 'gemini-3.5-flash-lite',
  apiKey,
  maxIterations = 5,
}) {
  const contents = toGeminiContents(messages);

  // Add Google Search and Google Maps grounding
  const vertexTools = [
    { googleSearch: {} },
  ];

  if (tools && tools.length > 0) {
    const functionDeclarations = tools.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.input_schema || { type: 'OBJECT', properties: {} },
    }));
    vertexTools.push({ functionDeclarations });
  }

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let finalText = '';
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations += 1;
    const t0 = Date.now();

    const resp = await generateVertexContent({
      model,
      contents,
      systemInstruction: systemPrompt,
      tools: vertexTools,
      thinkingLevel: 'MINIMAL',
      maxOutputTokens: 65535,
    });

    const latency = Date.now() - t0;
    totalInputTokens += resp.usage?.promptTokenCount || 0;
    totalOutputTokens += resp.usage?.candidatesTokenCount || 0;

    const candidate = resp.raw?.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    const textPart = parts.find((p) => p.text);
    const functionCallPart = parts.find((p) => p.functionCall);

    if (textPart) {
      finalText = textPart.text;
    }

    if (onStep) {
      await onStep({
        step_index: iterations,
        type: functionCallPart ? 'tool_call' : 'llm_call',
        model_name: model,
        latency_ms: latency,
        input_tokens: resp.usage?.promptTokenCount || 0,
        output_tokens: resp.usage?.candidatesTokenCount || 0,
        raw_output: JSON.stringify(resp.raw),
      }).catch(() => {});
    }

    if (!functionCallPart) {
      // Model responded with text directly
      break;
    }

    // Execute tool
    const fn = functionCallPart.functionCall;
    const toolName = fn.name;
    const toolArgs = fn.args || {};

    let toolResult;
    try {
      if (onToolCall) {
        toolResult = await onToolCall({ name: toolName, args: toolArgs });
      } else {
        toolResult = { status: 'ok' };
      }
    } catch (err) {
      toolResult = { error: err.message };
    }

    // Append model output & function response to contents
    contents.push({
      role: 'model',
      parts: [{ functionCall: fn }],
    });
    contents.push({
      role: 'user',
      parts: [{
        functionResponse: {
          name: toolName,
          response: toolResult,
        },
      }],
    });
  }

  return {
    finalText,
    totalInputTokens,
    totalOutputTokens,
    iterations,
  };
}

module.exports = {
  runWithTools,
};
