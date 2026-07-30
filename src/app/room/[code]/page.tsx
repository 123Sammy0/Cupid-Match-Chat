import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ChatClient from "./ChatClient";

export default async function ChatRoomPage({ params }: { params: any }) {
  const resolvedParams = await Promise.resolve(params);
  const code = resolvedParams.code;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  // Use Admin Client to bypass RLS restrictions
  const { createAdminClient } = await import("@/lib/supabase/server");
  const adminSupabase = createAdminClient();

  // Verify participant and fetch other user
  const { data: participants, error } = await adminSupabase
    .from('conversation_participants')
    .select('profile_id, profiles(username)')
    .eq('conversation_id', code);

  console.log("Chat room debug:", { code, userId: user.id, participantsLength: participants?.length, error });

  if (!participants || !participants.some(p => p.profile_id === user.id)) {
    console.error("Redirecting to /room because not a participant");
    redirect("/room"); // Not a participant
  }

  const otherParticipant = participants.find(p => p.profile_id !== user.id);

  return (
    <div className="h-screen w-full bg-white flex flex-col items-center justify-center sm:p-4">
      <div className="w-full max-w-[450px] h-full sm:h-[90vh] sm:rounded-[32px] overflow-hidden flex flex-col bg-white border border-gray-100 shadow-xl relative">
        <ChatClient 
          conversationId={code} 
          user={user} 
          profile={profile} 
          otherUser={otherParticipant ? { id: otherParticipant.profile_id, ...(otherParticipant.profiles as any) } : null} 
        />
      </div>
    </div>
  );
}
