import React, { useEffect, useRef } from 'react';
import { SessionData } from '../types';

interface VisualizerProps {
  session: SessionData;
  isPlaying: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ session, isPlaying }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Convert BPM to animation duration in seconds
  // A full breathe in/out cycle. 
  // If BPM is 10, that's 10 beats per minute -> 6 seconds per beat (cycle).
  const animationDuration = isPlaying ? 60 / session.audio.bpm : 0;

  return (
    <div 
      ref={containerRef}
      className="relative flex items-center justify-center w-full h-64 md:h-96"
    >
      {/* Outer Halo */}
      <div 
        className="absolute w-48 h-48 md:w-72 md:h-72 rounded-full opacity-30 blur-3xl transition-all duration-1000"
        style={{ 
          backgroundColor: session.moodColor,
          animation: isPlaying ? `breathe ${animationDuration}s infinite ease-in-out` : 'none'
        }}
      />
      
      {/* Inner Core */}
      <div 
        className="absolute w-32 h-32 md:w-48 md:h-48 rounded-full opacity-60 blur-xl transition-all duration-1000 mix-blend-screen"
        style={{ 
          backgroundColor: session.moodColor,
          animation: isPlaying ? `breathe ${animationDuration}s infinite ease-in-out` : 'none',
          animationDelay: '0.5s'
        }}
      />

      {/* Center Focus */}
      <div 
        className="z-10 w-4 h-4 rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.8)]"
        style={{
          animation: isPlaying ? `pulse 4s infinite ease-in-out` : 'none'
        }}
      />

      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(0.85); opacity: 0.3; }
          50% { transform: scale(1.15); opacity: 0.7; }
        }
        @keyframes pulse {
           0%, 100% { opacity: 0.5; }
           50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Visualizer;
