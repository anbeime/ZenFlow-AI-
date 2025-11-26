import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SessionMode, SessionData, AudioParams } from './types';
import { audioEngine } from './services/audioEngine';
import { generateSession } from './services/geminiService';
import Visualizer from './components/Visualizer';
import MotionSensor from './components/MotionSensor';
import { Play, Pause, Activity, Moon, Sun, Brain, Info, Camera } from 'lucide-react';

// Initial dummy data
const INITIAL_SESSION: SessionData = {
  title: "Welcome to ZenFlow",
  description: "Select a mode to generate your personalized soundscape.",
  moodColor: "#475569",
  instruction: "Ready to start?",
  audio: {
    baseFreq: 432,
    beatFreq: 4,
    bpm: 12,
    volume: 0,
    harmonicity: 0.5
  }
};

const App: React.FC = () => {
  const [session, setSession] = useState<SessionData>(INITIAL_SESSION);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<SessionMode>(SessionMode.YOGA);
  const [motionIntensity, setMotionIntensity] = useState(0);
  const [useCamera, setUseCamera] = useState(false);
  const [debugLog, setDebugLog] = useState<string>("");

  // Refs for throttling AI updates
  const lastAiUpdateRef = useRef<number>(0);
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Audio Engine Lifecycle
  useEffect(() => {
    return () => {
      audioEngine.stop();
    };
  }, []);

  // Handle Motion Intensity Change
  const handleMotionChange = useCallback((intensity: number) => {
    // Smoothing the input
    setMotionIntensity(prev => (prev * 0.8) + (intensity * 0.2));
  }, []);

  // "Smart" Adaptation Loop
  useEffect(() => {
    if (!isPlaying) return;

    // Direct Audio parameter manipulation based on motion (Local Logic)
    // This ensures immediate feedback while waiting for AI
    const currentAudio = { ...session.audio };
    
    // Example: High motion = faster breathing rhythm, slightly higher pitch energy
    if (mode === SessionMode.YOGA || mode === SessionMode.FOCUS) {
        const intensityFactor = motionIntensity / 100; // 0 to 1
        // Dynamic BPM adjustment
        const targetBpm = 10 + (intensityFactor * 10); // 10 to 20 BPM range
        // Smooth transition
        currentAudio.bpm = currentAudio.bpm + (targetBpm - currentAudio.bpm) * 0.05; 
        
        // Update audio engine in real-time
        audioEngine.update(currentAudio);
    }

    // AI Re-generation Trigger (Throttled to every 15s to avoid API spam)
    const now = Date.now();
    if (now - lastAiUpdateRef.current > 15000 && motionIntensity > 10) {
       // Only trigger if significant change or time passed. 
       // In a real app, we would debounced this better.
       // For demo, we stick to the manual "Start" generation mostly, 
       // but here is where we would call generateSession again implicitly.
    }

  }, [motionIntensity, isPlaying, mode, session.audio]);

  const togglePlay = async () => {
    if (!isPlaying) {
      await audioEngine.init();
      audioEngine.start(session.audio);
      setIsPlaying(true);
    } else {
      audioEngine.stop();
      setIsPlaying(false);
    }
  };

  const handleGenerate = async (selectedMode: SessionMode) => {
    setLoading(true);
    setMode(selectedMode);
    
    // Stop current if playing
    if (isPlaying) {
      audioEngine.stop();
      setIsPlaying(false);
    }

    try {
      setDebugLog("Consulting Gemini AI...");
      const newSession = await generateSession(selectedMode, motionIntensity);
      setSession(newSession);
      setDebugLog(`Generated: ${newSession.title}`);
      
      // Auto start (optional, but better UX to wait for user)
    } catch (e) {
      console.error(e);
      setDebugLog("Error generating session.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-between p-4 md:p-8 relative overflow-hidden">
      
      {/* Background Gradient */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none transition-colors duration-2000"
        style={{
            background: `radial-gradient(circle at 50% 50%, ${session.moodColor}, #0f172a 70%)`
        }}
      />

      {/* Header */}
      <header className="w-full max-w-4xl flex justify-between items-center z-10 mb-8">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold">Z</span>
           </div>
           <h1 className="text-xl font-bold tracking-tight">ZenFlow AI</h1>
        </div>
        
        <button 
           onClick={() => setUseCamera(!useCamera)}
           className={`p-2 rounded-full transition-colors ${useCamera ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
           title="Toggle Camera Motion Sensor"
        >
          <Camera size={20} />
        </button>
      </header>

      {/* Main Visualizer Area */}
      <main className="flex-1 w-full max-w-4xl flex flex-col items-center justify-center relative z-10">
         
         <MotionSensor active={useCamera} onIntensityChange={handleMotionChange} />

         <Visualizer session={session} isPlaying={isPlaying} />

         {/* Instructions / Guidance */}
         <div className="mt-8 text-center max-w-lg h-24">
            {loading ? (
                <div className="animate-pulse text-indigo-300">Generating Session Context...</div>
            ) : (
                <>
                  <h2 className="text-2xl font-light mb-2 transition-all duration-500">{session.title}</h2>
                  <p className="text-slate-400 font-light text-sm md:text-base leading-relaxed opacity-90 transition-all duration-500">
                    {isPlaying ? session.instruction : session.description}
                  </p>
                </>
            )}
         </div>
      </main>

      {/* Controls */}
      <div className="w-full max-w-xl z-20 mt-8 bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
        
        {/* Stats Row */}
        <div className="flex justify-between items-center text-xs text-slate-500 mb-6 font-mono">
            <div>FREQ: {Math.round(session.audio.baseFreq)}Hz</div>
            <div>BEAT: {session.audio.beatFreq}Hz</div>
            <div>BPM: {Math.round(session.audio.bpm)}</div>
            <div className={`${motionIntensity > 20 ? 'text-indigo-400' : ''}`}>
                MOTION: {Math.round(motionIntensity)}%
            </div>
        </div>

        {/* Mode Selectors */}
        <div className="grid grid-cols-4 gap-2 md:gap-4 mb-6">
            {[
                { m: SessionMode.YOGA, icon: Activity, label: "Yoga" },
                { m: SessionMode.ANXIETY, icon: Moon, label: "Calm" },
                { m: SessionMode.FOCUS, icon: Sun, label: "Focus" },
                { m: SessionMode.SLEEP, icon: Brain, label: "Sleep" },
            ].map((item) => (
                <button 
                    key={item.m}
                    onClick={() => handleGenerate(item.m)}
                    disabled={loading}
                    className={`flex flex-col items-center justify-center py-3 rounded-xl transition-all ${
                        mode === item.m 
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' 
                        : 'bg-slate-700/30 text-slate-400 hover:bg-slate-700/50'
                    }`}
                >
                    <item.icon size={20} className="mb-1" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">{item.label}</span>
                </button>
            ))}
        </div>

        {/* Play Button */}
        <div className="flex justify-center">
            <button 
                onClick={togglePlay}
                className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:scale-105 transition-transform ${
                    isPlaying 
                    ? 'bg-red-500/10 text-red-400 border border-red-500/30' 
                    : 'bg-indigo-500 text-white hover:bg-indigo-400'
                }`}
            >
                {isPlaying ? (
                    <>
                        <Pause fill="currentColor" /> Pause Session
                    </>
                ) : (
                    <>
                        <Play fill="currentColor" /> Start Session
                    </>
                )}
            </button>
        </div>
        
        {/* Manual Intensity Slider (If Camera is off or needed manual override) */}
        {!useCamera && isPlaying && (
            <div className="mt-6">
                <div className="flex justify-between text-xs text-slate-400 mb-2">
                    <span>Resting</span>
                    <span>Intense</span>
                </div>
                <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={motionIntensity} 
                    onChange={(e) => setMotionIntensity(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <p className="text-[10px] text-center text-slate-500 mt-1">Manual Intensity Simulator</p>
            </div>
        )}

      </div>
        
        {/* Footer info */}
        <div className="w-full text-center mt-4 mb-2 z-10 opacity-50 text-[10px] text-slate-500">
           {debugLog || "Powered by Gemini 2.5 Flash & Web Audio API"}
        </div>

    </div>
  );
};

export default App;