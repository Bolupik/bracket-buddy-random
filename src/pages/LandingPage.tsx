import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MoreHorizontal, Moon, Sun, Volume2, VolumeX } from "lucide-react";
import pikachuImage from "@/assets/pikachu.png";

const LandingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isDark, setIsDark] = useState(true);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio("https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3");
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsMusicPlaying(!isMusicPlaying);
    }
  };
  
  // Redirect to home if there's a tournament parameter
  useEffect(() => {
    const tournamentId = searchParams.get('tournament');
    if (tournamentId) {
      navigate(`/home?tournament=${tournamentId}`);
    }
  }, [searchParams, navigate]);
  
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Countdown to next tournament (example: 3 days from now)
  useEffect(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 3);

    const interval = setInterval(() => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();

      if (diff > 0) {
        setCountdown({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / (1000 * 60)) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (num: number) => num.toString().padStart(2, "0");

  return (
    <div className={`min-h-screen flex flex-col relative overflow-hidden transition-colors duration-500 ${
      isDark 
        ? 'bg-gradient-to-b from-[#0a1f1a] via-[#0d2924] to-[#0a1f1a]' 
        : 'bg-gradient-to-b from-[#1a3d35] via-[#2a5a4d] to-[#1a3d35]'
    }`}>
      {/* Controls */}
      <div className="absolute top-6 right-6 flex gap-2 z-10">
        {/* Music Toggle */}
        <button
          onClick={toggleMusic}
          className={`p-2 rounded-full transition-all duration-300 ${
            isDark 
              ? 'bg-teal-900/50 hover:bg-teal-800/50 text-teal-300' 
              : 'bg-teal-700/50 hover:bg-teal-600/50 text-teal-100'
          }`}
        >
          {isMusicPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
        
        {/* Dark Mode Toggle */}
        <button
          onClick={() => setIsDark(!isDark)}
          className={`p-2 rounded-full transition-all duration-300 ${
            isDark 
              ? 'bg-teal-900/50 hover:bg-teal-800/50 text-yellow-400' 
              : 'bg-teal-700/50 hover:bg-teal-600/50 text-yellow-300'
          }`}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      {/* Header - Spread text */}
      <header className="w-full px-4 md:px-8 py-6 flex items-center justify-between">
        <span className={`text-xs md:text-sm font-medium tracking-[0.3em] uppercase transition-colors ${
          isDark ? 'text-teal-300/80' : 'text-teal-100'
        }`}>
          Pokemon
        </span>
        <span className={`text-xs md:text-sm font-medium tracking-[0.3em] uppercase transition-colors ${
          isDark ? 'text-teal-300/80' : 'text-teal-100'
        }`}>
          Tournament
        </span>
        
        {/* Center Logo */}
        <div className="absolute left-1/2 -translate-x-1/2 top-4">
          <div className="w-12 h-12 md:w-16 md:h-16">
            <img 
              src={pikachuImage} 
              alt="Logo" 
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </div>
        </div>
        
        <span className={`text-xs md:text-sm font-medium tracking-[0.3em] uppercase transition-colors ${
          isDark ? 'text-teal-300/80' : 'text-teal-100'
        }`}>
          Battle
        </span>
        <span className={`text-xs md:text-sm font-medium tracking-[0.3em] uppercase transition-colors ${
          isDark ? 'text-teal-300/80' : 'text-teal-100'
        }`}>
          Arena
        </span>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 relative">
        {/* Central Image with Countdown */}
        <div className="relative">
          {/* Glow effect */}
          <div className={`absolute inset-0 rounded-full blur-3xl opacity-20 ${
            isDark ? 'bg-teal-500' : 'bg-teal-400'
          }`} style={{ transform: 'scale(1.5)' }} />
          
          {/* Main card/image container */}
          <div className={`relative backdrop-blur-sm rounded-2xl p-8 md:p-12 shadow-2xl border transition-colors ${
            isDark 
              ? 'bg-[#0d2924]/90 border-teal-800/50' 
              : 'bg-[#1a3d35]/90 border-teal-600/50'
          }`}>
            {/* Decorative elements */}
            <div className="absolute top-4 left-4 w-3 h-3 rounded-sm bg-blue-500" />
            <div className="absolute top-4 right-4 w-3 h-3 rounded-sm bg-pink-500" />
            
            {/* Pokeball design */}
            <div className="relative w-48 h-48 md:w-64 md:h-64 mx-auto">
              <div className={`absolute inset-0 rounded-full bg-gradient-to-b from-red-500 via-red-500 to-white border-4 overflow-hidden ${
                isDark ? 'border-teal-700' : 'border-teal-600'
              }`}>
                <div className={`absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 ${
                  isDark ? 'bg-teal-700' : 'bg-teal-600'
                }`} />
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 rounded-full bg-white border-4 flex items-center justify-center ${
                  isDark ? 'border-teal-700' : 'border-teal-600'
                }`}>
                  <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full border-2 ${
                    isDark ? 'bg-teal-100 border-teal-300' : 'bg-teal-50 border-teal-200'
                  }`} />
                </div>
              </div>
              
              {/* Countdown overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <span className="font-mono text-teal-300 text-lg md:text-2xl font-bold tracking-wider">
                    {formatTime(countdown.days)}:{formatTime(countdown.hours)}:{formatTime(countdown.minutes)}:{formatTime(countdown.seconds)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Decorative screws */}
            <div className={`absolute bottom-4 left-4 w-2 h-2 rounded-full ${isDark ? 'bg-teal-600' : 'bg-teal-500'}`} />
            <div className={`absolute bottom-4 right-4 w-2 h-2 rounded-full ${isDark ? 'bg-teal-600' : 'bg-teal-500'}`} />
            <div className={`absolute bottom-4 left-1/3 w-2 h-2 rounded-full ${isDark ? 'bg-teal-600' : 'bg-teal-500'}`} />
            <div className={`absolute bottom-4 right-1/3 w-2 h-2 rounded-full ${isDark ? 'bg-teal-600' : 'bg-teal-500'}`} />
          </div>
          
          {/* Reflection */}
          <div className={`h-24 bg-gradient-to-b to-transparent blur-sm ${
            isDark ? 'from-teal-900/30' : 'from-teal-700/30'
          }`} />
        </div>
      </main>

      {/* Bottom Explore Button */}
      <div className="pb-8 flex justify-center">
        <button
          onClick={() => navigate("/home")}
          className={`group flex items-center gap-4 border rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 ${
            isDark 
              ? 'bg-[#0d2924] hover:bg-[#133d35] border-teal-700/50 text-teal-200' 
              : 'bg-[#1a3d35] hover:bg-[#2a5a4d] border-teal-500/50 text-teal-100'
          }`}
        >
          <div className={`w-4 h-4 rounded-sm ${isDark ? 'bg-teal-400' : 'bg-teal-200'}`} />
          <span className="text-sm font-medium tracking-[0.2em] uppercase">
            Explore
          </span>
          <MoreHorizontal className={`w-5 h-5 ${isDark ? 'text-teal-500' : 'text-teal-300'}`} />
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
