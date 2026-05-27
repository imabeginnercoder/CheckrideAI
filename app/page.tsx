"use client";

import { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";

type ScoreRow = {
  id: number;
  created_at: string;
  score: number;
  total_questions: number;
  category: string;
};

function AnimatedDial({ percentage, label, color, count }: {
  percentage: number;
  label: string;
  color: string;
  count: number;
}) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(t);
  }, []);

  const r = 54;
  const cx = 70;
  const cy = 75;
  const circumference = 2 * Math.PI * r;
  const trackLength = circumference * 0.75;
  const fillLength = animated ? trackLength * (percentage / 100) : 0;

  return (
    <div className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-lg border border-slate-100 flex-1">
      <svg width="140" height="130" viewBox="0 0 140 130">
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth="10"
          strokeDasharray={`${trackLength} ${circumference - trackLength}`}
          strokeLinecap="round"
          style={{ transform: "rotate(135deg)", transformOrigin: `${cx}px ${cy}px` }}
        />
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={`${fillLength} ${circumference}`}
          strokeLinecap="round"
          style={{
            transform: "rotate(135deg)",
            transformOrigin: `${cx}px ${cy}px`,
            transition: "stroke-dasharray 1.5s cubic-bezier(0.4, 0, 0.2, 1)"
          }}
        />
        <text x={cx} y={cy - 4} textAnchor="middle" style={{ fontSize: "24px", fontWeight: "800", fill: "#1e293b" }}>
          {count === 0 ? "--" : `${Math.round(percentage)}%`}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" style={{ fontSize: "11px", fill: "#94a3b8", fontWeight: "600" }}>
          {count === 0 ? "no data yet" : "avg score"}
        </text>
      </svg>
      <p className="text-sm font-bold text-slate-700 mt-2">{label}</p>
      <p className="text-xs text-slate-400 mt-1">{count} session{count !== 1 ? "s" : ""}</p>
    </div>
  );
}

export default function Dashboard() {
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScores = async () => {
      const { data, error } = await supabase
        .from("quiz_scores")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) { console.error(error); return; }
      setScores(data || []);
      setLoading(false);
    };
    fetchScores();
  }, []);

  const practiceScores = scores.filter(s => s.category !== "Practice Exam" && s.category !== "Test Run");
  const examScores = scores.filter(s => s.category === "Practice Exam");

  const avgPractice = practiceScores.length > 0
    ? practiceScores.reduce((acc, s) => acc + (s.score / s.total_questions) * 100, 0) / practiceScores.length
    : 0;

  const avgExam = examScores.length > 0
    ? examScores.reduce((acc, s) => acc + (s.score / s.total_questions) * 100, 0) / examScores.length
    : 0;

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  const displayScores = scores.filter(s => s.category !== "Test Run");

  return (
    <div className="p-10 max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Track your progress and study history.</p>
      </div>

      {/* Dials */}
      <div className="flex gap-6 mb-10">
        <AnimatedDial
          percentage={avgPractice}
          label="Avg Practice Score"
          color="#3b82f6"
          count={practiceScores.length}
        />
        <AnimatedDial
          percentage={avgExam}
          label="Avg Exam Score"
          color="#8b5cf6"
          count={examScores.length}
        />
      </div>

      {/* Score History */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-extrabold text-slate-900">Score History</h2>
          <p className="text-slate-500 text-sm mt-1">Your recent practice sessions and exams.</p>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-400">Loading scores...</div>
        ) : displayScores.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            No scores yet. Complete a practice set or exam to see your history here.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            <div className="grid grid-cols-4 px-6 py-3 bg-slate-50">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Date</span>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Categories</span>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Questions</span>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Score</span>
            </div>
            {displayScores.map((s) => {
              const pct = Math.round((s.score / s.total_questions) * 100);
              const isPassing = pct >= 70;
              return (
                <div key={s.id} className="grid grid-cols-4 px-6 py-4 items-center hover:bg-slate-50 transition">
                  <span className="text-sm text-slate-600">{formatDate(s.created_at)}</span>
                  <span className="text-sm text-slate-700 font-medium">{s.category}</span>
                  <span className="text-sm text-slate-600">{s.total_questions} questions</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-800">{s.score}/{s.total_questions}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${isPassing ? "bg-green-100 text-green-700" : "bg-rose-100 text-rose-700"}`}>
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}