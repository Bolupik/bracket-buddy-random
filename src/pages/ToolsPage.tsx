import { Navigation } from "@/components/Navigation";
import { ToolAds } from "@/components/SponsorAds";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const ToolsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/home">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          
          <h1 className="text-3xl font-bold text-foreground mb-2">
            🛠️ Stacks Ecosystem Tools
          </h1>
          <p className="text-muted-foreground">
            Discover amazing tools and platforms built on Bitcoin and Stacks
          </p>
        </div>
        
        <ToolAds />
      </div>
    </div>
  );
};

export default ToolsPage;
