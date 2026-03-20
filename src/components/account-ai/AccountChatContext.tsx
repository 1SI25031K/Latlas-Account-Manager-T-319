"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { ChatMessagePayload } from "@/lib/account-ai-types";

export type AccountChatContextValue = {
  messages: ChatMessagePayload[];
  setMessages: Dispatch<SetStateAction<ChatMessagePayload[]>>;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
  error: string | null;
  setError: Dispatch<SetStateAction<string | null>>;
};

const AccountChatContext = createContext<AccountChatContextValue | null>(null);

export function AccountChatProvider({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const [messages, setMessages] = useState<ChatMessagePayload[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMessages([]);
    setInput("");
    setError(null);
    setLoading(false);
  }, [userId]);

  const value = useMemo(
    () => ({
      messages,
      setMessages,
      input,
      setInput,
      loading,
      setLoading,
      error,
      setError,
    }),
    [messages, input, loading, error],
  );

  return (
    <AccountChatContext.Provider value={value}>{children}</AccountChatContext.Provider>
  );
}

export function useAccountChat(): AccountChatContextValue {
  const ctx = useContext(AccountChatContext);
  if (!ctx) {
    throw new Error("useAccountChat must be used within AccountChatProvider");
  }
  return ctx;
}
