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

type CategoryStat = {
  category: string;
  correct: number;
  total: number;
  percentage: number;
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
    <div className="flex flex-col items-center p-8 bg-white rounded-xl border border-slate-200 flex-1">
      <svg width="140" height="130" viewBox="0 0 140 130">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="8"
          strokeDasharray={`${trackLength} ${circumference - trackLength}`} strokeLinecap="round"
          style={{ transform: "rotate(135deg)", transformOrigin: `${cx}px ${cy}px` }} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${fillLength} ${circumference}`} strokeLinecap="round"
          style={{ transform: "rotate(135deg)", transformOrigin: `${cx}px ${cy}px`,
            transition: "stroke-dasharray 1.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
        <text x={cx} y={cy - 4} textAnchor="middle" style={{ fontSize: "22px", fontWeight: "700", fill: "#0f172a" }}>
          {count === 0 ? "--" : `${Math.round(percentage)}%`}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" style={{ fontSize: "10px", fill: "#94a3b8", fontWeight: "500", letterSpacing: "0.05em" }}>
          {count === 0 ? "no data yet" : "AVG SCORE"}
        </text>
      </svg>
      <p className="text-sm font-semibold text-slate-700 mt-1">{label}</p>
      <p className="text-xs text-slate-400 mt-0.5">{count} session{count !== 1 ? "s" : ""}</p>
    </div>
  );
}

function CategoryBar({ stat }: { stat: CategoryStat }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 400);
    return () => clearTimeout(t);
  }, []);

  const pct = stat.percentage;
  const barColor = pct >= 80 ? "#4f46e5" : pct >= 70 ? "#f59e0b" : "#ef4444";
  const labelText = pct >= 90 ? "Strong" : pct >= 80 ? "Good" : pct >= 70 ? "Needs work" : "Weak";
  const labelStyle = pct >= 80
    ? { bg: "#eef2ff", color: "#4338ca" }
    : pct >= 70
    ? { bg: "#fef3c7", color: "#b45309" }
    : { bg: "#fee2e2", color: "#b91c1c" };

  return (
    <div className="flex items-center gap-4 py-3">
      <div className="w-44 shrink-0">
        <p className="text-sm font-medium text-slate-800 truncate">{stat.category}</p>
        <p className="text-xs text-slate-400">{stat.total} answered</p>
      </div>
      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
        <div
          className="h-2 rounded-full transition-all duration-1000"
          style={{ width: animated ? `${pct}%` : "0%", backgroundColor: barColor }}
        />
      </div>
      <div className="w-10 text-right">
        <span className="text-sm font-semibold" style={{ color: barColor }}>{Math.round(pct)}%</span>
      </div>
      <div className="w-24 text-right">
        <span className="text-xs font-medium px-2 py-1 rounded-md"
          style={{ backgroundColor: labelStyle.bg, color: labelStyle.color }}>
          {labelText}
        </span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [recentTrend, setRecentTrend] = useState<{ recent: number; previous: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: scoresData, error: scoresError } = await supabase
        .from("quiz_scores")
        .select("*")
        .order("created_at", { ascending: false });
      if (scoresError) console.error(scoresError);

      const { data: resultsData, error: resultsError } = await supabase
        .from("question_results")
        .select("*");
      if (resultsError) console.error(resultsError);

      if (scoresData) setScores(scoresData);

      if (resultsData) {
        setTotalAnswered(resultsData.length);

        const categoryMap: Record<string, { correct: number; total: number }> = {};
        resultsData.forEach((r) => {
          if (!categoryMap[r.category]) categoryMap[r.category] = { correct: 0, total: 0 };
          categoryMap[r.category].total += 1;
          if (r.correct) categoryMap[r.category].correct += 1;
        });

        const stats: CategoryStat[] = Object.entries(categoryMap)
          .map(([category, data]) => ({
            category,
            correct: data.correct,
            total: data.total,
            percentage: (data.correct / data.total) * 100,
          }))
          .sort((a, b) => a.percentage - b.percentage);

        setCategoryStats(stats);
      }

      if (scoresData) {
        const practiceSessions = scoresData.filter(
          (s) => s.category !== "Practice Exam" && s.category !== "Test Run"
        );
        setTotalSessions(practiceSessions.length);

        if (practiceSessions.length >= 2) {
          const half = Math.ceil(practiceSessions.length / 2);
          const recent = practiceSessions.slice(0, half);
          const previous = practiceSessions.slice(half);
          const recentAvg = recent.reduce((acc, s) => acc + (s.score / s.total_questions) * 100, 0) / recent.length;
          const previousAvg = previous.reduce((acc, s) => acc + (s.score / s.total_questions) * 100, 0) / previous.length;
          setRecentTrend({ recent: Math.round(recentAvg), previous: Math.round(previousAvg) });
        }
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const practiceScores = scores.filter(s => s.category !== "Practice Exam" && s.category !== "Test Run");
  const examScores = scores.filter(s => s.category === "Practice Exam");

  const avgPractice = practiceScores.length > 0
    ? practiceScores.reduce((acc, s) => acc + (s.score / s.total_questions) * 100, 0) / practiceScores.length
    : 0;

  const avgExam = examScores.length > 0
    ? examScores.reduce((acc, s) => acc + (s.score / s.total_questions) * 100, 0) / examScores.length
    : 0;

  const weakCategories = categoryStats.filter(s => s.percentage < 70);
  const strongCategories = categoryStats.filter(s => s.percentage >= 80);

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  const displayScores = scores.filter(s => s.category !== "Test Run");

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-0.5 text-sm">Track your progress toward checkride readiness.</p>
      </div>

      {/* Dials */}
      <div className="flex gap-4 mb-4">
        <AnimatedDial percentage={avgPractice} label="Avg Practice Score" color="#4f46e5" count={practiceScores.length} />
        <AnimatedDial percentage={avgExam} label="Avg Exam Score" color="#7c3aed" count={examScores.length} />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Questions Answered</p>
          <p className="text-3xl font-bold text-slate-900">{totalAnswered}</p>
          <p className="text-xs text-slate-400 mt-1">across all sessions</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Sessions Completed</p>
          <p className="text-3xl font-bold text-slate-900">{totalSessions}</p>
          <p className="text-xs text-slate-400 mt-1">practice sessions</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Score Trend</p>
          {recentTrend ? (
            <>
              <p className="text-3xl font-bold" style={{
                color: recentTrend.recent >= recentTrend.previous ? "#16a34a" : "#dc2626"
              }}>
                {recentTrend.recent >= recentTrend.previous ? "↑" : "↓"} {Math.abs(recentTrend.recent - recentTrend.previous)}%
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {recentTrend.recent}% recent vs {recentTrend.previous}% before
              </p>
            </>
          ) : (
            <>
              <p className="text-3xl font-bold text-slate-200">—</p>
              <p className="text-xs text-slate-400 mt-1">more sessions needed</p>
            </>
          )}
        </div>
      </div>

      {/* Performance by Category */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Performance by Category</h2>
          <p className="text-slate-400 text-xs mt-0.5">{totalAnswered} questions answered across all sessions</p>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-400 text-sm">Loading analytics...</div>
        ) : categoryStats.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">Complete a practice session to see category performance.</div>
        ) : (
          <div className="px-6 py-1 divide-y divide-slate-100">
            {categoryStats.map((stat) => (
              <CategoryBar key={stat.category} stat={stat} />
            ))}
          </div>
        )}
      </div>

      {/* Study Recommendations */}
      {(weakCategories.length > 0 || strongCategories.length > 0) && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">Study Recommendations</h2>
            <p className="text-slate-400 text-xs mt-0.5">Based on your performance across all categories</p>
          </div>
          <div className="p-6 space-y-5">
            {weakCategories.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-3">Needs Attention</p>
                <div className="space-y-2.5">
                  {weakCategories.map((cat) => (
                    <div key={cat.category} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{cat.category}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {Math.round(cat.percentage)}% correct across {cat.total} questions.
                          {cat.percentage < 50
                            ? " Significant weak area — prioritize before your checkride."
                            : " A bit more review here will make a difference."}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {strongCategories.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-3">Strong Areas</p>
                <div className="space-y-2.5">
                  {strongCategories.map((cat) => (
                    <div key={cat.category} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{cat.category}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {Math.round(cat.percentage)}% correct across {cat.total} questions.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Score History */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Score History</h2>
          <p className="text-slate-400 text-xs mt-0.5">Recent practice sessions and exams</p>
        </div>
        {loading ? (
          <div className="p-10 text-center text-slate-400 text-sm">Loading scores...</div>
        ) : displayScores.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">No scores yet. Complete a practice set to see your history.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            <div className="grid grid-cols-4 px-6 py-3 bg-slate-50">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Date</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Category</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Questions</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Score</span>
            </div>
            {displayScores.map((s) => {
              const pct = Math.round((s.score / s.total_questions) * 100);
              const isPassing = pct >= 70;
              return (
                <div key={s.id} className="grid grid-cols-4 px-6 py-3.5 items-center hover:bg-slate-50 transition-colors">
                  <span className="text-sm text-slate-500">{formatDate(s.created_at)}</span>
                  <span className="text-sm text-slate-700 font-medium">{s.category}</span>
                  <span className="text-sm text-slate-500">{s.total_questions} questions</span>
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-semibold text-slate-800">{s.score}/{s.total_questions}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                      isPassing ? "bg-indigo-50 text-indigo-700" : "bg-rose-50 text-rose-700"
                    }`}>
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
