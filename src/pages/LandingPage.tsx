import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Sparkles, Zap, Trophy, Users } from "lucide-react";
import pikachuImage from "@/assets/pikachu.png";
import { PageTransition, usePageTransition } from "@/components/PageTransition";

interface PokemonCard {
  id: number;
  name: string;
  image: string;
  types: string[];
}

const LandingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isTransitioning, targetPath, startTransition, completeTransition } = usePageTransition();
  const [pokemonCards, setPokemonCards] = useState<PokemonCard[]>([]);
  
  // Redirect to home if there's a tournament parameter
  useEffect(() => {
    const tournamentId = searchParams.get('tournament');
    if (tournamentId) {
      navigate(`/home?tournament=${tournamentId}`);
    }
  }, [searchParams, navigate]);

  // Fetch Pokemon for cards
  useEffect(() => {
    const fetchPokemon = async () => {
      const pokemonIds = [25, 6, 150, 94, 131, 143, 149, 196, 448, 445]; // Iconic Pokemon
      const cards: PokemonCard[] = [];
      
      for (const id of pokemonIds) {
        try {
          const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
          const data = await response.json();
          cards.push({
            id: data.id,
            name: data.name.charAt(0).toUpperCase() + data.name.slice(1),
            image: data.sprites.other['official-artwork'].front_default,
            types: data.types.map((t: any) => t.type.name),
          });
        } catch (error) {
          console.error('Failed to fetch Pokemon:', error);
        }
      }
      
      setPokemonCards(cards);
    };
    
    fetchPokemon();
  }, []);

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      fire: 'from-orange-500 to-red-600',
      water: 'from-blue-400 to-blue-600',
      grass: 'from-green-400 to-emerald-600',
      electric: 'from-yellow-400 to-amber-500',
      psychic: 'from-pink-400 to-purple-600',
      ghost: 'from-purple-500 to-indigo-700',
      dragon: 'from-indigo-500 to-purple-700',
      ice: 'from-cyan-300 to-blue-500',
      fighting: 'from-red-600 to-orange-700',
      normal: 'from-gray-400 to-gray-600',
      fairy: 'from-pink-300 to-pink-500',
      dark: 'from-gray-700 to-gray-900',
      steel: 'from-gray-400 to-slate-600',
      ground: 'from-amber-600 to-orange-800',
      rock: 'from-amber-700 to-stone-700',
      bug: 'from-lime-500 to-green-600',
      poison: 'from-purple-500 to-fuchsia-600',
      flying: 'from-sky-400 to-indigo-500',
    };
    return colors[type] || 'from-gray-500 to-gray-700';
  };

  const cardPositions = [
    { top: '5%', left: '2%', rotate: -15, scale: 0.9, delay: 0 },
    { top: '15%', right: '3%', rotate: 12, scale: 1, delay: 0.5 },
    { top: '40%', left: '-2%', rotate: -8, scale: 0.85, delay: 1 },
    { top: '55%', right: '-1%', rotate: 18, scale: 0.95, delay: 1.5 },
    { bottom: '15%', left: '5%', rotate: 10, scale: 0.8, delay: 2 },
    { bottom: '10%', right: '4%', rotate: -12, scale: 0.9, delay: 2.5 },
    { top: '25%', left: '8%', rotate: 5, scale: 0.75, delay: 3 },
    { top: '35%', right: '6%', rotate: -20, scale: 0.85, delay: 3.5 },
    { bottom: '30%', left: '1%', rotate: 15, scale: 0.8, delay: 4 },
    { bottom: '25%', right: '2%', rotate: -5, scale: 0.9, delay: 4.5 },
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Animated Background Mesh */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-[800px] h-[800px] -top-40 -left-40 bg-purple-600/20 rounded-full blur-3xl animate-float-drift" />
        <div className="absolute w-[600px] h-[600px] top-1/2 -right-32 bg-pink-600/15 rounded-full blur-3xl animate-float-bounce" style={{ animationDelay: '2s' }} />
        <div className="absolute w-[500px] h-[500px] -bottom-20 left-1/4 bg-blue-600/15 rounded-full blur-3xl animate-float-zigzag" style={{ animationDelay: '4s' }} />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Floating Pokemon Cards */}
      {pokemonCards.map((pokemon, index) => {
        const pos = cardPositions[index % cardPositions.length];
        return (
          <div
            key={pokemon.id}
            className="absolute hidden md:block pointer-events-none z-10 animate-float-drift"
            style={{
              top: pos.top,
              left: pos.left,
              right: pos.right,
              bottom: pos.bottom,
              transform: `rotate(${pos.rotate}deg) scale(${pos.scale})`,
              animationDelay: `${pos.delay}s`,
              animationDuration: '20s',
            }}
          >
            <div className={`w-44 h-60 rounded-2xl bg-gradient-to-br ${getTypeColor(pokemon.types[0])} p-1 shadow-2xl opacity-70 hover:opacity-100 transition-opacity`}>
              <div className="w-full h-full rounded-xl bg-slate-900/90 backdrop-blur-sm p-3 flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-white/80 uppercase tracking-wider">{pokemon.types[0]}</span>
                  <span className="text-xs font-mono text-white/60">#{pokemon.id.toString().padStart(3, '0')}</span>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <img 
                    src={pokemon.image} 
                    alt={pokemon.name}
                    className="w-28 h-28 object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                  />
                </div>
                <div className="text-center">
                  <h3 className="text-white font-bold text-sm">{pokemon.name}</h3>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Header */}
      <header className="relative z-20 w-full px-6 md:px-12 py-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight hidden sm:block">PokéBattle</span>
        </div>
        
        <nav className="flex items-center gap-6">
          <a href="#" className="text-white/70 hover:text-white text-sm font-medium transition-colors">About</a>
          <a href="#" className="text-white/70 hover:text-white text-sm font-medium transition-colors">Rules</a>
          <button 
            onClick={() => startTransition("/home")}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium transition-all border border-white/20"
          >
            Enter Arena
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 relative z-20">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-white/90 text-sm font-medium">Season 2 Now Live</span>
          </div>
          
          {/* Main Title */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-none tracking-tight">
              <span className="block">POKEMON</span>
              <span className="block bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent">
                TOURNAMENT
              </span>
              <span className="block">ARENA</span>
            </h1>
          </div>
          
          {/* Subtitle */}
          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Create epic tournament brackets, battle your friends, and become the ultimate Pokémon champion. Every trainer gets 3 matches!
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => startTransition("/home")}
              className="group relative overflow-hidden bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-8 py-4 rounded-2xl text-lg font-bold shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all hover:scale-105"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Start Tournament
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            
            <button
              onClick={() => startTransition("/tournaments")}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-2xl text-lg font-medium border border-white/20 transition-all"
            >
              <Users className="w-5 h-5" />
              Browse Tournaments
            </button>
          </div>
          
          {/* Stats */}
          <div className="flex items-center justify-center gap-8 md:gap-16 pt-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-white">1000+</div>
              <div className="text-white/50 text-sm">Battles</div>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-white">500+</div>
              <div className="text-white/50 text-sm">Trainers</div>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-white">50+</div>
              <div className="text-white/50 text-sm">Tournaments</div>
            </div>
          </div>
        </div>
        
        {/* Floating Pikachu Mascot */}
        <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 animate-float">
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-400/30 blur-3xl rounded-full scale-150" />
            <img 
              src={pikachuImage} 
              alt="Pikachu" 
              className="w-20 h-20 md:w-28 md:h-28 object-contain relative z-10 drop-shadow-[0_0_30px_rgba(250,204,21,0.5)]"
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-6 text-center">
        <p className="text-white/30 text-sm">© 2024 PokéBattle Arena. Not affiliated with Nintendo or The Pokémon Company.</p>
      </footer>

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
