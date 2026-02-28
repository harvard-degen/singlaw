import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard/chat");

  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-slate-100 px-6 py-4 flex justify-between items-center max-w-6xl mx-auto">
        <span className="font-bold text-slate-900 text-lg">SingLaw AI</span>
        <div className="flex gap-4">
          <Link
            href="/sign-in"
            className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="text-sm bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            Start free trial
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 text-sm bg-slate-100 text-slate-600 rounded-full px-3 py-1 mb-6">
          <span className="w-2 h-2 bg-green-500 rounded-full" />
          33,000+ pages of Singapore legal documents indexed
        </div>
        <h1 className="text-5xl font-bold text-slate-900 leading-tight mb-6">
          Singapore legal research,{" "}
          <span className="text-blue-600">answered in seconds</span>
        </h1>
        <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto">
          Ask questions in plain English. Get answers with citations from Singapore
          statutes, case law, and regulations — powered by AI trained on local legal
          documents.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/sign-up"
            className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Start 21-day free trial
          </Link>
          <p className="text-slate-400 text-sm self-center">
            No credit card required
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Cited answers",
              desc: "Every answer links back to the exact statute, case, or section. No hallucinations without a paper trail.",
            },
            {
              title: "Local corpus",
              desc: "Trained on Singapore-specific documents: SGHC, SGCA, statutes, subsidiary legislation.",
            },
            {
              title: "Research aid",
              desc: "Not a replacement for legal advice. A tool to cut research time from hours to minutes.",
            },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-xl p-6 border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-md mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Simple pricing</h2>
        <p className="text-slate-500 mb-8">One plan. Full access. Cancel anytime.</p>
        <div className="border border-slate-200 rounded-2xl p-8">
          <div className="text-4xl font-bold text-slate-900 mb-1">
            S$29<span className="text-lg font-normal text-slate-400">/mo</span>
          </div>
          <p className="text-slate-500 text-sm mb-6">21-day free trial, no card required</p>
          <ul className="text-sm text-slate-600 space-y-2 text-left mb-8">
            {[
              "Unlimited questions (fair use)",
              "Citations on every answer",
              "33,000+ Singapore legal pages",
              "Query history",
              "Cancel anytime",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="text-green-500">✓</span> {item}
              </li>
            ))}
          </ul>
          <Link
            href="/sign-up"
            className="block w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Start free trial
          </Link>
        </div>
        <p className="text-xs text-slate-400 mt-4">
          AI-generated research aid. Not a substitute for legal advice.
        </p>
      </section>
    </main>
  );
}
