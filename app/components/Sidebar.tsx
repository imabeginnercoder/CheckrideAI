"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { supabase } from "../../utils/supabase";
import { useAuth } from "./AuthProvider";

export default function Sidebar() {
  const [checkrideOpen, setCheckrideOpen] = useState(false);
  const { user } = useAuth();
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;
  const checkrideActive = isActive("/oral") || isActive("/checklist");
  const checkrideExpanded = checkrideOpen || checkrideActive;

  const linkClass = (href: string) =>
    `px-3 py-2.5 rounded-lg transition-all duration-150 text-sm font-medium flex items-center gap-2.5 ${
      isActive(href)
        ? "bg-white text-slate-950"
        : "text-slate-400 hover:text-white hover:bg-white/8"
    }`;

  return (
    <nav className="w-60 flex flex-col shrink-0 border-r border-white/5" style={{ backgroundColor: "#0d1117" }}>
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center shrink-0 text-slate-950">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M7 5V9M5 7H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white tracking-tight">CheckrideAI</h1>
            <p className="text-xs text-slate-500 tracking-wide">PPL Oral Prep</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex flex-col p-3 space-y-0.5 flex-grow">
        <p className="px-3 pt-3 pb-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Study</p>

        <Link href="/dashboard" className={linkClass("/dashboard")}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
            <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
            <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
            <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
            <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
          </svg>
          Dashboard
        </Link>

        <Link href="/practice" className={linkClass("/practice")}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M5.5 8L7.5 10L10.5 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Practice Questions
        </Link>

        <Link href="/exam" className={linkClass("/exam")}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
            <path d="M3 2H11L13 4V14H3V2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
            <path d="M5 6H11M5 9H9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          FAA Practice Exams
        </Link>

        <p className="px-3 pt-4 pb-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Checkride Prep</p>

        {/* Dropdown trigger */}
        <button
          onClick={() => setCheckrideOpen((prev) => !prev)}
          className={`px-3 py-2.5 rounded-lg hover:bg-white/8 transition-all duration-150 text-sm font-medium flex justify-between items-center w-full ${
            checkrideActive
              ? "text-white bg-white/8"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <span className="flex items-center gap-2.5">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
              <path d="M8 1.5L14 5V11L8 14.5L2 11V5L8 1.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
              <path d="M8 5.5V8.5M8 10.5V11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            Oral & Checklist
          </span>
          <ChevronDown
            size={14}
            className={`text-slate-600 transition-transform duration-200 ${checkrideExpanded ? "rotate-180" : ""}`}
          />
        </button>

        {checkrideExpanded && (
          <div className="flex flex-col space-y-0.5 pl-4 ml-2 border-l border-white/8">
            <Link href="/oral" className={linkClass("/oral")}>
              Mock Oral AI DPE
            </Link>
            <Link href="/checklist" className={linkClass("/checklist")}>
              Checkride Checklist
            </Link>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/5">
        <p className="truncate text-xs text-slate-500">{user.email}</p>
        <button
          onClick={() => supabase.auth.signOut()}
          className="mt-2 text-xs font-medium text-slate-600 transition hover:text-white"
        >
          Sign out
        </button>
        <p className="mt-4 text-xs text-slate-700">© 2025 CheckrideAI</p>
      </div>
    </nav>
  );
}
