"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import { useAuthState } from "./AuthProvider";

export default function ProtectedAppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthState();
  const pathname = usePathname();
  const next = pathname && pathname !== "/dashboard" ? `?next=${encodeURIComponent(pathname)}` : "";

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 text-sm text-slate-400">
        Loading CheckrideAI...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-8">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white">
            <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M7 5V9M5 7H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Sign in to continue</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Your practice history, oral sessions, and checklist are saved to your account.
          </p>
          <Link
            href={`/login${next}`}
            className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
