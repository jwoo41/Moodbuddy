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
  const [volume, setVolume] = useState(0.15);
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

      // Stop any existing sounds
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
      }

      const audioCtx = audioContextRef.current!;
      
      // Create multiple layers for rich massage-style ambient music
      const oscillators: OscillatorNode[] = [];
      const gains: GainNode[] = [];
      
      // Base drone - very low frequency for grounding
      const baseDrone = audioCtx.createOscillator();
      const baseDroneGain = audioCtx.createGain();
      baseDrone.type = 'sine';
      baseDrone.frequency.setValueAtTime(55, audioCtx.currentTime); // A1 note
      baseDroneGain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      baseDrone.connect(baseDroneGain);
      baseDroneGain.connect(gainNodeRef.current!);
      
      // Harmonic layer - creates warmth
      const harmonic = audioCtx.createOscillator();
      const harmonicGain = audioCtx.createGain();
      harmonic.type = 'sine';
      harmonic.frequency.setValueAtTime(165, audioCtx.currentTime); // E3 - perfect fifth
      harmonicGain.gain.setValueAtTime(0.06, audioCtx.currentTime);
      harmonic.connect(harmonicGain);
      harmonicGain.connect(gainNodeRef.current!);
      
      // Gentle pad - higher frequency for texture
      const pad = audioCtx.createOscillator();
      const padGain = audioCtx.createGain();
      pad.type = 'triangle';
      pad.frequency.setValueAtTime(330, audioCtx.currentTime); // E4
      padGain.gain.setValueAtTime(0.03, audioCtx.currentTime);
      pad.connect(padGain);
      padGain.connect(gainNodeRef.current!);
      
      // Add gentle LFO for breathing effect
      const lfo = audioCtx.createOscillator();
      const lfoGain = audioCtx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.05, audioCtx.currentTime); // Very slow, like breathing
      lfoGain.gain.setValueAtTime(0.01, audioCtx.currentTime);
      
      // Apply LFO to all layers for subtle breathing effect
      lfo.connect(lfoGain);
      lfoGain.connect(baseDroneGain.gain);
      lfoGain.connect(harmonicGain.gain);
      lfoGain.connect(padGain.gain);
      
      // Add soft low-pass filtering for warmth
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, audioCtx.currentTime);
      filter.Q.setValueAtTime(0.5, audioCtx.currentTime);
      
      // Route everything through the filter
      baseDroneGain.disconnect();
      harmonicGain.disconnect();
      padGain.disconnect();
      
      baseDroneGain.connect(filter);
      harmonicGain.connect(filter);
      padGain.connect(filter);
      filter.connect(gainNodeRef.current!);
      
      // Start all oscillators
      baseDrone.start();
      harmonic.start();
      pad.start();
      lfo.start();
      
      // Store the main oscillator for cleanup
      oscillatorRef.current = baseDrone;
      oscillators.push(baseDrone, harmonic, pad, lfo);
      
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