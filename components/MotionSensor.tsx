import React, { useEffect, useRef, useState } from 'react';

interface MotionSensorProps {
  active: boolean;
  onIntensityChange: (intensity: number) => void;
}

const MotionSensor: React.FC<MotionSensorProps> = ({ active, onIntensityChange }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const prevFrameRef = useRef<Uint8ClampedArray | null>(null);

  useEffect(() => {
    if (active && !stream) {
      startCamera();
    } else if (!active && stream) {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [active]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 240, facingMode: 'user' }, 
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
        requestAnimationFrame(processFrame);
      }
    } catch (err) {
      console.error("Camera error", err);
      setError("Camera access denied or unavailable.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const processFrame = () => {
    if (!videoRef.current || !canvasRef.current || !stream) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    if (!ctx) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      if (prevFrameRef.current) {
        let diffScore = 0;
        // Simple pixel diff algorithm (skip pixels for performance)
        for (let i = 0; i < data.length; i += 4 * 10) { 
          const rDiff = Math.abs(data[i] - prevFrameRef.current[i]);
          const gDiff = Math.abs(data[i + 1] - prevFrameRef.current[i + 1]);
          const bDiff = Math.abs(data[i + 2] - prevFrameRef.current[i + 2]);
          if (rDiff + gDiff + bDiff > 50) { // Threshold for "change"
             diffScore++;
          }
        }
        
        // Normalize score roughly to 0-100
        const normalizedScore = Math.min(100, (diffScore / (data.length / 40)) * 1000);
        onIntensityChange(normalizedScore);
      }

      // Store current frame
      prevFrameRef.current = new Uint8ClampedArray(data);
    }

    if (stream.active) {
      requestAnimationFrame(processFrame);
    }
  };

  if (!active) return null;

  return (
    <div className="absolute top-4 right-4 z-50 w-32 h-24 bg-black/50 rounded-lg overflow-hidden border border-white/20 shadow-lg backdrop-blur-sm transition-opacity">
       {error ? (
         <div className="flex items-center justify-center h-full text-xs text-red-300 p-2 text-center">{error}</div>
       ) : (
         <>
          <video 
            ref={videoRef} 
            className="w-full h-full object-cover opacity-60" 
            muted 
            playsInline 
          />
          <canvas ref={canvasRef} className="hidden" width={320} height={240} />
          <div className="absolute bottom-1 right-1 text-[10px] text-white/80 bg-black/40 px-1 rounded">
             Vision AI
          </div>
         </>
       )}
    </div>
  );
};

export default MotionSensor;
