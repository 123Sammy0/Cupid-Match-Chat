'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface CameraModalProps {
  onClose: () => void;
  onSend: (file: File) => void;
}

export default function CameraModal({ onClose, onSend }: CameraModalProps) {
  const [permissionState, setPermissionState] = useState<'requesting' | 'granted' | 'denied' | 'error'>('requesting');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async (facing: 'user' | 'environment') => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = newStream;
      setStream(newStream);
      setPermissionState('granted');
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionState('denied');
      } else {
        setPermissionState('error');
        setErrorMessage(err.message || 'Camera unavailable');
      }
    }
  }, []);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchCamera = () => {
    const newFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacing);
    startCamera(newFacing);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    // Haptic feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    setIsCapturing(true);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Apply beautiful filter to the saved photo to match the live preview
      ctx.filter = 'contrast(1.08) brightness(1.08) saturate(1.15)';
      
      // If using front camera, we should flip the canvas horizontally to match the mirrored preview
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedPhoto(dataUrl);
      
      canvas.toBlob((blob) => {
        if (blob) setCapturedBlob(blob);
      }, 'image/jpeg', 0.9);
    }
    
    setTimeout(() => setIsCapturing(false), 50);
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setCapturedBlob(null);
  };

  const handleSend = () => {
    if (capturedBlob) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([30, 50, 30]);
      }
      const file = new File([capturedBlob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      onSend(file);
    }
  };

  return (
    <>
      {/* Dimmed Background Overlay */}
      <div 
        className="fixed inset-0 z-[100] bg-transparent"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[101] bg-black flex flex-col animate-in slide-in-from-bottom duration-300 rounded-t-[28px] overflow-hidden shadow-2xl mx-auto max-w-3xl" style={{ height: '65vh', maxHeight: '800px' }}>
        {/* Drag handle / Pill */}
        <div className="absolute top-0 left-0 right-0 z-20 flex justify-center pt-3 pb-1 bg-gradient-to-b from-black/70 to-transparent">
          <div className="w-12 h-1.5 bg-white/30 rounded-full" />
        </div>

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 pt-8 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-95 transition-transform"
            aria-label="Close camera"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
          
          {!capturedPhoto && permissionState === 'granted' && (
            <button 
              onClick={switchCamera}
              className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-95 transition-transform"
              aria-label="Switch camera"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <path d="M12 9a4 4 0 0 1 4 4v1"/>
                <polyline points="18 12 16 14 14 12"/>
                <path d="M12 17a4 4 0 0 1-4-4v-1"/>
                <polyline points="6 14 8 12 10 14"/>
              </svg>
            </button>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
          {permissionState === 'requesting' && (
            <div className="text-white/60 flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              <p className="font-medium">Starting camera...</p>
            </div>
          )}
          
          {permissionState === 'denied' && (
            <div className="text-white flex flex-col items-center gap-4 max-w-xs text-center px-4">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-2">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
              </div>
              <h3 className="text-xl font-bold">Camera Access Required</h3>
              <p className="text-white/60 text-sm mb-4">Please enable camera access in your browser settings to take photos.</p>
              <button onClick={onClose} className="px-6 py-2.5 bg-white text-black font-semibold rounded-full active:scale-95 transition-transform">
                Dismiss
              </button>
            </div>
          )}
          
          {permissionState === 'error' && (
            <div className="text-white flex flex-col items-center gap-4 text-center px-4">
              <h3 className="text-xl font-bold">Camera Error</h3>
              <p className="text-white/60 text-sm">{errorMessage}</p>
              <button onClick={onClose} className="px-6 py-2.5 bg-white text-black font-semibold rounded-full">
                Dismiss
              </button>
            </div>
          )}

          {/* Video feed with Beautify Filter */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transition-opacity duration-300 ${permissionState === 'granted' && !capturedPhoto ? 'opacity-100' : 'opacity-0 absolute'}`}
            style={{ 
              transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
              filter: 'contrast(1.08) brightness(1.08) saturate(1.15)'
            }}
          />
          
          {/* Flash effect overlay */}
          {isCapturing && <div className="absolute inset-0 bg-white z-20 animate-in fade-in duration-75" />}
          
          {/* Captured image preview */}
          {capturedPhoto && (
            <img 
              src={capturedPhoto} 
              alt="Captured preview" 
              className="w-full h-full object-cover absolute inset-0 z-10 animate-in fade-in duration-200" 
              style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
            />
          )}
          
          {/* Hidden canvas for capturing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Footer Controls */}
        <div className="h-28 bg-black flex items-center justify-center relative z-10 pb-6 px-6">
          {permissionState === 'granted' && !capturedPhoto && (
            <button 
              onClick={capturePhoto}
              className="w-[72px] h-[72px] rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Take photo"
            >
              <div className="w-[54px] h-[54px] bg-white rounded-full" />
            </button>
          )}
          
          {capturedPhoto && (
            <div className="w-full flex justify-between items-center max-w-sm mx-auto">
              <button 
                onClick={handleRetake}
                className="text-white text-lg font-medium py-3 px-6 hover:bg-white/10 rounded-full transition-colors active:scale-95"
              >
                Retake
              </button>
              <button 
                onClick={handleSend}
                className="bg-white text-black text-lg font-bold py-3 px-8 rounded-full active:scale-95 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center gap-2"
              >
                Send <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
