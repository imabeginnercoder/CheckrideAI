"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CategoryStat, OralSessionRow, RepetitionItem, ScorePoint } from "./types";

export function AnimatedDial({ percentage, label, color, count }: {
  percentage: number;
  label: string;
  color: string;
  count: number;
}) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const trackLength = circumference * 0.75;
  const fillLength = animated ? trackLength * (percentage / 100) : 0;

  return (
    <div className="flex flex-1 flex-col items-center rounded-xl border border-slate-200 bg-white p-8">
      <svg width="140" height="130" viewBox="0 0 140 130" aria-label={`${label}: ${count ? `${Math.round(percentage)} percent` : "no data"}`}>
        <circle cx="70" cy="75" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="8" strokeDasharray={`${trackLength} ${circumference - trackLength}`} strokeLinecap="round" style={{ transform: "rotate(135deg)", transformOrigin: "70px 75px" }} />
        <circle cx="70" cy="75" r={radius} fill="none" stroke={color} strokeWidth="8" strokeDasharray={`${fillLength} ${circumference}`} strokeLinecap="round" style={{ transform: "rotate(135deg)", transformOrigin: "70px 75px", transition: "stroke-dasharray 1.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
        <text x="70" y="71" textAnchor="middle" style={{ fontSize: "22px", fontWeight: 700, fill: "#0f172a" }}>{count === 0 ? "--" : `${Math.round(percentage)}%`}</text>
        <text x="70" y="89" textAnchor="middle" style={{ fontSize: "10px", fill: "#94a3b8", fontWeight: 500 }}>{count === 0 ? "no data yet" : "AVG SCORE"}</text>
      </svg>
      <p className="mt-1 text-sm font-semibold text-slate-700">{label}</p>
      <p className="mt-0.5 text-xs text-slate-400">{count} session{count !== 1 ? "s" : ""}</p>
    </div>
  );
}

export function CategoryBar({ stat }: { stat: CategoryStat }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 400);
    return () => clearTimeout(timer);
  }, []);

  const color = stat.percentage >= 80 ? "#4f46e5" : stat.percentage >= 70 ? "#f59e0b" : "#ef4444";
  const label = stat.percentage >= 90 ? "Strong" : stat.percentage >= 80 ? "Good" : stat.percentage >= 70 ? "Needs work" : "Weak";

  return (
    <div className="flex items-center gap-4 py-3">
      <div className="w-44 shrink-0"><p className="truncate text-sm font-medium text-slate-800">{stat.category}</p><p className="text-xs text-slate-400">{stat.total} answered</p></div>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-2 rounded-full transition-all duration-1000" style={{ width: animated ? `${stat.percentage}%` : "0%", backgroundColor: color }} /></div>
      <span className="w-10 text-right text-sm font-semibold" style={{ color }}>{Math.round(stat.percentage)}%</span>
      <span className="w-24 text-right text-xs font-medium text-slate-500">{label}</span>
    </div>
  );
}

