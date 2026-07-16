"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "../../utils/supabase";
import { useAuth } from "../components/AuthProvider";
import ProtectedAppShell from "../components/ProtectedAppShell";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Mode = "beginner" | "intermediate" | "checkride";

const modeInfo = {
  beginner: {
    label: "Beginner",
    description: "Early in training. Covers fundamentals — basic aerodynamics, primary controls, simple weather, and basic regulations.",
    accentColor: "#16a34a",
    badgeStyle: "bg-green-50 text-green-700",
    borderActive: "border-green-500",
    bgActive: "bg-green-600",
  },
  intermediate: {
    label: "Intermediate",
    description: "More than halfway through training. Covers cross-country planning, weather products, airspace, systems, and performance.",
    accentColor: "#d97706",
    badgeStyle: "bg-amber-50 text-amber-700",
    borderActive: "border-amber-500",
    bgActive: "bg-amber-500",
  },
  checkride: {
    label: "Checkride Ready",
    description: "Final prep before your checkride. Full ACS-level oral covering all required knowledge areas. No hints given.",
    accentColor: "#dc2626",
    badgeStyle: "bg-rose-50 text-rose-700",
    borderActive: "border-rose-500",
    bgActive: "bg-rose-600",
  },
};

function OralPageContent() {
  const { user } = useAuth();
  const [screen, setScreen] = useState<"select" | "chat">("select");
  const [mode, setMode] = useState<Mode>("intermediate");
  const [questionCount, setQuestionCount] = useState(10);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const sessionRestoredRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Restore session from sessionStorage after mount (client-only)
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = sessionStorage.getItem("oral_session");
        if (raw) {
          const s = JSON.parse(raw);
          if (s.screen) setScreen(s.screen);
          if (s.mode) setMode(s.mode);
          if (s.questionCount) setQuestionCount(s.questionCount);
          if (s.messages) setMessages(s.messages);
        }
      } catch { /* ignore */ }
      sessionRestoredRef.current = true;
    });
  }, []);

  useEffect(() => {
    if (!sessionRestoredRef.current) return;
    sessionStorage.setItem("oral_session", JSON.stringify({ screen, mode, questionCount, messages }));
  }, [screen, mode, questionCount, messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const saveCompletedSession = async (finalMessages: Message[]) => {
    const summary = [...finalMessages]
      .reverse()
      .find((msg) => msg.role === "assistant")?.content ?? "";

    await supabase.from("oral_sessions").insert({
      user_id: user.id,
      mode,
      question_count: questionCount,
      transcript: finalMessages,
      summary,
    });
  };

  const startSession = async () => {
    setScreen("chat");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Begin the oral examination." }],
          mode,
          questionCount,
        }),
      });
      const data = await res.json();
      setMessages([
        { role: "user", content: "Begin the oral examination." },
        { role: "assistant", content: data.reply },
      ]);
    } catch (err) {
      console.error(err);
    }

    setIsLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: input.trim() },
    ];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, mode, questionCount }),
      });
      const data = await res.json();
      const finalMessages = [
        ...newMessages,
        { role: "assistant" as const, content: data.reply },
      ];
      setMessages(finalMessages);
      if (data.reply?.includes("That concludes our session")) {
        await saveCompletedSession(finalMessages);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    }

    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const requestHint = async () => {
    if (isLoading) return;

    const hintMessages: Message[] = [
      ...messages,
      { role: "user", content: "HINT_REQUESTED" },
    ];
    setMessages((prev) => [
      ...prev,
      { role: "user", content: "Hint requested" },
    ]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: hintMessages, mode, questionCount }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch (err) {
      console.error(err);
    }

    setIsLoading(false);
  };

  const resetSession = () => {
    sessionStorage.removeItem("oral_session");
    setMessages([]);
    setInput("");
    setScreen("select");
  };

  if (screen === "select") {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-slate-900">Mock Oral AI DPE</h1>
          <p className="text-slate-500 mt-0.5 text-sm">Select a practice mode and session length to begin.</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 w-full max-w-2xl">

          <div className="flex flex-col space-y-2.5 mb-7">
            {(Object.keys(modeInfo) as Mode[]).map((m) => {
              const mi = modeInfo[m];
              const isSelected = mode === m;
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`p-4 border-2 rounded-xl text-left transition-all ${
                    isSelected
                      ? `${mi.bgActive} border-transparent`
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`font-semibold text-sm ${isSelected ? "text-white" : "text-slate-800"}`}>
                      {mi.label}
                    </span>
                    {isSelected && (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8L6.5 11.5L13 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <p className={`text-xs leading-relaxed ${isSelected ? "text-white/85" : "text-slate-500"}`}>
                    {mi.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Question Count Slider */}
          <div className="mb-7">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-slate-700">Number of Questions</label>
              <span className="text-sm font-semibold text-indigo-600">{questionCount}</span>
            </div>
            <input
              type="range"
              min={5}
              max={30}
              step={1}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>5</span>
              <span>30</span>
            </div>
          </div>

          <button
            onClick={startSession}
            className="w-full bg-slate-950 text-white font-semibold py-3 rounded-xl hover:bg-slate-800 transition text-sm"
          >
            Begin Oral Examination
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-3.5 shrink-0">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-sm font-semibold text-slate-900">Mock Oral AI DPE</h1>
              <p className="text-xs text-slate-400">Cessna 172 · Private Pilot ACS · {questionCount} questions</p>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-md ${modeInfo[mode].badgeStyle}`}>
              {modeInfo[mode].label}
            </span>
          </div>
          <button
            onClick={resetSession}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 transition px-3 py-1.5 rounded-lg hover:bg-slate-100"
          >
            End Session
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-7 px-4">
        <div className="max-w-3xl mx-auto space-y-5">
          {messages
            .filter((msg) => msg.content !== "Begin the oral examination.")
            .map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-2xl w-full">
                  <p className={`text-xs font-medium mb-1.5 ${msg.role === "user" ? "text-right text-slate-400" : "text-left text-indigo-600"}`}>
                    {msg.role === "user" ? "You" : "Examiner"}
                  </p>
                  <div className={`px-4 py-3.5 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white ml-auto rounded-tr-sm"
                      : "bg-white text-slate-800 border border-slate-200 rounded-tl-sm"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-2xl w-full">
                <p className="text-xs font-medium mb-1.5 text-indigo-600">Examiner</p>
                <div className="bg-white border border-slate-200 rounded-xl rounded-tl-sm px-4 py-3.5 inline-block">
                  <div className="flex gap-1 items-center h-4">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-slate-200 px-4 py-3.5 shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2.5 items-end">
            {mode !== "checkride" && (
              <button
                onClick={requestHint}
                disabled={isLoading}
                className="bg-slate-100 text-slate-600 font-medium px-4 py-2.5 rounded-xl hover:bg-slate-200 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0 text-sm border border-slate-200"
              >
                Hint
              </button>
            )}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer... (Enter to send, Shift+Enter for new line)"
              rows={2}
              className="flex-1 resize-none border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 transition"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="bg-slate-950 text-white font-medium px-5 py-2.5 rounded-xl hover:bg-slate-800 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0 text-sm"
            >
              Send
            </button>
          </div>
          <p className="text-xs text-slate-400 text-center mt-2.5">
            Practice tool only. Always verify with official FAA publications.
          </p>
        </div>
      </div>

    </div>
  );
}

export default function OralPage() {
  return (
    <ProtectedAppShell>
      <OralPageContent />
    </ProtectedAppShell>
  );
}
