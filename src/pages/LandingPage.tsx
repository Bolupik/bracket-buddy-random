import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MoreHorizontal, Moon, Sun } from "lucide-react";
import pikachuImage from "@/assets/pikachu.png";
import { PageTransition, usePageTransition } from "@/components/PageTransition";

const LandingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isDark, setIsDark] = useState(false);
  const { isTransitioning, targetPath, startTransition, completeTransition } = usePageTransition();
  
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
        ? 'bg-gradient-to-b from-neutral-900 via-neutral-800 to-neutral-900' 
        : 'bg-gradient-to-b from-[#f5f5f5] via-[#e8e8e8] to-[#d4d4d4]'
    }`}>
      {/* Dark Mode Toggle */}
      <button
        onClick={() => setIsDark(!isDark)}
        className={`absolute top-6 right-6 p-2 rounded-full transition-all duration-300 z-10 ${
          isDark 
            ? 'bg-neutral-700 hover:bg-neutral-600 text-yellow-400' 
            : 'bg-white/80 hover:bg-white text-neutral-700 shadow-md'
        }`}
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* Header - Spread text */}
      <header className="w-full px-4 md:px-8 py-6 flex items-center justify-between">
        <span className={`text-xs md:text-sm font-medium tracking-[0.3em] uppercase transition-colors ${
          isDark ? 'text-neutral-300' : 'text-neutral-800'
        }`}>
          Pokemon
        </span>
        <span className={`text-xs md:text-sm font-medium tracking-[0.3em] uppercase transition-colors ${
          isDark ? 'text-neutral-300' : 'text-neutral-800'
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
          isDark ? 'text-neutral-300' : 'text-neutral-800'
        }`}>
          Battle
        </span>
        <span className={`text-xs md:text-sm font-medium tracking-[0.3em] uppercase transition-colors ${
          isDark ? 'text-neutral-300' : 'text-neutral-800'
        }`}>
          Arena
        </span>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 relative">
        {/* Central Image with Countdown */}
        <div className="relative">
          {/* Reflection effect */}
          <div className={`absolute inset-0 top-1/2 bg-gradient-to-b from-transparent blur-sm scale-y-[-1] opacity-30 ${
            isDark ? 'to-neutral-800/80' : 'to-[#d4d4d4]/80'
          }`} />
          
          {/* Main card/image container */}
          <div className={`relative backdrop-blur-sm rounded-2xl p-8 md:p-12 shadow-2xl border transition-colors ${
            isDark 
              ? 'bg-neutral-800/90 border-neutral-700' 
              : 'bg-white/90 border-neutral-200'
          }`}>
            {/* Decorative elements */}
            <div className="absolute top-4 left-4 w-3 h-3 rounded-sm bg-blue-500" />
            <div className="absolute top-4 right-4 w-3 h-3 rounded-sm bg-pink-500" />
            
            {/* Pokeball design */}
            <div className="relative w-48 h-48 md:w-64 md:h-64 mx-auto">
              <div className={`absolute inset-0 rounded-full bg-gradient-to-b from-red-500 via-red-500 to-white border-4 overflow-hidden ${
                isDark ? 'border-neutral-600' : 'border-neutral-800'
              }`}>
                <div className={`absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 ${
                  isDark ? 'bg-neutral-600' : 'bg-neutral-800'
                }`} />
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 rounded-full bg-white border-4 flex items-center justify-center ${
                  isDark ? 'border-neutral-600' : 'border-neutral-800'
                }`}>
                  <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full border-2 ${
                    isDark ? 'bg-neutral-200 border-neutral-400' : 'bg-neutral-100 border-neutral-300'
                  }`} />
                </div>
              </div>
              
              {/* Countdown overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <span className="font-mono text-white text-lg md:text-2xl font-bold tracking-wider">
                    {formatTime(countdown.days)}:{formatTime(countdown.hours)}:{formatTime(countdown.minutes)}:{formatTime(countdown.seconds)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Decorative screws */}
            <div className={`absolute bottom-4 left-4 w-2 h-2 rounded-full ${isDark ? 'bg-neutral-500' : 'bg-neutral-400'}`} />
            <div className={`absolute bottom-4 right-4 w-2 h-2 rounded-full ${isDark ? 'bg-neutral-500' : 'bg-neutral-400'}`} />
            <div className={`absolute bottom-4 left-1/3 w-2 h-2 rounded-full ${isDark ? 'bg-neutral-500' : 'bg-neutral-400'}`} />
            <div className={`absolute bottom-4 right-1/3 w-2 h-2 rounded-full ${isDark ? 'bg-neutral-500' : 'bg-neutral-400'}`} />
          </div>
          
          {/* Reflection */}
          <div className={`h-24 bg-gradient-to-b to-transparent blur-sm ${
            isDark ? 'from-neutral-800/50' : 'from-[#d4d4d4]/50'
          }`} />
        </div>
      </main>

      {/* Bottom Explore Button */}
      <div className="pb-8 flex justify-center">
        <button
          onClick={() => startTransition("/home")}
          className={`group flex items-center gap-4 border rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 ${
            isDark 
              ? 'bg-neutral-800 hover:bg-neutral-700 border-neutral-600 text-neutral-200' 
              : 'bg-white hover:bg-neutral-50 border-neutral-300 text-neutral-700'
          }`}
        >
          <div className={`w-4 h-4 rounded-sm ${isDark ? 'bg-white' : 'bg-black'}`} />
          <span className="text-sm font-medium tracking-[0.2em] uppercase">
            Explore
          </span>
          <MoreHorizontal className={`w-5 h-5 ${isDark ? 'text-neutral-400' : 'text-neutral-400'}`} />
        </button>
      </div>

      {/* Page Transition */}
      <PageTransition 
        isActive={isTransitioning} 
        targetPath={targetPath} 
        onComplete={completeTransition} 
      />
    </div>
  );
};

export default LandingPage;
