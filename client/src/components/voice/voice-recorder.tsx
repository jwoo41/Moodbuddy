import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
}

export default function VoiceRecorder({ 
  onTranscription, 
  onRecordingStart, 
  onRecordingStop 
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const { toast } = useToast();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);

  const startRecording = async () => {
    try {
      // Check if Speech Recognition is available
      if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onstart = () => {
          setIsListening(true);
          onRecordingStart?.();
          // Haptic feedback for iOS
          if ('vibrate' in navigator) {
            navigator.vibrate(50);
          }
        };
        
        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            }
          }
          
          if (finalTranscript) {
            onTranscription(finalTranscript);
          }
        };
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          toast({
            title: "Voice Recognition Error",
            description: "Unable to process speech. Please try again.",
            variant: "destructive"
          });
        };
        
        recognition.onend = () => {
          setIsListening(false);
          setIsRecording(false);
          onRecordingStop?.();
        };
        
        recognitionRef.current = recognition;
        recognition.start();
        setIsRecording(true);
        
      } else {
        // Fallback to basic audio recording
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks: BlobPart[] = [];
        
        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          // Here you could send the audio to a transcription service
          toast({
            title: "Recording Saved",
            description: "Audio recorded successfully. Transcription requires a transcription service.",
          });
        };
        
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        setIsRecording(true);
        onRecordingStart?.();
      }
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Unable to access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    
    setIsRecording(false);
    setIsListening(false);
    onRecordingStop?.();
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      // Use a natural voice if available
      const voices = speechSynthesis.getVoices();
      const naturalVoice = voices.find(voice => 
        voice.name.includes('Natural') || 
        voice.name.includes('Neural') ||
        voice.lang === 'en-US'
      );
      
      if (naturalVoice) {
        utterance.voice = naturalVoice;
      }
      
      speechSynthesis.speak(utterance);
    } else {
      toast({
        title: "Text-to-Speech Not Available",
        description: "Your browser doesn't support text-to-speech.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant={isRecording ? "destructive" : "outline"}
        onClick={isRecording ? stopRecording : startRecording}
        className={`transition-all duration-200 ${
          isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : ''
        }`}
        data-testid={isRecording ? "button-stop-recording" : "button-start-recording"}
      >
        {isRecording ? (
          <>
            <Square className="w-4 h-4 mr-1" />
            Stop
          </>
        ) : (
          <>
            <Mic className="w-4 h-4 mr-1" />
            {isListening ? 'Listening...' : 'Record'}
          </>
        )}
      </Button>
      
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => speakText("Welcome to MindFlow. How are you feeling today?")}
        data-testid="button-speak-welcome"
      >
        <Volume2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

// Type declarations for Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
  
  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  }
  
  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
  }
  
  interface SpeechRecognitionErrorEvent extends Event {
    error: string;
  }
  
  interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }
  
  interface SpeechRecognitionResult {
    length: number;
    isFinal: boolean;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
  }
  
  interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
  }
}