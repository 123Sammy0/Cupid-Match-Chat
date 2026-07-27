"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function generateRoomCode() {
  const words = ["moonlight", "stardust", "velvet", "ocean", "silent", "forest", "whisper", "echo", "ember", "dawn"];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(Math.random() * 90) + 10;
  return `${word}-${num}`;
}

export default function RoomSelector() {
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [createdCode, setCreatedCode] = useState("");
  const router = useRouter();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      router.push(`/room/${joinCode.trim()}`);
    }
  };

  const handleCreate = () => {
    const code = generateRoomCode();
    setCreatedCode(code);
    setShowJoin(false);
  };

  const enterCreated = () => {
    if (createdCode) {
      router.push(`/room/${createdCode}`);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-white text-black">
      <section className="auth-card room-card border border-gray-200 shadow-sm bg-white" role="dialog" aria-modal="true" style={{maxWidth: '450px', width: '100%', padding: '32px', borderRadius: '16px'}}>
        <div className="room-header mb-6">
          <div className="auth-mark text-black text-2xl mb-4" aria-hidden="true">✦</div>
          <div>
            <p className="eyebrow text-gray-500 text-xs tracking-widest uppercase mb-2">Private room</p>
            <h2 className="text-2xl font-bold mb-1 text-black">Your private space</h2>
            <p className="room-subtitle text-gray-500 text-sm">Welcome back.</p>
          </div>
        </div>

        <div className="room-options flex flex-col gap-4">
          <div className="room-option border border-gray-300 rounded-lg p-4 cursor-pointer hover:border-black transition-colors" onClick={handleCreate}>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-black">Create a room</p>
                <p className="text-sm text-gray-500">Start a new private chat.</p>
              </div>
              <button className="px-4 py-2 bg-black text-white rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors">Create</button>
            </div>
          </div>

          <div className="room-divider text-center text-sm text-gray-400 my-2"><span>or</span></div>

          <div className="room-option border border-gray-300 rounded-lg p-4 cursor-pointer hover:border-black transition-colors" onClick={() => { setShowJoin(true); setCreatedCode(""); }}>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-black">Join a room</p>
                <p className="text-sm text-gray-500">Enter a code you were given.</p>
              </div>
            </div>
          </div>

          {showJoin && (
            <form onSubmit={handleJoin} className="mt-4 p-4 border border-gray-300 rounded-lg bg-white">
              <label className="block text-sm font-semibold mb-2 text-black">
                Enter room code
                <input 
                  type="text" 
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  required 
                  placeholder="e.g. moonlight-27" 
                  className="w-full mt-2 p-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
              </label>
              <button className="w-full py-3 mt-2 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-colors" type="submit">Join chat</button>
            </form>
          )}
        </div>

        {createdCode && (
          <div className="mt-6 p-4 border border-gray-300 bg-gray-50 rounded-lg text-center">
            <p className="text-sm text-black font-semibold mb-2">Your room code</p>
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-2xl tracking-widest font-mono font-bold text-black">{createdCode}</span>
              <button className="text-xs border border-gray-300 px-3 py-1 rounded-full bg-white text-black hover:bg-gray-100 transition-colors" onClick={() => navigator.clipboard.writeText(createdCode)}>Copy</button>
            </div>
            <p className="text-xs text-gray-500 mb-4">Share this code with your person.</p>
            <button className="w-full py-3 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-colors" onClick={enterCreated}>Enter room</button>
          </div>
        )}
      </section>
    </div>
  );
}
