"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { authErrorMessage } from "@/lib/user-facing-errors";
import { supabase } from "@/lib/supabase/client";
import FormStatus from "../components/FormStatus";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("");
  const [statusTone, setStatusTone] = useState<"error" | "success">("error");
  const [complete, setComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("");
    setStatusTone("error");

    if (!/(?=.*[A-Za-z])(?=.*\d).{8,}/.test(password)) {
      setStatus("Use at least 8 characters with both a letter and a number.");
      return;
    }
    if (password !== confirmPassword) {
      setStatus("The passwords do not match.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setStatus(error ? authErrorMessage(error, "We could not update your password. Request a new reset link and try again.") : "Password updated successfully.");
    if (!error) setStatusTone("success");
    setComplete(!error);
    setSubmitting(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f6] p-6">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8">
        <h1 className="text-2xl font-bold text-slate-950">Choose a new password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Use at least 8 characters with a letter and a number.</p>
        {complete ? (
          <Link href="/dashboard" className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white">Return to dashboard</Link>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-slate-700">New password</label>
              <div className="relative">
                <input id="new-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="new-password" className="w-full rounded-lg border border-slate-200 py-2.5 pl-3 pr-11 text-sm outline-none focus:border-slate-500" />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>
            <div>
              <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-slate-700">Confirm password</label>
              <input id="confirm-password" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required autoComplete="new-password" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-500" />
            </div>
            <FormStatus message={status} tone={statusTone} />
            <button disabled={submitting} className="w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">{submitting ? "Updating..." : "Update password"}</button>
          </form>
        )}
      </section>
    </main>
  );
}
