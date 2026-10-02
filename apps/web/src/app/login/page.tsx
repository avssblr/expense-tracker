"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  Eye,
  EyeOff,
  LockKeyhole,
  PieChart,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  WalletCards,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setError(null);

    try {
      const response =
        await fetch("/api/auth/login", {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email,
            password,
          }),
        });

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ??
            "Unable to sign in",
        );

        return;
      }

      window.location.replace("/");
    } catch (error) {
      console.error(
        "Login failed:",
        error,
      );

      setError(
        "Unable to connect to the server",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-cyan-100 via-indigo-100 to-fuchsia-100">
      {/* Decorative background */}
      <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-cyan-300/40 blur-3xl" />

      <div className="absolute left-1/3 top-10 h-72 w-72 rounded-full bg-indigo-300/30 blur-3xl" />

      <div className="absolute -bottom-28 -right-20 h-96 w-96 rounded-full bg-fuchsia-300/40 blur-3xl" />

      <div className="absolute bottom-1/3 right-1/4 h-56 w-56 rounded-full bg-amber-200/30 blur-3xl" />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
        <div className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 shadow-[0_30px_80px_rgba(79,70,229,0.20)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]">

          {/* LEFT PANEL */}
          <section className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-700 via-violet-600 to-fuchsia-600 p-10 text-white lg:flex lg:flex-col lg:justify-between">

            {/* Decorative circles */}
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-400/30 blur-2xl" />

            <div className="absolute -bottom-16 -left-16 h-72 w-72 rounded-full bg-pink-400/30 blur-3xl" />

            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 shadow-lg backdrop-blur">
                  <WalletCards
                    size={30}
                    aria-hidden="true"
                  />
                </div>

                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-indigo-50 backdrop-blur">
                  SMART HOUSEHOLD FINANCE
                </span>
              </div>

              <h1 className="mt-8 text-5xl font-bold leading-[1.08] tracking-tight">
                Household
                <br />
                Expense
                <span className="block bg-gradient-to-r from-cyan-200 via-white to-pink-200 bg-clip-text text-transparent">
                  Tracker
                </span>
              </h1>

              <p className="mt-5 max-w-md text-base leading-7 text-indigo-100">
                Keep your household money organised,
                understand where it goes, and stay in
                control of monthly spending.
              </p>

              {/* Feature chips */}
              <div className="mt-7 flex flex-wrap gap-2">
                <span className="rounded-full bg-cyan-400/20 px-3 py-1.5 text-xs font-medium text-cyan-50">
                  Monthly budgets
                </span>

                <span className="rounded-full bg-pink-400/20 px-3 py-1.5 text-xs font-medium text-pink-50">
                  Expense insights
                </span>

                <span className="rounded-full bg-amber-300/20 px-3 py-1.5 text-xs font-medium text-amber-50">
                  Category tracking
                </span>
              </div>
            </div>

            {/* Decorative mini dashboard */}
            <div className="relative mt-10 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-lg backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <div className="rounded-xl bg-cyan-300/20 p-2">
                      <TrendingUp
                        size={19}
                        className="text-cyan-100"
                      />
                    </div>

                    <span className="text-xs text-indigo-100">
                      Overview
                    </span>
                  </div>

                  <p className="mt-4 text-sm text-indigo-100">
                    Monthly balance
                  </p>

                  <p className="mt-1 text-2xl font-bold">
                    Stay informed
                  </p>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-lg backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <div className="rounded-xl bg-pink-300/20 p-2">
                      <PieChart
                        size={19}
                        className="text-pink-100"
                      />
                    </div>

                    <span className="text-xs text-indigo-100">
                      Insights
                    </span>
                  </div>

                  <p className="mt-4 text-sm text-indigo-100">
                    Spending
                  </p>

                  <p className="mt-1 text-2xl font-bold">
                    See the pattern
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-gradient-to-r from-white/15 to-white/5 p-4 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-emerald-300/20 p-2">
                    <ShieldCheck
                      size={19}
                      className="text-emerald-100"
                    />
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      Private household access
                    </p>

                    <p className="mt-1 text-xs text-indigo-100">
                      Your dashboard is available only
                      after secure sign-in.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT LOGIN PANEL */}
          <section className="relative p-6 sm:p-10 lg:p-12">
            <div className="absolute right-8 top-8 hidden h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-100 to-indigo-100 lg:block" />

            <div className="relative mx-auto max-w-md">

              {/* Mobile branding */}
              <div className="mb-7 flex items-center gap-3 lg:hidden">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white shadow-lg">
                  <WalletCards
                    size={25}
                    aria-hidden="true"
                  />
                </div>

                <div>
                  <p className="font-bold text-gray-900">
                    Household Expense Tracker
                  </p>

                  <p className="text-xs text-indigo-500">
                    Your household finance dashboard
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-50 to-fuchsia-50 px-3 py-1.5 text-xs font-semibold text-indigo-600">
                <Sparkles size={14} />
                Welcome back
              </div>

              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Sign in to your
                <span className="block bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                  household dashboard
                </span>
              </h2>

              <p className="mt-3 text-sm leading-6 text-gray-500">
                Track expenses, budgets and monthly
                insights from one colourful dashboard.
              </p>

              <form
                onSubmit={handleSubmit}
                className="mt-8 space-y-5"
              >
                {/* Email */}
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">
                    Email address
                  </span>

                  <input
                    type="email"
                    required
                    autoComplete="username"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value,
                      )
                    }
                    placeholder="you@example.com"
                    className="w-full rounded-2xl border border-indigo-100 bg-gradient-to-r from-white to-indigo-50/40 px-4 py-3.5 text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  />
                </label>

                {/* Password */}
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">
                    Password
                  </span>

                  <div className="relative">
                    <LockKeyhole
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-violet-500"
                      aria-hidden="true"
                    />

                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) =>
                        setPassword(
                          event.target.value,
                        )
                      }
                      placeholder="Enter your password"
                      className="w-full rounded-2xl border border-violet-100 bg-gradient-to-r from-white to-violet-50/40 py-3.5 pl-11 pr-12 text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (current) =>
                            !current,
                        )
                      }
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      title={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-gray-400 transition hover:bg-violet-50 hover:text-violet-600"
                    >
                      {showPassword ? (
                        <EyeOff
                          size={18}
                        />
                      ) : (
                        <Eye
                          size={18}
                        />
                      )}
                    </button>
                  </div>
                </label>

                {error && (
                  <div
                    role="alert"
                    className="rounded-2xl border border-red-100 bg-gradient-to-r from-red-50 to-pink-50 px-4 py-3 text-sm text-red-700"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-4 py-4 font-semibold text-white shadow-xl shadow-violet-200 transition hover:-translate-y-0.5 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="relative z-10">
                    {loading
                      ? "Signing in..."
                      : "Sign In"}
                  </span>

                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-indigo-600 to-pink-500 opacity-0 transition group-hover:opacity-100" />
                </button>
              </form>

              <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-400">
                <ShieldCheck
                  size={14}
                  className="text-emerald-500"
                />

                Secure household access
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}