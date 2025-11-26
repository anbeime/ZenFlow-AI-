import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SessionMode, SessionData } from "../types";

// NOTE: In a real app, API_KEY should be in process.env.API_KEY
// The user is responsible for providing the key in a real deployment.
// For this output, we assume process.env.API_KEY is available.

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A calming title for the session" },
    description: { type: Type.STRING, description: "Short description of the vibe" },
    moodColor: { type: Type.STRING, description: "Hex color code representing the mood" },
    instruction: { type: Type.STRING, description: "Simple guidance text (e.g., 'Deep inhale...')" },
    audio: {
      type: Type.OBJECT,
      properties: {
        baseFreq: { type: Type.NUMBER, description: "Base frequency in Hz (e.g., 100-500)" },
        beatFreq: { type: Type.NUMBER, description: "Binaural beat difference (e.g., 1-15)" },
        bpm: { type: Type.NUMBER, description: "Rhythm in beats per minute (e.g., 10-60 for breathing)" },
        volume: { type: Type.NUMBER, description: "Volume level 0.1 to 1.0" },
        harmonicity: { type: Type.NUMBER, description: "Complexity 0.1 to 1.0" }
      },
      required: ["baseFreq", "beatFreq", "bpm", "volume", "harmonicity"]
    }
  },
  required: ["title", "description", "moodColor", "instruction", "audio"]
};

export const generateSession = async (mode: SessionMode, motionIntensity: number): Promise<SessionData> => {
  const modelId = "gemini-2.5-flash"; // Good for fast, structured responses

  let promptContext = "";
  switch (mode) {
    case SessionMode.YOGA:
      promptContext = "User is doing Yoga. Generate a rhythmic, flowing soundscape. If motion intensity is high, increase energy slightly.";
      break;
    case SessionMode.ANXIETY:
      promptContext = "User has high anxiety. Generate a deeply grounding, slow Delta/Theta wave session. Use calming colors like deep blue or purple.";
      break;
    case SessionMode.FOCUS:
      promptContext = "User is studying/working. Generate Alpha wave focus music. Clear, consistent, not distracting.";
      break;
    case SessionMode.SLEEP:
      promptContext = "User wants to sleep. Generate very low Delta waves. Dark colors.";
      break;
  }

  const prompt = `
    Context: ${promptContext}
    Current Motion Intensity (0-100): ${motionIntensity}.
    
    Generate a JSON session configuration.
    - baseFreq: 432Hz is common for healing, but vary it based on context (lower for sleep).
    - beatFreq: Delta (1-4Hz) for Sleep/Anxiety, Theta (4-8Hz) for Deep Yoga, Alpha (8-14Hz) for Focus.
    - bpm: Breathing pace. 12-16 normal, 4-6 deep meditative.
  `;

  try {
    const response = await genAI.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });
    
    if (response.text) {
        return JSON.parse(response.text) as SessionData;
    }
    throw new Error("No response text");
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    // Fallback if API fails or key missing
    return {
      title: "Offline Zen",
      description: "Default soothing mode",
      moodColor: "#4f46e5",
      instruction: "Breathe gently...",
      audio: {
        baseFreq: 220,
        beatFreq: 6,
        bpm: 10,
        volume: 0.5,
        harmonicity: 0.5
      }
    };
  }
};
