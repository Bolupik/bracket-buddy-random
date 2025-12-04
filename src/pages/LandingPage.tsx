import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import pikachuImage from "@/assets/pikachu.png";

const LandingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
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
    <div className="min-h-screen bg-gradient-to-b from-gray-100 via-gray-200 to-gray-300 flex flex-col relative overflow-hidden">
      {/* Header - Spread text */}
      <header className="w-full px-4 md:px-8 py-6 flex items-center justify-between">
        <span className="text-xs md:text-sm font-medium tracking-[0.3em] text-gray-800 uppercase">
          Pokemon
        </span>
        <span className="text-xs md:text-sm font-medium tracking-[0.3em] text-gray-800 uppercase">
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
        
        <span className="text-xs md:text-sm font-medium tracking-[0.3em] text-gray-800 uppercase">
          Battle
        </span>
        <span className="text-xs md:text-sm font-medium tracking-[0.3em] text-gray-800 uppercase">
          Arena
        </span>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 relative">
        {/* Central Image with Countdown */}
        <div className="relative">
          {/* Reflection effect */}
          <div className="absolute inset-0 top-1/2 bg-gradient-to-b from-transparent to-gray-200/80 blur-sm scale-y-[-1] opacity-30" />
          
          {/* Main card/image container */}
          <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-8 md:p-12 shadow-2xl border border-gray-200">
            {/* Decorative elements */}
            <div className="absolute top-4 left-4 w-3 h-3 rounded-sm bg-blue-500" />
            <div className="absolute top-4 right-4 w-3 h-3 rounded-sm bg-pink-500" />
            
            {/* Pokeball design */}
            <div className="relative w-48 h-48 md:w-64 md:h-64 mx-auto">
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-red-500 via-red-500 to-white border-4 border-gray-800 overflow-hidden">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-800 -translate-y-1/2" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 rounded-full bg-white border-4 border-gray-800 flex items-center justify-center">
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gray-100 border-2 border-gray-300" />
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
            <div className="absolute bottom-4 left-4 w-2 h-2 rounded-full bg-gray-400" />
            <div className="absolute bottom-4 right-4 w-2 h-2 rounded-full bg-gray-400" />
            <div className="absolute bottom-4 left-1/3 w-2 h-2 rounded-full bg-gray-400" />
            <div className="absolute bottom-4 right-1/3 w-2 h-2 rounded-full bg-gray-400" />
          </div>
          
          {/* Reflection */}
          <div className="h-24 bg-gradient-to-b from-gray-300/50 to-transparent blur-sm" />
        </div>
      </main>

      {/* Bottom Explore Button */}
      <div className="pb-8 flex justify-center">
        <button
          onClick={() => navigate("/home")}
          className="group flex items-center gap-4 bg-white hover:bg-gray-50 border border-gray-300 rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="w-4 h-4 bg-black rounded-sm" />
          <span className="text-sm font-medium tracking-[0.2em] uppercase text-gray-700">
            Explore
          </span>
          <MoreHorizontal className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
