"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../utils/supabase";
import { useAuth } from "../components/AuthProvider";
import ProtectedAppShell from "../components/ProtectedAppShell";

type ChecklistItem = {
  id: string;
  label: string;
  note?: string;
};

type ChecklistSection = {
  title: string;
  color: string;
  items: ChecklistItem[];
};

const sections: ChecklistSection[] = [
  {
    title: "Pilot Documents",
    color: "blue",
    items: [
      { id: "p1", label: "Student pilot certificate" },
      { id: "p2", label: "Government-issued photo ID", note: "Driver's license or passport" },
      { id: "p3", label: "Medical certificate", note: "Must be current third-class or BasicMed" },
      { id: "p4", label: "Pilot logbook", note: "With CFI solo endorsements and training endorsements" },
      { id: "p5", label: "FAA knowledge test results", note: "Must be within 24 calendar months" },
      { id: "p6", label: "Solo cross-country endorsement" },
      { id: "p7", label: "Checkride endorsement from CFI", note: "Signed within 60 days of the checkride" },
    ],
  },
  {
    title: "Aircraft Documents",
    color: "emerald",
    items: [
      { id: "a1", label: "Airworthiness certificate", note: "Must be original, displayed in aircraft" },
      { id: "a2", label: "Registration certificate", note: "Must be current" },
      { id: "a3", label: "Operating limitations / POH", note: "Approved flight manual for the aircraft" },
      { id: "a4", label: "Weight and balance data", note: "Current and specific to the aircraft" },
      { id: "a5", label: "Annual inspection records", note: "Within the preceding 12 calendar months" },
      { id: "a6", label: "100-hour inspection (if applicable)", note: "Required for hire — not typically for private checkride" },
      { id: "a7", label: "ELT inspection", note: "Within preceding 12 months or 1 hour cumulative use" },
    ],
  },
  {
    title: "Navigation & Planning",
    color: "violet",
    items: [
      { id: "n1", label: "Current sectional chart" },
      { id: "n2", label: "Cross-country flight plan", note: "Prepared per DPE instructions" },
      { id: "n3", label: "Navigation log", note: "Have updated Navlog based on most recent weather data" },
      { id: "n4", label: "Weather briefing printout", note: "Standard briefing from 1800wxbrief.com" },
      { id: "n5", label: "E6B flight computer or equivalent" },
      { id: "n6", label: "Plotter" },
      { id: "n7", label: "Current Chart Supplement (A/FD)" },
    ],
  },
  {
    title: "Knowledge & Preparation",
    color: "amber",
    items: [
      { id: "k1", label: "ACS (Airman Certification Standards)", note: "Know the private pilot ACS standards" },
      { id: "k2", label: "FAR/AIM — current edition", note: "You don't need a hard copy of both, but know important regulations" },
      { id: "k3", label: "Aircraft systems knowledge", note: "Know your specific aircraft inside and out" },
      { id: "k4", label: "Local airspace knowledge", note: "Airspace, restricted areas, and procedures around the test area" },
      { id: "k5", label: "NOTAM and TFR check for the day" },
      { id: "k6", label: "Current METAR and TAF for departure and area" },
      { id: "k7", label: "Winds aloft forecast" },
    ],
  },
];

const colorMap: Record<string, { border: string; bg: string; text: string; check: string }> = {
  blue:    { border: "border-blue-500",    bg: "bg-blue-50",    text: "text-blue-700",    check: "accent-blue-600"    },
  emerald: { border: "border-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", check: "accent-emerald-600" },
  violet:  { border: "border-violet-500",  bg: "bg-violet-50",  text: "text-violet-700",  check: "accent-violet-600"  },
  amber:   { border: "border-amber-500",   bg: "bg-amber-50",   text: "text-amber-700",   check: "accent-amber-600"   },
};

function CheckridePageContent() {
  const { user } = useAuth();
  const allIds = sections.flatMap((s) => s.items.map((i) => i.id));
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [loadingChecklist, setLoadingChecklist] = useState(true);

  // Load checked items from Supabase on mount
  useEffect(() => {
    const fetchChecklist = async () => {
      const { data, error } = await supabase
        .from("checklist_items")
        .select("item_id")
        .eq("user_id", user.id);
      if (error) { console.error(error); setLoadingChecklist(false); return; }
      setChecked(new Set(data.map((r: { item_id: string }) => r.item_id)));
      setLoadingChecklist(false);
    };
    fetchChecklist();
  }, [user.id]);

  const toggle = async (id: string) => {
    const isChecked = checked.has(id);

    // Optimistic update
    setChecked((prev) => {
      const next = new Set(prev);
      if (isChecked) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

    if (isChecked) {
      await supabase
        .from("checklist_items")
        .delete()
        .eq("user_id", user.id)
        .eq("item_id", id);
    } else {
      await supabase.from("checklist_items").insert({ item_id: id, user_id: user.id });
    }
  };

  const totalChecked = checked.size;
  const totalItems = allIds.length;
  const pct = Math.round((totalChecked / totalItems) * 100);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-slate-900">Checkride Checklist</h1>
        <p className="text-slate-500 mt-0.5 text-sm">Everything you need to bring on checkride day.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-sm font-semibold text-slate-700">Overall Readiness</span>
          <span className="text-sm font-semibold text-indigo-600">{totalChecked} / {totalItems} items</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div
            className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-1.5">{pct}% ready</p>
      </div>

      {loadingChecklist ? (
        <div className="text-center text-slate-400 py-10 text-sm">Loading checklist...</div>
      ) : (
        <div className="space-y-4">
          {sections.map((section) => {
            const c = colorMap[section.color];
            const sectionChecked = section.items.filter((i) => checked.has(i.id)).length;
            return (
              <div key={section.title} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className={`px-6 py-3.5 border-l-4 ${c.border} ${c.bg} flex justify-between items-center`}>
                  <h2 className={`font-semibold text-sm ${c.text}`}>{section.title}</h2>
                  <span className={`text-xs font-semibold ${c.text}`}>
                    {sectionChecked}/{section.items.length}
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  {section.items.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-start gap-4 px-6 py-3.5 cursor-pointer hover:bg-slate-50 transition"
                    >
                      <input
                        type="checkbox"
                        checked={checked.has(item.id)}
                        onChange={() => toggle(item.id)}
                        className={`mt-0.5 w-4 h-4 shrink-0 ${c.check}`}
                      />
                      <div>
                        <p className={`text-sm font-medium ${checked.has(item.id) ? "line-through text-slate-400" : "text-slate-800"}`}>
                          {item.label}
                        </p>
                        {item.note && (
                          <p className="text-xs text-slate-400 mt-0.5">{item.note}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CheckridePage() {
  return (
    <ProtectedAppShell>
      <CheckridePageContent />
    </ProtectedAppShell>
  );
}
