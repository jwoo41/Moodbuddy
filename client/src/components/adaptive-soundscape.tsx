import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Volume2, VolumeX, Play, Pause, Music } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { MoodEntry } from "@shared/schema";

interface SoundscapeConfig {
  name: string;
  description: string;
  audioUrl: string;
  color: string;
  icon: string;
}

const moodSoundscapes: Record<string, SoundscapeConfig> = {
  "very-happy": {
    name: "Uplifting Birds",
    description: "Cheerful birds and gentle nature sounds",
    audioUrl: "/audio/uplifting-birds.mp3",
    color: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200",
    icon: "🐦"
  },
  "happy": {
    name: "Peaceful Garden",
    description: "Light breeze and flowing water",
    audioUrl: "/audio/peaceful-garden.mp3", 
    color: "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200",
    icon: "🌸"
  },
  "neutral": {
    name: "Gentle Rain",
    description: "Soft rainfall and distant thunder",
    audioUrl: "/audio/gentle-rain.mp3",
    color: "bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200", 
    icon: "🌧️"
  },
  "sad": {
    name: "Ocean Waves",
    description: "Calming ocean sounds for reflection",
    audioUrl: "/audio/ocean-waves.mp3",
    color: "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200",
    icon: "🌊"
  },
  "very-sad": {
    name: "Forest Embrace",
    description: "Deep forest sounds for comfort",
    audioUrl: "/audio/forest-embrace.mp3",
    color: "bg-indigo-100 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-200",
    icon: "🌲"
  }
};

// Generate audio using Web Audio API for demo purposes
const generateTone = (frequency: number, duration: number, type: OscillatorType = 'sine'): Promise<AudioBuffer> => {
  return new Promise((resolve) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const sampleRate = audioContext.sampleRate;
    const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const channelData = buffer.getChannelData(0);
    
    for (let i = 0; i < channelData.length; i++) {
      const time = i / sampleRate;
      let value = 0;
      
      switch (type) {
        case 'sine':
          value = Math.sin(2 * Math.PI * frequency * time) * 0.1;
          break;
        case 'sawtooth':
          value = (2 * (time * frequency % 1) - 1) * 0.05;
          break;
        case 'square':
          value = Math.sin(2 * Math.PI * frequency * time) > 0 ? 0.05 : -0.05;
          break;
      }
      
      // Apply fade in/out
      const fadeTime = 0.5;
      if (time < fadeTime) {
        value *= time / fadeTime;
      } else if (time > duration - fadeTime) {
        value *= (duration - time) / fadeTime;
      }
      
      channelData[i] = value;
    }
    
    resolve(buffer);
  });
};

