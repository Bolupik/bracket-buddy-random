import { Link, useLocation } from "react-router-dom";
import { Trophy, Dices, Home, Plus, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Navigation = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[var(--gradient-card)] backdrop-blur-xl border-2 border-primary/40 rounded-full px-8 py-3 shadow-[var(--shadow-elegant)] animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to="/">
          <Button
            variant={isActive("/") ? "gradient" : "ghost"}
            size="sm"
            className="rounded-full font-semibold"
          >
            <Home className="w-4 h-4 mr-2" />
            View
          </Button>
        </Link>

        <Link to="/create">
          <Button
            variant={isActive("/create") ? "gradient" : "ghost"}
            size="sm"
            className="rounded-full font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create
          </Button>
        </Link>

        <Link to="/tournaments">
          <Button
            variant={isActive("/tournaments") ? "gradient" : "ghost"}
            size="sm"
            className="rounded-full font-semibold"
          >
            <ListTodo className="w-4 h-4 mr-2" />
            Tournaments
          </Button>
        </Link>

        <Link to="/random-wheel">
          <Button
            variant={isActive("/random-wheel") ? "gradient" : "ghost"}
            size="sm"
            className="rounded-full font-semibold"
          >
            <Dices className="w-4 h-4 mr-2" />
            Random Wheel
          </Button>
        </Link>

        <Link to="/wheel">
          <Button
            variant={isActive("/wheel") ? "gradient" : "ghost"}
            size="sm"
            className="rounded-full font-semibold"
          >
            <Trophy className="w-4 h-4 mr-2" />
            Winner Wheel
          </Button>
        </Link>
      </div>
    </nav>
  );
};
