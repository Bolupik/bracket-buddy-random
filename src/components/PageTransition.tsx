import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import menacingPikachu from "@/assets/menacing-pikachu.jpg";

interface PageTransitionProps {
  isActive: boolean;
  targetPath: string;
  onComplete: () => void;
}

export const PageTransition = ({ isActive, targetPath, onComplete }: PageTransitionProps) => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"idle" | "enter" | "hold" | "exit">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playTransitionSound = useCallback(() => {
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } catch (e) {
      console.log("Audio playback failed:", e);
    }
  }, []);

  const runTransition = useCallback(() => {
    setPhase("enter");
    playTransitionSound();
    
    // After enter animation, hold
    setTimeout(() => {
      setPhase("hold");
      navigate(targetPath);
    }, 600);
    
    // After hold, exit
    setTimeout(() => {
      setPhase("exit");
    }, 1200);
    
    // Complete
    setTimeout(() => {
      setPhase("idle");
      onComplete();
    }, 1800);
  }, [navigate, targetPath, onComplete, playTransitionSound]);

  useEffect(() => {
    if (isActive && phase === "idle") {
      runTransition();
    }
  }, [isActive, phase, runTransition]);

  if (phase === "idle") return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Black overlay */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-500 ${
          phase === "enter" || phase === "hold" ? "opacity-100" : "opacity-0"
        }`}
      />
      
      {/* Menacing Pikachu */}
      <div 
        className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${
          phase === "enter" 
            ? "opacity-100 scale-100" 
            : phase === "hold"
            ? "opacity-100 scale-110"
            : "opacity-0 scale-150"
        }`}
      >
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-yellow-400/30 blur-3xl scale-150 animate-pulse" />
          
          {/* Image */}
          <img 
            src={menacingPikachu}
            alt="Menacing Pikachu"
            className={`relative w-64 h-64 md:w-96 md:h-96 object-cover rounded-lg shadow-2xl transition-transform duration-700 ${
              phase === "enter" 
                ? "translate-y-0" 
                : phase === "hold"
                ? "translate-y-0"
                : "-translate-y-full"
            }`}
            style={{
              filter: "drop-shadow(0 0 30px rgba(250, 204, 21, 0.5))"
            }}
          />
          
          {/* Menacing text */}
          <div 
            className={`absolute -bottom-12 left-1/2 -translate-x-1/2 transition-all duration-500 delay-200 ${
              phase === "hold" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <span className="text-yellow-400 font-bold text-2xl md:text-4xl tracking-[0.5em] uppercase"
              style={{ textShadow: "0 0 20px rgba(250, 204, 21, 0.8)" }}
            >
              ゴゴゴゴ
            </span>
          </div>
        </div>
      </div>
      
      {/* Speed lines */}
      <div 
        className={`absolute inset-0 overflow-hidden transition-opacity duration-300 ${
          phase === "hold" || phase === "exit" ? "opacity-100" : "opacity-0"
        }`}
      >
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute h-0.5 bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent"
            style={{
              top: `${Math.random() * 100}%`,
              left: "-100%",
              width: `${50 + Math.random() * 50}%`,
              animation: `speedLine 0.5s linear ${i * 0.05}s forwards`
            }}
          />
        ))}
      </div>
      
      <style>{`
        @keyframes speedLine {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(400%);
          }
        }
      `}</style>
      
      {/* Audio element for transition sound */}
      <audio ref={audioRef} src="/sounds/transition.mp3" preload="auto" />
    </div>
  );
};

// Hook for easy usage
export const usePageTransition = () => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [targetPath, setTargetPath] = useState("");

  const startTransition = (path: string) => {
    setTargetPath(path);
    setIsTransitioning(true);
  };

  const completeTransition = () => {
    setIsTransitioning(false);
    setTargetPath("");
  };

  return {
    isTransitioning,
    targetPath,
    startTransition,
    completeTransition
  };
};
