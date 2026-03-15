import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { QUERY_DAILY_LIMIT } from "@/lib/subscription";
import { ChatBox } from "@/components/chat/ChatBox";

export default async function ChatPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  const user = await db.user.findUnique({ where: { clerkId: clerkUser.id } });
  if (!user) redirect("/sign-in");

  return (
    <div className="flex-1 flex flex-col p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-800">
          Singapore Legal Research
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Ask any question about Singapore law. Every answer cites the source
          document and page number.
        </p>
      </div>
      <ChatBox
        queriesUsed={user.queriesThisMonth}
        queryLimit={QUERY_DAILY_LIMIT * 30}
      />
    </div>
  );
}
