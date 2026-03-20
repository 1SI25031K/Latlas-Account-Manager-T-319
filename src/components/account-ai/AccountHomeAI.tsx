"use client";

import { CircleSpark, FastArrowRight, UserCircle } from "iconoir-react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { ChatMessagePayload } from "@/lib/account-ai-types";
import {
  ACCOUNT_FAQ_DISPLAY_MAX,
  ACCOUNT_FAQ_ITEMS,
} from "@/lib/account-faq";

function shuffleInPlace<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function TypingDots({ className }: { className?: string }) {
  return (
    <span className={`account-ai-typing-dots ${className ?? ""}`} aria-hidden>
      <span />
      <span />
      <span />
    </span>
  );
}

export function AccountHomeAI({
  displayName,
  avatarUrl,
  email,
}: {
  displayName: string;
  avatarUrl: string | null;
  email: string;
}) {
  const [animated, setAnimated] = useState(false);
  const [messages, setMessages] = useState<ChatMessagePayload[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listEndRef = useRef<HTMLDivElement>(null);

  const [faqChips] = useState(() =>
    ACCOUNT_FAQ_ITEMS.length
      ? shuffleInPlace(ACCOUNT_FAQ_ITEMS).slice(0, ACCOUNT_FAQ_DISPLAY_MAX)
      : [],
  );

  useLayoutEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      queueMicrotask(() => setAnimated(true));
      return;
    }
    let raf1 = 0;
    let raf2 = 0;
    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => setAnimated(true));
    });
    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, []);

  const scrollToBottom = useCallback(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const sendMessages = useCallback(
    async (nextMessages: ChatMessagePayload[]) => {
      setError(null);
      setLoading(true);
      try {
        const res = await fetch("/api/account-ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: nextMessages }),
        });
        const data = (await res.json()) as { text?: string; error?: string };
        if (!res.ok) {
          setError(data.error ?? "エラーが発生しました");
          return;
        }
        const text = data.text?.trim();
        if (!text) {
          setError("応答が空でした");
          return;
        }
        setMessages([...nextMessages, { role: "model", text }]);
      } catch {
        setError("通信に失敗しました");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const submitUserText = useCallback(
    async (raw: string) => {
      const t = raw.trim();
      if (!t || loading) return;
      const userMsg: ChatMessagePayload = { role: "user", text: t };
      const next = [...messages, userMsg];
      setMessages(next);
      setInput("");
      await sendMessages(next);
    },
    [loading, messages, sendMessages],
  );

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      void submitUserText(input);
    },
    [input, submitUserText],
  );

  const onComposerKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key !== "Enter") return;
      if (e.shiftKey) return;
      e.preventDefault();
      void submitUserText(input);
    },
    [input, submitUserText],
  );

  const hasConversation = messages.length > 0;

  useLayoutEffect(() => {
    if (hasConversation) scrollToBottom();
  }, [hasConversation, messages, loading, scrollToBottom]);

  return (
    <div className="flex flex-col items-center">
      <div
        className="account-home-hero flex w-full flex-col items-center text-center"
        data-animated={animated ? "true" : "false"}
        suppressHydrationWarning
      >
        <div
          className="account-home-item-1 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2"
          style={{
            borderColor: "var(--dashboard-border)",
            backgroundColor: "var(--dashboard-card)",
          }}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <UserCircle width={48} height={48} style={{ color: "var(--dashboard-text-muted)" }} />
          )}
        </div>
        <h1
          className="account-home-item-2 font-heading-ja mt-4 text-2xl font-semibold"
          style={{ color: "var(--dashboard-text)" }}
        >
          {displayName}
        </h1>
        <p
          className="account-home-item-3 mt-1 text-sm"
          style={{ color: "var(--dashboard-text-muted)" }}
        >
          {email}
        </p>
      </div>

      {faqChips.length > 0 ? (
        <div className="mt-8 flex w-full flex-wrap justify-center gap-3">
          {faqChips.map((label) => (
            <button
              key={label}
              type="button"
              disabled={loading}
              className="rounded-full border px-4 py-2.5 text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{
                borderColor: "var(--dashboard-border)",
                backgroundColor: "var(--dashboard-card)",
                color: "var(--dashboard-text)",
              }}
              onClick={() => void submitUserText(label)}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      <div
        className="mt-8 flex min-h-[min(70vh,520px)] max-h-[min(72vh,560px)] w-full max-w-3xl flex-col rounded-3xl border p-5 shadow-sm sm:p-8 md:rounded-[2.25rem]"
        style={{
          borderColor: "var(--dashboard-border)",
          backgroundColor: "var(--dashboard-card)",
        }}
      >
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div
            className="relative z-0 flex min-h-0 flex-1 flex-col space-y-3 overflow-y-auto px-1"
            style={{ color: "var(--dashboard-text)" }}
          >
            {messages.map((m, i) => (
              <div
                key={`${i}-${m.role}-${m.text.slice(0, 24)}`}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="max-w-[92%] rounded-3xl px-3 py-2 text-sm leading-relaxed"
                  style={{
                    backgroundColor:
                      m.role === "user" ? "var(--dashboard-nav-active-bg)" : "var(--dashboard-bg)",
                    color: "var(--dashboard-text)",
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading ? (
              <div className="flex justify-start py-1">
                <span className="sr-only">応答を生成しています</span>
                <TypingDots />
              </div>
            ) : null}
            <div ref={listEndRef} />
          </div>

          <div
            className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-2 text-center transition-opacity duration-500 ${hasConversation ? "opacity-0" : "opacity-100"}`}
            aria-hidden={hasConversation}
          >
            <div
              className="flex items-center gap-2 text-lg font-semibold sm:text-xl"
              style={{ color: "var(--dashboard-text)" }}
            >
              <span>Latlas AI for Account Management</span>
              <CircleSpark
                width={28}
                height={28}
                strokeWidth={1.5}
                className="shrink-0"
                style={{ color: "var(--dashboard-text)" }}
              />
            </div>
          </div>
        </div>

        {error ? (
          <p
            className="shrink-0 pt-2 text-center text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <form onSubmit={onSubmit} className="w-full shrink-0 pt-4">
          <div
            className="flex w-full items-end gap-2 rounded-[9999px] border py-2 pl-4 pr-2"
            style={{
              borderColor: "var(--dashboard-border)",
              backgroundColor: "var(--dashboard-bg)",
            }}
          >
            <textarea
              id="account-ai-input"
              rows={3}
              autoComplete="off"
              disabled={loading}
              placeholder="Latlas Account について質問できます。"
              title="Enter で送信、Shift+Enter で改行"
              aria-label="質問を入力"
              className="min-h-[4.5rem] min-w-0 flex-1 resize-none border-0 bg-transparent py-2 text-sm leading-relaxed outline-none"
              style={{ color: "var(--dashboard-text)" }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onComposerKeyDown}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{
                borderColor: "var(--dashboard-border)",
                backgroundColor: "transparent",
                color: "var(--dashboard-text)",
              }}
              aria-label="送信"
            >
              <FastArrowRight width={20} height={20} strokeWidth={1.5} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
