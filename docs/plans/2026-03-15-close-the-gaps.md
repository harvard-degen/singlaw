# Close the Gaps — Demo-Ready Sprint

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the 4 gaps blocking Singlaw from being demo-able to lawyers: billing page, Stripe success handling, subscription error UX, and deployment configs.

**Architecture:** The app is code-complete at the feature level. This sprint adds the connective tissue — the billing page that Stripe redirects to, the error state that expired trial users see, and the deployment configs that make it accessible on the internet. The FAISS index (Singapore law PDFs) is an ops task handled separately.

**Tech Stack:** Next.js 15, tRPC, Clerk, Stripe, Prisma (Neon), Tailwind CSS, Flask on Fly.io, Vercel

---

## Current State Diagram

```
User journey gaps (❌ = crashes or dead end today):

Sign up → Trial active → /dashboard/chat ✅ works
                       → asks question → FAISS empty → RAG error ⚠️ (ops, not code)

Trial expires → /dashboard/chat → page loads → asks question
              → tRPC FORBIDDEN "SUBSCRIPTION_REQUIRED"
              → ChatBox crashes / raw error shown ❌
              → user has no path to /billing ❌

Stripe checkout → success → /dashboard/chat?checkout=success
              → page loads, ?success param silently ignored ❌
              → no confirmation toast ❌

Stripe checkout → cancel → /billing ❌ (page doesn't exist)

Missing billing page → no "Manage subscription" link anywhere in UI ❌
```

---

## Task 1: Billing Page

**Files:**
- Create: `apps/web/src/app/(dashboard)/billing/page.tsx`
- Modify: `apps/web/src/app/(dashboard)/layout.tsx` (add Billing nav link)

**What it does:** Shows subscription status, trial days remaining, upgrade CTA, and a "Manage subscription" button (Stripe portal). This is where Stripe's cancel_url lands and where expired-trial users should be redirected.

**Step 1: Write the failing test**

```tsx
// apps/web/src/app/(dashboard)/billing/page.tsx must render without crashing
// Manual test — no unit test needed for a server component page.
// Verify with: npm run dev → navigate to /dashboard/billing
```

**Step 2: Create billing page**

```tsx
// apps/web/src/app/(dashboard)/billing/page.tsx
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  isSubscriptionActive,
  getTrialDaysRemaining,
  PLAN_PRICE_SGD,
  TRIAL_DAYS,
} from "@/lib/subscription";
import { BillingCard } from "@/components/billing/BillingCard";

export default async function BillingPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  const user = await db.user.findUnique({ where: { clerkId: clerkUser.id } });
  if (!user) redirect("/sign-in");

  const active = isSubscriptionActive(
    user.subscriptionStatus,
    user.trialEndsAt,
    user.subscriptionEndsAt
  );
  const trialDaysLeft = getTrialDaysRemaining(user.trialEndsAt);

  return (
    <div className="flex-1 p-6 max-w-2xl mx-auto w-full">
      <h1 className="text-2xl font-semibold text-slate-800 mb-8">
        Billing
      </h1>
      <BillingCard
        status={user.subscriptionStatus}
        isActive={active}
        trialDaysLeft={trialDaysLeft}
        subscriptionEndsAt={user.subscriptionEndsAt?.toISOString() ?? null}
        hasStripeCustomer={!!user.stripeCustomerId}
        priceSgd={PLAN_PRICE_SGD}
        trialDays={TRIAL_DAYS}
      />
    </div>
  );
}
```

**Step 3: Create BillingCard component**

```tsx
// apps/web/src/components/billing/BillingCard.tsx
"use client";
import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { SubscriptionStatus } from "@prisma/client";

interface Props {
  status: SubscriptionStatus;
  isActive: boolean;
  trialDaysLeft: number;
  subscriptionEndsAt: string | null;
  hasStripeCustomer: boolean;
  priceSgd: number;
  trialDays: number;
}

export function BillingCard({
  status,
  isActive,
  trialDaysLeft,
  subscriptionEndsAt,
  hasStripeCustomer,
  priceSgd,
  trialDays,
}: Props) {
  const [loading, setLoading] = useState(false);

  const checkout = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: ({ url }) => { if (url) window.location.href = url; },
  });

  const portal = trpc.billing.getPortalUrl.useMutation({
    onSuccess: ({ url }) => { if (url) window.location.href = url; },
  });

  const handleUpgrade = async () => {
    setLoading(true);
    checkout.mutate();
  };

  const handlePortal = async () => {
    setLoading(true);
    portal.mutate();
  };

  const statusLabel = {
    TRIAL: `Free trial — ${trialDaysLeft} day${trialDaysLeft !== 1 ? "s" : ""} left`,
    ACTIVE: "Active subscription",
    EXPIRED: "Trial ended",
    CANCELLED: "Cancelled",
  }[status] ?? status;

  return (
    <div className="border border-slate-200 rounded-2xl p-8 bg-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-sm text-slate-500 mb-1">Current plan</div>
          <div className="font-semibold text-slate-900">
            SingLaw AI — S${priceSgd}/month
          </div>
        </div>
        <span
          className={`text-xs font-medium px-3 py-1 rounded-full ${
            isActive
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="text-sm text-slate-600 mb-8">{statusLabel}</div>

      {status === "ACTIVE" && subscriptionEndsAt && (
        <p className="text-xs text-slate-400 mb-8">
          Renews {new Date(subscriptionEndsAt).toLocaleDateString("en-SG")}
        </p>
      )}

      {/* CTA */}
      {status === "TRIAL" || status === "EXPIRED" || status === "CANCELLED" ? (
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {status === "TRIAL"
            ? `Subscribe — S$${priceSgd}/month`
            : "Reactivate subscription"}
        </button>
      ) : (
        <button
          onClick={handlePortal}
          disabled={loading}
          className="w-full border border-slate-200 text-slate-700 py-3 rounded-xl font-semibold hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          Manage subscription
        </button>
      )}

      {status === "TRIAL" && (
        <p className="text-xs text-slate-400 mt-3 text-center">
          {trialDays}-day free trial. No charge until you subscribe.
        </p>
      )}
    </div>
  );
}
```

**Step 4: Add Billing link to dashboard nav**

In `apps/web/src/app/(dashboard)/layout.tsx`, add after the History link:

```tsx
<Link
  href="/dashboard/billing"
  className="hover:text-slate-900 transition-colors"
