import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Music, PlayCircle, PauseCircle, Volume2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { MoodEntry } from "@shared/schema";
import AdaptiveSoundscape from "@/components/adaptive-soundscape";

const allSoundscapes = [
  {
    mood: "very-happy",
    name: "Uplifting Birds",
    description: "Cheerful birds singing with gentle nature sounds to boost your spirits",
    icon: "🐦",
    color: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200",
    keywords: ["energetic", "joyful", "upbeat", "optimistic"]
  },
  {
    mood: "happy", 
    name: "Peaceful Garden",
    description: "Light breeze through leaves with flowing water for contentment",
    icon: "🌸",
    color: "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200",
    keywords: ["calm", "content", "peaceful", "harmonious"]
  },
  {
    mood: "neutral",
    name: "Gentle Rain",
    description: "Soft rainfall with distant thunder for balance and focus",
    icon: "🌧️",
    color: "bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200",
    keywords: ["balanced", "neutral", "focused", "steady"]
  },
  {
    mood: "sad",
    name: "Ocean Waves", 
    description: "Calming ocean sounds perfect for reflection and healing",
    icon: "🌊",
    color: "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200",
    keywords: ["soothing", "reflective", "healing", "gentle"]
  },
  {
    mood: "very-sad",
    name: "Forest Embrace",
    description: "Deep forest ambience to provide comfort and grounding",
    icon: "🌲", 
    color: "bg-indigo-100 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-200",
    keywords: ["grounding", "comforting", "deep", "nurturing"]
  }
];

export default function Soundscape() {
  const [selectedMood, setSelectedMood] = useState<string>("neutral");

  const { data: moodEntries } = useQuery<MoodEntry[]>({
    queryKey: ["/api/mood-entries"],
  });

  const currentMood = moodEntries && moodEntries.length > 0 
    ? moodEntries[moodEntries.length - 1].mood 
    : "neutral";

  const recommendedSoundscape = allSoundscapes.find(s => s.mood === currentMood) || allSoundscapes[2];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Adaptive Soundscape</h1>
        <p className="text-muted-foreground">
          Ambient sounds that adapt to your mood to enhance your mental wellness experience
        </p>
      </div>

      {/* Current Active Soundscape */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Music className="w-5 h-5 mr-2" />
          Active Soundscape
        </h2>
        <AdaptiveSoundscape />
      </div>

      {/* Mood-Based Recommendation */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <span className="text-2xl mr-2">💡</span>
              Recommended for Your Current Mood
            </span>
            <Badge variant="outline" className="ml-2">
              {currentMood.replace('-', ' ')}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`p-4 rounded-lg ${recommendedSoundscape.color}`}>
            <div className="flex items-center space-x-4">
              <div className="text-4xl">{recommendedSoundscape.icon}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{recommendedSoundscape.name}</h3>
                <p className="text-sm opacity-80 mb-2">{recommendedSoundscape.description}</p>
                <div className="flex flex-wrap gap-1">
                  {recommendedSoundscape.keywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All Available Soundscapes */}
      <div>
        <h2 className="text-xl font-semibold mb-4">All Soundscapes</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allSoundscapes.map((soundscape) => (
            <Card 
              key={soundscape.mood}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                soundscape.mood === currentMood ? 'ring-2 ring-primary' : ''
              }`}
              data-testid={`soundscape-card-${soundscape.mood}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="text-3xl">{soundscape.icon}</div>
                  {soundscape.mood === currentMood && (
                    <Badge className="bg-primary text-primary-foreground">Current</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg">{soundscape.name}</h3>
                    <p className="text-sm text-muted-foreground">{soundscape.description}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {soundscape.keywords.map((keyword) => (
                      <Badge key={keyword} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground">
                      <strong>Best for:</strong> {soundscape.mood.replace('-', ' ')} moods
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <span className="text-2xl mr-2">ℹ️</span>
            How Adaptive Soundscape Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Automatic Adaptation</h4>
                <p className="text-muted-foreground">
                  The soundscape automatically adapts based on your most recent mood entry. 
                  As you track your mood throughout the day, the ambient sounds will change to match your emotional state.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Mental Health Benefits</h4>
                <p className="text-muted-foreground">
                  Each soundscape is designed with specific frequencies and patterns that can help support your mental wellness, 
                  from energizing sounds for low moods to calming ambience for anxiety.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Personalized Experience</h4>
                <p className="text-muted-foreground">
                  The longer you use MoodBuddy and track your moods, the more personalized your soundscape experience becomes, 
                  creating the perfect audio environment for your mental health journey.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Web Audio Technology</h4>
                <p className="text-muted-foreground">
                  Using advanced Web Audio API, each soundscape is procedurally generated to create unique, 
                  seamless ambient experiences that never become repetitive.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}