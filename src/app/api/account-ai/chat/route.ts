import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import type { ChatMessagePayload } from "@/lib/account-ai-types";
import { createClient } from "@/lib/supabase/server";

const USER_ERROR_MAX = 480;

/** 生の SDK エラーを UI 向けに短く・日本語で返す（本文はログに出さない） */
function mapGeminiErrorToResponse(err: unknown): { message: string; status: number } {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();

  if (
    raw.includes("429") ||
    lower.includes("too many requests") ||
    lower.includes("quota exceeded") ||
    lower.includes("quota failure") ||
    lower.includes("resource exhausted")
  ) {
    return {
      message:
        "Gemini API の利用上限に達しています。無料枠の上限・「limit: 0」表示のときは、Google Cloud / AI Studio で請求の有効化やクォータを確認するか、別モデル（GEMINI_MODEL）を試してください。数分後に再試行できます。",
      status: 429,
    };
  }

  if (
    raw.includes("403") ||
    lower.includes("permission denied") ||
    (lower.includes("api key") && (lower.includes("invalid") || lower.includes("expired")))
  ) {
    return {
      message:
        "Gemini API の認可に失敗しました。GEMINI_API_KEY が正しいか、該当モデルが有効か確認してください。",
      status: 403,
    };
  }

  if (raw.includes("404") || lower.includes("not found")) {
    return {
      message: `モデルが見つかりません。GEMINI_MODEL（現在の設定値）が利用可能か確認してください。`,
      status: 404,
    };
  }

  const short =
    raw.length > USER_ERROR_MAX ? `${raw.slice(0, USER_ERROR_MAX)}…` : raw;
  return {
    message: short || "Gemini の応答に失敗しました",
    status: 502,
  };
}

/**
 * プロンプトにメール等の PII が含まれうるため、本文をログに残さない。
 */
export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY が未設定です。.env.local を確認してください。" },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正な JSON です" }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("messages" in body) ||
    !Array.isArray((body as { messages: unknown }).messages)
  ) {
    return NextResponse.json({ error: "messages 配列が必要です" }, { status: 400 });
  }

  const rawMessages = (body as { messages: unknown[] }).messages;
  const messages: ChatMessagePayload[] = [];
  for (const m of rawMessages) {
    if (!m || typeof m !== "object") continue;
    const role = (m as { role?: string }).role;
    const text = (m as { text?: string }).text;
    if ((role !== "user" && role !== "model") || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "各 message は role と非空 text が必要です" }, { status: 400 });
    }
    messages.push({ role, text: text.trim() });
  }

  if (messages.length === 0) {
    return NextResponse.json({ error: "メッセージが空です" }, { status: 400 });
  }
  const last = messages[messages.length - 1];
  if (last.role !== "user") {
    return NextResponse.json({ error: "最後のメッセージは user である必要があります" }, { status: 400 });
  }

  const modelName = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction:
      "You are Latlas AI for Account Management. Help users with Latlas Account: profile, security, password, data privacy, sharing, storage, and navigation in this app. Be concise and accurate. If unsure, say you are not sure. Respond in Japanese when the user writes in Japanese.",
  });

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "user" ? ("user" as const) : ("model" as const),
    parts: [{ text: m.text }],
  }));

  try {
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(last.text);
    const text = result.response.text();
    return NextResponse.json({ text });
  } catch (e) {
    const { message, status } = mapGeminiErrorToResponse(e);
    return NextResponse.json({ error: message }, { status });
  }
}
