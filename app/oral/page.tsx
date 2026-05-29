"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Mode = "beginner" | "intermediate" | "checkride";

const modeInfo = {
  beginner: {
    label: "Beginner",
    description: "Early in training. Covers fundamentals — basic aerodynamics, primary controls, simple weather, and basic regulations.",
    badge: "bg-emerald-100 text-emerald-700",
    selectedStyle: "border-emerald-500 bg-emerald-500",
  },
  intermediate: {
    label: "Intermediate",
    description: "More than halfway through training. Covers cross country planning, weather products, airspace, systems, and performance.",
    badge: "bg-amber-100 text-amber-700",
    selectedStyle: "border-amber-500 bg-amber-500",
  },
  checkride: {
    label: "Checkride Ready",
    description: "Final prep before your checkride. Full ACS-level oral covering all required knowledge areas. No hints given.",
    badge: "bg-rose-100 text-rose-700",
    selectedStyle: "border-rose-500 bg-rose-500",
  },
};

export default function OralPage() {
  const [screen, setScreen] = useState<"select" | "chat">("select");
  const [mode, setMode] = useState<Mode>("intermediate");
  const [questionCount, setQuestionCount] = useState(10);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
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
      { role: "user", content: "💡 Hint requested" },
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
    setMessages([]);
    setInput("");
    setScreen("select");
  };

  if (screen === "select") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-10">
        <div className="bg-white p-10 rounded-2xl shadow-lg w-full max-w-xl border border-slate-100">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Mock Oral AI DPE</h1>
          <p className="text-slate-500 mb-8">Select a practice mode and session length to begin.</p>

          <div className="flex flex-col space-y-3 mb-8">
            {(Object.keys(modeInfo) as Mode[]).map((m) => {
              const mi = modeInfo[m];
              const isSelected = mode === m;
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`p-5 border-2 rounded-xl text-left transition-all ${
                    isSelected
                      ? `${mi.selectedStyle} text-white border-transparent`
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-extrabold text-base ${isSelected ? "text-white" : "text-slate-800"}`}>
                      {mi.label}
                    </span>
                    {isSelected && <span className="text-white text-sm">✓</span>}
                  </div>
                  <p className={`text-sm leading-relaxed ${isSelected ? "text-white opacity-90" : "text-slate-500"}`}>
                    {mi.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Question Count Slider */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-slate-700">Number of Questions</label>
              <span className="text-sm font-bold text-blue-600">{questionCount}</span>
            </div>
            <input
              type="range"
              min={5}
              max={30}
              step={1}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>5</span>
              <span>30</span>
            </div>
          </div>

          <button
            onClick={startSession}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition shadow-md"
          >
            Begin Oral Examination
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-lg font-extrabold text-slate-900">Mock Oral AI DPE</h1>
              <p className="text-xs text-slate-400">Cessna 172 · Private Pilot ACS · {questionCount} questions</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${modeInfo[mode].badge}`}>
              {modeInfo[mode].label}
            </span>
          </div>
          <button
            onClick={resetSession}
            className="text-sm font-bold text-slate-500 hover:text-slate-800 transition px-4 py-2 rounded-lg hover:bg-slate-100"
          >
            End Session
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-8 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages
            .filter((msg) => msg.content !== "Begin the oral examination.")
            .map((msg, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className={`w-full ${msg.role === "user" ? "flex justify-end" : "flex justify-start"}`}>
                  <div className={`max-w-2xl w-full`}>
                    <p className={`text-xs font-bold mb-1 ${msg.role === "user" ? "text-right text-slate-400" : "text-left text-blue-600"}`}>
                      {msg.role === "user" ? "You" : "Examiner"}
                    </p>
                    <div className={`px-5 py-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-tr-sm ml-auto"
                        : "bg-white text-slate-800 border border-slate-200 rounded-tl-sm shadow-sm"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              </div>
            ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-2xl w-full">
                <p className="text-xs font-bold mb-1 text-blue-600">Examiner</p>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm inline-block">
                  <div className="flex gap-1 items-center h-4">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-slate-200 px-4 py-4 shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3 items-end">
            {mode !== "checkride" && (
              <button
                onClick={requestHint}
                disabled={isLoading}
                className="bg-slate-100 text-slate-600 font-bold px-4 py-3 rounded-xl hover:bg-slate-200 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0 text-sm border-2 border-slate-200"
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
              className="flex-1 resize-none border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-blue-400 transition"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md shrink-0"
            >
              Send
            </button>
          </div>
          <p className="text-xs text-slate-400 text-center mt-3">
            This is a practice tool. Always verify answers with official FAA publications.
          </p>
        </div>
      </div>

    </div>
  );
}