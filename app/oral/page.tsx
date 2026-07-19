"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ChevronRight, CircleHelp, Lightbulb, Send, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import {
  buildAssessmentFromEvaluations,
  type OralAssessment,
  type OralEvaluation,
  type OralMode,
} from "@/lib/oral-exam";
import { useAuth } from "../components/AuthProvider";
import ProtectedAppShell from "../components/ProtectedAppShell";
import AssessmentCard from "./AssessmentCard";

type PublicQuestion = {
  id: string;
  acsArea: string;
  acsCode: string;
  topic: string;
  prompt: string;
  hint: string;
  reference: string;
};

type SessionEntry = {
  question: PublicQuestion;
  answer: string;
  evaluation: OralEvaluation;
};

type SavedSession = {
  screen: "select" | "exam" | "results";
  mode: OralMode;
  questionCount: number;
  questions: PublicQuestion[];
  entries: SessionEntry[];
  sessionKey: string;
  aircraftModel: string;
  assessment: OralAssessment | null;
};

const modeInfo: Record<OralMode, { label: string; description: string }> = {
  beginner: {
    label: "Guided practice",
    description: "Hints are available and feedback explains the most important correction after each answer.",
  },
  intermediate: {
    label: "Standard practice",
    description: "A balanced ACS review with concise feedback and one clarifying follow-up when useful.",
  },
  checkride: {
    label: "Checkride simulation",
    description: "No hints or answer feedback during the session. Review the complete scorecard at the end.",
  },
};

function verdictLabel(verdict: OralEvaluation["verdict"]) {
  return ({ strong: "Strong", acceptable: "Acceptable", partial: "Needs detail", incorrect: "Review needed" })[verdict];
}

