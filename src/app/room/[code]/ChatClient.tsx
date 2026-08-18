"use client";

import type { Session } from "@supabase/supabase-js";
import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { markConversationRead, markConversationDelivered, blockUser, editMessage, deleteMessage, getMessages, sendMessageServer } from "@/app/actions/chat";
import Image from "next/image";
import { CustomAudioPlayer } from "./CustomAudioPlayer";
import AvatarImage from "@/app/components/AvatarImage";
import { LazyImage } from "@/app/components/LazyImage";
import dynamic from 'next/dynamic';
import GifPicker from "@/components/GifPicker";

const CameraModal = dynamic(() => import('./CameraModal'), { ssr: false });
const StickyRushBoard = dynamic(() => import('@/game/components/StickyRushBoard'), { ssr: false });

const MessageContextMenu = ({ m, isMine, onReply, onEdit, onDeleteMe, onDeleteEveryone, onReact }: any) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = popoverRef.current;
    if (!el) return;

    // Reset any prior inline styles
    el.style.top = '';
    el.style.bottom = '';
    el.style.left = '';
    el.style.right = '';
    el.style.transform = '';

    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const MARGIN = 10;
    const COMPOSER_H = 80; // approx composer bar height

    // ── Vertical: prefer above, fallback below, fallback centre ──
    if (rect.top < MARGIN) {
      // clips top → push down
      el.style.top = `${MARGIN - rect.top}px`;
    } else if (rect.bottom > vh - COMPOSER_H) {
      // clips bottom → pull up
      const overflowY = rect.bottom - (vh - COMPOSER_H);
      el.style.marginTop = `-${overflowY}px`;
    }

    // ── Horizontal: keep inside viewport ──
    const rect2 = el.getBoundingClientRect();
    if (rect2.left < MARGIN) {
      el.style.transform = `translateX(${MARGIN - rect2.left}px)`;
    } else if (rect2.right > vw - MARGIN) {
      el.style.transform = `translateX(-${rect2.right - (vw - MARGIN)}px)`;
    }
  }, []);

  return (
    <div
      ref={popoverRef}
      className={`absolute bottom-full mb-2 ${
        isMine ? 'right-0' : 'left-0'
      } z-50 animate-in fade-in zoom-in-95 duration-150 origin-bottom`}
      style={{ minWidth: 192 }}
    >
      {/* Unified glassmorphism card */}
      <div
        style={{
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.55)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.08)',
          borderRadius: 18,
          overflow: 'hidden',
        }}
      >
        {/* ── Reaction emoji row ── */}
        <div className={`flex items-center justify-${isMine ? 'end' : 'start'} gap-0.5 px-2 py-2 border-b border-white/40`}>
          {['❤️', '👍', '😂', '😮', '😢', '🙏'].map(emoji => (
            <button
              key={emoji}
              onClick={(e) => { e.stopPropagation(); onReact(m.id, emoji); }}
              className="text-[22px] w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/8 active:scale-90 transition-all duration-100"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* ── Action rows ── */}
        <div className="flex flex-col text-[13.5px] font-medium text-gray-900">
          <button
            onClick={(e) => { e.stopPropagation(); onReply(); }}
            className="flex items-center gap-2.5 px-4 py-[10px] hover:bg-black/5 active:bg-black/10 transition-colors whitespace-nowrap"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
            Reply
          </button>

          {isMine && m.type === 'text' && !m.is_deleted && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="flex items-center gap-2.5 px-4 py-[10px] hover:bg-black/5 active:bg-black/10 transition-colors whitespace-nowrap border-t border-white/40"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              Edit
            </button>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); onDeleteMe(); }}
            className="flex items-center gap-2.5 px-4 py-[10px] text-red-500 hover:bg-red-50/80 active:bg-red-100/80 transition-colors whitespace-nowrap border-t border-white/40"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            Delete for Me
          </button>

          {isMine && !m.is_deleted && (
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteEveryone(); }}
              className="flex items-center gap-2.5 px-4 py-[10px] text-red-500 hover:bg-red-50/80 active:bg-red-100/80 transition-colors whitespace-nowrap border-t border-white/40"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              Delete for Everyone
            </button>
          )}
        </div>
      </div>
    </div>
  );
};


// Emoji data by category
const EMOJI_CATEGORIES = [
  {
    name: "Smileys",
    icon: "😊",
    emojis: ["😀","😁","😂","🤣","😃","😄","😅","😆","😉","😊","😋","😎","😍","🥰","😘","😗","😙","😚","🙂","🤗","🤩","🤔","🤨","😐","😑","😶","🙄","😏","😣","😥","😮","🤐","😯","😪","😫","🥱","😴","😌","😛","😜","😝","🤤","😒","😓","😔","😕","🙃","🤑","😲","☹️","🙁","😖","😞","😟","😤","😢","😭","😦","😧","😨","😩","🤯","😬","😰","😱","🥵","🥶","😳","🤪","😵","🥴","😷","🤒","🤕"]
  },
  {
    name: "Gestures",
    icon: "👋",
    emojis: ["👋","🤚","🖐️","✋","🖖","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🤝","🙏","✍️","💅","🤳","💪","🦾","🦵","🦶","👂","🦻","👃","🫀","🫁","🧠","🦷","🦴","👀","👁️","👅","👄","💋","🩸"]
  },
  {
    name: "Hearts",
    icon: "❤️",
    emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟","☮️","✝️","☪️","🕉️","☸️","✡️","🔯","🕎","☯️","☦️","🛐","⛎","♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓","🆔","⚛️"]
  },
  {
    name: "Animals",
    icon: "🐶",
    emojis: ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐔","🐧","🐦","🐤","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🐛","🦋","🐌","🐞","🐜","🦟","🦗","🕷️","🦂","🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🐊","🐅","🐆","🦓","🦍","🦧","🦣","🐘","🦛","🦏","🐪","🐫","🦒","🦘","🦬","🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙","🐐","🦌","🐕","🐩","🦮","🐕‍🦺","🐈","🐈‍⬛","🪶","🐓","🦃","🦤","🦚","🦜","🦢","🦩","🕊️","🐇","🦝","🦨","🦡","🦫","🦦","🦥","🐁","🐀","🐿️","🦔"]
  },
  {
    name: "Food",
    icon: "🍔",
    emojis: ["🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🥬","🥒","🌶️","🫑","🥕","🧄","🧅","🥔","🍠","🥐","🥯","🍞","🥖","🥨","🧀","🥚","🍳","🧈","🥞","🧇","🥓","🥩","🍗","🍖","🌭","🍔","🍟","🍕","🫓","🥪","🥙","🧆","🌮","🌯","🫔","🥗","🥘","🫕","🥫","🍱","🍘","🍙","🍚","🍛","🍜","🍝","🍠","🍢","🍣","🍤","🍥","🥮","🍡","🥟","🦪","🍦","🍧","🍨","🍩","🍪","🎂","🍰","🧁","🥧","🍫","🍬","🍭","🍮","🍯","🍼","🥛","☕","🫖","🍵","🧃","🥤","🧋","🍶","🍺","🍻","🥂","🍷","🥃","🍸","🍹","🧉","🍾","🧊","🥄","🍴","🍽️","🥢","🧂"]
  },
  {
    name: "Activities",
    icon: "⚽",
    emojis: ["⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🏓","🏸","🏒","🏑","🥍","🏏","🪃","🥅","⛳","🪁","🎣","🤿","🎽","🎿","🛷","🥌","🎯","🪀","🪆","🎮","🕹️","🎲","🧩","🧸","♟️","🎭","🎨","🎬","🎤","🎧","🎼","🎵","🎶","🎷","🪗","🎸","🎹","🎺","🎻","🥁","🪘","🎙️","🎚️","🎛️","📻","🎞️","📽️","🎥","📷","📸"]
  },
  {
    name: "Travel",
    icon: "✈️",
    emojis: ["🚗","🚕","🚙","🚌","🚎","🏎️","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜","🏍️","🛵","🚲","🛴","🛹","🛼","🚏","🛣️","🛤️","⛽","🚨","🚥","🚦","🛑","🚧","⚓","🪝","⛵","🛶","🚤","🛥️","🛳️","⛴️","🚢","✈️","🛩️","🛫","🛬","🪂","💺","🚁","🚟","🚠","🚡","🛰️","🚀","🛸","🪐","🌍","🌎","🌏","🌐","🗺️","🗾","🧭","🏔️","⛰️","🌋","🗻","🏕️","🏖️","🏜️","🏝️","🏞️","🏟️","🏛️","🏗️","🧱","🏘️","🏚️","🏠","🏡","🏢","🏣","🏤","🏥","🏦","🏨","🏩","🏪","🏫","🏬","🏭","🏯","🏰","💒","🗼","🗽","⛪","🕌","🛕","🕍","⛩️","🕋","⛲","⛺","🌁","🌃","🏙️","🌄","🌅","🌆","🌇","🌉","🌌","🌠","🎇","🎆","🌈","🎑"]
  }
];

