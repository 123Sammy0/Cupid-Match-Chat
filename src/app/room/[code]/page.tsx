"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ChatClient from "./ChatClient";
import { createClient } from "@/lib/supabase/client";
import { getProfile } from "@/app/actions/settings";
import { getConversationDetails } from "@/app/actions/chat";

export default function ChatRoomPage({ params }: { params: any }) {
  const resolvedParams = use(params) as any;
  const code = resolvedParams.code;
  const router = useRouter();

  // Initialize from cache to enable instant rendering
  const [data, setData] = useState<{ user: any; profile: any; otherUser: any } | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cachedProfileStr = sessionStorage.getItem("cupid_cache_profile");
        const cachedOtherUserStr = sessionStorage.getItem(`cupid_other_user_${code}`);
        
        if (cachedProfileStr) {
          const profile = JSON.parse(cachedProfileStr);
          // Assuming user.id == profile.id
          const user = { id: profile.id }; 
          const otherUser = cachedOtherUserStr ? JSON.parse(cachedOtherUserStr) : null;
          return { user, profile, otherUser };
        }
      } catch (e) {}
    }
    return null;
  });

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Fetch fresh data in the background or if cache is missing
    const loadFresh = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }
      
      let profile = data?.profile;
      if (!profile) {
        profile = await getProfile();
        if (!profile) return;
      }

      let otherUser = data?.otherUser;
      if (!otherUser) {
        const res = await getConversationDetails(code);
        if (!res.success) {
          router.push("/room"); // Redirect if not a participant or error
          return;
        }
        otherUser = res.otherUser;
        try {
          if (otherUser) {
            sessionStorage.setItem(`cupid_other_user_${code}`, JSON.stringify(otherUser));
          }
        } catch (e) {}
      }
      
      // Update state with fresh data
      setData(prev => ({ user, profile, otherUser }));
    };
    
    loadFresh();
  }, [code, router]);

  // Render ChatClient immediately. 
  // If we are on the server or data is not yet available, pass a placeholder user so ChatClient can render its native skeleton.
  if (!isClient || !data || !data.user) {
    return (
      <div className="fixed inset-0 w-full bg-white flex flex-col items-center justify-center sm:static sm:h-[100dvh] sm:p-4 overflow-hidden">
        <div className="w-full max-w-[450px] h-full sm:h-[90vh] sm:rounded-[32px] overflow-hidden flex flex-col bg-white sm:border sm:border-gray-100 sm:shadow-xl relative">
          <ChatClient 
            conversationId={code} 
            user={{ id: 'loading' }} 
            profile={null} 
            otherUser={null} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full bg-white flex flex-col items-center justify-center sm:static sm:h-[100dvh] sm:p-4 overflow-hidden">
      <div className="w-full max-w-[450px] h-full sm:h-[90vh] sm:rounded-[32px] overflow-hidden flex flex-col bg-white sm:border sm:border-gray-100 sm:shadow-xl relative">
        <ChatClient 
          conversationId={code} 
          user={data.user} 
          profile={data.profile} 
          otherUser={data.otherUser} 
        />
      </div>
    </div>
  );
}
