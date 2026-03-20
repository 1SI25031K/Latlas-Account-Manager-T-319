"use client";

import {
  ArrowRight,
  CircleSpark,
  Compress,
  Maximize,
  UserCircle,
} from "iconoir-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ChatMessagePayload } from "@/lib/account-ai-types";
import { ACCOUNT_AI_SUGGESTION_ITEMS } from "@/lib/account-ai-suggestions";
import {
  ACCOUNT_FAQ_DISPLAY_MAX,
  ACCOUNT_FAQ_ITEMS,
} from "@/lib/account-faq";
import { useAccountChat } from "@/components/account-ai/AccountChatContext";
import { NewChatIcon } from "@/components/account-ai/NewChatIcon";

/** localStorage: 新チャット確認を省略するか */
const SKIP_NEW_CHAT_CONFIRM_KEY = "latlas-account-ai-skip-new-chat-confirm";

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
  const {
    messages,
    setMessages,
    input,
    setInput,
    loading,
    setLoading,
    error,
    setError,
  } = useAccountChat();
  const [animated, setAnimated] = useState(false);
  const [chatFullscreen, setChatFullscreen] = useState(false);
  /** フルスクリーンオーバーレイの表示トランジション（開く・閉じる） */
  const [fsOverlayEntered, setFsOverlayEntered] = useState(false);
  /** 通常表示のチャット枠のトランジション（フルスクリーン終了後の復帰） */
  const [inlineEntered, setInlineEntered] = useState(true);
  const closingFsRef = useRef(false);
  const wasFullscreenRef = useRef(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetSkipConfirmNext, setResetSkipConfirmNext] = useState(false);
  const listEndRef = useRef<HTMLDivElement>(null);
  /** Enter 1回目で true → 2回目で送信（1回目は変換確定などに使える） */
  const enterArmedRef = useRef(false);
  /** ブラウザの setTimeout は number、Node の型定義と食い違うため明示 */
  const enterArmTimeoutRef = useRef<number | null>(null);
  /** submitUserText 内で直近の loading を参照（コールバックの古い closure 対策） */
  const loadingRef = useRef(loading);
  loadingRef.current = loading;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  /** 送信処理の重複開始防止（再描画前に連打された場合） */
  const sendingGuardRef = useRef(false);

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
    /* 二重 rAF だと遅延やキャンセルで data-animated が true にならず、ヒーローが常時 opacity:0 のままになることがある */
    setAnimated(true);
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
      if (!t || loadingRef.current || sendingGuardRef.current) return;
      sendingGuardRef.current = true;
      const userMsg: ChatMessagePayload = { role: "user", text: t };
      const nextForSend = [...messagesRef.current, userMsg];
      try {
        setMessages(nextForSend);
        setInput("");
        await sendMessages(nextForSend);
      } finally {
        sendingGuardRef.current = false;
      }
    },
    [sendMessages, setMessages, setInput],
  );

  const clearEnterArmTimer = useCallback(() => {
    if (enterArmTimeoutRef.current) {
      clearTimeout(enterArmTimeoutRef.current);
      enterArmTimeoutRef.current = null;
    }
  }, []);

  const resetEnterArm = useCallback(() => {
    enterArmedRef.current = false;
    clearEnterArmTimer();
  }, [clearEnterArmTimer]);

  /** マーキーからそのままユーザーメッセージとして送信 */
  const onMarqueeSuggestionClick = useCallback(
    (label: string) => {
      resetEnterArm();
      void submitUserText(label);
    },
    [resetEnterArm, submitUserText],
  );

  useLayoutEffect(() => {
    return () => clearEnterArmTimer();
  }, [clearEnterArmTimer]);

  const performNewChat = useCallback(() => {
    resetEnterArm();
    setMessages([]);
    setInput("");
    setError(null);
    setLoading(false);
    setResetDialogOpen(false);
    setResetSkipConfirmNext(false);
  }, [
    resetEnterArm,
    setMessages,
    setInput,
    setError,
    setLoading,
  ]);

  const openNewChatFlow = useCallback(() => {
    if (loading) return;
    try {
      if (typeof window !== "undefined" && localStorage.getItem(SKIP_NEW_CHAT_CONFIRM_KEY) === "1") {
        performNewChat();
        return;
      }
    } catch {
      /* localStorage 不可 */
    }
    setResetSkipConfirmNext(false);
    setResetDialogOpen(true);
  }, [loading, performNewChat]);

  const confirmNewChat = useCallback(() => {
    if (resetSkipConfirmNext) {
      try {
        localStorage.setItem(SKIP_NEW_CHAT_CONFIRM_KEY, "1");
      } catch {
        /* ignore */
      }
    }
    performNewChat();
  }, [performNewChat, resetSkipConfirmNext]);

  useEffect(() => {
    if (!resetDialogOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setResetDialogOpen(false);
        setResetSkipConfirmNext(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [resetDialogOpen]);

  const requestCloseFullscreen = useCallback(() => {
    if (!chatFullscreen) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      closingFsRef.current = false;
      setChatFullscreen(false);
      return;
    }
    if (closingFsRef.current) return;
    closingFsRef.current = true;
    setFsOverlayEntered(false);
  }, [chatFullscreen]);

  const onFullscreenOverlayTransitionEnd = useCallback((e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (!closingFsRef.current) return;
    if (e.propertyName !== "opacity") return;
    closingFsRef.current = false;
    setChatFullscreen(false);
  }, []);

  useLayoutEffect(() => {
    if (!chatFullscreen) {
      setFsOverlayEntered(false);
      return;
    }
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setFsOverlayEntered(true);
      return;
    }
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setFsOverlayEntered(true));
    });
    return () => cancelAnimationFrame(id);
  }, [chatFullscreen]);

  useLayoutEffect(() => {
    if (chatFullscreen) {
      wasFullscreenRef.current = true;
      setInlineEntered(false);
      return;
    }
    if (!wasFullscreenRef.current) {
      setInlineEntered(true);
      return;
    }
    wasFullscreenRef.current = false;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInlineEntered(true);
      return;
    }
    setInlineEntered(false);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setInlineEntered(true));
    });
    return () => cancelAnimationFrame(id);
  }, [chatFullscreen]);

  useEffect(() => {
    if (!chatFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !resetDialogOpen) {
        e.preventDefault();
        requestCloseFullscreen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chatFullscreen, resetDialogOpen, requestCloseFullscreen]);

  useEffect(() => {
    if (!chatFullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [chatFullscreen]);

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      resetEnterArm();
      void submitUserText(input);
    },
    [input, resetEnterArm, submitUserText],
  );

  const onComposerKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Enter") return;

      // IME 変換中は何もしない（1回目の Enter で変換確定に使える）
      if (e.nativeEvent.isComposing || e.keyCode === 229) {
        return;
      }

      e.preventDefault();

      if (!input.trim() || loading) {
        resetEnterArm();
        return;
      }

      if (!enterArmedRef.current) {
        enterArmedRef.current = true;
        clearEnterArmTimer();
        enterArmTimeoutRef.current = window.setTimeout(() => {
          enterArmedRef.current = false;
          enterArmTimeoutRef.current = null;
        }, 4000);
        return;
      }

      enterArmedRef.current = false;
      clearEnterArmTimer();
      void submitUserText(input);
    },
    [input, loading, submitUserText, clearEnterArmTimer, resetEnterArm],
  );

  const hasConversation = messages.length > 0;

  /** アニメーション中の transform でも確実に反応するよう pointerup / キーボードで送る */
  const onMarqueeChipPointerUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>, label: string) => {
      e.stopPropagation();
      if (loadingRef.current || hasConversation) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      onMarqueeSuggestionClick(label);
    },
    [hasConversation, onMarqueeSuggestionClick],
  );

  const onMarqueeChipKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, label: string) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      if (loadingRef.current || hasConversation) return;
      onMarqueeSuggestionClick(label);
    },
    [hasConversation, onMarqueeSuggestionClick],
  );

  useLayoutEffect(() => {
    if (hasConversation) scrollToBottom();
  }, [hasConversation, messages, loading, scrollToBottom]);

  const chatCardEl = (
    <div
      className={
        chatFullscreen
          ? "account-ai-chat-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border p-5 pb-2 shadow-sm sm:p-8 sm:pb-3 md:rounded-[2.25rem] md:mx-auto md:my-4 md:max-w-4xl md:flex-1"
          : "account-ai-chat-card flex min-h-[min(70vh,520px)] max-h-[min(72vh,560px)] w-full flex-col overflow-hidden rounded-3xl border p-5 pb-2 shadow-sm sm:p-8 sm:pb-3 md:rounded-[2.25rem]"
      }
      style={{
        borderColor: "var(--account-ui-border)",
        backgroundColor: "var(--dashboard-card)",
      }}
    >
      <div className="flex shrink-0 justify-between gap-2 pb-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            if (chatFullscreen) {
              requestCloseFullscreen();
            } else {
              setChatFullscreen(true);
            }
          }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            borderColor: "var(--account-ui-border)",
            backgroundColor: "var(--dashboard-bg)",
            color: "var(--dashboard-text-muted)",
          }}
          title={chatFullscreen ? "フルスクリーンを終了" : "チャットをフルスクリーンにする"}
          aria-label={chatFullscreen ? "フルスクリーンを終了" : "チャットをフルスクリーンにする"}
        >
          {chatFullscreen ? (
            <Compress width={20} height={20} strokeWidth={1.75} aria-hidden />
          ) : (
            <Maximize width={20} height={20} strokeWidth={1.75} aria-hidden />
          )}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={openNewChatFlow}
          className="flex h-9 w-9 items-center justify-center rounded-full border transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            borderColor: "var(--account-ui-border)",
            backgroundColor: "var(--dashboard-bg)",
            color: "var(--dashboard-text-muted)",
          }}
          title="新しいチャットを始める"
          aria-label="新しいチャットを始める"
        >
          <NewChatIcon size={20} />
        </button>
      </div>

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
                    m.role === "user" ? "var(--account-chat-user-bg)" : "var(--dashboard-bg)",
                  color: m.role === "user" ? "var(--account-chat-user-text)" : "var(--dashboard-text)",
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
          className={`pointer-events-none absolute inset-0 z-10 flex min-h-0 flex-col overflow-hidden px-2 text-center transition-opacity duration-500 ${hasConversation ? "opacity-0" : "opacity-100"}`}
          aria-hidden={hasConversation}
        >
          <div
            className={`flex min-h-0 w-full max-w-3xl flex-col items-center justify-start gap-4 overflow-y-auto pt-5 sm:gap-5 sm:pt-6 ${hasConversation ? "pointer-events-none" : "pointer-events-auto"}`}
          >
            <div
              className="account-ai-empty-title flex max-w-full shrink-0 items-center justify-center gap-2 text-lg font-semibold sm:text-xl"
              style={{ color: "var(--dashboard-text)" }}
            >
              <span className="min-w-0">Latlas AI for Account Management</span>
              <CircleSpark
                width={28}
                height={28}
                strokeWidth={1.5}
                className="shrink-0"
                style={{ color: "var(--dashboard-text)" }}
              />
            </div>
            {ACCOUNT_AI_SUGGESTION_ITEMS.length > 0 ? (
              <div
                className={`account-ai-suggestions-marquee-clip w-full ${hasConversation ? "pointer-events-none" : ""}`}
                role="region"
                aria-label="質問の候補。クリックで送信できます。"
              >
                <div className="account-ai-suggestions-marquee-track">
                  <div className="account-ai-suggestions-marquee-set">
                    {ACCOUNT_AI_SUGGESTION_ITEMS.map((label, i) => (
                      <button
                        key={`account-ai-sugg-a-${i}`}
                        type="button"
                        disabled={loading}
                        tabIndex={hasConversation ? -1 : undefined}
                        className={`account-ai-suggestion-chip shrink-0 cursor-pointer whitespace-nowrap rounded-full border px-3 py-2 text-xs transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm ${hasConversation ? "pointer-events-none" : ""}`}
                        style={{
                          borderColor: "var(--account-ui-border)",
                          backgroundColor: "var(--dashboard-card)",
                          color: "var(--dashboard-text)",
                        }}
                        title={label}
                        aria-label={`この質問を送る: ${label}`}
                        onPointerUp={(e) => onMarqueeChipPointerUp(e, label)}
                        onKeyDown={(e) => onMarqueeChipKeyDown(e, label)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="account-ai-suggestions-marquee-set" aria-hidden="true">
                    {ACCOUNT_AI_SUGGESTION_ITEMS.map((label, i) => (
                      <button
                        key={`account-ai-sugg-b-${i}`}
                        type="button"
                        disabled={loading}
                        tabIndex={-1}
                        className={`account-ai-suggestion-chip shrink-0 cursor-pointer whitespace-nowrap rounded-full border px-3 py-2 text-xs transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm ${hasConversation ? "pointer-events-none" : ""}`}
                        style={{
                          borderColor: "var(--account-ui-border)",
                          backgroundColor: "var(--dashboard-card)",
                          color: "var(--dashboard-text)",
                        }}
                        title={label}
                        onPointerUp={(e) => onMarqueeChipPointerUp(e, label)}
                        onKeyDown={(e) => onMarqueeChipKeyDown(e, label)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
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

      <form onSubmit={onSubmit} className="w-full shrink-0 pt-6 pb-0">
        <div
          className="flex w-full items-center gap-2.5 rounded-[9999px] border px-2 py-2.5 pl-4 sm:pl-5"
          style={{
            borderColor: "var(--account-ui-border)",
            backgroundColor: "var(--dashboard-bg)",
          }}
        >
          <input
            id="account-ai-input"
            type="text"
            autoComplete="off"
            disabled={loading}
            placeholder="Latlas Account について質問できます。"
            title="Enter を2回で送信（変換中は変換の確定に使えます）"
            aria-label="質問を入力。Enter を2回で送信"
            className="min-h-8 min-w-0 flex-1 border-0 bg-transparent py-1 text-sm leading-snug outline-none"
            style={{ color: "var(--dashboard-text)" }}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              enterArmedRef.current = false;
              clearEnterArmTimer();
            }}
            onBlur={resetEnterArm}
            onKeyDown={onComposerKeyDown}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="account-ai-send-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45"
            style={{
              backgroundColor: "var(--account-send-bg, #3b82f6)",
              color: "var(--account-send-fg, #ffffff)",
              boxShadow: "var(--account-send-shadow)",
            }}
            aria-label="送信"
          >
            <ArrowRight
              width={20}
              height={20}
              strokeWidth={2}
              className="-translate-x-px"
              style={{ color: "var(--account-send-fg, #ffffff)" }}
              aria-hidden
            />
          </button>
        </div>
        <p
          className="mt-5 px-1 text-center text-[9px] leading-tight sm:text-[10px]"
          style={{ color: "var(--dashboard-text-muted)" }}
        >
          機密情報や個人情報は入力せず、回答の正確性を必ず自身で確認してください。
        </p>
      </form>
    </div>
  );

  return (
    <div
      className="account-ai-home flex w-full flex-col items-center"
      data-animated={animated ? "true" : "false"}
      suppressHydrationWarning
    >
      <div
        className={`account-home-hero relative flex w-full shrink-0 flex-col items-center text-center ${chatFullscreen ? "z-0" : "z-10"}`}
        aria-hidden={chatFullscreen}
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
        <div
          className={`mt-8 flex w-full flex-wrap justify-center gap-3 ${chatFullscreen ? "hidden" : ""}`}
          aria-hidden={chatFullscreen}
        >
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

      {!chatFullscreen ? (
        <div
          className={`mt-8 w-full max-w-3xl transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
            inlineEntered
              ? "opacity-100 scale-100"
              : "opacity-0 scale-[0.97] motion-reduce:opacity-100 motion-reduce:scale-100"
          }`}
          style={{ transformOrigin: "50% 42%" }}
        >
          {chatCardEl}
        </div>
      ) : null}
      {chatFullscreen
        ? createPortal(
            <div
              className={`fixed inset-0 z-[3000] isolate flex min-h-0 flex-col overflow-hidden p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pr-[max(0.75rem,env(safe-area-inset-right))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] sm:p-5 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                fsOverlayEntered
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-[0.97] motion-reduce:opacity-100 motion-reduce:scale-100"
              }`}
              style={{
                backgroundColor: "var(--dashboard-bg)",
                transformOrigin: "50% 42%",
              }}
              onTransitionEnd={onFullscreenOverlayTransitionEnd}
            >
              {chatCardEl}
            </div>,
            document.body,
          )
        : null}

      {resetDialogOpen ? (
        <div
          className="fixed inset-0 z-[5000] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="account-ai-new-chat-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            aria-label="閉じる"
            onClick={() => {
              setResetDialogOpen(false);
              setResetSkipConfirmNext(false);
            }}
          />
          <div
            className="relative z-10 w-full max-w-md rounded-2xl border p-5 shadow-xl sm:p-6"
            style={{
              backgroundColor: "var(--dashboard-card)",
              borderColor: "var(--account-ui-border)",
            }}
          >
            <h2
              id="account-ai-new-chat-title"
              className="font-heading-ja text-lg font-semibold"
              style={{ color: "var(--dashboard-text)" }}
            >
              新しいチャット
            </h2>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--dashboard-text)" }}>
              チャット内容は保存されません。
            </p>
            <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={resetSkipConfirmNext}
                onChange={(e) => setResetSkipConfirmNext(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border"
                style={{ borderColor: "var(--dashboard-border)" }}
              />
              <span style={{ color: "var(--dashboard-text-muted)" }}>次回以降はこのメッセージを表示しない。</span>
            </label>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
                style={{
                  borderColor: "var(--dashboard-border)",
                  backgroundColor: "var(--dashboard-bg)",
                  color: "var(--dashboard-text)",
                }}
                onClick={() => {
                  setResetDialogOpen(false);
                  setResetSkipConfirmNext(false);
                }}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--account-send-bg, #3b82f6)" }}
                onClick={confirmNewChat}
              >
                続行
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
