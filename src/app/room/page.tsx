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
    <div className="flex h-screen w-full items-center justify-center bg-[#FAF6EE]">
      <section className="auth-card room-card" role="dialog" aria-modal="true">
        <div className="room-header mb-6">
          <div className="auth-mark" aria-hidden="true">✦</div>
          <div>
            <p className="eyebrow">Private room</p>
            <h2 className="text-2xl font-semibold mb-1">Your private space</h2>
            <p className="room-subtitle text-gray-500 text-sm">Welcome back.</p>
          </div>
        </div>

        <div className="room-options flex flex-col gap-4">
          <div className="room-option border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-gray-400 transition" onClick={handleCreate}>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">Create a room</p>
                <p className="text-sm text-gray-500">Start a new private chat.</p>
              </div>
              <button className="btn btn-primary px-4 py-2 bg-black text-white rounded-md text-sm">Create</button>
            </div>
          </div>

          <div className="room-divider text-center text-sm text-gray-400 my-2"><span>or</span></div>

          <div className="room-option border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-gray-400 transition" onClick={() => { setShowJoin(true); setCreatedCode(""); }}>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">Join a room</p>
                <p className="text-sm text-gray-500">Enter a code you were given.</p>
              </div>
            </div>
          </div>

          {showJoin && (
            <form onSubmit={handleJoin} className="mt-4 p-4 border rounded-lg bg-white/50">
              <label className="block text-sm font-medium mb-2">
                Enter room code
                <input 
                  type="text" 
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  required 
                  placeholder="e.g. moonlight-27" 
                  className="w-full mt-1 p-2 border rounded-md"
                />
              </label>
              <button className="w-full py-2 bg-black text-white rounded-md font-medium" type="submit">Join chat</button>
            </form>
          )}
        </div>

        {createdCode && (
          <div className="mt-6 p-4 border border-green-200 bg-green-50 rounded-lg text-center">
            <p className="text-sm text-green-700 font-semibold mb-2">Your room code</p>
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-2xl tracking-widest font-mono font-bold text-black">{createdCode}</span>
              <button className="text-xs border px-2 py-1 rounded bg-white" onClick={() => navigator.clipboard.writeText(createdCode)}>Copy</button>
            </div>
            <p className="text-xs text-gray-500 mb-4">Share this code with your person.</p>
            <button className="w-full py-2 bg-black text-white rounded-md font-medium" onClick={enterCreated}>Enter room</button>
          </div>
        )}
      </section>
    </div>
  );
}
