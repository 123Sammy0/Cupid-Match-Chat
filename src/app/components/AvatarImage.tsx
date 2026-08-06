"use client";

import { useState } from "react";

interface AvatarImageProps {
  url?: string | null;
  username?: string | null;
}

export default function AvatarImage({ url, username }: AvatarImageProps) {
  const [error, setError] = useState(false);

  if (!url || error) {
    return <>{username?.charAt(0).toUpperCase() || '?'}</>;
  }

  return (
    <img 
      src={url} 
      alt={username || 'Avatar'} 
      className="w-full h-full object-cover" 
      onError={() => setError(true)} 
    />
  );
}