function OralPageContent() {
  const { user } = useAuth();
  const [screen, setScreen] = useState<SavedSession["screen"]>("select");
  const [mode, setMode] = useState<OralMode>("intermediate");
  const [questionCount, setQuestionCount] = useState(10);
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [entries, setEntries] = useState<SessionEntry[]>([]);
  const [sessionKey, setSessionKey] = useState("");
  const [aircraftModel, setAircraftModel] = useState("your preferred aircraft");
  const [assessment, setAssessment] = useState<OralAssessment | null>(null);
  const [input, setInput] = useState("");
  const [originalAnswer, setOriginalAnswer] = useState<string | null>(null);
  const [followUpQuestion, setFollowUpQuestion] = useState<string | null>(null);
  const [hintVisible, setHintVisible] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [restored, setRestored] = useState(false);

  const currentQuestion = questions[entries.length];
  const progress = questions.length ? (entries.length / questions.length) * 100 : 0;

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("oral_session_v2");
      if (raw) {
        const saved = JSON.parse(raw) as SavedSession;
        setScreen(saved.screen);
        setMode(saved.mode);
        setQuestionCount(saved.questionCount);
        setQuestions(saved.questions ?? []);
        setEntries(saved.entries ?? []);
        setSessionKey(saved.sessionKey ?? "");
        setAircraftModel(saved.aircraftModel ?? "your preferred aircraft");
        setAssessment(saved.assessment ?? null);
      }
    } catch {
      sessionStorage.removeItem("oral_session_v2");
    }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    const saved: SavedSession = {
      screen, mode, questionCount, questions, entries, sessionKey, aircraftModel, assessment,
    };
    sessionStorage.setItem("oral_session_v2", JSON.stringify(saved));
  }, [restored, screen, mode, questionCount, questions, entries, sessionKey, aircraftModel, assessment]);

  const latestEntry = entries.at(-1);
  const shownFeedback = useMemo(() => {
    if (!latestEntry || mode === "checkride" || !feedbackVisible) return null;
    return latestEntry.evaluation;
  }, [feedbackVisible, latestEntry, mode]);

  async function postExam(body: object) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "The oral examiner could not respond.");
    return data;
  }

  async function startSession() {
    const nextSessionKey = crypto.randomUUID();
    setIsLoading(true);
    setError("");
    try {
      const data = await postExam({ action: "start", mode, questionCount, sessionKey: nextSessionKey });
      setSessionKey(nextSessionKey);
      setQuestions(data.questions);
      setEntries([]);
      setAircraftModel(data.aircraftModel);
      setAssessment(null);
      setScreen("exam");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The session could not start.");
    } finally {
      setIsLoading(false);
    }
  }

  async function saveCompletedSession(finalEntries: SessionEntry[], finalAssessment: OralAssessment) {
    const { error: saveError } = await supabase.from("oral_sessions").upsert({
      user_id: user.id,
      session_key: sessionKey,
      mode,
      question_count: questions.length,
      transcript: finalEntries,
      summary: finalAssessment.summary,
      overall_score: finalAssessment.overallScore,
      readiness: finalAssessment.readiness,
      assessment: finalAssessment,
      aircraft_model: aircraftModel,
      acs_version: "FAA-S-ACS-6C",
    }, { onConflict: "session_key" });
    if (saveError) throw saveError;
  }

  async function recordEvaluation(evaluation: OralEvaluation, displayedAnswer: string) {
    if (!currentQuestion) return;
    const finalEntries = [...entries, { question: currentQuestion, answer: displayedAnswer, evaluation }];
    setEntries(finalEntries);
    setInput("");
    setOriginalAnswer(null);
    setFollowUpQuestion(null);
    setHintVisible(false);

    if (finalEntries.length === questions.length) {
      const finalAssessment = buildAssessmentFromEvaluations(finalEntries.map((entry) => entry.evaluation));
      setAssessment(finalAssessment);
      await saveCompletedSession(finalEntries, finalAssessment);
      setScreen("results");
      return;
    }

    setFeedbackVisible(mode !== "checkride");
  }

  async function submitAnswer() {
    const answer = input.trim();
    if (!answer || !currentQuestion || isLoading) return;
    setIsLoading(true);
    setError("");
    try {
      const data = await postExam({
        action: "evaluate",
        mode,
        sessionKey,
        questionId: currentQuestion.id,
        answer,
        previousAnswer: originalAnswer,
        followUpQuestion,
        attempt: followUpQuestion ? 1 : 0,
      });
      const evaluation = data.evaluation as OralEvaluation;
      if (evaluation.needsFollowUp && evaluation.followUpQuestion && !followUpQuestion) {
        setOriginalAnswer(answer);
        setFollowUpQuestion(evaluation.followUpQuestion);
        setInput("");
      } else {
        const displayedAnswer = originalAnswer ? `${originalAnswer}\nFollow-up: ${answer}` : answer;
        await recordEvaluation(evaluation, displayedAnswer);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your answer could not be scored.");
    } finally {
      setIsLoading(false);
    }
  }

  async function markUnknown() {
    if (!currentQuestion || isLoading) return;
    setIsLoading(true);
    setError("");
    try {
      const data = await postExam({ action: "unknown", mode, sessionKey, questionId: currentQuestion.id });
      await recordEvaluation(data.evaluation as OralEvaluation, "I don't know");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The answer could not be recorded.");
    } finally {
      setIsLoading(false);
    }
  }

  function continueAfterFeedback() {
    setFeedbackVisible(false);
  }

  function resetSession() {
    sessionStorage.removeItem("oral_session_v2");
    setScreen("select");
    setQuestions([]);
    setEntries([]);
    setAssessment(null);
    setSessionKey("");
    setInput("");
    setOriginalAnswer(null);
    setFollowUpQuestion(null);
    setFeedbackVisible(false);
    setError("");
  }

  if (screen === "select") {
    return (
      <div className="mx-auto min-h-screen max-w-5xl px-5 py-8 sm:px-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
          <ArrowLeft size={16} /> Dashboard
        </Link>
        <div className="mt-8 max-w-2xl">
          <p className="text-xs font-bold uppercase text-slate-500">FAA-S-ACS-6C practice</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">AI oral examiner</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
            Rehearse scenario-based questions mapped to the Private Pilot Airplane ACS. Your answers are scored against a defined rubric and used to focus future sessions.
          </p>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {(Object.keys(modeInfo) as OralMode[]).map((option) => {
            const selected = option === mode;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setMode(option)}
                className={`min-h-40 rounded-lg border p-5 text-left transition ${selected ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-900 hover:border-slate-400"}`}
              >
                <span className="flex items-center justify-between text-sm font-bold">
                  {modeInfo[option].label}
                  {selected && <Check size={17} />}
                </span>
                <span className={`mt-3 block text-sm leading-6 ${selected ? "text-slate-300" : "text-slate-500"}`}>{modeInfo[option].description}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 max-w-2xl rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <label htmlFor="question-count" className="text-sm font-bold text-slate-800">Session length</label>
            <span className="text-sm font-bold text-slate-950">{questionCount} questions</span>
          </div>
          <input id="question-count" type="range" min="5" max="30" value={questionCount} onChange={(event) => setQuestionCount(Number(event.target.value))} className="mt-4 w-full accent-slate-950" />
          <button type="button" onClick={startSession} disabled={isLoading} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
            {isLoading ? "Preparing your ACS session..." : "Begin oral practice"}<ChevronRight size={17} />
          </button>
          {error && <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}
        </div>
      </div>
    );
  }

  if (screen === "results" && assessment) {
    return (
      <div className="mx-auto min-h-screen max-w-5xl px-5 py-8 sm:px-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"><ArrowLeft size={16} /> Dashboard</Link>
            <p className="mt-6 text-xs font-bold uppercase text-slate-500">{aircraftModel} · FAA-S-ACS-6C</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-950">Oral practice scorecard</h1>
          </div>
          <button type="button" onClick={resetSession} className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800">Start another session</button>
        </div>
        <AssessmentCard assessment={assessment} />
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/dashboard" aria-label="Return to dashboard" title="Dashboard" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-950"><ArrowLeft size={18} /></Link>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-950">AI oral examiner</p>
              <p className="truncate text-xs text-slate-500">{aircraftModel} · {modeInfo[mode].label}</p>
            </div>
          </div>
          <button type="button" onClick={resetSession} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-950" aria-label="End session" title="End session"><X size={18} /></button>
        </div>
      </header>

      <div className="h-1 bg-slate-200"><div className="h-full bg-slate-950 transition-all" style={{ width: `${progress}%` }} /></div>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-slate-950 px-2 py-1 text-xs font-bold text-white">{currentQuestion.acsCode}</span>
            <span className="text-xs font-semibold text-slate-500">{currentQuestion.topic}</span>
          </div>
          <span className="text-xs font-semibold text-slate-500">Question {entries.length + 1} of {questions.length}</span>
        </div>

        <section className="mt-5 border-y border-slate-200 py-7 sm:py-9" aria-labelledby="oral-question">
          <p className="text-xs font-bold uppercase text-slate-500">Examiner</p>
          <h1 id="oral-question" className="mt-3 max-w-3xl text-xl font-semibold leading-8 text-slate-950 sm:text-2xl sm:leading-9">
            {followUpQuestion ?? currentQuestion.prompt}
          </h1>
          {followUpQuestion && <p className="mt-4 text-sm leading-6 text-slate-500">Your original answer: {originalAnswer}</p>}
          {hintVisible && !followUpQuestion && (
            <div className="mt-5 flex max-w-2xl gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              <Lightbulb className="mt-0.5 shrink-0" size={17} /><p><strong>Think about:</strong> {currentQuestion.hint}</p>
            </div>
          )}
        </section>

        {shownFeedback ? (
          <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5" aria-live="polite">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-slate-950">{verdictLabel(shownFeedback.verdict)}</p>
              <span className="text-sm font-bold text-slate-700">{shownFeedback.score}/100</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{shownFeedback.feedback}</p>
            {shownFeedback.missing.length > 0 && <p className="mt-3 text-xs leading-5 text-slate-500"><strong className="text-slate-700">Study next:</strong> {shownFeedback.missing[0]}</p>}
            <button type="button" onClick={continueAfterFeedback} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800">Next question <ChevronRight size={16} /></button>
          </section>
        ) : (
          <div className="mt-auto pt-8">
            <label htmlFor="oral-answer" className="text-sm font-bold text-slate-800">Your answer</label>
            <textarea
              id="oral-answer"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submitAnswer(); } }}
              rows={4}
              placeholder="Explain your decision and reasoning..."
              className="mt-2 w-full resize-none rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {mode !== "checkride" && !followUpQuestion && <button type="button" onClick={() => setHintVisible(true)} disabled={hintVisible || isLoading} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"><Lightbulb size={16} /> Hint</button>}
                <button type="button" onClick={markUnknown} disabled={isLoading} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"><CircleHelp size={16} /> I don&apos;t know</button>
              </div>
              <button type="button" onClick={submitAnswer} disabled={!input.trim() || isLoading} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40">{isLoading ? "Scoring..." : "Submit answer"}<Send size={16} /></button>
            </div>
            {error && <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p>}
            <p className="mt-5 text-center text-xs text-slate-400">Practice only. Verify aircraft-specific information with the applicable POH or AFM.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function OralPage() {
  return <ProtectedAppShell focus><OralPageContent /></ProtectedAppShell>;
}
