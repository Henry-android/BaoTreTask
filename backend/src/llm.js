// Optional LLM helper. If GEMINI_API_KEY is not provided, callers should handle gracefully.
// We use fetch to avoid bundling client SDKs.

function buildPrompt(task) {
  return `Bạn là Project Guardian AI - một trợ lý quản lý dự án cấp cao.
Hệ thống phát hiện Task sau đang TRỄ HẠN:
- Tên Task: "${task.title}"
- Người thực hiện: ${task.assignee?.name || "N/A"}
- Deadline: ${task.deadline}
- Độ ưu tiên: ${task.priority}

Hãy phân tích rủi ro hệ thống và đưa ra giải pháp quyết liệt.
Trả về JSON với các trường:
- risk (string)
- solution (string)
- reminder (string)
- severity ("Warning" | "Critical") dựa trên độ ưu tiên.`;
}

async function analyzeTaskWithGemini({ apiKey, task }) {
  if (!apiKey) {
    const err = new Error("Missing GEMINI_API_KEY");
    err.code = "MISSING_GEMINI_API_KEY";
    throw err;
  }

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
      encodeURIComponent(apiKey),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: buildPrompt(task) }] }],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(
      `Gemini API error: ${res.status} ${res.statusText} ${text}`
    );
    err.code = "GEMINI_API_ERROR";
    throw err;
  }

  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    const err = new Error("Gemini returned empty response");
    err.code = "EMPTY_LLM_RESPONSE";
    throw err;
  }

  try {
    return JSON.parse(text);
  } catch {
    // If model returns non-JSON, bubble up with raw text.
    const err = new Error("Failed to parse LLM JSON");
    err.code = "LLM_JSON_PARSE_ERROR";
    err.raw = text;
    throw err;
  }
}

module.exports = { analyzeTaskWithGemini };