export function ScoreOverTimeChart({ points }: { points: ScorePoint[] }) {
  if (points.length < 2) return <EmptyChart title="Score Over Time" detail="Complete two sessions to see your score trend." />;

  const width = 560;
  const height = 180;
  const pad = 28;
  const xFor = (index: number) => pad + (index / Math.max(points.length - 1, 1)) * (width - pad * 2);
  const yFor = (percentage: number) => pad + ((100 - percentage) / 100) * (height - pad * 2);
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${xFor(index)} ${yFor(point.percentage)}`).join(" ");
  const latest = points[points.length - 1];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-start justify-between"><div><h2 className="text-base font-semibold text-slate-900">Score Over Time</h2><p className="mt-0.5 text-xs text-slate-400">{points.length} saved sessions</p></div><p className="text-2xl font-bold text-indigo-600">{latest.percentage}%</p></div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full" aria-label="Score history line chart">
        {[0, 25, 50, 75, 100].map((tick) => <g key={tick}><line x1={pad} x2={width - pad} y1={yFor(tick)} y2={yFor(tick)} stroke="#f1f5f9" /><text x="0" y={yFor(tick) + 4} fontSize="10" fill="#94a3b8">{tick}</text></g>)}
        <line x1={pad} x2={width - pad} y1={yFor(70)} y2={yFor(70)} stroke="#c7d2fe" strokeDasharray="4 4" />
        <path d={path} fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point, index) => <circle key={point.id} cx={xFor(index)} cy={yFor(point.percentage)} r="4" fill="#4f46e5" stroke="white" strokeWidth="2" />)}
      </svg>
      <div className="flex justify-between text-xs text-slate-400"><span>{points[0].label}</span><span>70% target</span><span>{latest.label}</span></div>
    </div>
  );
}

function EmptyChart({ title, detail }: { title: string; detail: string }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-6"><h2 className="text-base font-semibold text-slate-900">{title}</h2><p className="mt-0.5 text-xs text-slate-400">{detail}</p><div className="mt-8 flex h-40 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">Not enough history yet</div></div>;
}

export function CategoryMasteryTrend({ stats }: { stats: CategoryStat[] }) {
  const displayStats = [...stats].sort((a, b) => b.percentage - a.percentage).slice(0, 6);
  if (!displayStats.length) return <EmptyChart title="Category Mastery Trend" detail="Complete questions to build mastery data." />;

  return <div className="rounded-xl border border-slate-200 bg-white p-6"><h2 className="text-base font-semibold text-slate-900">Category Mastery Trend</h2><p className="mt-0.5 text-xs text-slate-400">Current mastery based on question history</p><div className="mt-5 space-y-4">{displayStats.map((stat) => <div key={stat.category}><div className="mb-1.5 flex justify-between gap-3 text-xs"><span className="truncate font-medium text-slate-700">{stat.category}</span><span className="font-semibold text-slate-500">{Math.round(stat.percentage)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-2 rounded-full bg-indigo-500" style={{ width: `${Math.min(100, stat.percentage)}%` }} /></div></div>)}</div></div>;
}

export function SpacedRepetitionQueue({ queue }: { queue: RepetitionItem[] }) {
  return <div className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="border-b border-slate-100 px-6 py-5"><h2 className="text-base font-semibold text-slate-900">Suggested Spaced Repetition Queue</h2><p className="mt-0.5 text-xs text-slate-400">Prioritized categories based on score and practice volume</p></div>{queue.length === 0 ? <div className="p-10 text-center text-sm text-slate-400">Complete a practice session to generate suggestions.</div> : <div className="grid gap-3 p-6 sm:grid-cols-2">{queue.map((item) => <Link key={item.category} href={`/practice?categories=${encodeURIComponent(item.category)}&autostart=true`} className="rounded-xl border border-slate-200 p-4 transition hover:border-indigo-300 hover:bg-indigo-50"><div className="flex justify-between gap-3"><p className="text-sm font-semibold text-slate-800">{item.category}</p><span className="text-xs font-semibold text-indigo-700">{Math.round(item.percentage)}%</span></div><p className="mt-2 text-xs text-slate-500">{item.reason}</p><p className="mt-3 text-xs font-semibold text-indigo-600">Start focused set</p></Link>)}</div>}</div>;
}

export function OralSessionHistory({ sessions, formatDate }: { sessions: OralSessionRow[]; formatDate: (iso: string) => string }) {
  return <div className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="border-b border-slate-100 px-6 py-5"><h2 className="text-base font-semibold text-slate-900">Recent AI Oral Sessions</h2><p className="mt-0.5 text-xs text-slate-400">ACS-aligned practice scorecards and review summaries</p></div>{sessions.length === 0 ? <div className="p-10 text-center text-sm text-slate-400">Complete a mock oral session to save a scorecard.</div> : <div className="divide-y divide-slate-100">{sessions.map((session) => <div key={session.id} className="px-6 py-4"><div className="mb-2 flex items-center justify-between gap-3"><div><p className="text-sm font-semibold capitalize text-slate-800">{session.mode} mode{session.aircraft_model ? ` - ${session.aircraft_model}` : ""}</p><p className="text-xs text-slate-400">{formatDate(session.created_at)} - {session.question_count} questions</p></div>{session.overall_score === null ? <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">Legacy summary</span> : <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">{session.overall_score}/100</span>}</div><p className="line-clamp-3 text-xs leading-relaxed text-slate-500">{session.summary}</p></div>)}</div>}</div>;
}
