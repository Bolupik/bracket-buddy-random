import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FloatingPikachu } from "@/components/FloatingPikachu";
import Index from "./pages/Index";
import WheelPage from "./pages/WheelPage";
import RandomWheelPage from "./pages/RandomWheelPage";
import CreateTournamentPage from "./pages/CreateTournamentPage";
import AuthPage from "./pages/AuthPage";
import TournamentBrowserPage from "./pages/TournamentBrowserPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <FloatingPikachu />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/create" element={<CreateTournamentPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/tournaments" element={<TournamentBrowserPage />} />
          <Route path="/wheel" element={<WheelPage />} />
          <Route path="/random-wheel" element={<RandomWheelPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
