"use client";

import { useEffect, useRef, useState } from "react";
import { useRole } from "@/context/RoleContext";
import { useChat } from "@/hooks/useChat";
import { ROLE_LABELS } from "@/lib/roles";
import { ChatEmptyState } from "@/components/chat/ChatEmptyState";
import { Composer } from "@/components/chat/Composer";
import {
  AssistantBubble,
  ErrorBubble,
  PendingBubble,
  UserBubble,
} from "@/components/chat/ChatMessages";

export default function ChatPage() {
  const { role } = useRole();
  const { turns, pending, ask, retry } = useChat(role);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.parentElement?.parentElement?.scrollTo({
      top: endRef.current.offsetTop,
      behavior: "smooth",
    });
  }, [turns.length, pending]);

  const submit = () => {
    const q = input;
    setInput("");
    void ask(q);
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-auto px-5 py-8 lg:px-10">
        <div className="mx-auto flex max-w-[860px] flex-col gap-6">
          {turns.length === 0 && !pending && <ChatEmptyState onPick={setInput} />}

          {turns.map((turn, i) => {
            if (turn.kind === "user") return <UserBubble key={i} turn={turn} />;
            if (turn.kind === "assistant") return <AssistantBubble key={i} turn={turn} />;
            return <ErrorBubble key={i} turn={turn} onRetry={retry} />;
          })}

          {pending && <PendingBubble roleLabel={ROLE_LABELS[role]} />}
          <div ref={endRef} />
        </div>
      </div>

      <Composer
        disabled={pending}
        roleLabel={ROLE_LABELS[role]}
        value={input}
        onChange={setInput}
        onSubmit={submit}
      />
    </section>
  );
}
