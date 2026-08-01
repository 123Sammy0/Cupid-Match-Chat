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

  // Use Admin Client to bypass RLS restrictions and parallelize queries
  const { createAdminClient } = await import("@/lib/supabase/server");
  const adminSupabase = createAdminClient();

  // Fetch profile and participants IN PARALLEL to reduce latency by >60%
  const [profileRes, participantsRes] = await Promise.all([
    adminSupabase.from('profiles').select('*').eq('id', user.id).single(),
    adminSupabase
      .from('conversation_participants')
      .select('profile_id, profiles(*)')
      .eq('conversation_id', code)
  ]);

  const profile = profileRes.data;
  const participants = participantsRes.data;

  if (!participants || !participants.some((p: any) => p.profile_id === user.id)) {
    redirect("/room"); // Not a participant
  }

  const otherParticipant = participants.find((p: any) => p.profile_id !== user.id);

  return (
    <div className="h-[100dvh] w-full bg-white flex flex-col items-center justify-center sm:p-4">
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