export default function AdaptiveSoundscape() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([50]);
  const [currentMood, setCurrentMood] = useState<string>("neutral");
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const { data: moodEntries } = useQuery<MoodEntry[]>({
    queryKey: ["/api/mood-entries"],
  });

  useEffect(() => {
    // Get the most recent mood entry to adapt soundscape
    if (moodEntries && moodEntries.length > 0) {
      const latestMood = moodEntries[moodEntries.length - 1];
      setCurrentMood(latestMood.mood);
    }
  }, [moodEntries]);

  const initializeAudio = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
    }

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
  };

  const generateSoundscapeForMood = async (mood: string): Promise<AudioBuffer> => {
    await initializeAudio();
    const audioContext = audioContextRef.current!;
    const duration = 30; // 30 seconds, will loop

    switch (mood) {
      case "very-happy":
        // Bright, uplifting tones
        const happyBuffer = audioContext.createBuffer(1, audioContext.sampleRate * duration, audioContext.sampleRate);
        const happyData = happyBuffer.getChannelData(0);
        for (let i = 0; i < happyData.length; i++) {
          const time = i / audioContext.sampleRate;
          happyData[i] = Math.sin(2 * Math.PI * 440 * time) * 0.05 * Math.sin(time * 2) + // Base tone
                        Math.sin(2 * Math.PI * 880 * time) * 0.03 * Math.sin(time * 3) +  // Higher harmony
                        (Math.random() - 0.5) * 0.02; // Light sparkle
        }
        return happyBuffer;
        
      case "happy":
        // Gentle, positive ambience
        const gentleBuffer = audioContext.createBuffer(1, audioContext.sampleRate * duration, audioContext.sampleRate);
        const gentleData = gentleBuffer.getChannelData(0);
        for (let i = 0; i < gentleData.length; i++) {
          const time = i / audioContext.sampleRate;
          gentleData[i] = Math.sin(2 * Math.PI * 220 * time) * 0.04 * Math.sin(time) + 
                         (Math.random() - 0.5) * 0.01 * Math.sin(time * 0.5);
        }
        return gentleBuffer;
        
      case "sad":
        // Soothing, lower tones
        const sadBuffer = audioContext.createBuffer(1, audioContext.sampleRate * duration, audioContext.sampleRate);
        const sadData = sadBuffer.getChannelData(0);
        for (let i = 0; i < sadData.length; i++) {
          const time = i / audioContext.sampleRate;
          sadData[i] = Math.sin(2 * Math.PI * 110 * time) * 0.06 * Math.sin(time * 0.3) + 
                      Math.sin(2 * Math.PI * 165 * time) * 0.04 * Math.sin(time * 0.5);
        }
        return sadBuffer;
        
      case "very-sad":
        // Deep, comforting drones
        const deepBuffer = audioContext.createBuffer(1, audioContext.sampleRate * duration, audioContext.sampleRate);
        const deepData = deepBuffer.getChannelData(0);
        for (let i = 0; i < deepData.length; i++) {
          const time = i / audioContext.sampleRate;
          deepData[i] = Math.sin(2 * Math.PI * 80 * time) * 0.08 * Math.sin(time * 0.2) +
                       Math.sin(2 * Math.PI * 120 * time) * 0.05 * Math.sin(time * 0.4);
        }
        return deepBuffer;
        
      default: // neutral
        // Balanced, calming white noise
        const neutralBuffer = audioContext.createBuffer(1, audioContext.sampleRate * duration, audioContext.sampleRate);
        const neutralData = neutralBuffer.getChannelData(0);
        for (let i = 0; i < neutralData.length; i++) {
          const time = i / audioContext.sampleRate;
          neutralData[i] = (Math.random() - 0.5) * 0.03 * Math.sin(time * 0.5) + 
                          Math.sin(2 * Math.PI * 200 * time) * 0.02 * Math.sin(time * 0.7);
        }
        return neutralBuffer;
    }
  };

  const togglePlayback = async () => {
    if (!isPlaying) {
      await startPlayback();
    } else {
      stopPlayback();
    }
  };

  const startPlayback = async () => {
    try {
      await initializeAudio();
      
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
      }

      const audioBuffer = await generateSoundscapeForMood(currentMood);
      const source = audioContextRef.current!.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = true;
      source.connect(gainNodeRef.current!);
      
      // Set initial volume
      gainNodeRef.current!.gain.value = volume[0] / 100;
      
      source.start();
      audioSourceRef.current = source;
      setIsPlaying(true);
      
      source.onended = () => {
        if (isPlaying) {
          // Restart if still supposed to be playing
          startPlayback();
        }
      };
    } catch (error) {
      console.error('Failed to start soundscape:', error);
    }
  };

  const stopPlayback = () => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
    }
    setIsPlaying(false);
  };

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = newVolume[0] / 100;
    }
  };

  const currentSoundscape = moodSoundscapes[currentMood] || moodSoundscapes["neutral"];

  useEffect(() => {
    // Restart audio when mood changes and currently playing
    if (isPlaying) {
      startPlayback();
    }
  }, [currentMood]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopPlayback();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <Card className={`${currentSoundscape.color} transition-colors duration-1000`}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Music className="w-5 h-5 mr-2" />
          Adaptive Soundscape
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-4xl mb-2">{currentSoundscape.icon}</div>
          <h3 className="font-semibold text-lg">{currentSoundscape.name}</h3>
          <p className="text-sm opacity-80">{currentSoundscape.description}</p>
          <p className="text-xs mt-2 opacity-70">
            Adapted to your current mood: <strong>{currentMood.replace('-', ' ')}</strong>
          </p>
        </div>

        <div className="flex items-center justify-center space-x-4">
          <Button
            onClick={togglePlayback}
            variant="outline"
            size="lg"
            className="flex items-center space-x-2"
            data-testid="button-toggle-soundscape"
          >
            {isPlaying ? (
              <>
                <Pause className="w-5 h-5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>Play</span>
              </>
            )}
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Volume</label>
            <div className="flex items-center space-x-2">
              {volume[0] === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
              <span className="text-sm w-8">{volume[0]}%</span>
            </div>
          </div>
          <Slider
            value={volume}
            onValueChange={handleVolumeChange}
            max={100}
            step={1}
            className="w-full"
            data-testid="slider-volume"
          />
        </div>

        <div className="text-xs text-center opacity-70 space-y-1">
          <p>🎵 Background music adapts automatically to your logged mood entries</p>
          <p>Each soundscape is designed to support your current emotional state</p>
        </div>
      </CardContent>
    </Card>
  );
}