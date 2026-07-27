// ── Conqur "Let's Talk" — AI conversational support (Phase 3) ──────────────
// POST /.netlify/functions/quest-talk
// Body: { messages: [{role,content}], context: {questTitle,pattern,promise,
//         defaultReplacement,alternatives}, escalate: bool }
//
// Safety-first design: a hard-coded keyword/pattern pre-filter runs on the
// latest user message BEFORE any OpenAI call. If it matches, a fixed
// professional-support response is returned and the model is never called —
// a more capable model is not the safety system, a hard gate is (see
// CONQUR_REBUILD_ROADMAP.md, Section 2 item 2 and Section 5 Phase 3).

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL_DEFAULT = "gpt-4o-mini";
const MODEL_ESCALATED = "gpt-4o";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Deliberately broad/over-inclusive — a false positive just shows supportive
// copy + a real resource (always a safe outcome); a false negative is the
// actual risk this filter exists to avoid.
const SAFETY_PATTERNS = [
  /\bsuicid(e|al)\b/i, /\bkill myself\b/i, /\bend (it all|my life)\b/i, /\bwant(ed)? to die\b/i,
  /\bself[\s-]?harm\b/i, /\bcutting myself\b/i, /\bhurt(ing)? myself\b/i,
  /\boverdose\b/i, /\bcan'?t stop drinking\b/i, /\bwithdrawal\b/i, /\bdetox(ing)?\b/i,
  /\bpurg(e|ing)\b/i, /\bbing(e|ing)\b/i, /\bstarv(e|ing) myself\b/i, /\bnot eating\b/i,
  /\bpanic attack\b/i, /\babus(e|ed|ive)\b/i, /\bviolen(t|ce)\b/i,
];

const SAFETY_RESPONSE = "This sounds like it might be more than a habit question, and I want to take it seriously rather than guess. Conqur isn't equipped to help with this directly. If you're in the US, you can call or text 988 (Suicide & Crisis Lifeline), available 24/7. Outside the US, please reach out to your local emergency services or a crisis line where you are. You deserve real support.";

function hitsSafetyFilter(text) {
  return SAFETY_PATTERNS.some((re) => re.test(text));
}

const SYSTEM_PROMPT = [
  "You are Conqur's supportive habit-change companion, speaking directly to someone working on one specific Quest — a single automatic behavior they're trying to replace with something more intentional.",
  "Voice: calm, warm, honest, human, non-judgmental, never a diagnosis, never fake certainty, never guilt or shame, never hype ('crush it', 'beast mode', 'unstoppable', 'no excuses'). Sound like a thoughtful, grounded friend who's good at this — not a therapist, not a drill sergeant, not a chatbot pretending to be a best friend.",
  "You only know what the user has told you in this conversation and in the Quest context provided below — never claim to know or infer something about their day or life you weren't actually told.",
  "Your job: help them think through what's making today's Promise hard right now, offer at most one or two concrete suggestions grounded in their actual Quest (their real default replacement or alternatives — never invent a new one), and let them decide. Ask at most one clarifying question per reply — this is a quick check-in, not an interrogation.",
  "Never suggest extreme, restrictive, or punishing behavior. Never present yourself as a substitute for professional medical, psychological, or addiction care — if the conversation drifts toward something clinical, say so gently and suggest a professional, without becoming alarmist.",
  "Keep replies to 2-4 sentences.",
].join(" ");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "Server misconfigured: missing OPENAI_API_KEY" }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  const rawMessages = Array.isArray(payload.messages) ? payload.messages.slice(-12) : [];
  const messages = rawMessages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, 800) }));

  if (!messages.length) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "No messages provided" }) };
  }

  // Safety gate — checked before any model call, on the newest user turn only.
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  if (lastUserMsg && hitsSafetyFilter(lastUserMsg.content)) {
    return {
      statusCode: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
      body: JSON.stringify({ message: SAFETY_RESPONSE, safetyRouted: true }),
    };
  }

  const ctx = payload.context && typeof payload.context === "object" ? payload.context : {};
  const context = {
    questTitle: typeof ctx.questTitle === "string" ? ctx.questTitle.slice(0, 100) : "",
    pattern: typeof ctx.pattern === "string" ? ctx.pattern.slice(0, 300) : "",
    promise: typeof ctx.promise === "string" ? ctx.promise.slice(0, 300) : "",
    defaultReplacement: typeof ctx.defaultReplacement === "string" ? ctx.defaultReplacement.slice(0, 200) : "",
    alternatives: Array.isArray(ctx.alternatives)
      ? ctx.alternatives.filter((a) => typeof a === "string").slice(0, 2).map((a) => a.slice(0, 200))
      : [],
  };

  const model = payload.escalate === true ? MODEL_ESCALATED : MODEL_DEFAULT;
  const contextLine =
    `Quest: "${context.questTitle}". Pattern being changed: ${context.pattern}. ` +
    `Promise: "${context.promise}". Default replacement: "${context.defaultReplacement}".` +
    (context.alternatives.length ? ` Alternatives: ${context.alternatives.join("; ")}.` : "");

  try {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: `${SYSTEM_PROMPT}\n\n${contextLine}` }, ...messages],
        temperature: 0.6,
        max_tokens: 220,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: "Upstream error", detail: errText.slice(0, 300) }) };
    }

    const data = await res.json();
    const reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!reply) {
      return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: "No content in AI response" }) };
    }

    return {
      statusCode: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
      body: JSON.stringify({ message: reply.trim(), safetyRouted: false, model }),
    };
  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "Proxy failure", detail: String((err && err.message) || err) }) };
  }
};
