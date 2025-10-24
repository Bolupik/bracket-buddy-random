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

      <div className="max-w-6xl mx-auto pt-24 space-y-8 relative z-10">
        {/* Banner Image */}
        <div className="w-full animate-fade-in">
          <img 
            src={stackingBanner} 
            alt="STACKING DAO" 
            className="w-full h-auto rounded-lg shadow-[var(--shadow-intense)] border-2 border-primary/30"
          />
        </div>

        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in relative">
          <div className="absolute inset-0 bg-[var(--gradient-primary)] opacity-10 blur-3xl -z-10"></div>
          <div className="relative">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter">
              <span className="bg-[var(--gradient-primary)] bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                STACKINGDAO
              </span>
            </h1>
            <div className="flex items-center justify-center gap-3 mt-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
              <p className="text-xl md:text-2xl font-bold text-primary/90 uppercase tracking-widest">
                {isTiebreaker ? "Tiebreaker Selection" : "Winner Selection Wheel"}
              </p>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
            </div>
          </div>
          <p className="text-lg text-foreground/70 font-medium">
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
