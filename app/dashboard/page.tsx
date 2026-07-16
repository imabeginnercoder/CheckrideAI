"use client";

import { useState, useEffect } from "react";
import { buildCategoryStats, buildScoreSeries, buildSpacedRepetitionQueue } from "../../utils/analytics";
import { supabase } from "../../utils/supabase";
import { useAuth } from "../components/AuthProvider";
import ProtectedAppShell from "../components/ProtectedAppShell";

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

type ScorePoint = {
  id: number;
  label: string;
  category: string;
  percentage: number;
};

type RepetitionItem = CategoryStat & {
  priority: number;
  reason: string;
};

type OralSessionRow = {
  id: number;
  created_at: string;
  mode: string;
  question_count: number;
  summary: string;
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

function ScoreOverTimeChart({ points }: { points: ScorePoint[] }) {
  if (points.length < 2) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-900">Score Over Time</h2>
        <p className="text-slate-400 text-xs mt-0.5">Complete two sessions to see your score trend.</p>
        <div className="mt-8 h-40 rounded-lg bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-sm text-slate-400">
          Not enough score history yet
        </div>
      </div>
    );
  }

  const width = 560;
  const height = 180;
  const pad = 28;
  const xFor = (i: number) => pad + (i / Math.max(points.length - 1, 1)) * (width - pad * 2);
  const yFor = (pct: number) => pad + ((100 - pct) / 100) * (height - pad * 2);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(p.percentage)}`).join(" ");
  const latest = points[points.length - 1];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Score Over Time</h2>
          <p className="text-slate-400 text-xs mt-0.5">{points.length} saved sessions</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-indigo-600">{latest.percentage}%</p>
          <p className="text-xs text-slate-400">latest</p>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48">
        {[0, 25, 50, 75, 100].map((tick) => (
          <g key={tick}>
            <line x1={pad} x2={width - pad} y1={yFor(tick)} y2={yFor(tick)} stroke="#f1f5f9" strokeWidth="1" />
            <text x="0" y={yFor(tick) + 4} fontSize="10" fill="#94a3b8">{tick}</text>
          </g>
        ))}
        <line x1={pad} x2={width - pad} y1={yFor(70)} y2={yFor(70)} stroke="#c7d2fe" strokeDasharray="4 4" />
        <path d={path} fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={p.id} cx={xFor(i)} cy={yFor(p.percentage)} r="4" fill="#4f46e5" stroke="white" strokeWidth="2" />
        ))}
      </svg>
      <div className="flex justify-between text-xs text-slate-400">
        <span>{points[0].label}</span>
        <span>70% target</span>
        <span>{latest.label}</span>
      </div>
    </div>
  );
}

function CategoryMasteryTrend({ stats }: { stats: CategoryStat[] }) {
  const displayStats = stats.slice().sort((a, b) => b.percentage - a.percentage).slice(0, 6);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-base font-semibold text-slate-900">Category Mastery Trend</h2>
      <p className="text-slate-400 text-xs mt-0.5">Current mastery based on question history</p>
      {displayStats.length === 0 ? (
        <div className="mt-8 h-40 rounded-lg bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-sm text-slate-400">
          Complete questions to build mastery data
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {displayStats.map((stat) => (
            <div key={stat.category}>
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <span className="text-sm font-medium text-slate-700 truncate">{stat.category}</span>
                <span className="text-xs font-semibold text-slate-500">{Math.round(stat.percentage)}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-indigo-500"
                  style={{ width: `${Math.min(100, stat.percentage)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SpacedRepetitionQueue({ queue }: { queue: RepetitionItem[] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
      <div className="px-6 py-5 border-b border-slate-100">
        <h2 className="text-base font-semibold text-slate-900">Suggested Spaced Repetition Queue</h2>
        <p className="text-slate-400 text-xs mt-0.5">Prioritized categories based on score and practice volume</p>
      </div>
      {queue.length === 0 ? (
        <div className="p-10 text-center text-slate-400 text-sm">Complete a practice session to generate suggestions.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-6">
          {queue.map((item) => (
            <a
              key={item.category}
              href={`/practice?categories=${encodeURIComponent(item.category)}&autostart=true`}
              className="rounded-xl border border-slate-200 p-4 transition hover:border-indigo-300 hover:bg-indigo-50"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-800">{item.category}</p>
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md">
                  {Math.round(item.percentage)}%
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">{item.reason}</p>
              <p className="text-xs font-semibold text-indigo-600 mt-3">Start focused set</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function OralSessionHistory({ sessions, formatDate }: {
  sessions: OralSessionRow[];
  formatDate: (iso: string) => string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
      <div className="px-6 py-5 border-b border-slate-100">
        <h2 className="text-base font-semibold text-slate-900">Recent AI Oral Sessions</h2>
        <p className="text-slate-400 text-xs mt-0.5">Saved final summaries from completed mock oral exams</p>
      </div>
      {sessions.length === 0 ? (
        <div className="p-10 text-center text-slate-400 text-sm">Complete a mock oral session to save a review summary.</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {sessions.map((session) => (
            <div key={session.id} className="px-6 py-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800 capitalize">{session.mode} mode</p>
                  <p className="text-xs text-slate-400">{formatDate(session.created_at)} · {session.question_count} questions</p>
                </div>
                <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">AI review</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-500 line-clamp-3">{session.summary}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type InProgressSession = {
  currentIndex: number;
  questions: { category: string }[];
  answers: Record<number, string>;
  selectedCategories: string[];
  questionCount: number;
} | null;

function DashboardContent() {
  const { user } = useAuth();
  const practiceSessionKey = `practice_session:${user.id}`;
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [recentTrend, setRecentTrend] = useState<{ recent: number; previous: number } | null>(null);
  const [oralSessions, setOralSessions] = useState<OralSessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [inProgress, setInProgress] = useState<InProgressSession>(null);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = sessionStorage.getItem(practiceSessionKey);
        if (raw) {
          const s = JSON.parse(raw);
          if (s.screen === "quiz" && s.questions?.length > 0) {
            setInProgress(s);
          }
        }
      } catch { /* ignore */ }
    });
  }, [practiceSessionKey]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: scoresData, error: scoresError } = await supabase
        .from("quiz_scores")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (scoresError) console.error(scoresError);

      const { data: resultsData, error: resultsError } = await supabase
        .from("question_results")
        .select("*")
        .eq("user_id", user.id);
      if (resultsError) console.error(resultsError);

      const { data: oralData, error: oralError } = await supabase
        .from("oral_sessions")
        .select("id, created_at, mode, question_count, summary")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);
      if (oralError) console.error(oralError);

      if (scoresData) setScores(scoresData);
      if (oralData) setOralSessions(oralData);

      if (resultsData) {
        setTotalAnswered(resultsData.length);
        setCategoryStats(buildCategoryStats(resultsData));
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
  }, [user.id]);

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
  const scoreSeries = buildScoreSeries(displayScores);
  const repetitionQueue = buildSpacedRepetitionQueue(categoryStats);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-0.5 text-sm">Track your progress toward checkride readiness.</p>
      </div>

      {/* In-progress session banner */}
      {inProgress && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shrink-0" />
            <div>
              <p className="text-sm font-semibold text-indigo-900">Practice session in progress</p>
              <p className="text-xs text-indigo-600 mt-0.5">
                {inProgress.selectedCategories.join(", ")} · Question {inProgress.currentIndex + 1} of {inProgress.questions.length} · {Object.keys(inProgress.answers).length} answered
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { sessionStorage.removeItem(practiceSessionKey); setInProgress(null); }}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-700 transition px-3 py-1.5 rounded-lg hover:bg-indigo-100"
            >
              Discard
            </button>
            <a
              href="/practice"
              className="text-xs font-semibold bg-slate-950 text-white px-4 py-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              Continue
            </a>
          </div>
        </div>
      )}

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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        <ScoreOverTimeChart points={scoreSeries} />
        <CategoryMasteryTrend stats={categoryStats} />
      </div>

      <SpacedRepetitionQueue queue={repetitionQueue} />

      <OralSessionHistory sessions={oralSessions} formatDate={formatDate} />

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
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Needs Attention</p>
                  {weakCategories.length >= 2 && (
                    <a
                      href={`/practice?categories=${encodeURIComponent(weakCategories.slice(0, 3).map(c => c.category).join(","))}&autostart=true`}
                      className="text-xs font-semibold bg-rose-600 text-white px-3 py-1.5 rounded-lg hover:bg-rose-700 transition"
                    >
                      Focus on weak areas
                    </a>
                  )}
                </div>
                <div className="space-y-2.5">
                  {weakCategories.map((cat) => (
                    <div key={cat.category} className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
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
                      <a
                        href={`/practice?categories=${encodeURIComponent(cat.category)}`}
                        className="text-xs font-medium text-rose-600 hover:text-rose-800 border border-rose-200 hover:border-rose-400 px-2.5 py-1 rounded-lg transition shrink-0"
                      >
                        Practice
                      </a>
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

export default function Dashboard() {
  return (
    <ProtectedAppShell>
      <DashboardContent />
    </ProtectedAppShell>
  );
}
