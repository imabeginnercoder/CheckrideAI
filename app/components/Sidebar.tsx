"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const [checkrideOpen, setCheckrideOpen] = useState(false);
  const pathname = usePathname();

  const linkClass = (href: string) =>
    `p-3 rounded-lg hover:bg-slate-800 transition text-sm font-medium ${
      pathname === href ? "bg-slate-800 text-white" : "text-slate-300"
    }`;

  return (
    <nav className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-10 shrink-0">
      <div className="p-6 bg-slate-950 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-blue-400 tracking-tight">CheckrideAI</h1>
        <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest">Ace your Checkride</p>
      </div>

      <div className="flex flex-col p-4 space-y-2 flex-grow">
        <Link href="/" className={linkClass("/")}>
          Dashboard
        </Link>
        <Link href="/practice" className={linkClass("/practice")}>
          Practice Questions
        </Link>
        <Link href="/exam" className={linkClass("/exam")}>
          FAA Practice Exams
        </Link>

        {/* Checkride Prep Dropdown */}
        <button
          onClick={() => setCheckrideOpen((prev) => !prev)}
          className="p-3 rounded-lg hover:bg-slate-800 transition text-sm font-medium text-slate-300 flex justify-between items-center w-full"
        >
          <span>Checkride Prep</span>
          <span className={`text-slate-400 transition-transform duration-200 text-xl ${checkrideOpen ? "rotate-180" : ""}`}>
            ▾
          </span>
        </button>

        {checkrideOpen && (
          <div className="flex flex-col space-y-1 pl-3 border-l-2 border-slate-700 ml-2">
            <Link href="/oral" className={linkClass("/oral")}>
              Mock Oral AI DPE
            </Link>
            <Link href="/checklist" className={linkClass("/checklist")}>
              Checkride Checklist
            </Link>
          </div>
        )}
      </div>

      <div className="p-6 text-xs text-slate-500 border-t border-slate-800">
        © 2024 CheckrideAI
      </div>
    </nav>
  );
}