>
  Billing
</Link>
```

**Step 5: Smoke test**

```
Run: npm run dev (from apps/web/)
Navigate to: http://localhost:3000/dashboard/billing
Expected: Billing card renders with status, no crash
```

**Step 6: Commit**

```bash
git add apps/web/src/app/(dashboard)/billing/page.tsx \
        apps/web/src/components/billing/BillingCard.tsx \
        apps/web/src/app/(dashboard)/layout.tsx
git commit -m "feat: add billing page with subscription status and upgrade CTA"
```

---

## Task 2: Handle Stripe Checkout Success + Subscription Error in ChatBox

**Files:**
- Modify: `apps/web/src/components/chat/ChatBox.tsx`

**What it does:**
1. When `?checkout=success` is in the URL, show a success banner ("You're now subscribed!")
2. When the tRPC `ask` mutation returns `FORBIDDEN: SUBSCRIPTION_REQUIRED`, show a prompt to go to `/billing` instead of crashing

**Step 1: Read the current ChatBox**

```bash
cat apps/web/src/components/chat/ChatBox.tsx
```

**Step 2: Add checkout success banner**

At the top of `ChatBox`, read `searchParams` for `checkout`:

```tsx
// ChatBox.tsx — add these imports
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Inside the component, add:
const searchParams = useSearchParams();
const router = useRouter();
const [showSuccess, setShowSuccess] = useState(
  searchParams.get("checkout") === "success"
);

useEffect(() => {
  if (showSuccess) {
    // Clean the URL without a reload
    router.replace("/dashboard/chat", { scroll: false });
    const timer = setTimeout(() => setShowSuccess(false), 5000);
    return () => clearTimeout(timer);
  }
}, [showSuccess, router]);

// In JSX, add above the chat input:
{showSuccess && (
  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
    You&apos;re subscribed! Welcome to SingLaw AI.
  </div>
)}
```

**Step 3: Handle SUBSCRIPTION_REQUIRED error**

In the tRPC mutation error handler inside ChatBox:

```tsx
// Where the ask mutation is defined, add onError:
const askMutation = trpc.query.ask.useMutation({
  onError: (error) => {
    if (error.message === "SUBSCRIPTION_REQUIRED") {
      router.push("/dashboard/billing");
    } else {
      setError(error.message);
    }
  },
  onSuccess: (data) => {
    // existing success handler
  },
});
```

**Step 4: Smoke test**

```
1. Visit /dashboard/chat?checkout=success
   Expected: green banner appears, disappears after 5s, URL cleaned
2. Simulate SUBSCRIPTION_REQUIRED (set user.subscriptionStatus = EXPIRED in DB)
   Expected: submit question → redirected to /billing
```

**Step 5: Commit**

```bash
git add apps/web/src/components/chat/ChatBox.tsx
git commit -m "feat: handle checkout success banner and subscription-expired redirect in chat"
```

---

## Task 3: Deployment — Flask on Fly.io

**Files:**
- Create: `apps/rag-service/fly.toml`

**What it does:** Deploys the Flask RAG service to Fly.io so it has a stable HTTPS URL that Next.js can call.

**Prereqs:**
- Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
- `fly auth login`
- Have `.env` ready with `DEEPSEEK_API_KEY`, `OPENROUTER_API_KEY`, `GROQ_API_KEY`, `RAG_API_KEY`

**Step 1: Create fly.toml**

```toml
# apps/rag-service/fly.toml
app = "singlaw-rag"
primary_region = "sin"   # Singapore

[build]
  dockerfile = "Dockerfile"

