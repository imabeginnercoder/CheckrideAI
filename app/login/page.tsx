"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../utils/supabase";
import { useAuthState } from "../components/AuthProvider";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuthState();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "signin";
  const requestedNext = searchParams.get("next");
  const nextPath = requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
    ? requestedNext
    : "/dashboard";
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const heading = useMemo(() => (
    mode === "signin" ? "Welcome back" : "Create your account"
  ), [mode]);

  useEffect(() => {
    if (!loading && user) router.replace(nextPath);
  }, [loading, nextPath, router, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus("");

    const authCall = mode === "signin"
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password });

    const { data, error } = await authCall;

    if (error) {
      setStatus(error.message);
    } else if (mode === "signup" && !data.session) {
      setStatus("Account created. Check your email to confirm it, then sign in.");
    } else {
      router.replace(nextPath);
    }

    setSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-[#f7f8f6] text-slate-950">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 py-10 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden lg:block">
          <Link href="/" className="mb-10 inline-flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M9 2L15 5.5V12.5L9 16L3 12.5V5.5L9 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M9 5.5V12.5M5.8 9H12.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-950">CheckrideAI</p>
              <p className="text-xs font-medium text-slate-500">Private pilot prep</p>
            </div>
          </Link>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Saved study progress</p>
          <h1 className="mt-3 max-w-md text-4xl font-bold tracking-tight text-slate-950">
            Keep your practice history tied to your checkride plan.
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-slate-600">
            Your dashboard, weak categories, oral summaries, and checklist stay with your account.
          </p>
        </section>

        <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8">
          <div className="mb-7">
            <Link href="/" className="mb-6 flex items-center gap-3 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M9 2L15 5.5V12.5L9 16L3 12.5V5.5L9 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                  <path d="M9 5.5V12.5M5.8 9H12.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </div>
              <span className="text-sm font-bold text-slate-950">CheckrideAI</span>
            </Link>
            <h1 className="text-2xl font-bold text-slate-950">{heading}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {mode === "signin"
                ? "Sign in to continue your PPL prep."
                : "Create an account to save your scores and oral practice."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              />
            </div>

            {status && (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{status}</p>
            )}

            <button
              type="submit"
              disabled={submitting || loading}
              className="w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Working..." : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode((prev) => (prev === "signin" ? "signup" : "signin"));
              setStatus("");
            }}
            className="mt-5 w-full text-center text-sm font-medium text-slate-600 transition hover:text-slate-950"
          >
            {mode === "signin" ? "Need an account? Create one" : "Already have an account? Sign in"}
          </button>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <LoginForm />
    </Suspense>
  );
}
