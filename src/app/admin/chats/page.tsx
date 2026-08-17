import { getConversationsForModeration } from "@/app/actions/admin";
import ChatsClient from "./ChatsClient";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';

export default async function AdminChatsPage() {
  const conversations = await getConversationsForModeration();

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] w-full -m-6 max-w-none bg-zinc-950">
      <Suspense fallback={<div className="p-8 text-slate-500">Loading chats...</div>}>
        <ChatsClient initialConversations={conversations} />
      </Suspense>
    </div>
  );
}
