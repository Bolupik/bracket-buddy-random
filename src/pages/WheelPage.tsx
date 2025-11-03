import { useState, useEffect } from "react";
import { WinnerWheel } from "@/components/WinnerWheel";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import stackingBanner from "@/assets/stacking-banner.png";
import { Navigation } from "@/components/Navigation";

interface Participant {
  name: string;
  image?: string;
}

export default function WheelPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [pokemonImages, setPokemonImages] = useState<string[]>([]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");
  const isTiebreaker = mode === "tiebreaker";

  // Load participants from localStorage
  useEffect(() => {
    if (isTiebreaker) {
      const tiebreakerData = localStorage.getItem("tiebreakerParticipants");
      if (tiebreakerData) {
        setParticipants(JSON.parse(tiebreakerData));
      }
    } else {
      const savedParticipants = localStorage.getItem("tournamentParticipants");
      if (savedParticipants) {
        setParticipants(JSON.parse(savedParticipants));
      }
    }
  }, [isTiebreaker]);

  // Fetch random Pokemon images
  useEffect(() => {
    const fetchPokemon = async () => {
      const images: string[] = [];
      const randomIds = Array.from({ length: 20 }, () => Math.floor(Math.random() * 898) + 1);
      
      for (const id of randomIds) {
        try {
          const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
          const data = await response.json();
          images.push(data.sprites.other['official-artwork'].front_default);
        } catch (error) {
          console.error('Failed to fetch Pokemon:', error);
        }
      }
      
      setPokemonImages(images);
    };
    
    fetchPokemon();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--gradient-dark)] p-4 md:p-8 relative overflow-hidden">
      <Navigation />
      
      {/* Animated gradient overlay */}
      <div className="fixed inset-0 bg-[var(--gradient-hero)] pointer-events-none z-0" />
      
      {/* Pokemon Background */}
      <div className="fixed inset-0 pointer-events-none opacity-10 z-0">
        {pokemonImages.map((img, index) => (
          <img
            key={index}
            src={img}
            alt=""
            className="absolute animate-float"
            style={{
              width: `${80 + Math.random() * 120}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${15 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      <div className="max-w-6xl mx-auto pt-24 space-y-10 relative z-10">
        {/* Banner Image */}
        <div className="w-full animate-fade-in">
          <img 
            src={stackingBanner} 
            alt="STACKING DAO" 
            className="w-full h-auto rounded-2xl shadow-[var(--shadow-intense)] border-4 border-primary/40 hover:scale-[1.02] transition-transform duration-300"
          />
        </div>

        {/* Header */}
        <div className="text-center space-y-6 animate-fade-in relative">
          <div className="relative">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter gradient-text drop-shadow-2xl">
              STACKINGDAO
            </h1>
            <div className="flex items-center justify-center gap-4 mt-4">
              <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full"></div>
              <p className="text-2xl md:text-3xl font-black text-primary uppercase tracking-widest px-6 py-2 bg-primary/10 rounded-full border-2 border-primary/30">
                {isTiebreaker ? "🔥 Tiebreaker 🔥" : "🏆 Winner Wheel 🏆"}
              </p>
              <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full"></div>
            </div>
          </div>
          <p className="text-xl md:text-2xl text-foreground/80 font-semibold">
            {isTiebreaker
              ? "Spin to resolve the tie and determine final rankings!"
              : "Spin the wheel to select a random winner!"}
          </p>
        </div>

        {/* Winner Wheel */}
        <div className="animate-scale-in">
          <WinnerWheel participants={participants} />
        </div>
      </div>
    </div>
  );
}
