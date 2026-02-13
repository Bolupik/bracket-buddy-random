import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Sparkles, Trophy, Users, ArrowRight } from "lucide-react";
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
  
  useEffect(() => {
    const tournamentId = searchParams.get('tournament');
    if (tournamentId) {
      navigate(`/home?tournament=${tournamentId}`);
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    const fetchPokemon = async () => {
      const pokemonIds = [25, 6, 150, 94, 131, 143, 149, 196, 448, 445];
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
      grass: 'from-primary to-accent',
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
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background noise-overlay">
      {/* Ambient Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-[900px] h-[900px] -top-60 -left-40 bg-primary/15 rounded-full blur-[120px] animate-float-drift" />
        <div className="absolute w-[700px] h-[700px] top-1/2 -right-40 bg-accent/10 rounded-full blur-[100px] animate-float-bounce" style={{ animationDelay: '2s' }} />
        <div className="absolute w-[500px] h-[500px] -bottom-20 left-1/4 bg-primary/8 rounded-full blur-[80px] animate-float-zigzag" style={{ animationDelay: '4s' }} />
      </div>

      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

      {/* Floating Pokemon Cards */}
      {pokemonCards.map((pokemon, index) => {
        const pos = cardPositions[index % cardPositions.length];
        return (
          <div
            key={pokemon.id}
            className="absolute hidden lg:block pointer-events-none z-10 animate-float-drift"
            style={{
              top: pos.top, left: pos.left, right: pos.right, bottom: pos.bottom,
              transform: `rotate(${pos.rotate}deg) scale(${pos.scale})`,
              animationDelay: `${pos.delay}s`,
              animationDuration: '20s',
            }}
          >
            <div className={`w-40 h-56 rounded-2xl bg-gradient-to-br ${getTypeColor(pokemon.types[0])} p-[2px] shadow-2xl opacity-40 transition-opacity duration-500`}>
              <div className="w-full h-full rounded-[14px] bg-card/95 backdrop-blur-sm p-3 flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{pokemon.types[0]}</span>
                  <span className="text-[10px] font-mono text-muted-foreground/60">#{pokemon.id.toString().padStart(3, '0')}</span>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <img src={pokemon.image} alt={pokemon.name} className="w-24 h-24 object-contain drop-shadow-[0_0_15px_hsl(var(--primary)/0.3)]" />
                </div>
                <p className="text-center text-foreground font-bold text-xs">{pokemon.name}</p>
              </div>
            </div>
          </div>
        );
      })}

      {/* Header */}
      <header className="relative z-20 w-full px-6 md:px-12 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg overflow-hidden">
            <img src={pikachuImage} alt="Logo" className="w-9 h-9 object-contain" />
          </div>
          <span className="text-foreground font-bold text-lg tracking-tight hidden sm:block">PokéBattle</span>
        </div>
        
        <nav className="flex items-center gap-1">
          <a href="#" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors px-4 py-2 rounded-lg hover:bg-secondary/50">About</a>
          <a href="#" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors px-4 py-2 rounded-lg hover:bg-secondary/50">Rules</a>
          <button 
            onClick={() => startTransition("/home")}
            className="ml-2 glass text-foreground px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:bg-primary/10 hover:border-primary/30"
          >
            Enter Arena
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 relative z-20">
        <div className="text-center max-w-3xl mx-auto space-y-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 glass rounded-full px-5 py-2.5 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-foreground/80 text-sm font-medium tracking-wide">Season 2 Now Live</span>
          </div>
          
          {/* Main Title */}
          <div className="space-y-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-foreground leading-[0.9] tracking-tighter">
              BRACKET
            </h1>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black leading-[0.9] tracking-tighter bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              BUDDY
            </h1>
          </div>
          
          {/* Subtitle */}
          <p className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Create epic tournament brackets, battle your friends, and crown the ultimate Pokémon champion.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <button
              onClick={() => startTransition("/home")}
              className="group relative overflow-hidden bg-gradient-to-r from-primary to-accent text-primary-foreground px-8 py-4 rounded-2xl text-lg font-bold shadow-[var(--shadow-glow)] hover:shadow-[var(--shadow-intense)] transition-all hover:scale-[1.03] active:scale-[0.98]"
            >
              <span className="relative z-10 flex items-center gap-3">
                <Trophy className="w-5 h-5" />
                Start Tournament
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
            
            <button
              onClick={() => startTransition("/tournaments")}
              className="flex items-center gap-2 glass text-foreground px-8 py-4 rounded-2xl text-lg font-medium transition-all hover:bg-primary/10 hover:border-primary/30 active:scale-[0.98]"
            >
              <Users className="w-5 h-5" />
              Browse Tournaments
            </button>
          </div>
          
          {/* Stats */}
          <div className="flex items-center justify-center gap-10 md:gap-16 pt-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            {[
              { value: '1000+', label: 'Battles' },
              { value: '500+', label: 'Trainers' },
              { value: '50+', label: 'Tournaments' },
            ].map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-10">
                {i > 0 && <div className="w-px h-10 bg-border -ml-10" />}
                <div className="text-center group cursor-default">
                  <div className="text-3xl md:text-4xl font-black text-foreground group-hover:text-primary transition-colors duration-300">{stat.value}</div>
                  <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider mt-1">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Floating Pikachu Mascot */}
        <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 animate-float">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150" />
            <img 
              src={pikachuImage} 
              alt="Pikachu" 
              className="w-16 h-16 md:w-24 md:h-24 object-contain relative z-10 drop-shadow-[0_0_20px_hsl(var(--primary)/0.4)]"
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-6 text-center">
        <p className="text-muted-foreground/40 text-xs font-medium tracking-wide">© 2024 PokéBattle Arena. Not affiliated with Nintendo or The Pokémon Company.</p>
      </footer>

      <PageTransition 
        isActive={isTransitioning} 
        targetPath={targetPath} 
        onComplete={completeTransition} 
      />
    </div>
  );
};

export default LandingPage;