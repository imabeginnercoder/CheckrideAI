"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { aircraftOptions, daysUntilDate, mergeProfileWithUserMetadata, type Profile } from "@/lib/profile";
import { supabase } from "@/lib/supabase/client";
import { authErrorMessage, isMissingDatabaseColumn, profileErrorMessage } from "@/lib/user-facing-errors";
import { useAuth } from "../components/AuthProvider";
import FormStatus from "../components/FormStatus";
import ProtectedAppShell from "../components/ProtectedAppShell";

type UsageSummary = {
  request_count: number;
  input_tokens: number;
  output_tokens: number;
  estimated_cost_microusd: number;
};

function ProfileContent() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile>({
    id: user.id,
    display_name: "",
    checkride_date: null,
    preferred_aircraft: "Cessna 172S",
  });
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [statusTone, setStatusTone] = useState<"error" | "success">("error");

  useEffect(() => {
    const load = async () => {
      const usagePromise = supabase.rpc("get_my_ai_usage_summary");
      let profileResult = await supabase.from("profiles").select("id, display_name, checkride_date, preferred_aircraft, onboarding_completed").eq("id", user.id).maybeSingle();
      if (isMissingDatabaseColumn(profileResult.error, "onboarding_completed")) {
        profileResult = await supabase.from("profiles").select("id, display_name, checkride_date, preferred_aircraft").eq("id", user.id).maybeSingle();
      }
      const usageResult = await usagePromise;

      const repairedProfile = mergeProfileWithUserMetadata(profileResult.data as Profile | null, user);
      setProfile(repairedProfile);

      if (!profileResult.data || JSON.stringify(profileResult.data) !== JSON.stringify(repairedProfile)) {
        const { error: repairError } = await supabase.from("profiles").upsert({
          id: repairedProfile.id,
          display_name: repairedProfile.display_name,
          checkride_date: repairedProfile.checkride_date,
          preferred_aircraft: repairedProfile.preferred_aircraft,
        }, { onConflict: "id" });
        if (repairError) {
          setStatusTone("error");
          setStatus(profileErrorMessage("save"));
        }
      }

      if (usageResult.data?.[0]) setUsage(usageResult.data[0] as UsageSummary);
      if (profileResult.error) {
        setStatusTone("error");
        setStatus(profileErrorMessage("load"));
      }
      setLoading(false);
    };

    load();
  }, [user]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setStatus("");
    setStatusTone("error");

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      display_name: profile.display_name?.trim() || null,
      checkride_date: profile.checkride_date || null,
      preferred_aircraft: profile.preferred_aircraft,
    });

    let metadataError = null;
    if (!profileError) {
      const result = await supabase.auth.updateUser({
        data: {
          display_name: profile.display_name?.trim() || null,
          checkride_date: profile.checkride_date || null,
          preferred_aircraft: profile.preferred_aircraft,
        },
      });
      metadataError = result.error;
    }

    if (profileError) {
      setStatus(profileErrorMessage("save"));
    } else if (metadataError) {
      setStatus(authErrorMessage(metadataError, "Your profile was saved, but account preferences could not be synchronized."));
    } else {
      setStatusTone("success");
      setStatus("Profile saved. Future oral sessions will use this aircraft.");
    }
    setSaving(false);
  };

  const daysRemaining = daysUntilDate(profile.checkride_date);
  const estimatedCost = usage ? usage.estimated_cost_microusd / 1_000_000 : 0;

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-8">
        <Link href="/dashboard" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to dashboard
        </Link>
        <h1 className="text-2xl font-bold text-slate-950">Profile and study plan</h1>
        <p className="mt-1 text-sm text-slate-500">Keep your aircraft and checkride timeline current.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <form onSubmit={save} className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-bold text-slate-900">Study profile</h2>
          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="profile-name" className="mb-1.5 block text-sm font-medium text-slate-700">Name</label>
              <input id="profile-name" value={profile.display_name ?? ""} onChange={(event) => setProfile((current) => ({ ...current, display_name: event.target.value }))} disabled={loading} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-500 disabled:bg-slate-50" />
            </div>
            <div>
              <label htmlFor="profile-aircraft" className="mb-1.5 block text-sm font-medium text-slate-700">Preferred aircraft</label>
              <select id="profile-aircraft" value={profile.preferred_aircraft} onChange={(event) => setProfile((current) => ({ ...current, preferred_aircraft: event.target.value }))} disabled={loading} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 disabled:bg-slate-50">
                {aircraftOptions.map((aircraft) => <option key={aircraft}>{aircraft}</option>)}
              </select>
              <p className="mt-1.5 text-xs leading-5 text-slate-400">The AI examiner uses this for systems questions and reminds you when an answer depends on your exact POH.</p>
            </div>
            <div>
              <label htmlFor="profile-date" className="mb-1.5 block text-sm font-medium text-slate-700">Checkride date</label>
              <input id="profile-date" type="date" value={profile.checkride_date ?? ""} onChange={(event) => setProfile((current) => ({ ...current, checkride_date: event.target.value || null }))} disabled={loading} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-500 disabled:bg-slate-50" />
            </div>
          </div>
          <FormStatus message={status} tone={statusTone} className="mt-4" />
          <button disabled={loading || saving} className="mt-5 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">{saving ? "Saving..." : "Save profile"}</button>
        </form>

        <div className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-slate-950 p-6 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Checkride countdown</p>
            {daysRemaining === null ? (
              <p className="mt-4 text-sm leading-6 text-slate-300">Add a date to turn your study history into a visible timeline.</p>
            ) : daysRemaining < 0 ? (
              <><p className="mt-4 text-4xl font-bold">Date passed</p><p className="mt-2 text-sm text-slate-300">Update your date when the next checkride is scheduled.</p></>
            ) : (
              <><p className="mt-4 text-5xl font-bold">{daysRemaining}</p><p className="mt-1 text-sm text-slate-300">day{daysRemaining === 1 ? "" : "s"} remaining</p></>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-base font-bold text-slate-900">AI usage</h2>
            <dl className="mt-4 grid grid-cols-2 gap-4">
              <div><dt className="text-xs text-slate-400">Requests</dt><dd className="mt-1 text-xl font-bold text-slate-900">{usage?.request_count ?? 0}</dd></div>
              <div><dt className="text-xs text-slate-400">Estimated cost</dt><dd className="mt-1 text-xl font-bold text-slate-900">${estimatedCost.toFixed(4)}</dd></div>
              <div><dt className="text-xs text-slate-400">Input tokens</dt><dd className="mt-1 text-sm font-semibold text-slate-700">{(usage?.input_tokens ?? 0).toLocaleString()}</dd></div>
              <div><dt className="text-xs text-slate-400">Output tokens</dt><dd className="mt-1 text-sm font-semibold text-slate-700">{(usage?.output_tokens ?? 0).toLocaleString()}</dd></div>
            </dl>
            <p className="mt-4 text-xs leading-5 text-slate-400">Cost is an estimate based on the configured model&apos;s standard token pricing.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return <ProtectedAppShell><ProfileContent /></ProtectedAppShell>;
}
