import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface BackgroundMusicProps {
  autoPlay?: boolean;
}

export default function BackgroundMusic({ autoPlay = true }: BackgroundMusicProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (autoPlay) {
      // Small delay to ensure user interaction has occurred
      const timer = setTimeout(() => {
        startCalmingMusic();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoPlay]);

  const createAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
      gainNodeRef.current.gain.value = isMuted ? 0 : volume;
    }
  };

  const startCalmingMusic = async () => {
    try {
      createAudioContext();
      
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Create a gentle, calming ambient sound
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
      }

      const oscillator = audioContextRef.current!.createOscillator();
      const filter = audioContextRef.current!.createBiquadFilter();
      
      // Set up a gentle, low-frequency ambient tone
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(80, audioContextRef.current!.currentTime);
      
      // Add gentle frequency modulation for a more natural sound
      const lfo = audioContextRef.current!.createOscillator();
      const lfoGain = audioContextRef.current!.createGain();
      lfo.frequency.setValueAtTime(0.1, audioContextRef.current!.currentTime);
      lfoGain.gain.setValueAtTime(5, audioContextRef.current!.currentTime);
      
      lfo.connect(lfoGain);
      lfoGain.connect(oscillator.frequency);
      
      // Low-pass filter for warmth
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, audioContextRef.current!.currentTime);
      filter.Q.setValueAtTime(1, audioContextRef.current!.currentTime);
      
      // Connect the audio chain
      oscillator.connect(filter);
      filter.connect(gainNodeRef.current!);
      
      oscillator.start();
      lfo.start();
      
      oscillatorRef.current = oscillator;
      setIsPlaying(true);
      
    } catch (error) {
      console.log('Background music could not start:', error);
    }
  };

  const stopMusic = () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current = null;
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (gainNodeRef.current) {
      const newMutedState = !isMuted;
      gainNodeRef.current.gain.value = newMutedState ? 0 : volume;
      setIsMuted(newMutedState);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (gainNodeRef.current && !isMuted) {
      gainNodeRef.current.gain.value = newVolume;
    }
  };

  return (
    <div className="fixed bottom-20 right-4 md:bottom-4 z-40 bg-white dark:bg-gray-800 rounded-full shadow-lg p-2 border">
      <div className="flex items-center space-x-2">
        <button
          onClick={toggleMute}
          className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
          data-testid="button-toggle-music"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
        
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
          className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          data-testid="slider-volume"
        />
        
        {isPlaying && (
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        )}
      </div>
    </div>
  );
}