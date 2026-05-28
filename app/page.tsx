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
    <div className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-lg border border-slate-100 flex-1">
      <svg width="140" height="130" viewBox="0 0 140 130">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="10"
          strokeDasharray={`${trackLength} ${circumference - trackLength}`} strokeLinecap="round"
          style={{ transform: "rotate(135deg)", transformOrigin: `${cx}px ${cy}px` }} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${fillLength} ${circumference}`} strokeLinecap="round"
          style={{ transform: "rotate(135deg)", transformOrigin: `${cx}px ${cy}px`,
            transition: "stroke-dasharray 1.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
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

function CategoryBar({ stat }: { stat: CategoryStat }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 400);
    return () => clearTimeout(t);
  }, []);

  const pct = stat.percentage;
  const color = pct >= 80 ? "#22c55e" : pct >= 70 ? "#fca5a5" : pct >= 60 ? "#f59e0b" : "#ef4444";
  const label = pct >= 90 ? "Strong" : pct >= 80 ? "Improving" : pct >= 70 ? "Needs work" : "Weak";

  return (
    <div className="flex items-center gap-4 py-3">
      <div className="w-44 shrink-0">
        <p className="text-sm font-semibold text-slate-700 truncate">{stat.category}</p>
        <p className="text-xs text-slate-400">{stat.total} questions answered</p>
      </div>
      <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
        <div
          className="h-3 rounded-full transition-all duration-1000"
          style={{ width: animated ? `${pct}%` : "0%", backgroundColor: color }}
        />
      </div>
      <div className="w-12 text-right">
        <span className="text-sm font-bold" style={{ color }}>{Math.round(pct)}%</span>
      </div>
      <div className="w-24 text-right">
        <span className="text-xs font-bold px-2 py-1 rounded-full"
          style={{
            backgroundColor: pct >= 90 ? "#dcfce7" : pct >= 80 ? "#d1fae5" : pct >= 70 ? "#fee2e2" : pct >= 60 ? "#fef3c7" : "#fee2e2",
            color: pct >= 90 ? "#15803d" : pct >= 80 ? "#065f46" : pct >= 70 ? "#b91c1c" : pct >= 60 ? "#b45309" : "#b91c1c"
          }}>
          {label}
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
    <div className="p-10 max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Track your progress and study history.</p>
      </div>

      {/* Dials */}
      <div className="flex gap-6 mb-6">
        <AnimatedDial percentage={avgPractice} label="Avg Practice Score" color="#3b82f6" count={practiceScores.length} />
        <AnimatedDial percentage={avgExam} label="Avg Exam Score" color="#8b5cf6" count={examScores.length} />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Total Questions Answered</p>
          <p className="text-4xl font-extrabold text-slate-900">{totalAnswered}</p>
          <p className="text-xs text-slate-400 mt-1">across all practice sessions</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Total Sessions</p>
          <p className="text-4xl font-extrabold text-slate-900">{totalSessions}</p>
          <p className="text-xs text-slate-400 mt-1">practice sessions completed</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Score Trend</p>
          {recentTrend ? (
            <>
              <p className="text-4xl font-extrabold" style={{
                color: recentTrend.recent >= recentTrend.previous ? "#22c55e" : "#ef4444"
              }}>
                {recentTrend.recent >= recentTrend.previous ? "↑" : "↓"} {Math.abs(recentTrend.recent - recentTrend.previous)}%
              </p>
              <p className="text-xs text-slate-400 mt-1">
                recent avg {recentTrend.recent}% vs previous {recentTrend.previous}%
              </p>
            </>
          ) : (
            <>
              <p className="text-4xl font-extrabold text-slate-300">--</p>
              <p className="text-xs text-slate-400 mt-1">complete more sessions to see trend</p>
            </>
          )}
        </div>
      </div>

      {/* Performance Analytics */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-extrabold text-slate-900">Performance by Category</h2>
          <p className="text-slate-500 text-sm mt-1">Based on {totalAnswered} questions answered across all sessions.</p>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-400">Loading analytics...</div>
        ) : categoryStats.length === 0 ? (
          <div className="p-10 text-center text-slate-400">Complete a practice session to see category performance.</div>
        ) : (
          <div className="px-6 py-2 divide-y divide-slate-100">
            {categoryStats.map((stat) => (
              <CategoryBar key={stat.category} stat={stat} />
            ))}
          </div>
        )}
      </div>

      {/* Study Recommendations */}
      {(weakCategories.length > 0 || strongCategories.length > 0) && (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden mb-8">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-extrabold text-slate-900">Study Recommendations</h2>
            <p className="text-slate-500 text-sm mt-1">Based on your performance across all categories.</p>
          </div>
          <div className="p-6 space-y-4">
            {weakCategories.length > 0 && (
              <div>
                <p className="text-sm font-extrabold text-rose-600 mb-3">Needs Attention</p>
                {weakCategories.map((cat) => (
                  <div key={cat.category} className="flex items-start gap-3 mb-3">
                    <span className="w-2 h-2 rounded-full bg-rose-500 mt-2 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{cat.category}</p>
                      <p className="text-xs text-slate-500">
                        You are getting {Math.round(cat.percentage)}% correct across {cat.total} questions.
                        {cat.percentage < 50
                          ? " This is a significant weak area — prioritize this before your checkride."
                          : " A little more review here will make a big difference."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {strongCategories.length > 0 && (
              <div>
                <p className="text-sm font-extrabold text-green-600 mb-3">Strong Areas</p>
                {strongCategories.map((cat) => (
                  <div key={cat.category} className="flex items-start gap-3 mb-3">
                    <span className="w-2 h-2 rounded-full bg-green-500 mt-2 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{cat.category}</p>
                      <p className="text-xs text-slate-500">
                        {Math.round(cat.percentage)}% correct across {cat.total} questions. Keep it up.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Score History */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-extrabold text-slate-900">Score History</h2>
          <p className="text-slate-500 text-sm mt-1">Your recent practice sessions and exams.</p>
        </div>
        {loading ? (
          <div className="p-10 text-center text-slate-400">Loading scores...</div>
        ) : displayScores.length === 0 ? (
          <div className="p-10 text-center text-slate-400">No scores yet. Complete a practice set or exam to see your history here.</div>
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