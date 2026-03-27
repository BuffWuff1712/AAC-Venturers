"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { Card } from "../components/Card";
import { useChildSession } from "../context/ChildSessionContext";

export function ChildConversationView() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId;
  const { sessionSnapshot, setSessionSnapshot } = useChildSession();
  const [messages, setMessages] = useState(sessionSnapshot.messages || []);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    if (!messages.length && sessionId) {
      api.getSession(sessionId).then((session) => {
        const nextMessages = session.transcripts.map((item) => ({
          speaker: item.speaker === "child" ? "child" : "assistant",
          message: item.message,
          action: item.action,
        }));
        setMessages(nextMessages);
        setSessionSnapshot((current) => ({
          ...current,
          state: {
            sessionId: session.id,
            status: session.status,
            objectiveCompleted: session.objectiveCompleted,
            selectedItem: session.selectedItem,
            selectedCustomizations: session.selectedCustomizations,
            hintsUsed: session.hintsUsed,
            clarificationCount: session.clarificationCount,
            averageResponseTimeMs: Math.round(session.averageResponseTimeMs || 0),
          },
        }));
      });
    }
  }, [messages.length, sessionId, setSessionSnapshot]);

  function speakMessage(text) {
    if (!("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }

  async function handleSend(event) {
    event.preventDefault();
    if (!draft.trim() || sending) return;

    setError("");
    const childMessage = { speaker: "child", message: draft.trim() };
    const previousMessages = messages;
    const optimisticMessages = [...messages, childMessage];
    setMessages(optimisticMessages);
    setDraft("");
    setSending(true);

    try {
      const result = await api.respondToConversation({
        sessionId: Number(sessionId),
        childInput: childMessage.message,
      });

      const assistantMessage = {
        speaker: "assistant",
        message: result.replyText,
        action: result.replyType,
      };

      const nextMessages = [...optimisticMessages, assistantMessage];
      setMessages(nextMessages);
      setSessionSnapshot((current) => ({
        ...current,
        messages: nextMessages,
        state: result.state,
        orderSummary: {
          item: result.state?.selectedItem || "",
          customizations: result.state?.selectedCustomizations || [],
        },
      }));

      if (result.sessionComplete) {
        router.push(`/child/completion/${sessionId}`);
      }
    } catch (requestError) {
      setError(requestError.message);
      setMessages(previousMessages);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr,1.15fr]">
      <Card className="bg-white/95">
        <p className="text-sm uppercase tracking-[0.3em] text-coral">Conversation Goal</p>
        <h2 className="mt-3 text-3xl font-semibold text-ink">Order lunch clearly</h2>
        <p className="mt-3 text-slate-600">
          Try asking for one menu item and any changes you want, like chilli on the side.
        </p>
        <div className="mt-6 rounded-[24px] bg-slate-100 p-5">
          <p className="text-sm font-medium text-slate-700">Helpful prompt</p>
          <p className="mt-2 text-sm text-slate-500">
            You can type: I want Chicken Chop with no coleslaw and chilli on the side.
          </p>
        </div>
        <div className="mt-4 rounded-[24px] bg-sand p-5">
          <p className="text-sm font-medium text-slate-700">Live progress</p>
          <p className="mt-2 text-sm text-slate-600">
            Selected item:{" "}
            {sessionSnapshot.orderSummary?.item || sessionSnapshot.state?.selectedItem || "Not chosen yet"}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Hints used: {sessionSnapshot.state?.hintsUsed || 0} | Clarifications:{" "}
            {sessionSnapshot.state?.clarificationCount || 0}
          </p>
        </div>
      </Card>

      <Card className="flex min-h-[560px] flex-col bg-white/95">
        <div className="flex-1 space-y-4 overflow-y-auto rounded-[24px] bg-slate-50 p-4">
          {messages.map((message, index) => (
            <div
              key={`${message.speaker}-${index}`}
              className={`flex ${message.speaker === "assistant" ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[85%] rounded-[24px] px-4 py-3 text-sm ${
                  message.speaker === "assistant"
                    ? "bg-slate-900 text-white"
                    : "bg-coral text-white"
                }`}
              >
                <p>{message.message}</p>
                {message.speaker === "assistant" ? (
                  <button
                    type="button"
                    onClick={() => speakMessage(message.message)}
                    className="mt-3 rounded-full bg-white/10 px-3 py-1 text-xs text-white/90 transition hover:bg-white/20"
                  >
                    Speak
                  </button>
                ) : null}
              </div>
            </div>
          ))}
          {sending ? (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-[24px] bg-slate-200 px-4 py-3 text-sm text-slate-600">
                Stall owner is thinking...
              </div>
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}

        <form className="mt-4 flex gap-3" onSubmit={handleSend}>
          <input
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-coral focus:ring-2"
            placeholder="Type what the child wants to say..."
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <button
            disabled={sending}
            className="rounded-2xl bg-coral px-5 py-3 font-medium text-white disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </Card>
    </div>
  );
}