[http_service]
  internal_port = 8000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  memory = "2gb"
  cpus = 2
```

**Step 2: Launch app on Fly**

```bash
cd apps/rag-service
fly launch --no-deploy --name singlaw-rag
fly secrets set \
  RAG_API_KEY=<your-secret> \
  DEEPSEEK_API_KEY=<key> \
  OPENROUTER_API_KEY=<key> \
  GROQ_API_KEY=<key>
```

**Step 3: Upload FAISS index as a Fly volume**

```bash
# Create a persistent volume for the index
fly volumes create faiss_data --size 5 --region sin

# Add to fly.toml:
[mounts]
  source = "faiss_data"
  destination = "/data/faiss"

# Set env var to point to volume
fly secrets set FAISS_INDEX_PATH=/data/faiss/faiss_index_bgem3

# After deploy, copy index files up:
fly sftp shell
# then: put faiss_index_bgem3/index.faiss /data/faiss/faiss_index_bgem3/index.faiss
# then: put faiss_index_bgem3/index.pkl   /data/faiss/faiss_index_bgem3/index.pkl
```

**Step 4: Deploy**

```bash
fly deploy
```

**Step 5: Verify**

```bash
curl https://singlaw-rag.fly.dev/health
# Expected: {"status": "ok"}

curl -X POST https://singlaw-rag.fly.dev/api/ask \
  -H "X-API-Key: <your-secret>" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the Employment Act?"}'
# Expected: JSON with answer, citations, provider
```

**Step 6: Commit fly.toml**

```bash
git add apps/rag-service/fly.toml
git commit -m "feat: add Fly.io deployment config for RAG service (sin region)"
```

---

## Task 4: Deployment — Next.js on Vercel

**Files:**
- Create: `apps/web/.env.production.example`
- Create: `vercel.json` (root)

**Step 1: Create vercel.json at repo root**

```json
{
  "buildCommand": "cd apps/web && npm run build",
  "outputDirectory": "apps/web/.next",
  "installCommand": "cd apps/web && npm install",
  "framework": "nextjs"
}
```

**Step 2: Create .env.production.example**

```bash
# apps/web/.env.production.example
# Copy to .env.local for local dev, set as Vercel env vars for production

DATABASE_URL=postgresql://...          # Neon or Supabase connection string
DIRECT_URL=postgresql://...            # Direct (non-pooled) for Prisma migrations

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...

STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...

RAG_SERVICE_URL=https://singlaw-rag.fly.dev
RAG_API_KEY=<same-secret-as-fly>

NEXT_PUBLIC_APP_URL=https://singlaw.ai
```

**Step 3: Push to GitHub and deploy via Vercel dashboard**

```
1. Go to vercel.com → New Project → Import from GitHub
2. Select the singlaw.ai repo
3. Set all env vars from .env.production.example
4. Deploy
```

**Step 4: Run Prisma migrations on production DB**

```bash
cd apps/web
DATABASE_URL=<production-url> npx prisma migrate deploy
```

**Step 5: Verify end-to-end**

```
1. Visit https://singlaw.ai (or Vercel preview URL)
2. Sign up → 21-day trial starts
3. Ask a question → answer returned with citations
4. Go to /dashboard/billing → subscription card renders
5. Click "Subscribe" → Stripe checkout opens
6. Complete checkout → redirect back → success banner shows
```

**Step 6: Commit**

```bash
git add vercel.json apps/web/.env.production.example
git commit -m "feat: add Vercel deployment config and production env example"
```

---

## NOT in scope

| Item | Reason deferred |
|---|---|
| FAISS index build | Ops task — needs Singapore law PDFs (33k docs). Run `build_index.py` separately. |
| `llm_providers.py` DRY refactor | Tracked in TODOS.md |
| Agentic workflows / multi-turn | Phase 2 per proposal |
| On-prem deployment (Tier 2) | Phase 2 per proposal |
| Email notifications | Not needed for demo |
| Rate limiting at infra level | tRPC query limit handles this for now |

---

## Failure Modes

| Failure | Test | Handler | Silent? |
|---|---|---|---|
| Stripe cancel → `/billing` doesn't exist | Task 1 fixes this | Page now exists | Was silent (404) |
| SUBSCRIPTION_REQUIRED crashes ChatBox | Task 2 fixes this | Redirect to /billing | Was silent |
| FAISS index missing → RAG returns 500 | Existing try/catch in app.py | Returns error JSON | No — shows error |
| Fly deploy fails due to missing volume | Manual verify step | fly logs shows clearly | No |
| Prisma migrate fails on production DB | Step 4 of Task 4 | migrate deploy exits non-zero | No |

---

## Execution Order

```
Task 1 (billing page)     → local dev → commit
Task 2 (ChatBox patches)  → local dev → commit
Task 3 (Fly deploy)       → needs FAISS index first ideally, but can deploy without
Task 4 (Vercel deploy)    → after Task 3 (needs RAG_SERVICE_URL)
```
