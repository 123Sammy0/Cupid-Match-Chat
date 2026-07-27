import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ChatClient from "./ChatClient";

export const runtime = 'edge';


export default async function ChatRoomPage({ params }: { params: { code: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  return (
    <div className="h-screen w-full bg-[#FAF6EE] flex flex-col">
      <ChatClient roomCode={params.code} user={user} profile={profile} />
    </div>
  );
}
