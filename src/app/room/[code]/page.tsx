import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ChatClient from "./ChatClient";

export default async function ChatRoomPage({ params }: { params: { code: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  // Verify participant and fetch other user
  const { data: participants } = await supabase
    .from('conversation_participants')
    .select('profile_id, profiles(username, last_seen)')
    .eq('conversation_id', params.code);

  if (!participants || !participants.some(p => p.profile_id === user.id)) {
    redirect("/room"); // Not a participant
  }

  const otherParticipant = participants.find(p => p.profile_id !== user.id);

  return (
    <div className="h-screen w-full bg-[#FAF6EE] flex flex-col items-center justify-center sm:p-4">
      <div className="w-full max-w-[450px] h-full sm:h-[90vh] sm:rounded-[32px] overflow-hidden flex flex-col bg-white border border-gray-100 shadow-xl relative">
        <ChatClient 
          conversationId={params.code} 
          user={user} 
          profile={profile} 
          otherUser={otherParticipant ? { id: otherParticipant.profile_id, ...(otherParticipant.profiles as any) } : null} 
        />
      </div>
    </div>
  );
}
