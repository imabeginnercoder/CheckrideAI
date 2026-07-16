"use client";

import Image from "next/image";
import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "../components/AuthProvider";
import ProtectedAppShell from "../components/ProtectedAppShell";

type Question = {
  id: string;
  category: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_answer: string;
  explanation: string;
  image_url: string | null;
};

function PracticeQuizContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const practiceSessionKey = `practice_session:${user.id}`;
  const sessionRestoredRef = useRef(false);
  const handledParamsRef = useRef("");
  const [screen, setScreen] = useState<"select" | "quiz" | "results">("select");
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [questionCount, setQuestionCount] = useState(20);
  const [optionOrders, setOptionOrders] = useState<Record<number, ("option_a" | "option_b" | "option_c")[]>>({});

  // Restore session from sessionStorage after mount (client-only)
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = sessionStorage.getItem(practiceSessionKey);
        if (raw) {
          const s = JSON.parse(raw);
          if (s.screen) setScreen(s.screen);
          if (s.selectedCategories) setSelectedCategories(s.selectedCategories);
          if (s.questions) setQuestions(s.questions);
          if (s.currentIndex !== undefined) setCurrentIndex(s.currentIndex);
          if (s.answers) setAnswers(s.answers);
          if (s.score !== undefined) setScore(s.score);
          if (s.questionCount) setQuestionCount(s.questionCount);
          if (s.optionOrders) setOptionOrders(s.optionOrders);
        }
      } catch { /* ignore */ }
      sessionRestoredRef.current = true;
    });
  }, [practiceSessionKey]);

  // Persist session state to sessionStorage whenever it changes
  useEffect(() => {
    if (!sessionRestoredRef.current) return;
    sessionStorage.setItem(practiceSessionKey, JSON.stringify({
      screen, selectedCategories, questions, currentIndex, answers, score, questionCount, optionOrders,
    }));
  }, [practiceSessionKey, screen, selectedCategories, questions, currentIndex, answers, score, questionCount, optionOrders]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from("questions").select("category");
      if (error) { console.error(error); return; }
      const unique = [...new Set(data.map((q) => q.category))];
      setCategories(unique);
      setLoading(false);
    };
    fetchCategories();
  }, []);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const startQuiz = useCallback(async (overrideCategories?: string[]) => {
    const cats = overrideCategories ?? selectedCategories;
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .in("category", cats);
    if (error || !data || data.length === 0) { console.error(error); return; }
    const shuffled = data.sort(() => Math.random() - 0.5).slice(0, questionCount);
    setQuestions(shuffled);

    // Builds a shuffled option order for each question
    const orders: Record<number, ("option_a" | "option_b" | "option_c")[]> = {};
    shuffled.forEach((_, i) => {
      orders[i] = (["option_a", "option_b", "option_c"] as const)
        .slice()
        .sort(() => Math.random() - 0.5);
    });
    setOptionOrders(orders);
    setCurrentIndex(0);
    setAnswers({});
    setScore(0);
    setScreen("quiz");
  }, [selectedCategories, questionCount]);

  // Handle URL params: ?categories=X,Y&autostart=true
  useEffect(() => {
    const cats = searchParams.get("categories");
    const autostart = searchParams.get("autostart");
    const paramsKey = searchParams.toString();
    if (cats && handledParamsRef.current !== paramsKey) {
      handledParamsRef.current = paramsKey;
      const parsed = cats.split(",").map((c) => c.trim()).filter(Boolean);
      queueMicrotask(() => {
        if (autostart === "true") {
          sessionStorage.removeItem(practiceSessionKey);
          setScreen("select");
        }
        setSelectedCategories(parsed);
        if (autostart === "true") void startQuiz(parsed);
      });
    }
  }, [practiceSessionKey, searchParams, startQuiz]);

  const handleAnswer = (answer: string) => {
    if (answers[currentIndex] !== undefined) return;
    setAnswers((prev) => ({ ...prev, [currentIndex]: answer }));
  };

  const handleFinish = async () => {
    const finalScore = questions.reduce((acc, q, i) => {
      return answers[i] === q.correct_answer ? acc + 1 : acc;
    }, 0);
    setScore(finalScore);
    setScreen("results");
    setIsSaving(true);

    const sessionId = `session_${Date.now()}`;

    const { error: scoreError } = await supabase
      .from("quiz_scores")
      .insert([{
        score: finalScore,
        total_questions: questions.length,
        category: selectedCategories.join(", "),
        user_id: user.id,
    }]);
    if (scoreError) console.error(scoreError);

    const questionResults = questions.map((q, i) => ({
      question_id: q.id,
      category: q.category,
      correct: answers[i] === q.correct_answer,
      session_id: sessionId,
      user_id: user.id,
    }));

    const { error: resultsError } = await supabase
      .from("question_results")
      .insert(questionResults);
    if (resultsError) console.error(resultsError);

    setIsSaving(false);
  };

  const question = questions[currentIndex];
  const selectedAnswer = answers[currentIndex];
  const isCorrect = selectedAnswer === question?.correct_answer;
  const isLast = currentIndex === questions.length - 1;
  const allAnswered = questions.length > 0 && Object.keys(answers).length === questions.length;

  // Category Selection Screen
  if (screen === "select") {
    const allSelected = selectedCategories.length === categories.length;
    const estimatedMinutes = Math.round(questionCount * 0.75);

    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-slate-900">Practice Questions</h1>
          <p className="text-slate-500 mt-0.5 text-sm">Pick which categories you want to practice.</p>
        </div>

        <div className="bg-white p-6 rounded-xl w-full max-w-2xl border border-slate-200">

          {loading ? (
            <p className="text-slate-400">Loading categories...</p>
          ) : (
            <>
              {/* Select All */}
              <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all mb-3 ${
                allSelected ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-indigo-300"
              }`}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() =>
                    allSelected
                      ? setSelectedCategories([])
                      : setSelectedCategories([...categories])
                  }
                  className="w-5 h-5 accent-indigo-600"
                />
                <span className="font-bold text-slate-700">Select All Categories</span>
              </label>

              <div className="flex flex-col space-y-3 mb-8">
                {categories.map((cat) => (
                  <label
                    key={cat}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedCategories.includes(cat)
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 hover:border-indigo-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                      className="w-5 h-5 accent-indigo-600"
                    />
                    <span className="font-semibold text-slate-700">{cat}</span>
                  </label>
                ))}
              </div>
            </>
          )}

          {/* Question Count Slider */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-slate-700">Number of Questions</label>
              <span className="text-sm font-semibold text-indigo-600">
                {questionCount} questions (~{estimatedMinutes} min)
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={100}
              step={1}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>5</span>
              <span>100</span>
            </div>
          </div>

          <button
            onClick={() => startQuiz()}
            disabled={selectedCategories.length === 0}
            className="w-full bg-slate-950 text-white font-semibold py-3 rounded-xl hover:bg-slate-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Start Practice Set
          </button>
        </div>
      </div>
    );
  }

  // Results Screen
  if (screen === "results") {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-slate-900">Practice Complete</h1>
          <p className="text-slate-500 mt-0.5 text-sm">Review your score and choose what to do next.</p>
        </div>

        <div className="bg-white p-8 rounded-xl text-center border border-slate-200 w-full max-w-md">
          <div className="my-8">
            <span className="text-6xl font-black text-indigo-600">{score}</span>
            <span className="text-2xl text-slate-400 font-bold"> / {questions.length}</span>
          </div>
          {isSaving ? (
            <p className="text-sm font-bold text-amber-500 animate-pulse mb-6">Saving score...</p>
          ) : (
            <p className="text-sm font-bold text-green-500 mb-6">Score saved!</p>
          )}
          <button
            onClick={() => { sessionStorage.removeItem(practiceSessionKey); setScreen("select"); setQuestions([]); setAnswers({}); setCurrentIndex(0); setScore(0); }}
            className="w-full bg-slate-950 text-white px-6 py-3 rounded-xl hover:bg-slate-800 font-semibold transition"
          >
            Practice Again
          </button>
        </div>
      </div>
    );
  }

  // Quiz Screen
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* Question Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Questions</p>
          <p className="text-sm text-slate-500 mt-1">
            {Object.keys(answers).length} of {questions.length} answered
          </p>
        </div>
        <div className="overflow-y-auto flex-1">
          {questions.map((q, i) => {
            const answered = answers[i] !== undefined;
            const correct = answers[i] === q.correct_answer;
            const isCurrent = i === currentIndex;

            let statusStyle = "border-slate-200 text-slate-500";
            if (isCurrent) statusStyle = "border-blue-500 bg-blue-50 text-blue-900";
            else if (answered && correct) statusStyle = "border-green-400 bg-green-50 text-green-800";
            else if (answered && !correct) statusStyle = "border-rose-400 bg-rose-50 text-rose-800";

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(i)}
                className={`w-full text-left p-3 border-l-4 transition-all hover:bg-slate-50 ${statusStyle}`}
              >
                <p className="text-xs font-bold mb-1">Q{i + 1} · {q.category}</p>
                <p className="text-xs leading-relaxed line-clamp-2 text-slate-500">
                  {q.question_text}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Quiz Area */}
      <div className="flex-1 overflow-y-auto p-10">
        <div className="w-full max-w-3xl mx-auto">

          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Practice Questions</h1>
              <p className="text-slate-500 mt-0.5 text-sm">{selectedCategories.join(", ")}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { window.location.href = "/dashboard"; }}
                className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
              >
                Save & Quit
              </button>
              <div className="bg-white px-4 py-2 rounded-lg border border-slate-200">
                <span className="text-slate-600 font-bold text-sm">
                  Question {currentIndex + 1} of {questions.length}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-xl w-full border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>

            <span className="ml-4 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider rounded-full">
              {question.category}
            </span>
            
            {question.image_url && (
                <div className="ml-4 mt-4 mb-6">
                  <Image
                    src={question.image_url}
                    alt="Question reference image"
                    width={900}
                    height={500}
                    unoptimized
                    className="rounded-xl border border-slate-200 max-w-full max-h-96 object-contain"
                  />
                </div>
            )}

            <h2 className="ml-4 text-2xl font-semibold mt-4 mb-8 text-slate-800 leading-relaxed">
              {question.question_text}
            </h2>

            <div className="ml-4 flex flex-col space-y-4">
              {(optionOrders[currentIndex] ?? ["option_a", "option_b", "option_c"]).map((opt, i) => {
                const label = ["A", "B", "C"][i];
                const isSelected = selectedAnswer === opt;
                const isRight = opt === question.correct_answer;
                let style = "border-slate-200 hover:border-indigo-300 text-slate-700 hover:bg-slate-50";
                if (selectedAnswer !== undefined) {
                  if (isRight) style = "border-green-500 bg-green-50 text-green-900";
                  else if (isSelected) style = "border-rose-500 bg-rose-50 text-rose-900";
                  else style = "border-slate-200 text-slate-400";
                }
                return (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(opt)}
                    disabled={selectedAnswer !== undefined}
                    className={`p-5 border-2 rounded-xl text-left transition-all font-medium ${style}`}
                  >
                    <span className="font-bold mr-2 text-slate-400">{label})</span>
                    {question[opt]}
                </button>
               );
              })}
            </div>

            {selectedAnswer !== undefined && (
              <div className="ml-4 mt-8">
                <div className={`p-6 rounded-xl ${isCorrect ? "bg-emerald-50 border border-emerald-200" : "bg-rose-50 border border-rose-200"}`}>
                  <h3 className={`font-extrabold text-lg ${isCorrect ? "text-emerald-700" : "text-rose-700"}`}>
                    {isCorrect ? "✓ Correct!" : "✗ Incorrect."}
                  </h3>
                  <p className={`mt-2 font-medium leading-relaxed ${isCorrect ? "text-emerald-900" : "text-rose-900"}`}>
                    {question.explanation}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <button
              onClick={() => setCurrentIndex((i) => i - 1)}
              disabled={currentIndex === 0}
              className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:border-indigo-300 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>

            <div className="flex gap-3">
              {allAnswered && (
                <button
                  onClick={handleFinish}
                  className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition"
                >
                  Finish & Save Score ✓
                </button>
              )}
              <button
                onClick={() => setCurrentIndex((i) => i + 1)}
                disabled={isLast}
                className="px-6 py-3 bg-slate-950 text-white font-semibold rounded-xl hover:bg-slate-800 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next Question ➔
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function PracticeQuiz() {
  return (
    <ProtectedAppShell>
      <Suspense fallback={<div className="p-8 text-sm text-slate-400">Loading practice setup...</div>}>
        <PracticeQuizContent />
      </Suspense>
    </ProtectedAppShell>
  );
}
