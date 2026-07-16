"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import type { OralAssessment, OralMessage, OralMode, OralResponse } from "@/lib/oral-exam";
import { useAuth } from "../components/AuthProvider";
import ProtectedAppShell from "../components/ProtectedAppShell";
import AssessmentCard from "./AssessmentCard";

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
  const [screen, setScreen] = useState<"select" | "chat" | "results">("select");
  const [mode, setMode] = useState<OralMode>("intermediate");
  const [questionCount, setQuestionCount] = useState(10);
  const [messages, setMessages] = useState<OralMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionKey, setSessionKey] = useState("");
  const [assessment, setAssessment] = useState<OralAssessment | null>(null);
  const [aircraftModel, setAircraftModel] = useState("your preferred aircraft");
  const [questionsCompleted, setQuestionsCompleted] = useState(0);
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
          if (s.sessionKey) setSessionKey(s.sessionKey);
          if (s.assessment) setAssessment(s.assessment);
          if (s.aircraftModel) setAircraftModel(s.aircraftModel);
          if (s.questionsCompleted) setQuestionsCompleted(s.questionsCompleted);
        }
      } catch { /* ignore */ }
      sessionRestoredRef.current = true;
    });
  }, []);

  useEffect(() => {
    if (!sessionRestoredRef.current) return;
    sessionStorage.setItem("oral_session", JSON.stringify({
      screen,
      mode,
      questionCount,
      messages,
      sessionKey,
      assessment,
      aircraftModel,
      questionsCompleted,
    }));
  }, [screen, mode, questionCount, messages, sessionKey, assessment, aircraftModel, questionsCompleted]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const saveCompletedSession = async (
    finalMessages: OralMessage[],
    finalAssessment: OralAssessment,
    completedSessionKey: string,
    completedAircraft: string
  ) => {
    const { error: saveError } = await supabase.from("oral_sessions").upsert({
      user_id: user.id,
      session_key: completedSessionKey,
      mode,
      question_count: questionCount,
      transcript: finalMessages,
      summary: finalAssessment.summary,
      overall_score: finalAssessment.overallScore,
      readiness: finalAssessment.readiness,
      assessment: finalAssessment,
      aircraft_model: completedAircraft,
      acs_version: "FAA-S-ACS-6C",
    }, { onConflict: "session_key" });

    if (saveError) throw saveError;
  };

  const callExaminer = async (requestMessages: OralMessage[], activeSessionKey: string) => {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: requestMessages,
        mode,
        questionCount,
        sessionKey: activeSessionKey,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "The AI examiner could not respond.");
    return data as OralResponse & { aircraftModel: string };
  };

  const startSession = async () => {
    const newSessionKey = crypto.randomUUID();
    setSessionKey(newSessionKey);
    setAssessment(null);
    setQuestionsCompleted(0);
    setError("");
    setScreen("chat");
    setIsLoading(true);

    try {
      const openingMessages: OralMessage[] = [{ role: "user", content: "Begin the oral examination." }];
      const data = await callExaminer(openingMessages, newSessionKey);
      setAircraftModel(data.aircraftModel);
      setQuestionsCompleted(data.questionNumber);
      setMessages([
        ...openingMessages,
        { role: "assistant", content: data.reply },
      ]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The session could not start.");
      setScreen("select");
    }

    setIsLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const newMessages: OralMessage[] = [
      ...messages,
      { role: "user", content: input.trim() },
    ];
    setMessages(newMessages);
    setInput("");
    setError("");
    setIsLoading(true);

    try {
      const data = await callExaminer(newMessages, sessionKey);
      const finalMessages: OralMessage[] = [
        ...newMessages,
        { role: "assistant", content: data.reply },
      ];
      setMessages(finalMessages);
      setQuestionsCompleted(data.questionNumber);
      setAircraftModel(data.aircraftModel);
      if (data.completed && data.assessment) {
        setAssessment(data.assessment);
        await saveCompletedSession(finalMessages, data.assessment, sessionKey, data.aircraftModel);
        setScreen("results");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.");
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

    const hintMessages: OralMessage[] = [
      ...messages,
      { role: "user", content: "HINT_REQUESTED" },
    ];
    setMessages((prev) => [
      ...prev,
      { role: "user", content: "Hint requested" },
    ]);
    setError("");
    setIsLoading(true);

    try {
      const data = await callExaminer(hintMessages, sessionKey);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
      setQuestionsCompleted(data.questionNumber);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "A hint could not be generated.");
    }

    setIsLoading(false);
  };

  const resetSession = () => {
    sessionStorage.removeItem("oral_session");
    setMessages([]);
    setInput("");
    setError("");
    setAssessment(null);
    setSessionKey("");
    setQuestionsCompleted(0);
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
            {(Object.keys(modeInfo) as OralMode[]).map((m) => {
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
          {error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        </div>
      </div>
    );
  }

  if (screen === "results" && assessment) {
    return (
      <div className="mx-auto max-w-5xl p-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{aircraftModel} - FAA-S-ACS-6C</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-950">Oral practice scorecard</h1>
          </div>
          <button onClick={resetSession} className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Start another session</button>
        </div>
        <AssessmentCard assessment={assessment} />
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
              <p className="text-xs text-slate-400">{aircraftModel} - Private Pilot ACS - {questionsCompleted}/{questionCount} complete</p>
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
          {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
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
