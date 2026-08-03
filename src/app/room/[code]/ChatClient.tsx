"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { markConversationRead, markConversationDelivered, blockUser, editMessage, deleteMessage } from "@/app/actions/chat";
import Image from "next/image";

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
  const [emojiCategory, setEmojiCategory] = useState(0);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showCallModal, setShowCallModal] = useState<"voice" | "video" | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activePreviewImage, setActivePreviewImage] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [messageMenu, setMessageMenu] = useState<string | null>(null);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [isSearchingChat, setIsSearchingChat] = useState(false);
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const isTypingRef = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileTypeRef = useRef<"image" | "video" | "audio">("image");
  // Swipe-to-reply refs
  const swipeStartX = useRef(0);
  const swipeMessageRef = useRef<any>(null);
  const [swipingId, setSwipingId] = useState<string | null>(null);
  const [swipeDelta, setSwipeDelta] = useState(0);
  // Read receipts & Presence
  const [otherLastRead, setOtherLastRead] = useState<string | null>(null);
  const [otherLastDelivered, setOtherLastDelivered] = useState<string | null>(null);
  const [otherUserLastSeen, setOtherUserLastSeen] = useState<string | null>(otherUser?.last_seen || null);
  const [localMessages, setLocalMessages] = useState<any[]>([]); // Track Sending and Failed messages

  // PHASE 2 — Lifecycle remount detection
  useEffect(() => {
    console.log('[LIFECYCLE] ChatClient MOUNTED', Date.now());
    return () => console.log('[LIFECYCLE] ChatClient UNMOUNTED', Date.now());
  }, []);

  // PHASE 3 — Log whenever localMessages changes and track when it actually PAINTS
  useEffect(() => {
    if (localMessages.length === 0) return;
    requestAnimationFrame(() => {
      console.log(`[PAINT] localMessages updated & painted. count=${localMessages.length}`, Date.now());
    });
  }, [localMessages]);

  // PHASE 4 — sessionStorage write commented out to isolate blocking effect
  // Uncomment to restore: this JSON.stringifies all messages on every message change
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      try {
        // TEMPORARILY DISABLED FOR LATENCY DIAGNOSIS:
        // sessionStorage.setItem(`cupid_messages_${conversationId}`, JSON.stringify(messages));
        console.log('[DIAG] sessionStorage write skipped (disabled for testing)');
      } catch (e) {}
    }
  }, [messages, conversationId]);

  useEffect(() => {
    if (!conversationId) return;

    try {
      const cached = sessionStorage.getItem(`cupid_messages_${conversationId}`);
      if (cached) setMessages(JSON.parse(cached));
    } catch (e) {}

    const supabaseClient = createClient();

    const fetchMessages = async () => {
      const { data } = await supabaseClient
        .from('messages')
        .select('*, profiles(username)')
        .eq('conversation_id', conversationId)
        .order('sent_at', { ascending: true });
      if (data) {
        setMessages(data);
        setLocalMessages(prev => prev.filter(m => !data.some((d: any) => d.id === m.id)));
        try { sessionStorage.setItem(`cupid_messages_${conversationId}`, JSON.stringify(data)); } catch (e) {}
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

    // ─── CHANNEL 1: Presence ────────────────────────────────────────────────
    // Read from the global window state emitted by GlobalPresence.tsx
    // This avoids singleton channel config conflicts in Supabase JS.
    const handleSync = (e: any) => {
      const state = e.detail;
      const isOnline = Object.values(state).some((presences: any) =>
        presences.some((p: any) => p.user_id === otherUser?.id)
      );
      setOtherUserOnline(isOnline);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('global_presence_sync', handleSync);
      // Read initial state instantly to fix race conditions if ChatClient mounted after sync
      if ((window as any)._globalPresenceState) {
        handleSync({ detail: (window as any)._globalPresenceState });
      }
    }

    // ─── CHANNEL 2: Room broadcast (typing + instant messages) ──────────────
    // Broadcast-only — no postgres_changes here so it subscribes instantly.
    const roomChannel = supabaseClient.channel(`room:${conversationId}`, {
      config: { broadcast: { self: false } }
    });
    channelRef.current = roomChannel;

    roomChannel
      .on('broadcast', { event: 'new_message' }, (payload: any) => {
        const msg = payload.payload;
        if (msg.sender_id !== user.id) {
          setMessages(prev => prev.some((m: any) => m.id === msg.id) ? prev : [...prev, msg]);
          markConversationRead(conversationId);
        }
      })
      .on('broadcast', { event: 'typing' }, (payload: any) => {
        if (payload.payload?.user_id === otherUser?.id) {
          setOtherUserTyping(payload.payload.isTyping);
          if (payload.payload.isTyping) {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => setOtherUserTyping(false), 3000);
          } else {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          }
        }
      })
      .subscribe();

    // ─── CHANNEL 3: Postgres changes (DB events) ────────────────────────────
    const dbChannel = supabaseClient.channel(`db:${conversationId}`);
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
          if (prev.some((m: any) => m.id === payload.new.id)) return prev;
          return [...prev, { ...payload.new, profiles: { username } }];
        });
        // Sender: remove the optimistic local copy
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
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocus);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (typeof window !== 'undefined') {
        window.removeEventListener('global_presence_sync', handleSync);
      }
      supabaseClient.removeChannel(roomChannel);
      supabaseClient.removeChannel(dbChannel);
      channelRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    if (messagesEndRef.current?.parentElement) {
      const container = messagesEndRef.current.parentElement;
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  }, [messages, otherUserTyping]);



  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    // Auto-expand textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;

    if (!isTypingRef.current && channelRef.current) {
      isTypingRef.current = true;
      channelRef.current.send({ type: 'broadcast', event: 'typing', payload: { user_id: user.id, isTyping: true } });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      if (channelRef.current) channelRef.current.send({ type: 'broadcast', event: 'typing', payload: { user_id: user.id, isTyping: false } });
    }, 1500);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim()) return;
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
    if (channelRef.current) channelRef.current.send({ type: 'broadcast', event: 'typing', payload: { user_id: user.id, isTyping: false } });

    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
    const msgId = crypto.randomUUID();

    const payload = {
      id: msgId, sender_id: user.id, conversation_id: conversationId,
      content: finalContent, type: 'text', sent_at: new Date().toISOString(),
      expires_at: expiresAt, profiles: { username: profile?.username }
    };

    console.log(`[T+${(performance.now()-t0).toFixed(1)}ms] calling setLocalMessages (optimistic)`);
    setLocalMessages((prev) => [...prev, { ...payload, localStatus: 'sending' }]);
    console.log(`[T+${(performance.now()-t0).toFixed(1)}ms] setLocalMessages called (React will batch & paint async)`);

    // Phase 5 — Broadcast send timing
    const tBroadcast = performance.now();
    channelRef.current?.send({ type: 'broadcast', event: 'new_message', payload });
    console.log(`[T+${(performance.now()-t0).toFixed(1)}ms] broadcast .send() dispatched (${(performance.now()-tBroadcast).toFixed(1)}ms for send call itself)`);

    // DB insert timing
    const tInsert = performance.now();
    console.log(`[T+${(performance.now()-t0).toFixed(1)}ms] starting supabase insert...`);
    const { error } = await supabase.from('messages').insert({
      id: msgId, sender_id: user.id, conversation_id: conversationId,
      content: finalContent, type: 'text', expires_at: expiresAt
    });
    console.log(`[T+${(performance.now()-t0).toFixed(1)}ms] supabase insert resolved | insert took ${(performance.now()-tInsert).toFixed(1)}ms | error=${JSON.stringify(error)}`);

    if (error) {
      console.error("Message insert error:", error);
      setLocalMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, localStatus: 'failed' } : m));
    } else {
      // Clear the localMessage sending state on confirmed DB write
      setLocalMessages((prev) => prev.filter(m => m.id !== msgId));
      console.log(`[T+${(performance.now()-t0).toFixed(1)}ms] localMessages cleared (optimistic removed, awaiting postgres_changes echo)`);
    }
  };

  const handleRetry = async (msg: any) => {
    setLocalMessages(prev => prev.map(m => m.id === msg.id ? { ...m, localStatus: 'sending' } : m));
    const { error } = await supabase.from('messages').insert({
      id: msg.id, sender_id: msg.sender_id, conversation_id: msg.conversation_id,
      content: msg.content, type: msg.type, expires_at: msg.expires_at
    });
    if (error) {
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
    
    if (diff < 60) return `Last seen just now`;
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

    let currentReactions = [];
    try {
      if (msg.reactions) {
        currentReactions = typeof msg.reactions === 'string' ? JSON.parse(msg.reactions) : msg.reactions;
      }
    } catch {}

    // Toggle reaction
    const existingIdx = currentReactions.findIndex((r: any) => r.user_id === user.id);
    if (existingIdx > -1) {
      if (currentReactions[existingIdx].emoji === emoji) {
        currentReactions.splice(existingIdx, 1);
      } else {
        currentReactions[existingIdx].emoji = emoji;
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
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipingId) return;
    const delta = e.touches[0].clientX - swipeStartX.current;
    // Only allow swiping right (positive delta)
    if (delta > 0 && delta < 120) {
      setSwipeDelta(delta);
    }
  };

  const handleTouchEnd = () => {
    if (swipeDelta > 60 && swipeMessageRef.current) {
      setReplyTo(swipeMessageRef.current);
      inputRef.current?.focus();
    }
    setSwipingId(null);
    setSwipeDelta(0);
    swipeMessageRef.current = null;
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

  const handleAttach = (type: "image" | "video" | "audio") => {
    setShowAttachMenu(false);
    fileTypeRef.current = type;
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
      const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

      setMessages(prev => [...prev, {
        id: msgId, sender_id: user.id, conversation_id: conversationId,
        content: msgContent, type, sent_at: new Date().toISOString(),
        expires_at: expiresAt, profiles: { username: profile?.username }
      }]);

      const { error: insertError } = await supabase.from('messages').insert({
        id: msgId, sender_id: user.id, conversation_id: conversationId,
        content: msgContent, type, expires_at: expiresAt
      });

      if (insertError) throw insertError;
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
      const wrapper = document.getElementById('chat-viewport-wrapper');
      if (wrapper) {
        wrapper.style.setProperty('height', `${vh}px`, 'important');
        wrapper.style.setProperty('transform', `translateY(${offsetTop}px)`, 'important');
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

  return (
    <div id="chat-viewport-wrapper" className="w-full h-full flex flex-col relative overflow-hidden bg-white">
      {/* Call Modal */}
      {showCallModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCallModal(null)}>
          <div className="bg-white rounded-[32px] p-8 w-full max-w-[300px] flex flex-col items-center gap-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-20 h-20 rounded-[24px] bg-gradient-to-tr from-[#3A2034] to-[#5a3652] text-white flex items-center justify-center font-bold text-3xl shadow-lg">
              {otherUser?.username?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="text-center">
              <p className="font-bold text-[20px] text-[#3A2034]">{otherUser?.username || 'Unknown'}</p>
              <p className="text-gray-400 text-sm font-medium mt-1">
                {showCallModal === "video" ? "📹 Video call" : "📞 Voice call"} — Coming soon
              </p>
            </div>
            <p className="text-center text-gray-500 text-sm leading-relaxed">
              Calling features are coming in the next update! You can still chat in the meantime. 💬
            </p>
            <button onClick={() => setShowCallModal(null)} className="w-full py-3 bg-[#3A2034] text-white font-semibold rounded-2xl hover:bg-[#261522] transition-colors">
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
            <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-[#3A2034] to-[#5a3652] text-white flex items-center justify-center font-bold text-5xl shadow-lg mt-2">
              {otherUser?.avatar_url ? otherUser.avatar_url : otherUser?.username?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="text-center w-full mt-2">
              <h2 className="font-bold text-[24px] text-[#3A2034] break-words">{otherUser?.username || 'Unknown'}</h2>
              <p className="text-[#D97A89] text-sm font-semibold mt-1">
                {otherUserOnline ? '🟢 Online now' : '⚪ Offline'}
              </p>
            </div>
            <div className="w-full bg-slate-50 p-4 rounded-2xl mt-2 border border-slate-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">About</p>
              <p className="text-sm text-[#3A2034] font-medium leading-relaxed">
                {otherUser?.bio || "Hey there! I am using this app."}
              </p>
            </div>
            <div className="flex gap-2 w-full mt-2">
              <button onClick={() => { setShowContactModal(false); setShowCallModal("voice"); }} className="flex-1 py-3 bg-[#F0F2F5] hover:bg-gray-200 text-[#3A2034] font-semibold rounded-2xl transition-colors flex justify-center items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg> Voice
              </button>
              <button onClick={() => { setShowContactModal(false); setShowCallModal("video"); }} className="flex-1 py-3 bg-[#F0F2F5] hover:bg-gray-200 text-[#3A2034] font-semibold rounded-2xl transition-colors flex justify-center items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg> Video
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-2 py-2 bg-white/95 backdrop-blur-xl text-[#3A2034] z-10 border-b border-[#EEE7F7]/60 sticky top-0 relative">
        
        {isSearchingChat ? (
          <div className="flex-1 flex items-center gap-2 px-2 animate-in fade-in slide-in-from-right-4 duration-200">
            <button onClick={() => { setIsSearchingChat(false); setChatSearchQuery(""); }} className="p-2 rounded-full hover:bg-slate-100 text-gray-400 hover:text-[#3A2034] transition-all active:scale-90 active:bg-slate-200 select-none cursor-pointer" aria-label="Back">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <input 
              autoFocus
              type="text" 
              placeholder="Search in chat..."
              value={chatSearchQuery}
              onChange={(e) => setChatSearchQuery(e.target.value)}
              className="flex-1 bg-slate-100 rounded-full py-2 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#D97A89]/30"
            />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1">
              <button onClick={() => router.push('/room')} className="p-2 rounded-full hover:bg-slate-100 text-gray-400 hover:text-[#3A2034] transition-all active:scale-90 active:bg-slate-200 select-none cursor-pointer" aria-label="Back">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowContactModal(true)}>
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#3A2034] to-[#5a3652] text-white flex items-center justify-center font-bold text-2xl shadow-sm">
                    {otherUser?.avatar_url ? otherUser.avatar_url : otherUser?.username?.charAt(0).toUpperCase() || '?'}
              </div>
              {otherUserOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"/>}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[15px] text-[#3A2034] leading-tight">{otherUser?.username || 'Unknown'}</span>
              <span className="text-[11px] text-gray-400 font-semibold">
                {otherUserTyping ? '✍️ typing...' : otherUserOnline ? 'Online' : formatLastSeen(otherUserLastSeen)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-0.5 relative">
          <button onClick={() => setShowCallModal("voice")} className="p-2 rounded-full hover:bg-slate-100 text-[#D97A89] transition-colors" aria-label="Voice Call">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </button>
          <button onClick={() => setShowCallModal("video")} className="p-2 rounded-full hover:bg-slate-100 text-[#D97A89] transition-colors" aria-label="Video Call">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
          </button>
          <button onClick={() => setShowHeaderMenu(!showHeaderMenu)} className="p-2 rounded-full hover:bg-slate-100 text-gray-400 hover:text-[#3A2034] transition-colors" aria-label="More">
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
          </>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2 bg-white" onClick={() => { setShowEmojiPicker(false); setShowAttachMenu(false); setMessageMenu(null); setShowHeaderMenu(false); }}>
        {(() => {
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
          
          // Parse JSON content (media or replies)
          let parsedData: any = null;
          try { 
            if (m.content.startsWith('{')) parsedData = JSON.parse(m.content); 
          } catch {}

          const mediaData = (m.type === 'image' || m.type === 'video' || m.type === 'audio') ? parsedData : null;
          const replyData = (!mediaData && parsedData && parsedData.replyTo) ? parsedData : null;
          const textContent = replyData ? replyData.text : (!mediaData ? m.content : null);

          const showTail = !nextMsg || nextMsg.sender_id !== m.sender_id || showTime;

          // Filter by search query if searching
          if (isSearchingChat && chatSearchQuery.trim() !== "" && !mediaData) {
            if (!textContent?.toLowerCase().includes(chatSearchQuery.toLowerCase())) {
              return null;
            }
          }

          return (
            <div key={m.id} className="flex flex-col w-full">
              {showDateSeparator && (
                <div className="flex justify-center w-full my-4">
                  <div className="bg-slate-100 text-slate-500 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                    {formatMessageDate(m.sent_at)}
                  </div>
                </div>
              )}
              <div 
                className={`flex flex-col w-full ${isMine ? 'items-end' : 'items-start'} mb-2 relative`}
              onTouchStart={(e) => handleTouchStart(e, m)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Swipe icon indicator behind message */}
              {swipingId === m.id && swipeDelta > 20 && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D97A89] animate-pulse flex items-center gap-1">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
                </div>
              )}

              <div 
                className={`relative max-w-[85%] text-[15px] shadow-sm leading-relaxed cursor-pointer group ${isMine ? 'bg-[#3A2034] text-white' : 'bg-white border border-gray-100 text-[#3A2034]'} ${showTail && isMine ? 'rounded-[20px] rounded-br-[4px]' : showTail && !isMine ? 'rounded-[20px] rounded-bl-[4px]' : 'rounded-[20px]'}`}
                onClick={(e) => { e.stopPropagation(); setMessageMenu(m.id === messageMenu ? null : m.id); }}
                style={{ 
                  transform: swipingId === m.id ? `translateX(${Math.min(swipeDelta, 80)}px)` : 'none', 
                  transition: swipingId === m.id ? 'none' : 'transform 0.15s ease-out' 
                }}
              >
                
                {/* Context Menu Dropdown */}
                {messageMenu === m.id && (
                  <div className="relative">
                    {/* Reaction Emojis Row Above Menu */}
                    <div className={`absolute bottom-full mb-2 ${isMine ? 'right-0' : 'left-0'} bg-white border border-gray-100 shadow-xl rounded-full px-2 py-1.5 z-40 flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150`}>
                      {["❤️", "👍", "😂", "😮", "😢", "🙏"].map(emoji => (
                        <button 
                          key={emoji} 
                          onClick={(e) => { e.stopPropagation(); handleReact(m.id, emoji); }} 
                          className="text-lg hover:scale-125 transition-transform px-0.5 active:scale-90"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    {/* Main Actions Dropdown */}
                    <div className={`absolute top-0 ${isMine ? 'right-full mr-2' : 'left-full ml-2'} w-36 bg-white border border-gray-100 shadow-xl rounded-xl py-1 z-30 flex flex-col text-sm text-[#3A2034] font-medium animate-in fade-in zoom-in duration-150`}>
                      <button onClick={(e) => { e.stopPropagation(); setReplyTo(m); setMessageMenu(null); inputRef.current?.focus(); }} className="px-4 py-2 text-left hover:bg-slate-50 transition-colors flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg> Reply
                      </button>
                      {isMine && m.type === 'text' && !m.is_deleted && (
                        <button onClick={(e) => { e.stopPropagation(); setEditingMessage(m); setNewMessage(m.content); setMessageMenu(null); inputRef.current?.focus(); }} className="px-4 py-2 text-left hover:bg-slate-50 transition-colors flex items-center gap-2">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg> Edit
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(m.id, false); }} className="px-4 py-2 text-left text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg> Delete for me
                      </button>
                      {isMine && !m.is_deleted && (
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(m.id, true); }} className="px-4 py-2 text-left text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2 border-t border-gray-100">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg> Delete for everyone
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Tail SVG */}
                {showTail && isMine && (
                  <svg className="absolute -right-[6px] bottom-0 text-[#3A2034] w-[16px] h-[16px]" viewBox="0 0 8 13" fill="currentColor"><path d="M5.188 1H0v11.156C0 12.156 1.15 13 2.15 13c1.378 0 2.227-.881 3.528-2.181L8 8.5V1z"/></svg>
                )}
                {showTail && !isMine && (
                  <svg className="absolute -left-[6px] bottom-0 text-white w-[16px] h-[16px]" viewBox="0 0 8 13" fill="currentColor"><path d="M2.812 1H8v11.156C8 12.156 6.85 13 5.85 13 4.472 13 3.623 12.119 2.322 10.819L0 8.5V1z"/></svg>
                )}

                <div className={`relative ${mediaData ? 'p-1' : 'px-3 pt-2 pb-1.5'} z-10`}>
                  
                  {/* Replied Message Preview */}
                  {replyData && (
                    <div className={`mb-1.5 p-2 rounded-xl text-sm border-l-4 ${isMine ? 'bg-black/20 border-white/40 text-white/90' : 'bg-[#F0F2F5] border-[#D97A89] text-gray-700'}`}>
                      <p className={`font-bold text-xs mb-0.5 ${isMine ? 'text-white' : 'text-[#D97A89]'}`}>{replyData.replyTo.sender}</p>
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
                          className="max-w-[240px] sm:max-w-[280px] max-h-[320px] object-cover rounded-[16px] cursor-pointer hover:opacity-90 transition-opacity" 
                          onClick={() => setActivePreviewImage(mediaData.url)}
                        />
                      )}
                      {mediaData?.type === 'video' && (
                        <video src={mediaData.url} controls className="max-w-[240px] sm:max-w-[280px] rounded-[16px]" />
                      )}
                      {mediaData?.type === 'audio' && (
                        <div className="px-2 py-2 flex items-center gap-2">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                          <audio src={mediaData.url} controls className="h-10 w-44" style={{ filter: isMine ? 'invert(1)' : 'none' }} />
                        </div>
                      )}
                      {!mediaData && (
                        <span className="break-words whitespace-pre-wrap">{textContent}<span className="inline-block w-[75px]" /></span>
                      )}
                    </>
                  )}
                  
                  {/* Timestamp & Status inside bubble */}
                  <div className={`flex items-center gap-1 text-[10px] font-bold ${mediaData && !m.is_deleted ? 'absolute bottom-2 right-2 bg-black/40 text-white px-1.5 py-0.5 rounded-full' : (isMine ? 'absolute bottom-[4px] right-[8px] text-[#D97A89]/90' : 'absolute bottom-[4px] right-[8px] text-gray-400')}`}>
                    {m.is_edited && !m.is_deleted && <span className="opacity-70 mr-0.5">Edited</span>}
                    <span>{new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isMine && m.localStatus === 'sending' && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 ml-0.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    )}
                    {isMine && m.localStatus === 'failed' && (
                      <button onClick={(e) => { e.stopPropagation(); handleRetry(m); }} className="text-red-400 font-bold ml-0.5" title="Retry">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      </button>
                    )}
                  </div>
                  {/* Clear float to ensure bubble wraps timestamp */}
                  {!mediaData && <div className="clear-both"></div>}

                  {/* Reactions list at bottom of bubble */}
                  {m.reactions && m.reactions.length > 0 && !m.localStatus && (
                    <div className={`absolute bottom-[-10px] ${isMine ? 'right-4' : 'left-4'} flex items-center gap-0.5 bg-white border border-gray-100 shadow-sm rounded-full px-1.5 py-0.5 z-20`}>
                      {Array.from(new Set(m.reactions.map((r: any) => r.emoji))).map((emoji: any) => (
                        <span key={emoji} className="text-[12px]">{emoji}</span>
                      ))}
                      {m.reactions.length > 1 && (
                        <span className="text-[9px] text-gray-400 font-bold ml-0.5">{m.reactions.length}</span>
                      )}
                    </div>
                  )}
                </div>
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
            <div className="px-4 py-3 rounded-[20px] rounded-bl-[5px] bg-white border border-[#EEE7F7] shadow-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#D97A89]/70 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
              <span className="w-1.5 h-1.5 bg-[#D97A89]/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
              <span className="w-1.5 h-1.5 bg-[#D97A89]/70 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="bg-white border-t border-[#EEE7F7] flex flex-col" style={{ height: 280 }}>
          {/* Category tabs */}
          <div className="flex items-center gap-0 border-b border-[#EEE7F7] px-2 overflow-x-auto">
            {EMOJI_CATEGORIES.map((cat, i) => (
              <button
                key={cat.name}
                onClick={() => setEmojiCategory(i)}
                className={`flex-shrink-0 px-3 py-2.5 text-lg transition-all border-b-2 ${emojiCategory === i ? 'border-[#D97A89]' : 'border-transparent opacity-50'}`}
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

      {/* Attachment Menu */}
      {showAttachMenu && (
        <div className="bg-white border-t border-[#EEE7F7] px-6 py-5 flex justify-around items-center" onClick={() => setShowAttachMenu(false)}>
          <button onClick={() => handleAttach("image")} className="flex flex-col items-center gap-2 group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D97A89] to-[#b35e6b] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
              </svg>
            </div>
            <span className="text-[12px] font-semibold text-gray-500">Image</span>
          </button>
          <button onClick={() => handleAttach("video")} className="flex flex-col items-center gap-2 group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
              </svg>
            </div>
            <span className="text-[12px] font-semibold text-gray-500">Video</span>
          </button>
          <button onClick={() => handleAttach("audio")} className="flex flex-col items-center gap-2 group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
              </svg>
            </div>
            <span className="text-[12px] font-semibold text-gray-500">Audio</span>
          </button>
        </div>
      )}

      {/* Full-screen Image Preview Lightbox */}
      {activePreviewImage && (
        <div 
          className="absolute inset-0 z-40 bg-black/95 flex flex-col items-center justify-between p-4 rounded-[inherit] animate-in fade-in duration-200"
          onClick={() => setActivePreviewImage(null)}
        >
          {/* Header */}
          <div className="w-full max-w-[450px] flex items-center justify-between py-2 text-white z-10">
            <button 
              onClick={() => setActivePreviewImage(null)} 
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

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={fileTypeRef.current === 'image' ? 'image/*' : fileTypeRef.current === 'video' ? 'video/*' : 'audio/*'}
        onChange={handleFileSelected}
      />

      {/* Composer Area */}
      <div className="bg-[#F0F2F5]/50 border-t border-gray-100 z-20 flex flex-col">
        
        {/* Reply/Edit Banner */}
        {(replyTo || editingMessage) && (
          <div className="px-4 pt-3 pb-1 flex items-center justify-between animate-in slide-in-from-bottom-2">
            <div className={`flex-1 bg-white p-3 rounded-2xl border-l-4 ${editingMessage ? 'border-sky-500' : 'border-[#D97A89]'} shadow-sm text-sm`}>
              <div className="flex items-center gap-1.5 mb-0.5">
                {editingMessage ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-sky-500"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                ) : null}
                <p className={`font-bold ${editingMessage ? 'text-sky-500' : 'text-[#D97A89]'} text-xs`}>
                  {editingMessage ? 'Editing message' : (replyTo?.sender_id === user.id ? 'You' : otherUser?.username || 'Unknown')}
                </p>
              </div>
              <p className="text-gray-600 line-clamp-1">
                {editingMessage ? editingMessage.content : 
                 replyTo?.type === 'image' ? '📷 Image' : 
                 replyTo?.type === 'video' ? '🎥 Video' : 
                 replyTo?.type === 'audio' ? '🎵 Audio' : 
                 (replyTo?.content.startsWith('{') ? JSON.parse(replyTo.content).text : replyTo?.content)}
              </p>
            </div>
            <button onClick={() => { setReplyTo(null); setEditingMessage(null); setNewMessage(''); }} className="p-2 ml-2 bg-gray-200 hover:bg-gray-300 rounded-full text-gray-600 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        )}

        <div className="px-2 py-2 flex items-end gap-1.5">
        
        {/* Input area */}
        <div className="flex-1 bg-white rounded-3xl shadow-sm flex items-end overflow-hidden transition-all min-h-[44px]">
          {/* Emoji toggle (inside input like WhatsApp) */}
          <button
            type="button"
            onClick={() => { setShowEmojiPicker(v => !v); setShowAttachMenu(false); }}
            className={`p-2.5 pb-2 ml-1 flex-shrink-0 transition-colors ${showEmojiPicker ? 'text-[#D97A89]' : 'text-gray-400 hover:text-gray-500'}`}
            aria-label="Emoji"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>
            </svg>
          </button>

          <textarea
            ref={inputRef}
            rows={1}
            value={newMessage}
            onChange={handleTyping}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (editingMessage) {
                  handleEdit(e);
                } else {
                  handleSend(e);
                }
              }
            }}
            onFocus={() => {
              setTimeout(() => {
                if (messagesEndRef.current?.parentElement) {
                  const container = messagesEndRef.current.parentElement;
                  container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
                }
              }, 300);
            }}
            placeholder="Message"
            className="flex-1 bg-transparent py-2.5 px-2 focus:outline-none focus:ring-0 focus:border-transparent border-none text-[#3A2034] font-medium placeholder-gray-400 text-[16px] sm:text-[15px] min-w-0 resize-none max-h-[120px] overflow-y-auto self-center"
            style={{ lineHeight: '1.4' }}
          />

          {/* Attachment button (inside input like WhatsApp) */}
          <button
            type="button"
            onClick={() => { setShowAttachMenu(v => !v); setShowEmojiPicker(false); }}
            className={`p-2.5 pb-2 mr-1 flex-shrink-0 transition-colors ${showAttachMenu ? 'text-[#D97A89]' : 'text-gray-400 hover:text-gray-500'}`}
            aria-label="Attach"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(-45deg)' }}>
              <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
          </button>
        </div>

        {/* Action Button (Mic or Send) */}
        {isUploading ? (
          <div className="p-3 bg-[#3A2034] text-white rounded-full flex-shrink-0 flex items-center justify-center shadow-md w-11 h-11 mb-[2px]">
            <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          </div>
        ) : newMessage.trim() ? (
          <button
            onPointerDown={(e) => e.preventDefault()}
            onClick={editingMessage ? handleEdit : handleSend}
            className={`p-3 text-white rounded-full transition-all shadow-md active:scale-95 flex-shrink-0 w-11 h-11 mb-[2px] flex items-center justify-center ${editingMessage ? 'bg-sky-500 hover:bg-sky-600' : 'bg-[#3A2034] hover:bg-[#261522]'}`}
            aria-label={editingMessage ? "Update" : "Send"}
          >
            {editingMessage ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-0.5">
                <path d="m22 2-7 20-4-9-9-4 20-7z"/><path d="M22 2 11 13"/>
              </svg>
            )}
          </button>
        ) : (
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              setIsRecording(true);
            }}
            onPointerUp={() => {
              setIsRecording(false);
              alert("Voice recording is coming in a future update!");
            }}
            onPointerLeave={() => setIsRecording(false)}
            className={`p-3 text-white rounded-full transition-all shadow-md flex-shrink-0 w-11 h-11 mb-[2px] flex items-center justify-center ${isRecording ? 'bg-red-500 scale-125' : 'bg-[#3A2034] hover:bg-[#261522] active:scale-95'}`}
            aria-label="Voice Message"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>
            </svg>
          </button>
        )}

        </div>
      </div>
    </div>
  );
}