export default function ChatClient({ conversationId, user, profile, otherUser }: { conversationId: string, user: any, profile: any, otherUser: any }) {
  // PHASE 1 — Build verification marker (remove after confirming new deploy)
  console.log('[BUILD_CHECK] ChatClient loaded', Date.now());
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [emojiCategory, setEmojiCategory] = useState(0);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const gameIdRef = useRef<string | null>(null);
  const [lastUsedAttachment, setLastUsedAttachment] = useState<'image' | 'video' | 'audio' | 'document' | 'camera'>('image');
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wasLongPressRef = useRef<boolean>(false);
  const [showCallModal, setShowCallModal] = useState<"voice" | "video" | null>(null);
  
  // Smart auto-scroll states
  const isNearBottomRef = useRef(true);
  const shouldForceScrollRef = useRef(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activePreviewImage, setActivePreviewImage] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingLocked, setIsRecordingLocked] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTimeRef = useRef(0);
  const audioSwipeStartX = useRef(0);
  const audioSwipeStartY = useRef(0);
  const [audioSwipeDeltaX, setAudioSwipeDeltaX] = useState(0);
  const [audioSwipeDeltaY, setAudioSwipeDeltaY] = useState(0);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [messageMenu, setMessageMenu] = useState<string | null>(null);
  // Selection Mode
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const longPressTimerRef2 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFiredRef = useRef(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [isSearchingChat, setIsSearchingChat] = useState(false);
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const myTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const theirTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const isTypingRef = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileTypeRef = useRef<"image" | "video" | "audio">("image");
  const docInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  // Swipe-to-reply refs
  const swipeStartX = useRef(0);
  const swipeMessageRef = useRef<any>(null);
  const [swipingId, setSwipingId] = useState<string | null>(null);
  const [swipeDelta, setSwipeDelta] = useState(0);
  // Double-tap quick-react
  const doubleTapRef = useRef<{ id: string; ts: number } | null>(null);
  const singleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [heartAnimId, setHeartAnimId] = useState<string | null>(null);
  // Read receipts & Presence
  const [otherLastRead, setOtherLastRead] = useState<string | null>(null);
  const [otherLastDelivered, setOtherLastDelivered] = useState<string | null>(null);
  const [otherUserLastSeen, setOtherUserLastSeen] = useState<string | null>(otherUser?.last_seen || null);
  const [localMessages, setLocalMessages] = useState<any[]>([]); // Track Sending and Failed messages

  // Lifecycle mount detection
  useEffect(() => {
    return () => console.log('[LIFECYCLE] ChatClient UNMOUNTED');
  }, []);

  // --- Modal History Management ---
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (activePreviewImage && window.location.hash !== '#preview') {
        // Stop the default back navigation and just close the preview
        setActivePreviewImage(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activePreviewImage]);

  const openImagePreview = (url: string) => {
    setActivePreviewImage(url);
    window.history.pushState({ imagePreview: true }, '', window.location.pathname + window.location.search + '#preview');
  };

  const closeImagePreview = () => {
    setActivePreviewImage(null);
    // If we pushed the state when opening, pop it now so history stays clean
    if (window.location.hash === '#preview' || window.history.state?.imagePreview) {
      window.history.back();
    }
  };



  // Cache messages to sessionStorage for instant re-render on navigation
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      try {
        sessionStorage.setItem(`cupid_messages_${conversationId}`, JSON.stringify(messages));
      } catch (e) {}
    }
  }, [messages, conversationId]);

  useEffect(() => {
    if (!conversationId) return;
    if (user?.id === 'loading') return;
    // NOTE: do NOT guard on !otherUser?.id here — that caused mobile to never fetch
    // messages on first load since otherUser arrives slightly after user in page.tsx

    try {
      const cached = sessionStorage.getItem(`cupid_messages_${conversationId}`);
      if (cached) setMessages(JSON.parse(cached));
    } catch (e) {}

    const supabaseClient = supabase;

    // Use server action for reliable message fetching (bypasses browser JWT race condition)
    const fetchMessages = async () => {
      try {
        const result = await getMessages(conversationId);
        if (result.success && result.messages) {
          console.log(`[DIAGNOSTIC] fetchMessages (server) returned ${result.messages.length} messages`);
          setMessages(result.messages);
          setLocalMessages(prev => prev.filter(m => !result.messages.some((d: any) => d.id === m.id)));
          try { sessionStorage.setItem(`cupid_messages_${conversationId}`, JSON.stringify(result.messages)); } catch (e) {}
        } else {
          console.error('[DIAGNOSTIC] fetchMessages server error:', result.error);
          // Fallback: try browser client (might work if session is established)
          const { data } = await supabaseClient
            .from('messages')
            .select('*, profiles(username)')
            .eq('conversation_id', conversationId)
            .order('sent_at', { ascending: true });
          if (data && data.length > 0) {
            console.log(`[DIAGNOSTIC] fetchMessages (browser fallback) returned ${data.length} messages`);
            setMessages(data);
            setLocalMessages(prev => prev.filter(m => !data.some((d: any) => d.id === m.id)));
          }
        }
      } catch (err) {
        console.error('[DIAGNOSTIC] fetchMessages exception:', err);
      }
    };

    const fetchParticipants = async () => {
      const { data } = await supabaseClient
        .from('conversation_participants')
        .select('profile_id, last_read_at, last_delivered_at')
        .eq('conversation_id', conversationId);
      if (data) {
        const otherP = data.find((p: any) => p.profile_id === otherUser?.id);
        if (otherP?.last_read_at) setOtherLastRead(otherP.last_read_at);
        if (otherP?.last_delivered_at) setOtherLastDelivered(otherP.last_delivered_at);
      }
    };

    fetchParticipants();
    fetchMessages();
    markConversationRead(conversationId);

    const handleFocus = () => markConversationRead(conversationId);
    window.addEventListener('focus', handleFocus);

    // Safety-net poll every 15 seconds
    const pollInterval = setInterval(fetchMessages, 15000);

    // ─── REALTIME AUTH: must fully resolve BEFORE channels subscribe ──────────
    // Previous bug: initRealtime() was called without await, so channels
    // subscribed before getSession() resolved — token was never set in time.
    // Fix: wrap everything from here in an async IIFE so we can properly await.
    let roomChannel: any;
    let dbChannel: any;
    let authSub: any;
    let realtimeSetupDone = false;
    let isMounted = true;
    let handleSyncRef: any = null;

    const handleSync = (e: any) => {
      const state = e.detail;
      const isOnline = Object.values(state).some((presences: any) =>
        presences.some((p: any) => p.user_id === otherUser?.id)
      );
      setOtherUserOnline(isOnline);
    };
    handleSyncRef = handleSync;

    if (typeof window !== 'undefined') {
      window.addEventListener('global_presence_sync', handleSync);
      if ((window as any)._globalPresenceState) {
        handleSync({ detail: (window as any)._globalPresenceState });
      }
    }

    const setupChannels = async () => {
      // Step 1: Get session and set auth token BEFORE subscribing
      console.log('[REALTIME-DEBUG] about to call getSession...');
      const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
      console.log('[REALTIME-DEBUG] session exists?', !!session, '| error:', sessionError,
        '| token preview:', session?.access_token?.substring(0, 20) ?? 'NONE');

      if (!isMounted) {
        console.log('[REALTIME-DEBUG] isMounted=false after getSession, aborting channel setup');
        return;
      }

      if (session?.access_token) {
        await supabaseClient.realtime.setAuth(session.access_token);
        console.log('[REALTIME-DEBUG] setAuth() awaited successfully');
      } else {
        console.warn('[REALTIME-DEBUG] NO SESSION — setAuth was NOT called. RLS-gated events will not arrive.');
      }

      if (!isMounted) return;

      // Step 2: Keep token fresh on every refresh
      const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event: string, newSession: Session | null) => {
        if (newSession?.access_token) {
          supabaseClient.realtime.setAuth(newSession.access_token);
          console.log('[REALTIME-DEBUG] Token refreshed via onAuthStateChange, setAuth updated');
        }
      });
      authSub = subscription;

      // Step 3: NOW create and subscribe channels (token is set)
      // ─── CHANNEL 1: Presence (Handled outside setupChannels) ────────────────

      // ─── CHANNEL 2: Room broadcast (typing + instant messages) ──────────────
      const roomChannelName = `room:${conversationId}`;
      const existingRoom = supabaseClient.getChannels().find((c: any) => c.topic === `realtime:${roomChannelName}`);
      if (existingRoom) supabaseClient.removeChannel(existingRoom);

      roomChannel = supabaseClient.channel(roomChannelName, {
        config: { broadcast: { self: false } }
      });
      channelRef.current = roomChannel;

      roomChannel
        .on('broadcast', { event: 'typing' }, (payload: any) => {
          if (payload.payload?.user_id === otherUser?.id) {
            setOtherUserTyping(payload.payload.isTyping);
            if (payload.payload.isTyping) {
              if (theirTypingTimeoutRef.current) clearTimeout(theirTypingTimeoutRef.current);
              theirTypingTimeoutRef.current = setTimeout(() => setOtherUserTyping(false), 3000);
            } else {
              if (theirTypingTimeoutRef.current) clearTimeout(theirTypingTimeoutRef.current);
            }
          }
        })
        .subscribe((status: string, err?: Error) => {
          console.log('[REALTIME] roomChannel status:', status, err ?? '');
        });

      // ─── CHANNEL 3: Postgres changes (DB events) ────────────────────────────
      const dbChannelName = `db:${conversationId}`;
      const existingDb = supabaseClient.getChannels().find((c: any) => c.topic === `realtime:${dbChannelName}`);
      if (existingDb) supabaseClient.removeChannel(existingDb);

      dbChannel = supabaseClient.channel(dbChannelName);
      dbChannel
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        }, (payload: any) => {
          console.log(`[REALTIME] postgres_changes INSERT fired for msg id=${payload.new.id} sender=${payload.new.sender_id}`, Date.now());
          const username = payload.new.sender_id === user.id ? profile?.username : otherUser?.username;
          setMessages(prev => {
            const index = prev.findIndex((m: any) => m.id === payload.new.id);
            if (index > -1) {
              // Merge only necessary fields to prevent optimistic UI flicker
              return prev.map((m: any) => m.id === payload.new.id ? { 
                ...m, 
                is_read: payload.new.is_read, 
                is_delivered: payload.new.is_delivered, 
                is_edited: payload.new.is_edited,
                is_deleted: payload.new.is_deleted,
                reactions: payload.new.reactions || m.reactions 
              } : m);
            }
            return [...prev, { ...payload.new, profiles: { username } }];
          });
          if (payload.new.sender_id === user.id) {
            setLocalMessages(prev => prev.filter(m => m.id !== payload.new.id));
          } else {
            markConversationRead(conversationId);
          }
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        }, (payload: any) => {
          setMessages(prev => prev.map((m: any) => m.id === payload.new.id ? { ...m, ...payload.new } : m));
        })
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        }, (payload: any) => {
          setMessages(prev => prev.filter((m: any) => m.id !== payload.old.id));
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversation_participants',
          filter: `conversation_id=eq.${conversationId}`
        }, (payload: any) => {
          if (payload.new.profile_id === otherUser?.id) {
            if (payload.new.last_read_at) setOtherLastRead(payload.new.last_read_at);
            if (payload.new.last_delivered_at) setOtherLastDelivered(payload.new.last_delivered_at);
          }
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${otherUser?.id ?? '00000000-0000-0000-0000-000000000000'}`
        }, (payload: any) => {
          if (payload.new.last_seen) setOtherUserLastSeen(payload.new.last_seen);
        })
        .subscribe((status: string, err?: Error) => {
          console.log('[REALTIME] dbChannel status:', status, err ?? '');
        });

      realtimeSetupDone = true;
    };

    setupChannels().catch(err => console.error('[REALTIME] setupChannels failed:', err));

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocus);
      if (typeof window !== 'undefined' && handleSyncRef) {
        window.removeEventListener('global_presence_sync', handleSyncRef);
      }
      if (authSub) authSub.unsubscribe();
      if (myTypingTimeoutRef.current) clearTimeout(myTypingTimeoutRef.current);
      if (theirTypingTimeoutRef.current) clearTimeout(theirTypingTimeoutRef.current);
      if (roomChannel) supabaseClient.removeChannel(roomChannel);
      if (dbChannel) supabaseClient.removeChannel(dbChannel);
      channelRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, user?.id, otherUser?.id]);

  const scrollToBottom = (force = false) => {
    if (messagesEndRef.current?.parentElement) {
      const container = messagesEndRef.current.parentElement;
      if (force || isNearBottomRef.current) {
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
        shouldForceScrollRef.current = false;
      }
    }
  };

  useEffect(() => {
    // When the other user goes offline, their last_seen is effectively NOW.
    // Optimistically update it to ensure high precision without another DB roundtrip.
    if (!otherUserOnline && otherUser?.id) {
      setOtherUserLastSeen(new Date().toISOString());
    }
  }, [otherUserOnline, otherUser?.id]);

  useEffect(() => {
    scrollToBottom(shouldForceScrollRef.current);
  }, [messages, otherUserTyping, localMessages]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollPosition = target.scrollTop + target.clientHeight;
    // Consider "near bottom" if within 150px of the actual bottom
    const isNear = target.scrollHeight - scrollPosition < 150;
    isNearBottomRef.current = isNear;
    
    if (showScrollButton === isNear) {
      setShowScrollButton(!isNear);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    // Auto-expand textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;

    if (!isTypingRef.current && channelRef.current) {
      isTypingRef.current = true;
      channelRef.current.send({ type: 'broadcast', event: 'typing', payload: { user_id: user.id, isTyping: true } });
    }
    if (myTypingTimeoutRef.current) clearTimeout(myTypingTimeoutRef.current);
    myTypingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      if (channelRef.current) channelRef.current.send({ type: 'broadcast', event: 'typing', payload: { user_id: user.id, isTyping: false } });
    }, 1500);
  };

  const handleGifSelect = async (gif: any, type: 'gif' | 'sticker') => {
    setShowGifPicker(false);
    shouldForceScrollRef.current = true;
    
    const mediaUrl = gif.images.fixed_height.url || gif.images.original.url;
    
    const finalContent = JSON.stringify({
      url: mediaUrl,
      type: type,
      width: gif.images.fixed_height.width,
      height: gif.images.fixed_height.height
    });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const msgId = crypto.randomUUID();

    const payload = {
      id: msgId, sender_id: user.id, conversation_id: conversationId,
      content: finalContent, type: 'image', sent_at: new Date().toISOString(),
      expires_at: expiresAt, profiles: { username: profile?.username }
    };

    setLocalMessages((prev) => [...prev, { ...payload, localStatus: 'sending' }]);

    // Send as 'image' to DB to bypass constraint, since content JSON has type: type.
    const insertResult = await sendMessageServer(conversationId, finalContent, 'image', msgId, expiresAt);

    if (!insertResult.success) {
      setLocalMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, localStatus: 'failed' } : m));
    } else {
      setMessages(prev => {
        if (prev.some(m => m.id === msgId)) return prev;
        return [...prev, payload];
      });
      setLocalMessages((prev) => prev.filter(m => m.id !== msgId));
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim()) return;
    shouldForceScrollRef.current = true;
    const t0 = performance.now();
    console.log(`[T+0ms] handleSend triggered`, Date.now());

    const textContent = newMessage.trim();
    
    // Check if replying
    let finalContent = textContent;
    if (replyTo) {
      finalContent = JSON.stringify({ 
        text: textContent, 
        replyTo: {
          id: replyTo.id,
          content: replyTo.content,
          sender: replyTo.sender_id === user.id ? 'You' : otherUser?.username || 'Unknown',
          type: replyTo.type
        }
      });
    }

    setNewMessage("");
    setReplyTo(null);
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.focus();
    }
    setShowEmojiPicker(false);
    isTypingRef.current = false;
    if (myTypingTimeoutRef.current) clearTimeout(myTypingTimeoutRef.current);
    if (channelRef.current) channelRef.current.send({ type: 'broadcast', event: 'typing', payload: { user_id: user.id, isTyping: false } });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const msgId = crypto.randomUUID();

    const payload = {
      id: msgId, sender_id: user.id, conversation_id: conversationId,
      content: finalContent, type: 'text', sent_at: new Date().toISOString(),
      expires_at: expiresAt, profiles: { username: profile?.username }
    };

    console.log(`[T+${(performance.now()-t0).toFixed(1)}ms] calling setLocalMessages (optimistic)`);
    setLocalMessages((prev) => [...prev, { ...payload, localStatus: 'sending' }]);
    console.log(`[T+${(performance.now()-t0).toFixed(1)}ms] setLocalMessages called (React will batch & paint async)`);

    // Phase 5 — Broadcast send timing (REMOVED: we rely on postgres_changes for security)
    const tBroadcast = performance.now();
    console.log(`[T+${(performance.now()-t0).toFixed(1)}ms] broadcast skipped for security`);

    // DB insert via server action (bypasses browser JWT race condition)
    const tInsert = performance.now();
    console.log(`[T+${(performance.now()-t0).toFixed(1)}ms] starting server insert...`);
    const insertResult = await sendMessageServer(conversationId, finalContent, 'text', msgId, expiresAt);
    console.log(`[T+${(performance.now()-t0).toFixed(1)}ms] server insert resolved | insert took ${(performance.now()-tInsert).toFixed(1)}ms | error=${insertResult.error || 'none'}`);

    if (!insertResult.success) {
      console.error("Message insert error:", insertResult.error);
      setLocalMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, localStatus: 'failed' } : m));
    } else {
      // Direct update to prevent the disappear-and-reappear flicker
      setMessages(prev => {
        if (prev.some(m => m.id === msgId)) return prev;
        return [...prev, payload];
      });
      // Clear the localMessage sending state on confirmed DB write
      setLocalMessages((prev) => prev.filter(m => m.id !== msgId));
      console.log(`[T+${(performance.now()-t0).toFixed(1)}ms] localMessages cleared and appended directly to messages state (flicker prevented)`);
    }
  };

  const handleRetry = async (msg: any) => {
    setLocalMessages(prev => prev.map(m => m.id === msg.id ? { ...m, localStatus: 'sending' } : m));
    const result = await sendMessageServer(msg.conversation_id, msg.content, msg.type, msg.id, msg.expires_at);
    if (!result.success) {
      setLocalMessages(prev => prev.map(m => m.id === msg.id ? { ...m, localStatus: 'failed' } : m));
    }
  };

  const handleDelete = async (msgId: string, forEveryone: boolean) => {
    setMessageMenu(null);
    if (!forEveryone) {
      setMessages((prev) => prev.filter(m => m.id !== msgId));
    } else {
      // Optimistic update for everyone
      setMessages((prev) => prev.map(m => m.id === msgId ? { ...m, is_deleted: true } : m));
    }
    const res = await deleteMessage(msgId, forEveryone);
    if (!res.success) {
      alert("Failed to delete message.");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !editingMessage) return;
    const newContent = newMessage.trim();
    const msgId = editingMessage.id;
    
    // Optimistic update
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: newContent, is_edited: true } : m));
    setEditingMessage(null);
    setNewMessage("");
    inputRef.current?.focus();

    const res = await editMessage(msgId, newContent);
    if (!res.success) {
      alert("Failed to edit message.");
    }
  };

  const formatLastSeen = (isoString?: string | null) => {
    if (!isoString) return 'Offline';
    const date = new Date(isoString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return `Online`;
    if (diff < 3600) return `Last seen ${Math.floor(diff / 60)} minutes ago`;
    
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    const isYesterday = new Date(now.getTime() - 86400000).getDate() === date.getDate();
    
    const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    if (isToday) return `Last seen today at ${timeStr}`;
    if (isYesterday) return `Last seen yesterday at ${timeStr}`;
    
    const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    return `Last seen on ${dateStr} at ${timeStr}`;
  };

  const handleReact = async (msgId: string, emoji: string) => {
    setMessageMenu(null);
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;

    let currentReactions: any[] = [];
    try {
      if (msg.reactions) {
        const parsed = typeof msg.reactions === 'string' ? JSON.parse(msg.reactions) : msg.reactions;
        if (Array.isArray(parsed)) {
          currentReactions = [...parsed];
        }
      }
    } catch {}

    // Toggle reaction
    const existingIdx = currentReactions.findIndex((r: any) => r.user_id === user.id);
    if (existingIdx > -1) {
      if (currentReactions[existingIdx].emoji === emoji) {
        currentReactions.splice(existingIdx, 1);
      } else {
        currentReactions[existingIdx] = { ...currentReactions[existingIdx], emoji };
      }
    } else {
      currentReactions.push({ user_id: user.id, username: profile?.username, emoji });
    }

    // Optimistic update
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reactions: currentReactions } : m));

    const { error } = await supabase
      .from('messages')
      .update({ reactions: currentReactions })
      .eq('id', msgId);

    if (error && error.code === '42703') {
      alert("Please run the SQL command from the walkthrough to enable persistent message reactions!");
    }
  };

  const handleTouchStart = (e: React.TouchEvent, msg: any) => {
    swipeStartX.current = e.touches[0].clientX;
    swipeMessageRef.current = msg;
    setSwipingId(msg.id);
    // Long-press → selection mode
    longPressFiredRef.current = false;
    if (longPressTimerRef2.current) clearTimeout(longPressTimerRef2.current);
    longPressTimerRef2.current = setTimeout(() => {
      longPressFiredRef.current = true;
      if (navigator.vibrate) navigator.vibrate([40]);
      setSelectedMessage(msg);
      setMessageMenu(null);
      // Cancel any pending double-tap
      if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
      doubleTapRef.current = null;
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // If user moves, cancel long-press
    const deltaX = Math.abs(e.touches[0].clientX - swipeStartX.current);
    const deltaY = Math.abs((e.touches[0].clientY || 0) - (swipeStartX.current || 0));
    if (deltaX > 10) {
      if (longPressTimerRef2.current) clearTimeout(longPressTimerRef2.current);
    }
    if (!swipingId) return;
    const delta = e.touches[0].clientX - swipeStartX.current;
    if (delta > 0 && delta < 120) {
      setSwipeDelta(delta);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef2.current) clearTimeout(longPressTimerRef2.current);
    if (!longPressFiredRef.current) {
      const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
      const threshold = isMobile ? 25 : 60;
      if (swipeDelta > threshold && swipeMessageRef.current) {
        setReplyTo(swipeMessageRef.current);
        inputRef.current?.focus();
      }
    }
    setSwipingId(null);
    setSwipeDelta(0);
    swipeMessageRef.current = null;
  };


  const handleDoubleTap = (msgId: string) => {
    const now = Date.now();
    const DOUBLE_TAP_MS = 400;
    // Cancel any pending single-tap menu open
    if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);

    if (doubleTapRef.current && doubleTapRef.current.id === msgId && now - doubleTapRef.current.ts < DOUBLE_TAP_MS) {
      // Double tap detected — toggle ❤️
      doubleTapRef.current = null;
      if (navigator.vibrate) navigator.vibrate(30);

      // Check if user already reacted with ❤️
      const msg = messages.find(m => m.id === msgId);
      const parsedReactions = msg?.reactions ? (typeof msg.reactions === 'string' ? JSON.parse(msg.reactions) : msg.reactions) : [];
      const hasHeartAlready = Array.isArray(parsedReactions) && parsedReactions.some((r: any) => r.user_id === user.id && r.emoji === '❤️');

      if (!hasHeartAlready) {
        setHeartAnimId(msgId);
        setTimeout(() => setHeartAnimId(null), 700);
      }

      handleReact(msgId, '❤️');
    } else {
      doubleTapRef.current = { id: msgId, ts: now };
      // Schedule menu open after double-tap window
      singleTapTimerRef.current = setTimeout(() => {
        if (doubleTapRef.current?.id === msgId) {
          doubleTapRef.current = null;
          setMessageMenu((prev: string | null) => msgId === prev ? null : msgId);
        }
      }, 410);
    }
  };

  const handleClearChat = async () => {
    if (!confirm("Are you sure you want to clear this chat? Your sent messages will be deleted.")) return;
    setShowHeaderMenu(false);
    
    // Delete all messages sent by this user in this conversation
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('sender_id', user.id);
    
    if (error) {
      alert("Failed to clear chat: " + error.message);
    } else {
      setMessages(prev => prev.filter(m => m.sender_id !== user.id));
    }
  };

  const handleBlock = async () => {
    if (!confirm(`Block ${otherUser?.username || 'this user'}? This will remove the conversation.`)) return;
    setShowHeaderMenu(false);
    const res = await blockUser(conversationId);
    if (res.success) {
      router.push('/room');
    } else {
      alert("Failed to block user.");
    }
  };

  const insertEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    inputRef.current?.focus();
  };

  // Allowed document extensions (future types: add to this array)
  const ALLOWED_DOC_EXTENSIONS = ['pdf','doc','docx','xls','xlsx','ppt','pptx','txt','csv','zip','rar','jpg','jpeg','png','webp'];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

  const handleAttach = (type: "image" | "video" | "audio" | "document" | "camera") => {
    setShowAttachMenu(false);
    setLastUsedAttachment(type);
    localStorage.setItem('lastUsedAttachment', type);
    
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
    
    if (type === 'camera') {
      fileTypeRef.current = 'image';
      setShowCameraModal(true);
      return;
    }
    
    if (type === 'document') {
      docInputRef.current?.click();
      return;
    }
    
    fileTypeRef.current = type as "image" | "video" | "audio";
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'image' ? 'image/*,video/*' : type === 'video' ? 'video/*' : 'audio/*';
      fileInputRef.current.click();
    }
  };

  const handleAttachDocument = () => {
    setShowAttachMenu(false);
    docInputRef.current?.click();
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsRecordingLocked(false);
      setRecordingTime(0);
      setAudioSwipeDeltaX(0);
      setAudioSwipeDeltaY(0);
      recordingStartTimeRef.current = Date.now();

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied or error:', err);
      alert('Could not access microphone. Please check your permissions.');
    }
  };

  const stopAndSendVoiceRecording = () => {
    const duration = Date.now() - recordingStartTimeRef.current;
    if (duration < 1000) {
      cancelVoiceRecording();
      return;
    }
    
    const finalDurationSeconds = Math.floor(duration / 1000);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], `voice_note_${Date.now()}.webm`, { type: 'audio/webm' });
        await uploadAudioFile(file, finalDurationSeconds);
        
        // Cleanup stream
        const stream = mediaRecorderRef.current?.stream;
        stream?.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current.stop();
    }
    cleanupRecordingState();
  };

  const cancelVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        // Cleanup stream, don't upload
        const stream = mediaRecorderRef.current?.stream;
        stream?.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current.stop();
    }
    cleanupRecordingState();
  };

  const cleanupRecordingState = () => {
    setIsRecording(false);
    setIsRecordingLocked(false);
    setRecordingTime(0);
    setAudioSwipeDeltaX(0);
    setAudioSwipeDeltaY(0);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const uploadAudioFile = async (file: File, durationSeconds?: number) => {
    shouldForceScrollRef.current = true;
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const path = `${conversationId}/${Date.now()}_voice.webm`;
      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(path, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('chat-media').getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      const msgContent = JSON.stringify({
        type: 'audio',
        url: publicUrl,
        name: 'Voice Note',
        duration: durationSeconds
      });
      const msgId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      setMessages(prev => [...prev, {
        id: msgId, sender_id: user.id, conversation_id: conversationId,
        content: msgContent, type: 'audio', sent_at: new Date().toISOString(),
        expires_at: expiresAt, profiles: { username: profile?.username }
      }]);

      const insertResult = await sendMessageServer(conversationId, msgContent, 'audio', msgId, expiresAt);
      if (!insertResult.success) throw new Error(insertResult.error || 'Insert failed');
    } catch (err: any) {
      console.error('Voice upload failed:', err);
      alert('Upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (ext: string): string => {
    const e = ext.toLowerCase();
    if (e === 'pdf') return 'pdf';
    if (['doc','docx'].includes(e)) return 'word';
    if (['xls','xlsx'].includes(e)) return 'excel';
    if (['ppt','pptx'].includes(e)) return 'ppt';
    if (['zip','rar'].includes(e)) return 'archive';
    if (['jpg','jpeg','png','webp'].includes(e)) return 'image';
    return 'generic';
  };

  const handleDocumentSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    shouldForceScrollRef.current = true;
    e.target.value = '';

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_DOC_EXTENSIONS.includes(ext)) {
      alert('This file type is not supported.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      alert('This file exceeds the maximum upload size of 10 MB.');
      return;
    }

    // Image types render as thumbnails via the existing image flow
    if (['jpg','jpeg','png','webp'].includes(ext)) {
      fileTypeRef.current = 'image';
      setIsUploading(true);
      try {
        const path = `${conversationId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('chat-media')
          .upload(path, file, { cacheControl: '3600', upsert: false });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('chat-media').getPublicUrl(path);
        const publicUrl = urlData.publicUrl;
        const msgContent = JSON.stringify({ type: 'image', url: publicUrl, name: file.name });
        const msgId = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        setMessages(prev => [...prev, {
          id: msgId, sender_id: user.id, conversation_id: conversationId,
          content: msgContent, type: 'image', sent_at: new Date().toISOString(),
          expires_at: expiresAt, profiles: { username: profile?.username }
        }]);
        const insertResult = await sendMessageServer(conversationId, msgContent, 'image', msgId, expiresAt);
        if (!insertResult.success) throw new Error(insertResult.error || 'Insert failed');
      } catch (err: any) {
        alert('Upload failed: ' + (err.message || 'Unknown error'));
      } finally {
        setIsUploading(false);
      }
      return;
    }

    // Document upload
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const path = `${conversationId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(path, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;

      setUploadProgress(80);
      const { data: urlData } = supabase.storage.from('chat-media').getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      const msgContent = JSON.stringify({
        type: 'document',
        url: publicUrl,
        name: file.name,
        size: file.size,
        ext: ext
      });
      const msgId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      setUploadProgress(90);
      setMessages(prev => [...prev, {
        id: msgId, sender_id: user.id, conversation_id: conversationId,
        content: msgContent, type: 'document', sent_at: new Date().toISOString(),
        expires_at: expiresAt, profiles: { username: profile?.username }
      }]);

      const insertResult = await sendMessageServer(conversationId, msgContent, 'document', msgId, expiresAt);
      if (!insertResult.success) throw new Error(insertResult.error || 'Insert failed');
      setUploadProgress(100);
    } catch (err: any) {
      console.error('Document upload failed:', err);
      alert('Upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    shouldForceScrollRef.current = true;
    // Reset the input so same file can be selected again
    e.target.value = '';
    
    const type = fileTypeRef.current;
    const maxSize = type === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`File too large! Max size: ${type === 'video' ? '50MB' : '10MB'}`);
      return;
    }

    setIsUploading(true);
    try {
      // Upload to Supabase Storage
      const ext = file.name.split('.').pop();
      const path = `${conversationId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(path, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage.from('chat-media').getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      // Send as message with type and url in content (JSON encoded)
      const msgContent = JSON.stringify({ type, url: publicUrl, name: file.name });
      const msgId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      setMessages(prev => [...prev, {
        id: msgId, sender_id: user.id, conversation_id: conversationId,
        content: msgContent, type, sent_at: new Date().toISOString(),
        expires_at: expiresAt, profiles: { username: profile?.username }
      }]);

      const insertResult = await sendMessageServer(conversationId, msgContent, type, msgId, expiresAt);

      if (!insertResult.success) throw new Error(insertResult.error || 'Insert failed');
    } catch (err: any) {
      console.error('Upload failed:', err);
      alert('Upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    
    const viewport = window.visualViewport;
    
    const handleResize = () => {
      const vh = viewport?.height;
      const offsetTop = viewport?.offsetTop || 0;
      if (!vh) return;
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      const wrapper = document.getElementById('chat-viewport-wrapper');
      if (wrapper) {
        if (isMobile) {
          wrapper.style.setProperty('height', `${vh}px`, 'important');
          wrapper.style.setProperty('transform', `translateY(${offsetTop}px)`, 'important');
        } else {
          wrapper.style.removeProperty('height');
          wrapper.style.removeProperty('transform');
        }
      }
    };
    
    viewport.addEventListener('resize', handleResize);
    viewport.addEventListener('scroll', handleResize);
    handleResize();
    
    // Fallback: trigger after keyboard opens
    setTimeout(handleResize, 100);
    setTimeout(handleResize, 300);
    
    return () => {
      viewport.removeEventListener('resize', handleResize);
      viewport.removeEventListener('scroll', handleResize);
    };
  }, []);
  const isPracticallyOnline = otherUserOnline || (otherUserLastSeen ? (new Date().getTime() - new Date(otherUserLastSeen).getTime()) < 60000 : false);

  return (
    <div id="chat-viewport-wrapper" className="w-full h-full flex flex-col relative overflow-hidden bg-base">
      {/* Call Modal */}
      {showCallModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCallModal(null)}>
          <div className="bg-white rounded-[32px] p-8 w-full max-w-[300px] flex flex-col items-center gap-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-20 h-20 rounded-full bg-black text-white flex items-center justify-center font-bold text-3xl shadow-lg overflow-hidden">
              <AvatarImage url={otherUser?.avatar_url} username={otherUser?.username} />
            </div>
            <div className="text-center">
              <p className="font-bold text-[20px] text-black">{otherUser?.username || 'Unknown'}</p>
              <p className="text-gray-400 text-sm font-medium mt-1">
                {showCallModal === "video" ? "📹 Video call" : "📞 Voice call"} — Coming soon
              </p>
            </div>
            <p className="text-center text-gray-500 text-sm leading-relaxed">
              Calling features are coming in the next update! You can still chat in the meantime. 💬
            </p>
            <button onClick={() => setShowCallModal(null)} className="w-full py-3 bg-black text-white font-semibold rounded-2xl hover:bg-gray-900 transition-colors">
              OK
            </button>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200" onClick={() => setShowContactModal(false)}>
          <div className="bg-white rounded-[32px] p-8 w-full max-w-[320px] flex flex-col items-center gap-4 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowContactModal(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
            <div className="w-28 h-28 rounded-full bg-black text-white flex items-center justify-center font-bold text-5xl shadow-lg mt-2 overflow-hidden">
              <AvatarImage url={otherUser?.avatar_url} username={otherUser?.username} />
            </div>
            <div className="text-center w-full mt-2">
              <h2 className="font-bold text-[24px] text-black break-words">{otherUser?.username || 'Unknown'}</h2>
              <p className="text-black text-sm font-semibold mt-1">
                {otherUserOnline ? '🟢 Online now' : '⚪ Offline'}
              </p>
            </div>
            <div className="w-full bg-slate-50 p-4 rounded-2xl mt-2 border border-slate-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">About</p>
              <p className="text-sm text-black font-medium leading-relaxed">
                {otherUser?.bio || "Hey there! I am using this app."}
              </p>
            </div>
            <div className="flex gap-2 w-full mt-2">
              <button onClick={() => { setShowContactModal(false); setShowCallModal("voice"); }} className="flex-1 py-3 bg-[#F0F2F5] hover:bg-gray-200 text-black font-semibold rounded-2xl transition-colors flex justify-center items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg> Voice
              </button>
              <button onClick={() => { setShowContactModal(false); setShowCallModal("video"); }} className="flex-1 py-3 bg-[#F0F2F5] hover:bg-gray-200 text-black font-semibold rounded-2xl transition-colors flex justify-center items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg> Video
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Bottom Sheet */}
      {showDeleteDialog && selectedMessage && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center"
          onClick={() => setShowDeleteDialog(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" />
          <div
            className="relative w-full max-w-lg bg-white rounded-t-[28px] pb-safe pt-2 px-4 pb-6 animate-in slide-in-from-bottom-4 duration-200 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <p className="text-center text-[15px] font-semibold text-black mb-4">Delete message?</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { handleDelete(selectedMessage.id, false); setShowDeleteDialog(false); setSelectedMessage(null); }}
                className="w-full py-3.5 rounded-2xl bg-red-50 text-red-500 font-semibold text-[15px] hover:bg-red-100 active:bg-red-200 transition-colors"
              >
                Delete for Me
              </button>
              {selectedMessage.sender_id === user.id && !selectedMessage.is_deleted && (
                <button
                  onClick={() => { handleDelete(selectedMessage.id, true); setShowDeleteDialog(false); setSelectedMessage(null); }}
                  className="w-full py-3.5 rounded-2xl bg-red-500 text-white font-semibold text-[15px] hover:bg-red-600 active:bg-red-700 transition-colors"
                >
                  Delete for Everyone
                </button>
              )}
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="w-full py-3.5 rounded-2xl bg-gray-100 text-black font-semibold text-[15px] hover:bg-gray-200 active:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-2 py-2 bg-surface/90 backdrop-blur-xl text-text-main z-40 border-b border-border-soft sticky top-0 relative">
        
        {/* Selection Mode Toolbar */}
        {selectedMessage ? (
          <div className="flex-1 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Left: cancel */}
            <button
              onClick={() => { setSelectedMessage(null); setMessageMenu(null); }}
              className="p-2 rounded-full hover:bg-slate-100 text-gray-500 hover:text-black transition-all active:scale-90 flex items-center gap-1"
              aria-label="Cancel selection"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>

            {/* Centre: label */}
            <span className="text-[15px] font-semibold text-black">1 selected</span>

            {/* Right: actions */}
            <div className="flex items-center gap-0.5">
              {/* Copy */}
              <button
                onClick={() => {
                  try {
                    const textToCopy = selectedMessage.content?.startsWith('{') ? JSON.parse(selectedMessage.content).text : selectedMessage.content;
                    if (textToCopy) navigator.clipboard.writeText(textToCopy);
                  } catch (e) {}
                  setSelectedMessage(null);
                }}
                className="p-2 rounded-full hover:bg-slate-100 text-black transition-all active:scale-90"
                aria-label="Copy"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              </button>
              {/* Reply */}
              <button
                onClick={() => { setReplyTo(selectedMessage); setSelectedMessage(null); inputRef.current?.focus(); }}
                className="p-2 rounded-full hover:bg-slate-100 text-black transition-all active:scale-90"
                aria-label="Reply"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
              </button>
              {/* Edit — only own text messages */}
              {selectedMessage.sender_id === user.id && selectedMessage.type === 'text' && !selectedMessage.is_deleted && (
                <button
                  onClick={() => { setEditingMessage(selectedMessage); setNewMessage(selectedMessage.content); setSelectedMessage(null); inputRef.current?.focus(); }}
                  className="p-2 rounded-full hover:bg-slate-100 text-black transition-all active:scale-90"
                  aria-label="Edit"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                </button>
              )}
              {/* Delete */}
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="p-2 rounded-full hover:bg-red-50 text-red-500 transition-all active:scale-90"
                aria-label="Delete"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        ) : isSearchingChat ? (
          <div className="flex-1 flex items-center gap-2 px-2 animate-in fade-in slide-in-from-right-4 duration-200">
            <button onClick={() => { setIsSearchingChat(false); setChatSearchQuery(""); }} className="p-2 rounded-full hover:bg-slate-100 text-gray-400 hover:text-black transition-all active:scale-90 active:bg-slate-200 select-none cursor-pointer" aria-label="Back">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <input 
              autoFocus
              type="text" 
              placeholder="Search in chat..."
              value={chatSearchQuery}
              onChange={(e) => setChatSearchQuery(e.target.value)}
              className="flex-1 bg-slate-100 rounded-full py-2 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/30"
            />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1">
              <button onClick={() => router.push('/room')} className="p-2 rounded-full hover:bg-slate-100 text-gray-400 hover:text-black transition-all active:scale-90 active:bg-slate-200 select-none cursor-pointer" aria-label="Back">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              
              {user?.id === 'loading' ? (
                <div className="flex items-center gap-3 w-full animate-pulse ml-1">
                  <div className="w-10 h-10 rounded-full bg-slate-100"></div>
                  <div className="flex flex-col gap-1.5">
                    <div className="w-24 h-4 bg-slate-100 rounded"></div>
                    <div className="w-16 h-3 bg-slate-100 rounded"></div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowContactModal(true)}>
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-2xl shadow-sm overflow-hidden">
                      <AvatarImage url={otherUser?.avatar_url} username={otherUser?.username} />
                </div>
              {isPracticallyOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"/>}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[15px] text-black leading-tight">{otherUser?.username || 'Unknown'}</span>
              <span className="text-[11px] text-gray-400 font-semibold" suppressHydrationWarning>
                {otherUserTyping ? '✍️ typing...' : isPracticallyOnline ? 'Online' : formatLastSeen(otherUserLastSeen)}
              </span>
            </div>
          </div>
          )}
        </div>

        {user?.id !== 'loading' && (
        <div className="flex items-center gap-0.5 relative">
          <button onClick={() => setShowCallModal("voice")} className="p-2 rounded-full hover:bg-slate-100 text-black transition-colors" aria-label="Voice Call">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </button>
          <button onClick={() => setShowCallModal("video")} className="p-2 rounded-full hover:bg-slate-100 text-black transition-colors" aria-label="Video Call">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
          </button>
          <button onClick={() => setShowHeaderMenu(!showHeaderMenu)} className="p-2 rounded-full hover:bg-slate-100 text-gray-400 hover:text-black transition-colors" aria-label="More">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
            </svg>
          </button>

          {/* 3-Dot Dropdown Menu */}
          {showHeaderMenu && (
            <div className="absolute top-12 right-0 w-48 bg-white border border-gray-100 shadow-xl rounded-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <button onClick={() => { setShowHeaderMenu(false); setShowContactModal(true); }} className="w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-slate-50 transition-colors">
                View Contact
              </button>
              <button onClick={() => { setShowHeaderMenu(false); setIsSearchingChat(true); }} className="w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-slate-50 transition-colors">
                Search Chat
              </button>
              <button onClick={handleClearChat} className="w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-slate-50 transition-colors text-red-500">
                Clear Chat
              </button>
              <button onClick={handleBlock} className="w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-slate-50 transition-colors text-red-500">
                Block
              </button>
            </div>
          )}
        </div>
        )}
          </>
        )}
      </header>



      {/* Messages */}
      <div onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-[3px] bg-white" onClick={() => { setShowEmojiPicker(false); setShowGifPicker(false); setShowAttachMenu(false); setMessageMenu(null); setShowHeaderMenu(false); if (selectedMessage) setSelectedMessage(null); }}>
        {user?.id === 'loading' ? (
          <div className="flex flex-col gap-4 w-full opacity-50 pointer-events-none mt-2">
             <div className="w-2/3 h-12 bg-slate-100 rounded-2xl rounded-bl-none animate-pulse self-start"></div>
             <div className="w-1/2 h-12 bg-black/10 rounded-2xl rounded-br-none animate-pulse self-end"></div>
             <div className="w-3/4 h-16 bg-slate-100 rounded-2xl rounded-bl-none animate-pulse self-start"></div>
             <div className="w-2/3 h-12 bg-black/10 rounded-2xl rounded-br-none animate-pulse self-end"></div>
             <div className="w-1/2 h-12 bg-slate-100 rounded-2xl rounded-bl-none animate-pulse self-start"></div>
          </div>
        ) : (() => {
          // Merge: prefer confirmed DB messages over optimistic local ones (same id)
          const confirmedIds = new Set(messages.map((m: any) => m.id));
          const pendingOnly = localMessages.filter(m => !confirmedIds.has(m.id));
          const allMessages = [...messages, ...pendingOnly].sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime());
          
          if (allMessages.length === 0) {
            return (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-inner mb-4 text-2xl">💬</div>
                <p className="text-gray-500 font-medium text-sm">No messages yet.<br/>Say hello!</p>
              </div>
            );
          }
          
          return allMessages.filter(m => {
            const deletedBy = Array.isArray(m.deleted_by) ? m.deleted_by : (m.deleted_by ? JSON.parse(m.deleted_by as string) : []);
            return !deletedBy.includes(user.id);
          }).map((m, idx, arr) => {
            const isMine = m.sender_id === user.id;
            const nextMsg = arr[idx + 1];
            const prevMsg = arr[idx - 1];
            const showTime = !nextMsg || (new Date(nextMsg.sent_at).getTime() - new Date(m.sent_at).getTime() > 5 * 60 * 1000);
            const showDateSeparator = !prevMsg || new Date(m.sent_at).toDateString() !== new Date(prevMsg.sent_at).toDateString();
            
            const formatMessageDate = (dateString: string) => {
              const date = new Date(dateString);
              const now = new Date();
              const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
              const isYesterday = new Date(now.getTime() - 86400000).getDate() === date.getDate() && new Date(now.getTime() - 86400000).getMonth() === date.getMonth();
              if (isToday) return "Today";
              if (isYesterday) return "Yesterday";
              return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
            };
          
          // Parse JSON content (media, document, or replies)
          let parsedData: any = null;
          try { 
            if (m.content.startsWith('{')) parsedData = JSON.parse(m.content); 
          } catch {}

          const mediaData = (m.type === 'image' || m.type === 'video' || m.type === 'audio' || m.type === 'gif' || m.type === 'sticker') ? parsedData : null;
          const docData = (m.type === 'document' && parsedData?.type === 'document') ? parsedData : null;
          const replyData = (!mediaData && !docData && parsedData && parsedData.replyTo) ? parsedData : null;
          const textContent = replyData ? replyData.text : (!mediaData && !docData ? m.content : null);

          const showTail = !nextMsg || nextMsg.sender_id !== m.sender_id || showTime;

          // Filter by search query if searching
          if (isSearchingChat && chatSearchQuery.trim() !== "" && !mediaData) {
            if (!textContent?.toLowerCase().includes(chatSearchQuery.toLowerCase())) {
              return null;
            }
          }

          return (
            <div key={m.id} className={`flex flex-col w-full ${idx === 0 ? 'mt-auto' : ''}`}>
              {showDateSeparator && (
                <div className="flex justify-center w-full my-3">
                  <div className="bg-slate-100 text-slate-500 text-xs font-semibold px-3 py-1 rounded-full shadow-sm" suppressHydrationWarning>
                    {formatMessageDate(m.sent_at)}
                  </div>
                </div>
              )}
              <div 
                className={`flex flex-col w-full ${isMine ? 'items-end pr-[6px]' : 'items-start pl-[6px]'} relative ${
                  m.reactions && m.reactions.length > 0 && !m.localStatus ? 'mb-4' : ''
                }`}
            >
              {/* Floating Reaction Bar — absolutely positioned above selected message to prevent layout shift */}
              {selectedMessage?.id === m.id && (
                <div
                  className={`absolute bottom-full flex items-center gap-1 mb-2 pointer-events-auto z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 ${
                    isMine ? 'right-[6px]' : 'left-[6px]'
                  }`}
                  onClick={e => e.stopPropagation()}
                >
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.82)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: '1px solid rgba(0,0,0,0.07)',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
                      borderRadius: 999,
                      padding: '6px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    {['❤️','👍','😂','😮','😢','🙏'].map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => { handleReact(m.id, emoji); setSelectedMessage(null); }}
                        className="text-[22px] w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/8 active:scale-90 transition-all duration-100"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* Heart pop animation on double-tap */}
              {heartAnimId === m.id && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                  <span
                    className="text-5xl select-none"
                    style={{
                      animation: 'heartPop 0.65s ease-out forwards',
                    }}
                  >❤️</span>
                </div>
              )}
              {/* Swipe icon indicator behind message */}
              {swipingId === m.id && swipeDelta > 15 && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-black animate-pulse flex items-center gap-1">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
                </div>
              )}

              <div 
                className={`relative max-w-[85%] text-[15px] shadow-sm leading-relaxed cursor-pointer group touch-manipulation ${
                  isMine ? 'bg-text-main text-base' : 'bg-accent text-text-main'
                } ${
                  showTail && isMine ? 'rounded-[20px] rounded-br-none' : showTail && !isMine ? 'rounded-[20px] rounded-bl-none' : 'rounded-[20px]'
                } ${
                  selectedMessage?.id === m.id ? (isMine ? 'ring-2 ring-white/40 select-text' : 'ring-2 ring-black/15 select-text') : 'select-none'
                } ${
                  m.metadata?.is_admin_reply ? 'border-2 border-red-500' : ''
                }`}
                onTouchStart={(e) => handleTouchStart(e, m)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={(e) => {
                  e.stopPropagation();
                  if (selectedMessage) {
                    // Tapping while in selection mode deselects
                    setSelectedMessage(null);
                    return;
                  }
                  handleDoubleTap(m.id);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Desktop right-click → enter selection mode
                  setSelectedMessage(m);
                  setMessageMenu(null);
                }}
                style={{ 
                  transform: swipingId === m.id ? `translateX(${Math.min(swipeDelta, 80)}px)` : 'none', 
                  transition: swipingId === m.id ? 'none' : 'transform 0.15s ease-out' 
                }}
              >
                {m.metadata?.is_admin_reply && (
                  <div className="absolute -top-3 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow z-10">
                    ADMIN
                  </div>
                )}
                {/* Selection-mode subtle highlight on the bubble itself */}
                {selectedMessage?.id === m.id && (
                  <div className={`absolute inset-0 pointer-events-none z-10 animate-in fade-in duration-150 bg-black/10 ${
                    showTail && isMine ? 'rounded-[20px] rounded-br-none' : showTail && !isMine ? 'rounded-[20px] rounded-bl-none' : 'rounded-[20px]'
                  }`} />
                )}
                
                {/* No floating context menu any more — selection handled by long-press/toolbar */}
                
                {/* Tail SVG */}
                {showTail && isMine && (
                  <svg className="absolute -right-[6px] bottom-0 text-text-main w-[16px] h-[16px]" viewBox="0 0 8 13" fill="currentColor"><path d="M0 0v13h8C4 13 1 9 0 0z"/></svg>
                )}
                {showTail && !isMine && (
                  <svg className="absolute -left-[6px] bottom-0 text-accent w-[16px] h-[16px]" viewBox="0 0 8 13" fill="currentColor"><path d="M8 0v13H0C4 13 7 9 8 0z"/></svg>
                )}

                <div className={`relative ${mediaData ? 'p-1' : docData ? 'p-1' : 'px-3 py-1.5'} z-10`}>
                  
                  {/* Replied Message Preview */}
                  {replyData && (
                    <div className={`mb-1.5 p-2 rounded-xl text-sm border-l-4 ${isMine ? 'bg-white/30 border-black/40 text-black/90' : 'bg-white/30 border-black/40 text-black/90'}`}>
                      <p className={`font-bold text-xs mb-0.5 ${isMine ? 'text-white' : 'text-black'}`}>{replyData.replyTo.sender}</p>
                      <p className="line-clamp-2 leading-tight">
                        {replyData.replyTo.type === 'image' ? '📷 Image' : 
                         replyData.replyTo.type === 'video' ? '🎥 Video' : 
                         replyData.replyTo.type === 'audio' ? '🎵 Audio' : 
                         (replyData.replyTo.content.startsWith('{') ? JSON.parse(replyData.replyTo.content).text : replyData.replyTo.content)}
                      </p>
                    </div>
                  )}

                  {m.is_deleted ? (
                    <span className="italic text-gray-500 flex items-center gap-1.5 opacity-80">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                      This message was deleted
                      <span className="inline-block w-[65px]" />
                    </span>
                  ) : (
                    <>
                      {mediaData?.type === 'image' && (
                        <img 
                          src={mediaData.url} 
                          alt="image" 
                          className="w-52 sm:w-64 h-40 sm:h-48 object-cover rounded-[16px] cursor-pointer hover:opacity-90 transition-opacity" 
                          onClick={() => openImagePreview(mediaData.url)}
                          loading="lazy"
                        />
                      )}
                      {(mediaData?.type === 'gif' || mediaData?.type === 'sticker') && (
                        <img 
                          src={mediaData.url} 
                          alt={mediaData.type} 
                          className={`max-w-[200px] sm:max-w-[240px] rounded-[16px] ${mediaData.type === 'sticker' ? 'bg-transparent' : 'object-cover'}`}
                          loading="lazy"
                        />
                      )}
                      {mediaData?.type === 'video' && (
                        <video src={mediaData.url} controls className="max-w-[240px] sm:max-w-[280px] rounded-[16px]" />
                      )}
                      {mediaData?.type === 'audio' && (
                        <div className="pt-1 pr-[42px] pb-1">
                          <CustomAudioPlayer src={mediaData.url} isMine={isMine} messageId={m.id} initialDuration={mediaData.duration} />
                        </div>
                      )}
                      {docData && (() => {
                        const iconType = getFileIcon(docData.ext || '');
                        const iconColors: Record<string, string> = {
                          pdf: 'bg-red-500', word: 'bg-blue-600', excel: 'bg-green-600',
                          ppt: 'bg-orange-500', archive: 'bg-yellow-600', image: 'bg-purple-500', generic: 'bg-gray-500'
                        };
                        const iconLabels: Record<string, string> = {
                          pdf: 'PDF', word: 'DOC', excel: 'XLS', ppt: 'PPT', archive: 'ZIP', image: 'IMG', generic: 'FILE'
                        };
                        const iconColor = iconColors[iconType] || 'bg-gray-500';
                        const iconLabel = iconLabels[iconType] || (docData.ext?.toUpperCase() || 'FILE');
                        const displayName = docData.name || 'file';
                        const truncName = displayName.length > 28 ? displayName.slice(0, 25) + '…' : displayName;
                        return (
                          <div className={`flex flex-col`}>
                            <div className={`flex items-center gap-3 min-w-[220px] max-w-[260px] px-3 pt-3 pb-2`}>
                              {/* File type icon */}
                              <div className={`flex-shrink-0 w-11 h-11 ${iconColor} rounded-xl flex flex-col items-center justify-center shadow-sm`}>
                                <span className="text-white text-[9px] font-black leading-none tracking-wider">{iconLabel}</span>
                              </div>
                              {/* File info */}
                              <div className="flex-1 min-w-0">
                                <p className={`text-[13px] font-semibold leading-tight truncate text-black`} title={displayName}>
                                  {truncName}
                                </p>
                                <p className={`text-[11px] mt-0.5 font-medium text-black/60`}>
                                  {docData.size ? formatFileSize(docData.size) : docData.ext?.toUpperCase() || ''}
                                </p>
                              </div>
                              {/* Download button */}
                              <a
                                href={docData.url}
                                download={docData.name || 'file'}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors bg-white/30 hover:bg-white/50 text-black`}
                                title="Download"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                  <polyline points="7 10 12 15 17 10"/>
                                  <line x1="12" y1="15" x2="12" y2="3"/>
                                </svg>
                              </a>
                            </div>
                            {/* Timestamp in natural flow for docData */}
                            <div className={`flex justify-end items-center gap-1 px-3 pb-1.5 text-[10px] font-bold text-black/60`}>
                              {m.is_edited && !m.is_deleted && <span className="opacity-70 mr-0.5">Edited</span>}
                              <span suppressHydrationWarning>{new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {isMine && m.localStatus === 'sending' && (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 ml-0.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                              )}
                              {isMine && m.localStatus === 'failed' && (
                                <button onClick={(e) => { e.stopPropagation(); handleRetry(m); }} className="text-red-400 font-bold ml-0.5" title="Retry">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                      {mediaData?.type === 'game_invite' && (
                        <div className="flex flex-col items-center gap-3 p-4 bg-white/10 rounded-[16px] min-w-[200px]">
                          <div className="text-4xl">🎮</div>
                          <p className={`font-bold text-[15px] ${isMine ? 'text-white' : 'text-black'}`}>
                            {mediaData.gameName}
                          </p>
                          <p className={`text-xs ${isMine ? 'text-white/70' : 'text-black/60'} text-center`}>
                            {isMine ? 'Waiting for partner...' : 'Invited you to play!'}
                          </p>
                          {!isMine && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                gameIdRef.current = mediaData.gameId;
                                setShowGame(true);
                              }}
                              className="w-full mt-2 py-2 bg-black text-white dark:bg-white dark:text-black rounded-full text-sm font-bold shadow-md hover:scale-105 active:scale-95 transition-transform"
                            >
                              Accept & Play
                            </button>
                          )}
                        </div>
                      )}
                      {!mediaData && !docData && (
                        <span className="break-words whitespace-pre-wrap">{textContent}<span className="inline-block w-[75px]" /></span>
                      )}
                    </>
                  )}
                  
                  {/* Timestamp & Status inside bubble (Hidden for docData as it is rendered inline) */}
                  {!docData && (
                    <div className={`flex items-center gap-1 text-[10px] font-bold ${
                      mediaData && !m.is_deleted
                        ? 'absolute bottom-2 right-2 bg-black/40 text-white px-1.5 py-0.5 rounded-full'
                        : 'absolute bottom-[4px] right-[8px] text-black/60'
                    }`}>
                      {m.is_edited && !m.is_deleted && <span className="opacity-70 mr-0.5">Edited</span>}
                      <span suppressHydrationWarning>{new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isMine && m.localStatus === 'sending' && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 ml-0.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      )}
                      {isMine && m.localStatus === 'failed' && (
                        <button onClick={(e) => { e.stopPropagation(); handleRetry(m); }} className="text-red-400 font-bold ml-0.5" title="Retry">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        </button>
                      )}
                    </div>
                  )}
                  {/* Clear float to ensure bubble wraps timestamp */}
                  {!mediaData && !docData && <div className="clear-both"></div>}
                </div>

                {/* Reaction badge — absolutely positioned OUTSIDE and BELOW the bubble */}
                {m.reactions && m.reactions.length > 0 && !m.localStatus && (
                  <div
                    className={`absolute top-full flex items-center gap-[3px] pointer-events-none z-20 mt-[-4px] ${
                      isMine ? 'right-[32px]' : 'left-[8px]'
                    }`}
                  >
                    {Array.from(new Set(m.reactions.map((r: any) => r.emoji))).map((emoji: any) => (
                      <span
                        key={emoji}
                        className="text-[13px] sm:text-[16px] leading-none select-none"
                        style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.22))' }}
                      >{emoji}</span>
                    ))}
                  </div>
                )}
              </div>
              {/* Instagram-style Seen label — shown below the last message the other user has read */}
              {isMine && !m.localStatus && otherLastRead && (() => {
                // Find if this is the last message sent by me that was seen
                const myMsgs = arr.filter(msg => msg.sender_id === user.id && !msg.localStatus);
                const lastSeenMsg = [...myMsgs].reverse().find(msg => new Date(otherLastRead) >= new Date(msg.sent_at));
                return lastSeenMsg?.id === m.id ? (
                  <div className="flex justify-end pr-1 mt-0.5">
                    <span className="text-[10px] text-gray-400 font-medium">Seen</span>
                  </div>
                ) : null;
              })()}
              </div>
            </div>
          );
          })
        })()}
        {otherUserTyping && (
          <div className="self-start">
            <div className="px-4 py-3 rounded-[20px] rounded-bl-[5px] bg-white border border-gray-100 shadow-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-black/70 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
              <span className="w-1.5 h-1.5 bg-black/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
              <span className="w-1.5 h-1.5 bg-black/70 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-1 w-full flex-shrink-0" />
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="bg-white border-t border-[#EEE7F7] flex flex-col" style={{ height: 280 }}>
          {/* Category tabs */}
          <div className="flex items-center gap-0 border-b border-gray-100 px-2 overflow-x-auto">
            {EMOJI_CATEGORIES.map((cat, i) => (
              <button
                key={cat.name}
                onClick={() => setEmojiCategory(i)}
                className={`flex-shrink-0 px-3 py-2.5 text-lg transition-all border-b-2 ${emojiCategory === i ? 'border-black' : 'border-transparent opacity-50'}`}
                title={cat.name}
              >
                {cat.icon}
              </button>
            ))}
          </div>
          {/* Emoji grid */}
          <div className="flex-1 overflow-y-auto p-2 grid grid-cols-8 gap-0.5 content-start">
            {EMOJI_CATEGORIES[emojiCategory].emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => insertEmoji(emoji)}
                className="w-full aspect-square flex items-center justify-center text-[22px] hover:bg-slate-100 rounded-xl transition-colors active:scale-90"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* GIF Picker */}
      {showGifPicker && (
        <GifPicker onSelect={handleGifSelect} onClose={() => setShowGifPicker(false)} />
      )}

      

      {/* Full-screen Image Preview Lightbox */}
      {activePreviewImage && (
        <div 
          className="absolute inset-0 z-40 bg-black/95 flex flex-col items-center justify-between p-4 rounded-[inherit] animate-in fade-in duration-200"
          onClick={closeImagePreview}
        >
          {/* Header */}
          <div className="w-full max-w-[450px] flex items-center justify-between py-2 text-white z-10">
            <button 
              onClick={closeImagePreview} 
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
            <span className="font-semibold text-sm">Image Preview</span>
            <button 
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  const response = await fetch(activePreviewImage);
                  const blob = await response.blob();
                  const blobUrl = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = blobUrl;
                  a.download = `chat-image-${Date.now()}.jpg`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(blobUrl);
                } catch (err) {
                  // Fallback if fetch fails (e.g. CORS)
                  window.open(activePreviewImage, '_blank');
                }
              }} 
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-all text-white flex items-center gap-1.5 text-xs font-bold"
              aria-label="Download"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download
            </button>
          </div>

          {/* Image Container */}
          <div className="flex-1 w-full flex items-center justify-center p-2">
            <img 
              src={activePreviewImage} 
              alt="preview" 
              className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="h-10" />
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={fileTypeRef.current === 'image' ? 'image/*' : fileTypeRef.current === 'video' ? 'video/*' : 'audio/*'}
        onChange={handleFileSelected}
      />
      <input
        ref={docInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.jpg,.jpeg,.png,.webp"
        onChange={handleDocumentSelected}
      />

      {/* Scroll to Latest Button */}
      {showScrollButton && (
        <button 
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-[80px] right-4 z-50 w-10 h-10 bg-white border border-gray-100 rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 transition-all active:scale-95 animate-in zoom-in duration-200"
          aria-label="Scroll to latest"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>
      )}

      {/* ── COMPOSER ─────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 relative z-20 px-3 pb-3 pt-1 w-full max-w-3xl mx-auto"
      >
        {/* Reply / Edit Banner */}
        {(replyTo || editingMessage) && (
          <div
            className="flex items-center gap-2 px-4 pt-3 pb-2 animate-in slide-in-from-bottom-2 duration-200"
          >
            <div
              className="flex-1 flex items-start gap-2.5 bg-white border border-gray-100 rounded-2xl px-3.5 py-2.5 shadow-sm"
              style={{ borderLeft: '3px solid #000' }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-black mb-0.5 flex items-center gap-1.5">
                  {editingMessage ? (
                    <>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                      Editing message
                    </>
                  ) : (
                    replyTo?.sender_id === user.id ? 'You' : otherUser?.username || 'Unknown'
                  )}
                </p>
                <p className="text-[12px] text-gray-500 line-clamp-1 leading-4">
                  {editingMessage ? editingMessage.content :
                   replyTo?.type === 'image' ? '📷 Image' :
                   replyTo?.type === 'video' ? '🎥 Video' :
                   replyTo?.type === 'audio' ? '🎵 Audio' :
                   replyTo?.type === 'document' ? (() => { try { return '📎 ' + JSON.parse(replyTo.content).name; } catch { return '📎 File'; } })() :
                   (replyTo?.content?.startsWith('{') ? JSON.parse(replyTo.content).text : replyTo?.content)}
                </p>
              </div>
            </div>
            <button
              onClick={() => { setReplyTo(null); setEditingMessage(null); setNewMessage(''); }}
              className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 hover:bg-gray-50 text-gray-500 transition-colors"
              aria-label="Dismiss"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        )}

        {/* ── Unified Composer — ONE pill holds everything ── */}
        <div className="relative">
          {/* Floating Attachment Menu */}
          {showAttachMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowAttachMenu(false)} />
              <div 
                className="absolute right-1 z-50 animate-in fade-in zoom-in-95 duration-200 origin-bottom"
                style={{ bottom: '100%', paddingBottom: '12px' }}
              >
                <div 
                  className="flex flex-col items-center p-2 gap-3 bg-white/70 dark:bg-black/70 backdrop-blur-[20px] rounded-[20px] border border-black/5 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
                >
                  <button 
                    onClick={() => handleAttach('image')} 
                    className="w-[44px] h-[44px] rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all text-black dark:text-white" 
                    aria-label="Gallery"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                  </button>
                  <button 
                    onClick={() => { setShowAttachMenu(false); setShowGifPicker(v => !v); }} 
                    className="w-[44px] h-[44px] rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all text-black dark:text-white" 
                    aria-label="GIF"
                  >
                    <div className="font-black text-[11px] px-1.5 py-0.5 border-2 rounded-md tracking-widest border-current" style={{ lineHeight: 1.2 }}>GIF</div>
                  </button>
                  <button 
                    onClick={() => handleAttach('audio')} 
                    className="w-[44px] h-[44px] rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all text-black dark:text-white" 
                    aria-label="Audio"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                  </button>
                  <button 
                    onClick={() => handleAttach('document')} 
                    className="w-[44px] h-[44px] rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all text-black dark:text-white" 
                    aria-label="Document"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
                  </button>
                  <button 
                    onClick={() => { setShowAttachMenu(false); setShowGame(true); }} 
                    className="w-[44px] h-[44px] rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all text-black dark:text-white" 
                    aria-label="Play Game"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"/><path d="M6 12h4"/><path d="M8 10v4"/><circle cx="17" cy="10" r="1"/><circle cx="15" cy="13" r="1"/></svg>
                  </button>
                </div>
              </div>
            </>
          )}


          {/* THE floating white pill container */}
          <div
            style={{
              background: 'var(--color-surface)',
              borderRadius: 28,
              border: 'none',
              boxShadow: '0 4px 20px rgba(50, 96, 128, 0.08)',
              overflow: 'hidden',
              minHeight: 52,
              display: 'flex',
              alignItems: 'flex-end',
              transition: 'all 200ms ease',
              WebkitTapHighlightColor: 'transparent',
              outline: 'none',
            }}
          >
            {/* Recording State — full-width inside pill */}
            {isRecording ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, minHeight: 52 }}>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
                <span className="text-red-500 font-semibold text-[15px] tabular-nums">
                  {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                </span>
                <div style={{ flex: 1 }} />
                {isRecordingLocked ? (
                  <button
                    type="button"
                    onClick={cancelVoiceRecording}
                    className="text-[13px] font-semibold text-gray-400 hover:text-red-500 transition-colors"
                    style={{ paddingRight: 4 }}
                  >
                    Cancel
                  </button>
                ) : (
                  <div className="flex items-center gap-1 text-gray-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
                    <span className="text-[12px] font-medium hidden sm:block">Slide to cancel</span>
                    <span className="text-[12px] font-medium sm:hidden">Cancel</span>
                  </div>
                )}
                {/* Mic button stays in pill during recording */}
                <div className="relative" style={{ flexShrink: 0, marginRight: 4 }}>
                  {isRecording && !isRecordingLocked && audioSwipeDeltaY < -20 && (
                    <div className="absolute -top-11 left-1/2 -translate-x-1/2 bg-white px-2.5 py-1 rounded-full shadow-sm text-gray-600 text-[11px] font-bold flex items-center gap-1 border border-gray-100 whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 duration-150">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      Lock
                    </div>
                  )}
                  <button
                    onPointerDown={(e) => {
                      e.preventDefault();
                      if (e.isPrimary) {
                        e.currentTarget.setPointerCapture(e.pointerId);
                        audioSwipeStartX.current = e.clientX;
                        audioSwipeStartY.current = e.clientY;
                      }
                    }}
                    onPointerMove={(e) => {
                      if (isRecording && !isRecordingLocked && e.currentTarget.hasPointerCapture(e.pointerId)) {
                        const deltaX = e.clientX - audioSwipeStartX.current;
                        const deltaY = e.clientY - audioSwipeStartY.current;
                        if (deltaY < -50) {
                          setIsRecordingLocked(true);
                          setAudioSwipeDeltaX(0); setAudioSwipeDeltaY(0);
                          e.currentTarget.releasePointerCapture(e.pointerId);
                        } else if (deltaX < -50) {
                          cancelVoiceRecording();
                          e.currentTarget.releasePointerCapture(e.pointerId);
                        } else {
                          if (deltaX < 0) setAudioSwipeDeltaX(deltaX);
                          if (deltaY < 0) setAudioSwipeDeltaY(deltaY);
                        }
                      }
                    }}
                    onPointerUp={(e) => {
                      e.preventDefault();
                      if (e.currentTarget.hasPointerCapture && e.currentTarget.hasPointerCapture(e.pointerId)) {
                        e.currentTarget.releasePointerCapture(e.pointerId);
                      }
                      if (isRecording && !isRecordingLocked) { stopAndSendVoiceRecording(); }
                    }}
                    onPointerCancel={(e) => {
                      if (e.currentTarget.hasPointerCapture && e.currentTarget.hasPointerCapture(e.pointerId)) {
                        e.currentTarget.releasePointerCapture(e.pointerId);
                      }
                      if (isRecording && !isRecordingLocked) { cancelVoiceRecording(); }
                    }}
                    className="touch-none select-none flex items-center justify-center"
                    style={{
                      width: 42, height: 42, borderRadius: 21,
                      background: '#FF3B30', color: '#fff',
                      border: 'none', cursor: 'pointer',
                      boxShadow: '0 0 0 8px rgba(255,59,48,0.12), 0 2px 10px rgba(255,59,48,0.3)',
                      transform: (isRecording && !isRecordingLocked)
                        ? `translate(${audioSwipeDeltaX}px, ${audioSwipeDeltaY}px) scale(1.12)`
                        : 'scale(1)',
                      transition: (isRecording && !isRecordingLocked)
                        ? 'background 0.15s, box-shadow 0.15s'
                        : 'background 0.2s, box-shadow 0.2s, transform 0.15s',
                    }}
                    aria-label="Voice Message"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              /* ── Normal (non-recording) state ── */
              <>
                {/* Home Button — collapses when typing */}
                <div
                  style={{
                    maxWidth: newMessage ? 0 : 46,
                    opacity: newMessage ? 0 : 1,
                    overflow: 'hidden',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'max-width 220ms cubic-bezier(0.4,0,0.2,1), opacity 150ms ease',
                  }}
                >
                  <button
                    type="button"
                    tabIndex={newMessage ? -1 : 0}
                    onClick={() => router.push('/')}
                    className="text-[#8E8E93] hover:text-black active:scale-95 transition-all"
                    style={{
                      width: 46, minHeight: 52,
                      flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'none', border: 'none', cursor: 'pointer',
                    }}
                    aria-label="Home"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  </button>
                </div>

                {/* Textarea — always fills remaining space */}
                <textarea
                  id="message-input"
                  name="message"
                  ref={inputRef}
                  rows={1}
                  value={newMessage}
                  onChange={handleTyping}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (editingMessage) { handleEdit(e); } else { handleSend(e); }
                    }
                  }}
                  onFocus={() => { 
                    setShowEmojiPicker(false);
                    setShowGifPicker(false);
                    setShowAttachMenu(false);
                    setTimeout(() => scrollToBottom(true), 300); 
                  }}
                  placeholder="Message…"
                  style={{
                    flex: 1,
                    background: 'transparent',
                    fontSize: 16,
                    lineHeight: '1.45',
                    paddingTop: 14,
                    paddingBottom: 14,
                    paddingLeft: 14,
                    maxHeight: 130,
                    overflowY: 'auto',
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'none',
                    WebkitAppearance: 'none',
                    appearance: 'none',
                    resize: 'none',
                    fontFamily: 'inherit',
                    fontWeight: 400,
                    color: '#000',
                    minWidth: 0,
                    margin: 0,
                  }}
                  className="placeholder-[#8E8E93] focus:ring-0 focus:outline-none focus:border-transparent focus:shadow-none !bg-transparent scrollbar-hide"
                />

                {/* Attach — collapses when typing */}
                <div
                  style={{
                    maxWidth: newMessage ? 0 : 38,
                    opacity: newMessage ? 0 : 1,
                    overflow: 'hidden',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'max-width 220ms cubic-bezier(0.4,0,0.2,1), opacity 150ms ease',
                  }}
                >
                  <button
                    type="button"
                    tabIndex={newMessage ? -1 : 0}
                    onClick={(e) => {
                      if (wasLongPressRef.current) {
                        wasLongPressRef.current = false;
                        return;
                      }
                      setShowAttachMenu(v => !v); 
                      setShowEmojiPicker(false);
                      setShowGifPicker(false);
                    }}
                    onPointerDown={(e) => {
                      if (e.pointerType === 'mouse' && e.button !== 0) return;
                      longPressTimerRef.current = setTimeout(() => {
                        longPressTimerRef.current = null;
                        wasLongPressRef.current = true;
                        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([20, 30, 20]);
                        handleAttach(lastUsedAttachment);
                      }, 400);
                    }}
                    onPointerUp={() => {
                      if (longPressTimerRef.current) {
                        clearTimeout(longPressTimerRef.current);
                        longPressTimerRef.current = null;
                      }
                    }}
                    onPointerLeave={() => {
                      if (longPressTimerRef.current) {
                        clearTimeout(longPressTimerRef.current);
                        longPressTimerRef.current = null;
                      }
                    }}
                    style={{
                      width: 38, minHeight: 52,
                      color: showAttachMenu ? '#000' : '#8E8E93',
                      flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'none', border: 'none', cursor: 'pointer',
                      transition: 'color 150ms ease',
                    }}
                    aria-label="Attach"
                  >
                    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(-45deg)' }}>
                      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                    </svg>
                  </button>
                </div>

                {/* Camera — collapses when typing */}
                <div
                  style={{
                    maxWidth: newMessage ? 0 : 38,
                    opacity: newMessage ? 0 : 1,
                    overflow: 'hidden',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'max-width 220ms cubic-bezier(0.4,0,0.2,1), opacity 150ms ease',
                  }}
                >
                  <button
                    type="button"
                    tabIndex={newMessage ? -1 : 0}
                    onClick={() => handleAttach('camera')}
                    style={{
                      width: 38, minHeight: 52,
                      color: '#8E8E93',
                      flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'none', border: 'none', cursor: 'pointer',
                    }}
                    aria-label="Camera"
                  >
                    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                      <circle cx="12" cy="13" r="3"/>
                    </svg>
                  </button>
                </div>

                {/* ── Action Button INSIDE pill — mic or send ── */}
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'flex-end', padding: '5px 5px 5px 0' }}>
                  {isUploading ? (
                    <div
                      style={{
                        width: 42, height: 42, borderRadius: 21,
                        background: '#000', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 200ms ease',
                      }}
                    >
                      <svg className="animate-spin" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    </div>
                  ) : newMessage.trim() || isRecordingLocked ? (
                    /* Send button */
                    <button
                      onPointerDown={(e) => {
                        e.preventDefault();
                        if (isRecordingLocked) stopAndSendVoiceRecording();
                        else if (editingMessage) handleEdit(e as any);
                        else handleSend();
                      }}
                      style={{
                        width: 42, height: 42, borderRadius: 21,
                        background: 'var(--color-success)', color: '#ffffff',
                        border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 1px 8px rgba(0,0,0,0.22)',
                        transition: 'transform 150ms cubic-bezier(0.34,1.56,0.64,1), background 200ms ease',
                        flexShrink: 0,
                        touchAction: 'manipulation',
                      }}
                      className="active:scale-90"
                      aria-label={isRecordingLocked ? 'Send Audio' : (editingMessage ? 'Update' : 'Send')}
                    >
                      {editingMessage && !isRecordingLocked ? (
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                      ) : (
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'translateX(-1px)' }}>
                          <path d="m22 2-7 20-4-9-9-4 20-7z"/><path d="M22 2 11 13"/>
                        </svg>
                      )}
                    </button>
                  ) : (
                    /* Mic button */
                    <div className="relative">
                      {isRecording && !isRecordingLocked && audioSwipeDeltaY < -20 && (
                        <div className="absolute -top-11 left-1/2 -translate-x-1/2 bg-white px-2.5 py-1 rounded-full shadow-sm text-gray-600 text-[11px] font-bold flex items-center gap-1 border border-gray-100 whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 duration-150">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                          Lock
                        </div>
                      )}
                      <button
                        onPointerDown={(e) => {
                          e.preventDefault();
                          if (e.isPrimary) {
                            e.currentTarget.setPointerCapture(e.pointerId);
                            audioSwipeStartX.current = e.clientX;
                            audioSwipeStartY.current = e.clientY;
                            startVoiceRecording();
                          }
                        }}
                        onPointerMove={(e) => {
                          if (isRecording && !isRecordingLocked && e.currentTarget.hasPointerCapture(e.pointerId)) {
                            const deltaX = e.clientX - audioSwipeStartX.current;
                            const deltaY = e.clientY - audioSwipeStartY.current;
                            if (deltaY < -50) {
                              setIsRecordingLocked(true);
                              setAudioSwipeDeltaX(0); setAudioSwipeDeltaY(0);
                              e.currentTarget.releasePointerCapture(e.pointerId);
                            } else if (deltaX < -50) {
                              cancelVoiceRecording();
                              e.currentTarget.releasePointerCapture(e.pointerId);
                            } else {
                              if (deltaX < 0) setAudioSwipeDeltaX(deltaX);
                              if (deltaY < 0) setAudioSwipeDeltaY(deltaY);
                            }
                          }
                        }}
                        onPointerUp={(e) => {
                          e.preventDefault();
                          if (e.currentTarget.hasPointerCapture && e.currentTarget.hasPointerCapture(e.pointerId)) {
                            e.currentTarget.releasePointerCapture(e.pointerId);
                          }
                          if (isRecording && !isRecordingLocked) { stopAndSendVoiceRecording(); }
                        }}
                        onPointerCancel={(e) => {
                          if (e.currentTarget.hasPointerCapture && e.currentTarget.hasPointerCapture(e.pointerId)) {
                            e.currentTarget.releasePointerCapture(e.pointerId);
                          }
                          if (isRecording && !isRecordingLocked) { cancelVoiceRecording(); }
                        }}
                        className="touch-none select-none flex items-center justify-center"
                        style={{
                          width: 42, height: 42, borderRadius: 21,
                          background: isRecording ? '#FF3B30' : 'var(--color-text-main)',
                          color: 'var(--color-base)',
                          border: 'none', cursor: 'pointer',
                          boxShadow: isRecording
                            ? '0 0 0 8px rgba(255,59,48,0.12), 0 2px 10px rgba(255,59,48,0.3)'
                            : '0 1px 8px rgba(0,0,0,0.22)',
                          transform: (isRecording && !isRecordingLocked)
                            ? `translate(${audioSwipeDeltaX}px, ${audioSwipeDeltaY}px) scale(1.12)`
                            : 'scale(1)',
                          transition: (isRecording && !isRecordingLocked)
                            ? 'background 0.15s, box-shadow 0.15s'
                            : 'background 0.2s, box-shadow 0.2s, transform 0.15s',
                          position: 'relative', zIndex: 10,
                          flexShrink: 0,
                        }}
                        aria-label="Voice Message"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showCameraModal && (
        <CameraModal 
          onClose={() => setShowCameraModal(false)}
          onSend={(file) => {
            setShowCameraModal(false);
            handleFileSelected({ target: { files: [file] } } as any);
          }}
        />
      )}

      {showGame && (
        <StickyRushBoard
          conversationId={conversationId}
          userId={user.id}
          userName={profile?.username || 'Player'}
          partnerName={otherUser?.username || 'Partner'}
          channelRef={channelRef}
          initialGameId={gameIdRef.current || undefined}
          onClose={() => {
            setShowGame(false);
            gameIdRef.current = null;
          }}
        />
      )}
    </div>
  );
}
