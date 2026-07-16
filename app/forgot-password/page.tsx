"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    setStatus(error ? error.message : "Check your email for a secure password-reset link.");
    setSubmitting(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f6] p-6">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8">
        <Link href="/login" className="text-sm font-medium text-slate-500 hover:text-slate-950">Back to sign in</Link>
        <h1 className="mt-6 text-2xl font-bold text-slate-950">Reset your password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Enter the email on your account. We will send a one-time reset link.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="recovery-email" className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
            <input id="recovery-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-500" />
          </div>
          {status && <p role="status" className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{status}</p>}
          <button disabled={submitting} className="w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">{submitting ? "Sending..." : "Send reset link"}</button>
        </form>
      </section>
    </main>
  );
}
