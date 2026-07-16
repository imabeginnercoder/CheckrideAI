"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { daysUntilDate } from "@/lib/profile";
import { supabase } from "@/lib/supabase/client";

export default function CheckrideCountdown({ userId }: { userId: string }) {
  const [date, setDate] = useState<string | null>(null);
  const [aircraft, setAircraft] = useState("Cessna 172S");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("profiles").select("checkride_date, preferred_aircraft").eq("id", userId).maybeSingle();
      if (data) {
        setDate(data.checkride_date);
        setAircraft(data.preferred_aircraft);
      }
    };
    load();
  }, [userId]);

  const days = daysUntilDate(date);

  return (
    <section className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Study configuration</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">{aircraft}</p>
      </div>
      <div className="flex items-center gap-5">
        <div className="text-right">
          <p className="text-xs text-slate-400">Checkride</p>
          <p className="mt-1 text-sm font-bold text-slate-900">{days === null ? "Date not set" : days < 0 ? "Update date" : `${days} day${days === 1 ? "" : "s"}`}</p>
        </div>
        <Link href="/profile" className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-950">Edit profile</Link>
      </div>
    </section>
  );
}
