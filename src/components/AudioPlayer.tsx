'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useTranslation } from '@/lib/LanguageContext';

export default function AudioPlayer() {
  const { language, isRtl } = useTranslation();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Initialize and auto-play audio
  useEffect(() => {
    // We want it to play automatically. Default state is unmuted (false).
    const savedMutedState = localStorage.getItem('bg-music-muted') === 'true';
    
    const audio = new Audio('/background.mp3');
    audio.loop = true;
    audio.volume = 0.35; // Comfortable, soft ambient background volume
    audio.muted = savedMutedState;
    audioRef.current = audio;
    setIsMuted(savedMutedState);

    // Attempt autoplay immediately
    const startPlay = () => {
      if (audioRef.current) {
        audioRef.current.play()
          .then(() => {
            setHasInteracted(true);
          })
          .catch((err) => {
            // Autoplay blocked by browser policy.
            console.log('Autoplay blocked. Sound will start on user interaction.');
          });
      }
    };

    startPlay();

    // Interaction fallback: play as soon as the user interacts anywhere on the application
    const handleFirstInteraction = () => {
      if (audioRef.current && !hasInteracted) {
        audioRef.current.play()
          .then(() => {
            setHasInteracted(true);
          })
          .catch(() => {});
      }
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;

    const newMute = !isMuted;
    audioRef.current.muted = newMute;
    setIsMuted(newMute);
    localStorage.setItem('bg-music-muted', String(newMute));

    // Force play on first interaction toggle just in case
    if (!newMute) {
      audioRef.current.play().catch(() => {});
    }
  };

  const tooltipText = isMuted 
    ? (language === 'ar' ? 'تشغيل الموسيقى' : 'Play Music')
    : (language === 'ar' ? 'كتم الموسيقى' : 'Mute Music');

  return (
    <div
      className={`fixed bottom-6 z-55 ${isRtl ? 'left-6' : 'right-6'}`}
      style={{ contentVisibility: 'auto' }}
    >
      <button
        onClick={toggleMute}
        className={`w-11 h-11 rounded-full flex items-center justify-center border shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 ${
          isMuted
            ? 'bg-slate-100/90 text-slate-500 border-slate-200 hover:bg-slate-200'
            : 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700 shadow-emerald-200/50 animate-pulse-subtle'
        }`}
        title={tooltipText}
        aria-label={tooltipText}
      >
        {isMuted ? (
          <VolumeX className="w-5 h-5" />
        ) : (
          <Volume2 className="w-5 h-5 animate-wiggle" />
        )}
      </button>

      {/* Global CSS animations */}
      <style jsx global>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg); }
          75% { transform: rotate(5deg); }
        }
        .animate-wiggle {
          animation: wiggle 0.6s ease-in-out infinite alternate;
        }
        @keyframes pulse-subtle {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s infinite;
        }
      `}</style>
    </div>
  );
}
