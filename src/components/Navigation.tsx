import { Link, useLocation } from "react-router-dom";
import { Trophy, Dices, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Navigation = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-card/95 backdrop-blur-lg border-2 border-primary/30 rounded-full px-6 py-3 shadow-[var(--shadow-elegant)] animate-fade-in">
      <div className="flex items-center gap-2">
        <Link to="/">
          <Button
            variant={isActive("/") ? "default" : "ghost"}
            size="sm"
            className="rounded-full transition-all duration-300 hover:scale-105"
          >
            <Home className="w-4 h-4 mr-2" />
            Tournament
          </Button>
        </Link>

        <Link to="/random-wheel">
          <Button
            variant={isActive("/random-wheel") ? "default" : "ghost"}
            size="sm"
            className="rounded-full transition-all duration-300 hover:scale-105"
          >
            <Dices className="w-4 h-4 mr-2" />
            Random Wheel
          </Button>
        </Link>

        <Link to="/wheel">
          <Button
            variant={isActive("/wheel") ? "default" : "ghost"}
            size="sm"
            className="rounded-full transition-all duration-300 hover:scale-105"
          >
            <Trophy className="w-4 h-4 mr-2" />
            Winner Selection
          </Button>
        </Link>
      </div>
    </nav>
  );
};
