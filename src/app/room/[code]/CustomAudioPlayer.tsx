import React, { useState, useEffect, useRef } from 'react';

interface CustomAudioPlayerProps {
  src: string;
  isMine: boolean;
  messageId: string;
  initialDuration?: number;
}

export function CustomAudioPlayer({ src, isMine, messageId, initialDuration }: CustomAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Generate a consistent pseudo-random waveform for this message
  const waveform = React.useMemo(() => {
    // simple hash from messageId
    let hash = 0;
    for (let i = 0; i < messageId.length; i++) {
      hash = (hash << 5) - hash + messageId.charCodeAt(i);
      hash |= 0;
    }
    const bars = [];
    const numBars = 35; // number of frequency bars
    for (let i = 0; i < numBars; i++) {
      const x = Math.sin(hash + i) * 10000;
      let height = Math.floor((x - Math.floor(x)) * 100);
      // Ensure some variance like a real voice note (quiet ends, louder middle)
      const envelope = Math.sin((i / numBars) * Math.PI); 
      height = Math.max(15, height * envelope);
      bars.push(height);
    }
    return bars;
  }, [messageId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && audio.duration !== Infinity && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!audioRef.current || !duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress(percentage * 100);
  };

  const formatTime = (timeInSeconds: number) => {
    if (!timeInSeconds || isNaN(timeInSeconds)) return "0:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className="flex items-center gap-3 w-full min-w-[240px] max-w-[320px] p-2"
      onClick={(e) => e.stopPropagation()}
    >
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {/* Play/Pause Button */}
      <button 
        onClick={togglePlay}
        className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-95 ${isMine ? 'bg-white text-black' : 'bg-black text-white'}`}
      >
        {isPlaying ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><path d="M5 3l14 9-14 9V3z"/></svg>
        )}
      </button>

      {/* Waveform / Scrubber */}
      <div className="flex-1 flex flex-col justify-center gap-1 overflow-hidden">
        <div 
          className="relative h-7 w-full flex items-center gap-[2px] cursor-pointer py-1"
          onClick={handleSeek}
        >
          {waveform.map((h, i) => {
            const barPercentage = (i / waveform.length) * 100;
            const isPlayed = barPercentage <= progress;
            return (
              <div 
                key={i}
                className={`flex-1 rounded-full transition-colors ${
                  isPlayed 
                    ? (isMine ? 'bg-white' : 'bg-black') 
                    : (isMine ? 'bg-white/30' : 'bg-black/20')
                }`}
                style={{ height: `${Math.max(15, h)}%` }}
              />
            );
          })}
        </div>
        
        {/* Time display */}
        <div className={`text-[10px] font-bold tracking-wide ${isMine ? 'text-white/70' : 'text-black/50'} flex justify-between px-0.5`}>
          <span>{(isPlaying || currentTime > 0) ? formatTime(currentTime) : formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
