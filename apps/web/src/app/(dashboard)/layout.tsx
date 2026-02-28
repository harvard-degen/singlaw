import { TRPCProvider } from "@/lib/trpc/provider";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TRPCProvider>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <header className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard/chat" className="font-semibold text-slate-900">
              SingLaw AI
            </Link>
            <nav className="flex items-center gap-4 text-sm text-slate-600">
              <Link
                href="/dashboard/chat"
                className="hover:text-slate-900 transition-colors"
              >
                Research
              </Link>
              <Link
                href="/dashboard/history"
                className="hover:text-slate-900 transition-colors"
              >
                History
              </Link>
            </nav>
          </div>
          <UserButton afterSignOutUrl="/" />
        </header>
        <main className="flex-1 flex flex-col">{children}</main>
      </div>
    </TRPCProvider>
  );
}
