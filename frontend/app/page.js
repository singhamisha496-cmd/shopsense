
"use client";

import Link from "next/link";

const features = [
  {
    icon: "▥",
    title: "Sales Analytics",
    description: "Understand revenue, sales trends and marketplace performance.",
    color: "bg-violet-100 text-violet-700",
  },
  {
    icon: "▦",
    title: "Inventory Management",
    description: "Monitor stock levels and manage products efficiently.",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    icon: "♙",
    title: "Vendor Management",
    description: "Manage vendors and organize your marketplace operations.",
    color: "bg-amber-100 text-amber-700",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Navbar */}
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-2xl font-extrabold text-white">
              S
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">
                ShopSense
              </h1>
              <p className="text-[11px] font-medium tracking-wide text-slate-500">
                COMMERCE INTELLIGENCE
              </p>
            </div>
          </Link>

          {/* Login and Sign Up appear only here */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Sign Up
            </Link>
          </div>
        </nav>
      </header>

      {/* Compact hero section */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-violet-50">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-2 lg:gap-12 lg:px-10 lg:py-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 shadow-sm sm:text-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              SMART MARKETPLACE MANAGEMENT
            </span>

            <h2 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-[52px]">
              Your marketplace.
              <span className="mt-1 block text-indigo-600">
                One smart platform.
              </span>
            </h2>

            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
              Manage products, track inventory, coordinate vendors and
              understand marketplace performance through one unified
              commerce analytics platform.
            </p>

            <div className="mt-6 flex flex-wrap gap-5 text-sm font-medium text-slate-600">
              <span>✓ Product management</span>
              <span>✓ Inventory tracking</span>
              <span>✓ Sales insights</span>
            </div>
          </div>

          {/* Small dashboard preview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-indigo-100/70 sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900">
                  Marketplace Overview
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  ShopSense workspace preview
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-xl text-indigo-700">
                ↗
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-indigo-50 p-4">
                <p className="text-xs font-medium text-slate-500">
                  Analytics
                </p>
                <p className="mt-2 text-lg font-bold text-indigo-700">
                  Sales insights
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Understand performance
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-xs font-medium text-slate-500">
                  Inventory
                </p>
                <p className="mt-2 text-lg font-bold text-emerald-700">
                  Stock control
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Monitor availability
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-100 p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-bold">Platform activity</p>
                <span className="text-xs text-slate-400">Preview</span>
              </div>
              <div className="flex h-20 items-end gap-2">
                {[35, 55, 43, 72, 50, 85, 65, 95, 70, 80, 60, 90].map(
                  (height, index) => (
                    <div
                      key={index}
                      className={`flex-1 rounded-t-sm ${
                        index === 7 ? "bg-indigo-600" : "bg-indigo-200"
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  )
                )}
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-slate-400">
                <span>MON</span>
                <span>TUE</span>
                <span>WED</span>
                <span>THU</span>
                <span>FRI</span>
                <span>SAT</span>
                <span>SUN</span>
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-slate-400">
              Illustrative preview — not live sales data
            </p>
          </div>
        </div>
      </section>

      {/* Short feature section */}
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10 lg:py-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
              Built for commerce
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Everything you need, in one place
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-slate-500">
            Simplify daily operations with practical tools for your
            marketplace.
          </p>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl font-bold ${feature.color}`}
              >
                {feature.icon}
              </div>
              <h3 className="mt-4 font-bold text-slate-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Minimal footer; no duplicate buttons */}
      <footer className="border-t border-slate-200 bg-slate-50 px-5 py-5 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <span className="font-bold text-slate-700">ShopSense</span>
          <span>Multi-Vendor Commerce Analytics Platform · © 2026</span>
        </div>
      </footer>
    </main>
  );
}
